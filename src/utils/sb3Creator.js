import JSZip from 'jszip';

/**
 * SB3 Creator class.
 * The Indentation-based parser should handle scripts nested under SPRITE/STAGE and attempts:
 * - Accurate ID generation using the full Scratch character set.
 * - Correct block input, shadow, and variable reporter structures.
 * - Proper global (Stage) and local (Sprite) variable scoping.
 * - Automatic variable monitor generation for stage visibility.
 * - Correctly parses and creates operator blocks (e.g., speed * -1).
 * - Generates visible SVG assets for costumes and backdrops.
 */
class RealSB3Creator {
    constructor() {
        this.reset();
    }

    reset() {
        this.project = {
            targets: [],
            monitors: [],
            extensions: [],
            meta: { semver: "3.0.0", vm: "4.6.0", agent: "SB3 Creator/0.1.0" }
        };
        this.usedIds = new Set();
        this.variables = new Map(); // Maps "scope:varName" to {id, name}
        this.extensionsUsed = new Set();
        this.generatedSB3 = null;
        this.errors = [];
        this.warnings = [];
    }

    // Use Scratch's wider character set for IDs
    generateId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#%()*+,-./:;=?@[]^_`{|}~';
        let id;
        do {
            id = '';
            for (let i = 0; i < 20; i++) id += chars[Math.floor(Math.random() * chars.length)];
        } while (this.usedIds.has(id));
        this.usedIds.add(id);
        return id;
    }

    isGameVariable(name) {
        const globalVars = ['health', 'score', 'game active', 'speed', 'lives', 'level'];
        return globalVars.includes(name.toLowerCase());
    }

    getOrCreateVariable(name, target) {
        const isGlobal = this.isGameVariable(name) || target.isStage;
        const scope = isGlobal ? 'Stage' : target.name;
        const key = `${scope}:${name}`;

        if (!this.variables.has(key)) {
            const id = this.generateId();
            this.variables.set(key, { id, name });
            const varTarget = isGlobal ? this.project.targets.find(t => t.isStage) : target;
            if (varTarget) {
                if (!varTarget.variables) varTarget.variables = {};
                varTarget.variables[id] = [name, 0];
                this.createMonitor(id, name);
            }
        }
        return this.variables.get(key);
    }

    createMonitor(varId, varName) {
        if (this.project.monitors.find(m => m.id === varId)) return;
        const monitorY = 5 + this.project.monitors.length * 28;
        this.project.monitors.push({
            id: varId,
            mode: "default",
            opcode: "data_variable",
            params: { VARIABLE: varName },
            spriteName: null,
            value: 0, width: 0, height: 0,
            x: 5, y: monitorY,
            visible: true,
            sliderMin: 0, sliderMax: 100, isDiscrete: true
        });
    }
    
    createBlock(opcode, options = {}) {
        const id = this.generateId();
        const block = {
            opcode,
            next: null, parent: null,
            inputs: {}, fields: {},
            shadow: false, topLevel: false,
            ...options
        };
        return { [id]: block };
    }

    parseValue(valueStr, context) {
        valueStr = valueStr.trim();
        
        if (/^-?\d+(\.\d+)?$/.test(valueStr)) return [1, [4, valueStr]];
        if (valueStr.startsWith('"') && valueStr.endsWith('"')) return [1, [10, valueStr.slice(1, -1)]];
        if (valueStr.toLowerCase() === 'true' || valueStr.toLowerCase() === 'false') return [1, [10, valueStr]];

        const ops = [['+', 'operator_add'], ['-', 'operator_subtract'], ['*', 'operator_multiply'], ['/', 'operator_divide']];
        for (const [op, code] of ops) {
            // Ensure we split only on the last operator for precedence
            const opIndex = valueStr.lastIndexOf(op);
            if (opIndex > 0) {
                 const parts = [valueStr.substring(0, opIndex), valueStr.substring(opIndex + 1)];
                 if (parts[0].trim() && parts[1].trim()) {
                    const opId = this.generateId();
                    context.extraBlocks[opId] = {
                        opcode: code, parent: context.parentId, next: null, shadow: false, topLevel: false,
                        inputs: {
                            NUM1: this.parseValue(parts[0], context),
                            NUM2: this.parseValue(parts[1], context)
                        },
                        fields: {}
                    };
                    return [3, opId, [4, "0"]];
                }
            }
        }
        
        // Treat as variable only if it looks like one, otherwise it's a literal string
        if (!/^[a-zA-Z_][a-zA-Z0-9_\s]*$/.test(valueStr) || valueStr.includes(':')) {
            return [1, [10, valueStr]];
        }
        
        const variable = this.getOrCreateVariable(valueStr, context.target);
        return [3, [12, variable.name, variable.id], [10, ""]];
    }
    
    parseCondition(conditionStr, context) {
        conditionStr = conditionStr.trim();
        const ops = [['<', 'operator_lt'], ['>', 'operator_gt'], ['=', 'operator_equals']];

        for (const [op, code] of ops) {
            const parts = conditionStr.split(op);
            if (parts.length === 2) {
                const id = this.generateId();
                context.extraBlocks[id] = {
                    opcode: code, parent: context.parentId, next: null, shadow: false, topLevel: false,
                    inputs: {
                        OPERAND1: this.parseValue(parts[0], context),
                        OPERAND2: this.parseValue(parts[1], context)
                    },
                    fields: {}
                };
                return id;
            }
        }

        if (conditionStr.startsWith('touching ')) {
            const targetName = conditionStr.replace('touching ', '').trim();
            const id = this.generateId();
            const shadowId = this.generateId();
            context.extraBlocks[id] = {
                opcode: 'sensing_touchingobject', parent: context.parentId, next: null, shadow: false, topLevel: false,
                inputs: { TOUCHINGOBJECTMENU: [1, shadowId] }, fields: {}
            };
            context.extraBlocks[shadowId] = {
                opcode: 'sensing_touchingobjectmenu', parent: id, next: null, shadow: true, topLevel: false,
                inputs: {}, fields: { TOUCHINGOBJECTMENU: [targetName, null] }
            };
            return id;
        }

        const id = this.generateId();
        context.extraBlocks[id] = {
            opcode: 'operator_equals', parent: context.parentId, next: null, shadow: false, topLevel: false,
            inputs: {
                OPERAND1: this.parseValue(conditionStr, context),
                OPERAND2: [1, [10, 'true']]
            },
            fields: {}
        };
        return id;
    }

    parseCommand(line, target) {
        const context = { target, extraBlocks: {} };
        let match, blockData;

        if ((match = line.match(/^go to x:\s*(-?\d+\.?\d*)\s+y:\s*(-?\d+\.?\d*)$/i))) {
            blockData = { block: this.createBlock('motion_gotoxy', { inputs: { X: [1, [4, match[1]]], Y: [1, [4, match[2]]] } }) };
        } else if ((match = line.match(/^change x by\s+(.+)$/i))) {
            context.opcode = 'motion_changexby';
            blockData = { block: this.createBlock('motion_changexby', { inputs: { DX: this.parseValue(match[1], context) } }) };
        } else if ((match = line.match(/^change y by\s+(.+)$/i))) {
            context.opcode = 'motion_changeyby';
            blockData = { block: this.createBlock('motion_changeyby', { inputs: { DY: this.parseValue(match[1], context) } }) };
        } else if ((match = line.match(/^set\s+(.+?)\s+to\s+(.+)$/i))) {
            context.opcode = 'data_setvariableto';
            const variable = this.getOrCreateVariable(match[1].trim(), target);
            blockData = { block: this.createBlock('data_setvariableto', { inputs: { VALUE: this.parseValue(match[2], context) }, fields: { VARIABLE: [variable.name, variable.id] } }) };
        } else if ((match = line.match(/^change\s+(.+?)\s+by\s+(.+)$/i))) {
            context.opcode = 'data_changevariableby';
            const variable = this.getOrCreateVariable(match[1].trim(), target);
            blockData = { block: this.createBlock('data_changevariableby', { inputs: { VALUE: this.parseValue(match[2], context) }, fields: { VARIABLE: [variable.name, variable.id] } }) };
        } else if (line.toLowerCase() === 'show') {
            blockData = { block: this.createBlock('looks_show') };
        } else if (line.toLowerCase() === 'stop all') {
            blockData = { block: this.createBlock('control_stop', { fields: { STOP_OPTION: ['all', null] } }) };
        } else if ((match = line.match(/^say\s+(.+?)(?:\s+for\s+(.+)\s+seconds?)?$/i))) {
            const messageContent = match[1];
            if (match[2]) {
                context.opcode = 'looks_sayforsecs';
                blockData = { block: this.createBlock('looks_sayforsecs', { inputs: { MESSAGE: this.parseValue(messageContent, context), SECS: this.parseValue(match[2], context) } }) };
            } else {
                context.opcode = 'looks_say';
                blockData = { block: this.createBlock('looks_say', { inputs: { MESSAGE: this.parseValue(messageContent, context) } }) };
            }
        } else if ((match = line.match(/^WHEN\s+(.+)\s+key\s+pressed/i))) {
            const key = match[1].toLowerCase().replace(/\s+/g, ''); // "left arrow" -> "leftarrow"
            blockData = { block: this.createBlock('event_whenkeypressed', { topLevel: true, fields: { KEY_OPTION: [key, null] } }) };
        } else if (line.includes('flag clicked')) {
            blockData = { block: this.createBlock('event_whenflagclicked', { topLevel: true }) };
        } else {
            this.warnings.push(`Unknown command: "${line}"`);
            return null;
        }
        
        blockData.extraBlocks = context.extraBlocks;
        return blockData;
    }

    createStage() { return { isStage: true, name: "Stage", variables: {}, lists: {}, broadcasts: {}, blocks: {}, comments: {}, currentCostume: 0, costumes: [{ assetId: "cd21514d0531fdffb22204e0ec5ed84a", name: "backdrop1", md5ext: "cd21514d0531fdffb22204e0ec5ed84a.svg", dataFormat: "svg", rotationCenterX: 240, rotationCenterY: 180 }], sounds: [{ assetId: "83a9787d4cb6f3b7632b4ddfebf74367", name: "Pop", dataFormat: "wav", rate: 48000, sampleCount: 1123, md5ext: "83a9787d4cb6f3b7632b4ddfebf74367.wav" }], volume: 100, layerOrder: 0, tempo: 60, videoTransparency: 50, videoState: "on", textToSpeechLanguage: null }; }
    createSprite(name) { return { isStage: false, name, variables: {}, lists: {}, broadcasts: {}, blocks: {}, comments: {}, currentCostume: 0, costumes: [{ assetId: "bcf454acf82e4504149f7ffe07081dbc", name: "costume1", md5ext: "bcf454acf82e4504149f7ffe07081dbc.svg", dataFormat: "svg", rotationCenterX: 48, rotationCenterY: 50 }], sounds: [{ assetId: "83c36d806dc92327b9e7049a565c6bff", name: "Meow", dataFormat: "wav", rate: 48000, sampleCount: 40681, md5ext: "83c36d806dc92327b9e7049a565c6bff.wav" }], volume: 100, layerOrder: 1, visible: true, x: 0, y: 0, size: 100, direction: 90, draggable: false, rotationStyle: "all around" }; }

    parse(pseudocode) {
        this.reset();
        if (!pseudocode.trim()) throw new Error("Pseudocode is empty.");

        const lines = pseudocode.split('\n');
        const getIndent = (s) => s.match(/^\s*/)[0].length;

        const stage = this.createStage();
        this.project.targets.push(stage);
        let currentTarget = stage;
        let scriptCount = {};

        const parseStructure = (startIndex, indentLevel, target) => {
            let i = startIndex;
            let firstBlockId = null, lastBlockId = null;
            const allBlocks = {};

            const linkBlock = (newBlockData) => {
                if (!newBlockData || !newBlockData.block) return;
                const newId = Object.keys(newBlockData.block)[0];
                Object.assign(allBlocks, newBlockData.extraBlocks, newBlockData.block);
                if (!firstBlockId) firstBlockId = newId;
                if (lastBlockId) {
                    allBlocks[lastBlockId].next = newId;
                    allBlocks[newId].parent = lastBlockId;
                }
                lastBlockId = newId;
            };

            while (i < lines.length) {
                const line = lines[i];
                if (!line.trim()) { i++; continue; }
                const currentIndent = getIndent(line);
                if (currentIndent < indentLevel) break;
                if (currentIndent > indentLevel) {
                    this.warnings.push(`Skipping line with unexpected indentation: "${line.trim()}"`);
                    i++;
                    continue;
                }

                const trimmed = line.trim();
                let childResult;

                if (trimmed.endsWith(':')) {
                    let newBlockData, blockId;
                    const context = { target, extraBlocks: {}, parentId: null };
                    if (trimmed.startsWith('FOREVER')) {
                        newBlockData = { block: this.createBlock('control_forever'), extraBlocks: {} };
                    } else if (trimmed.startsWith('REPEAT')) {
                        const times = trimmed.match(/REPEAT\s+(.+?):/i)[1];
                        context.opcode = 'control_repeat';
                        newBlockData = { block: this.createBlock('control_repeat', { inputs: { TIMES: this.parseValue(times, context) } }), extraBlocks: context.extraBlocks };
                    } else if (trimmed.startsWith('IF')) {
                        const condition = trimmed.match(/IF\s+(.+?)\s+THEN:/i)[1];
                        const ifBlock = this.createBlock('control_if');
                        blockId = Object.keys(ifBlock)[0];
                        context.parentId = blockId;
                        const condId = this.parseCondition(condition, context);
                        ifBlock[blockId].inputs.CONDITION = [2, condId];
                        newBlockData = { block: ifBlock, extraBlocks: context.extraBlocks };
                    } else if (trimmed.startsWith('ELSE')) {
                        const ifBlock = allBlocks[lastBlockId];
                        if (ifBlock && ifBlock.opcode === 'control_if') {
                            ifBlock.opcode = 'control_if_else';
                            childResult = parseStructure(i + 1, currentIndent + 2, target);
                            if (childResult.firstBlockId) {
                                ifBlock.inputs.SUBSTACK2 = [2, childResult.firstBlockId];
                                childResult.blocks[childResult.firstBlockId].parent = lastBlockId;
                                Object.assign(allBlocks, childResult.blocks);
                            }
                            i = childResult.endIndex;
                            continue;
                        }
                    }

                    if (newBlockData) {
                        childResult = parseStructure(i + 1, currentIndent + 2, target);
                        blockId = Object.keys(newBlockData.block)[0];
                        if (childResult.firstBlockId) {
                            newBlockData.block[blockId].inputs.SUBSTACK = [2, childResult.firstBlockId];
                            childResult.blocks[childResult.firstBlockId].parent = blockId;
                            Object.assign(newBlockData.extraBlocks, childResult.blocks);
                        }
                        linkBlock(newBlockData);
                        i = childResult.endIndex;
                        continue;
                    }
                } else {
                    linkBlock(this.parseCommand(trimmed, target));
                }
                i++;
            }
            return { blocks: allBlocks, firstBlockId, endIndex: i };
        };

        let i = 0;
        let currentTargetIndent = -1;
        while (i < lines.length) {
            const line = lines[i];
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) { i++; continue; }
            
            const indent = getIndent(line);

            if (trimmed.startsWith('SPRITE') || trimmed.startsWith('STAGE')) {
                if (trimmed.startsWith('SPRITE')) {
                    const name = trimmed.match(/SPRITE\s+(.+?):/i)[1];
                    currentTarget = this.createSprite(name);
                    this.project.targets.push(currentTarget);
                } else {
                    currentTarget = stage;
                }
                currentTargetIndent = indent;
                i++;
            } else if (trimmed.startsWith('WHEN')) {
                const eventData = this.parseCommand(trimmed, currentTarget);
                const eventId = Object.keys(eventData.block)[0];
                
                const nextLineIndent = (i + 1 < lines.length) ? getIndent(lines[i+1]) : 0;
                const result = parseStructure(i + 1, nextLineIndent, currentTarget);
                
                eventData.block[eventId].next = result.firstBlockId;
                if (result.firstBlockId) result.blocks[result.firstBlockId].parent = eventId;
                
                const count = scriptCount[currentTarget.name] || 0;
                eventData.block[eventId].x = 50 + (count % 3) * 350;
                eventData.block[eventId].y = 50 + Math.floor(count / 3) * 300;
                scriptCount[currentTarget.name] = count + 1;

                Object.assign(currentTarget.blocks, eventData.block, eventData.extraBlocks, result.blocks);
                i = result.endIndex;
            } else {
                 this.warnings.push(`Ignoring line not associated with a script: "${trimmed}"`);
                 i++;
            }
        }
        return this.project;
    }

    async generateSB3() {
        if (!this.project) throw new Error('No project to generate');
        const zip = new JSZip();
        zip.file('project.json', JSON.stringify(this.project));

        const stageAsset = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0,0,480,360"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" /><stop offset="100%" style="stop-color:#98FB98;stop-opacity:1" /></linearGradient></defs><rect width="480" height="360" fill="url(#bg)"/></svg>`;
        const spriteAsset = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="-2 -2 104 104"><g><ellipse cx="50" cy="50" rx="45" ry="38" fill="#FF8C00" stroke="#000000" stroke-width="4"/><g transform="translate(0,-5)"><ellipse cx="35" cy="40" rx="10" ry="12" fill="#FFFFFF" stroke="#000000" stroke-width="2"/><ellipse cx="65" cy="40" rx="10" ry="12" fill="#FFFFFF" stroke="#000000" stroke-width="2"/><circle cx="35" cy="42" r="5" fill="#000000"/><circle cx="65" cy="42" r="5" fill="#000000"/></g></g></svg>`;

        zip.file('cd21514d0531fdffb22204e0ec5ed84a.svg', stageAsset);
        zip.file('bcf454acf82e4504149f7ffe07081dbc.svg', spriteAsset);
        
        const silentWav = new Uint8Array([82, 73, 70, 70, 36, 0, 0, 0, 87, 65, 86, 69, 102, 109, 116, 32, 16, 0, 0, 0, 1, 0, 1, 0, 68, 172, 0, 0, 136, 88, 1, 0, 2, 0, 16, 0, 100, 97, 116, 97, 0, 0, 0, 0]);
        zip.file('83a9787d4cb6f3b7632b4ddfebf74367.wav', silentWav); // Pop
        zip.file('83c36d806dc92327b9e7049a565c6bff.wav', silentWav); // Meow
        
        this.generatedSB3 = await zip.generateAsync({ type: 'blob' });
        return this.generatedSB3;
    }

    validate() {
        const scriptsFound = this.project.targets.reduce((acc, t) => acc + Object.values(t.blocks || {}).filter(b => b.topLevel).length, 0);
        if (scriptsFound === 0 && this.errors.length === 0) this.warnings.push("No scripts found. Scripts must start with 'WHEN'.");
        return {
            isValid: this.errors.length === 0,
            errors: this.errors,
            parsingWarnings: this.warnings,
            scriptsFound,
            variablesCreated: this.variables.size
        };
    }
}

export default RealSB3Creator;