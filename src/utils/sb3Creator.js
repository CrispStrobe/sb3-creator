import JSZip from 'jszip';

// Comprehensive block definitions
const blockDefinitions = {
    motion: {
        'motion_movesteps': { inputs: ['STEPS'], fields: [] },
        'motion_turnright': { inputs: ['DEGREES'], fields: [] },
        'motion_turnleft': { inputs: ['DEGREES'], fields: [] },
        'motion_gotoxy': { inputs: ['X', 'Y'], fields: [] },
        'motion_changexby': { inputs: ['DX'], fields: [] },
        'motion_changeyby': { inputs: ['DY'], fields: [] },
        'motion_setx': { inputs: ['X'], fields: [] },
        'motion_sety': { inputs: ['Y'], fields: [] },
        'motion_pointindirection': { inputs: ['DIRECTION'], fields: [] },
    },
    looks: {
        'looks_sayforsecs': { inputs: ['MESSAGE', 'SECS'], fields: [] },
        'looks_say': { inputs: ['MESSAGE'], fields: [] },
        'looks_thinkforsecs': { inputs: ['MESSAGE', 'SECS'], fields: [] },
        'looks_think': { inputs: ['MESSAGE'], fields: [] },
        'looks_show': { inputs: [], fields: [] },
        'looks_hide': { inputs: [], fields: [] },
        'looks_switchcostumeto': { inputs: ['COSTUME'], fields: [] },
        'looks_nextcostume': { inputs: [], fields: [] },
        'looks_changesizeby': { inputs: ['CHANGE'], fields: [] },
        'looks_setsizeto': { inputs: ['SIZE'], fields: [] },
    },
    sound: {
        'sound_play': { inputs: ['SOUND_MENU'], fields: [] },
        'sound_playuntildone': { inputs: ['SOUND_MENU'], fields: [] },
        'sound_stopallsounds': { inputs: [], fields: [] },
        'sound_changevolumeby': { inputs: ['VOLUME'], fields: [] },
        'sound_setvolumeto': { inputs: ['VOLUME'], fields: [] },
    },
    pen: {
        'pen_clear': { inputs: [], fields: [] },
        'pen_penDown': { inputs: [], fields: [] },
        'pen_penUp': { inputs: [], fields: [] },
        'pen_setPenColorToColor': { inputs: ['COLOR'], fields: [] },
        'pen_changePenSizeBy': { inputs: ['SIZE'], fields: [] },
        'pen_setPenSizeTo': { inputs: ['SIZE'], fields: [] },
    },
    sensing: {
        'sensing_askandwait': { inputs: ['QUESTION'], fields: [] },
        'sensing_answer': { inputs: [], fields: [] },
        'sensing_keypressed': { inputs: [], fields: ['KEY_OPTION'] },
        'sensing_mousedown': { inputs: [], fields: [] },
        'sensing_mousex': { inputs: [], fields: [] },
        'sensing_mousey': { inputs: [], fields: [] },
        'sensing_touchingobject': { inputs: [], fields: ['TOUCHINGOBJECTMENU'] },
        'sensing_timer': { inputs: [], fields: [] },
        'sensing_resettimer': { inputs: [], fields: [] },
    },
    data: {
        'data_setvariableto': { inputs: ['VALUE'], fields: ['VARIABLE'] },
        'data_changevariableby': { inputs: ['VALUE'], fields: ['VARIABLE'] },
        'data_showvariable': { inputs: [], fields: ['VARIABLE'] },
        'data_hidevariable': { inputs: [], fields: ['VARIABLE'] },
    },
    event: {
        'event_whenflagclicked': { inputs: [], fields: [] },
        'event_whenkeypressed': { inputs: [], fields: ['KEY_OPTION'] },
        'event_whenthisspriteclicked': { inputs: [], fields: [] },
        'event_broadcast': { inputs: ['BROADCAST_INPUT'], fields: [] },
        'event_broadcastandwait': { inputs: ['BROADCAST_INPUT'], fields: [] },
    },
    control: {
        'control_wait': { inputs: ['DURATION'], fields: [] },
        'control_forever': { inputs: [], fields: [] },
        'control_repeat': { inputs: ['TIMES'], fields: [] },
        'control_if': { inputs: ['CONDITION'], fields: [] },
        'control_if_else': { inputs: ['CONDITION'], fields: [] },
        'control_stop': { inputs: [], fields: ['STOP_OPTION'] },
    },
    operator: {
        'operator_add': { inputs: ['NUM1', 'NUM2'], fields: [] },
        'operator_subtract': { inputs: ['NUM1', 'NUM2'], fields: [] },
        'operator_multiply': { inputs: ['NUM1', 'NUM2'], fields: [] },
        'operator_divide': { inputs: ['NUM1', 'NUM2'], fields: [] },
        'operator_random': { inputs: ['FROM', 'TO'], fields: [] },
        'operator_gt': { inputs: ['OPERAND1', 'OPERAND2'], fields: [] },
        'operator_lt': { inputs: ['OPERAND1', 'OPERAND2'], fields: [] },
        'operator_equals': { inputs: ['OPERAND1', 'OPERAND2'], fields: [] },
        'operator_and': { inputs: ['OPERAND1', 'OPERAND2'], fields: [] },
        'operator_or': { inputs: ['OPERAND1', 'OPERAND2'], fields: [] },
        'operator_not': { inputs: ['OPERAND'], fields: [] },
        'operator_join': { inputs: ['STRING1', 'STRING2'], fields: [] },
        'operator_letter_of': { inputs: ['LETTER', 'STRING'], fields: [] },
        'operator_length': { inputs: ['STRING'], fields: [] },
    }
};

// Structured error classes
class SB3Error extends Error {
    constructor(message, type = 'SB3Error') {
        super(message);
        this.name = type;
        this.isSB3Error = true;
    }
}

class ParseError extends SB3Error {
    constructor(message, line = null) {
        super(message, 'ParseError');
        this.line = line;
    }
}

class ValidationError extends SB3Error {
    constructor(message) {
        super(message, 'ValidationError');
    }
}

class AssetError extends SB3Error {
    constructor(message) {
        super(message, 'AssetError');
    }
}

/**
 * Enhanced SB3 Creator with improved accuracy and comprehensive command support
 */
class EnhancedSB3Creator {
    constructor() {
        this.reset();
    }

    reset() {
        this.project = {
            targets: [],
            monitors: [],
            extensions: [],
            meta: { semver: "3.0.0", vm: "4.6.0", agent: "Enhanced SB3 Creator/1.0.0" }
        };
        this.usedIds = new Set();
        this.variables = new Map(); // scope:name -> {id, name, isGlobal}
        this.assets = new Map(); // assetId -> {type, data, metadata}
        this.generatedSB3 = null;
        this.errors = [];
        this.warnings = [];
        this.scriptCount = 0;
    }

    // Use Scratch's character set for IDs
    generateId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#%()*+,-./:;=?@[]^_`{|}~';
        let id;
        do {
            id = '';
            for (let i = 0; i < 20; i++) {
                id += chars[Math.floor(Math.random() * chars.length)];
            }
        } while (this.usedIds.has(id));
        this.usedIds.add(id);
        return id;
    }

    // Determine if variable should be global
    isGlobalVariable(name, target) {
        const globalVars = ['health', 'score', 'game active', 'speed', 'lives', 'level', 'time', 'points'];
        return globalVars.includes(name.toLowerCase()) || target.isStage;
    }

    getOrCreateVariable(name, target) {
        const isGlobal = this.isGlobalVariable(name, target);
        const scope = isGlobal ? 'Stage' : target.name;
        const key = `${scope}:${name}`;

        if (!this.variables.has(key)) {
            const id = this.generateId();
            this.variables.set(key, { id, name, isGlobal });
            
            const varTarget = isGlobal ? this.project.targets.find(t => t.isStage) : target;
            if (varTarget) {
                if (!varTarget.variables) varTarget.variables = {};
                varTarget.variables[id] = [name, 0];
                
                // Create monitor for global variables
                if (isGlobal) {
                    this.createMonitor(id, name, 'data_variable');
                }
            }
        }
        return this.variables.get(key);
    }

    createMonitor(varId, varName, opcode = 'data_variable') {
        if (this.project.monitors.find(m => m.id === varId)) return;
        
        const monitorY = 5 + this.project.monitors.length * 28;
        this.project.monitors.push({
            id: varId,
            mode: "default",
            opcode,
            params: opcode === 'data_variable' ? { VARIABLE: varName } : { LIST: varName },
            spriteName: null,
            value: opcode === 'data_variable' ? 0 : [],
            width: 0,
            height: 0,
            x: 5,
            y: monitorY,
            visible: true,
            sliderMin: 0,
            sliderMax: 100,
            isDiscrete: true
        });
    }

    // Create shadow block for dropdown menus
    createShadowBlock(opcode, fieldName, value, parentId) {
        const shadowId = this.generateId();
        const shadowOpcode = this.getShadowOpcode(opcode, fieldName);
        
        return {
            id: shadowId,
            block: {
                opcode: shadowOpcode,
                next: null,
                parent: parentId,
                inputs: {},
                fields: { [fieldName]: [value, null] },
                shadow: true,
                topLevel: false
            }
        };
    }

    getShadowOpcode(parentOpcode, fieldName) {
        const shadowMap = {
            'KEY_OPTION': 'sensing_keyoptions',
            'TOUCHINGOBJECTMENU': 'sensing_touchingobjectmenu',
            'DISTANCETOMENU': 'sensing_distancetomenu',
            'BACKDROP': 'event_whenbackdropswitchesto_menu',
            'BROADCAST_OPTION': 'event_broadcast_menu',
            'STOP_OPTION': 'control_stop_menu',
            'CLONE_OPTION': 'control_create_clone_of_menu'
        };
        return shadowMap[fieldName] || parentOpcode + '_menu';
    }

    createBlock(opcode, options = {}) {
        const id = this.generateId();
        const block = {
            opcode,
            next: null,
            parent: null,
            inputs: {},
            fields: {},
            shadow: false,
            topLevel: false,
            ...options
        };
        return { id, block: { [id]: block } };
    }

    // Enhanced value parsing with proper string concatenation and operator precedence
    parseValue(valueStr, context) {
        valueStr = valueStr.trim();
        
        // Handle literals
        if (/^-?\d+(\.\d+)?$/.test(valueStr)) {
            return [1, [4, valueStr]];
        }
        
        // Handle quoted strings - NO variable interpolation for now
        if (valueStr.startsWith('"') && valueStr.endsWith('"')) {
            return [1, [10, valueStr.slice(1, -1)]];
        }
        
        if (/^(true|false)$/i.test(valueStr)) {
            return [1, [10, valueStr.toLowerCase()]];
        }

        // Handle operators with proper precedence (only if not in quotes)
        const operators = [
            { symbols: ['*', '/'], opcodes: ['operator_multiply', 'operator_divide'] },
            { symbols: ['+', '-'], opcodes: ['operator_add', 'operator_subtract'] }
        ];

        for (const { symbols, opcodes } of operators) {
            for (let i = 0; i < symbols.length; i++) {
                const symbol = symbols[i];
                const opcode = opcodes[i];
                const parts = valueStr.split(symbol);
                
                if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
                    const opId = this.generateId();
                    context.extraBlocks[opId] = {
                        opcode,
                        parent: context.parentId,
                        next: null,
                        shadow: false,
                        topLevel: false,
                        inputs: {
                            NUM1: this.parseValue(parts[0].trim(), context),
                            NUM2: this.parseValue(parts[1].trim(), context)
                        },
                        fields: {}
                    };
                    return [3, opId, [4, "0"]];
                }
            }
        }

        // Handle special sensing values that should be blocks, not variables
        if (valueStr === 'answer') {
            const answerId = this.generateId();
            context.extraBlocks[answerId] = {
                opcode: 'sensing_answer',
                parent: context.parentId,
                next: null,
                shadow: false,
                topLevel: false,
                inputs: {},
                fields: {}
            };
            return [3, answerId, [4, ""]];
        }
        
        if (valueStr === 'mouse x') {
            const mouseXId = this.generateId();
            context.extraBlocks[mouseXId] = {
                opcode: 'sensing_mousex',
                parent: context.parentId,
                next: null,
                shadow: false,
                topLevel: false,
                inputs: {},
                fields: {}
            };
            return [3, mouseXId, [4, ""]];
        }
        
        if (valueStr === 'mouse y') {
            const mouseYId = this.generateId();
            context.extraBlocks[mouseYId] = {
                opcode: 'sensing_mousey',
                parent: context.parentId,
                next: null,
                shadow: false,
                topLevel: false,
                inputs: {},
                fields: {}
            };
            return [3, mouseYId, [4, ""]];
        }
        
        if (valueStr === 'timer') {
            const timerId = this.generateId();
            context.extraBlocks[timerId] = {
                opcode: 'sensing_timer',
                parent: context.parentId,
                next: null,
                shadow: false,
                topLevel: false,
                inputs: {},
                fields: {}
            };
            return [3, timerId, [4, ""]];
        }

        // Handle variables
        if (/^[a-zA-Z_][a-zA-Z0-9_\s]*$/.test(valueStr)) {
            const variable = this.getOrCreateVariable(valueStr, context.target);
            return [3, [12, variable.name, variable.id], [10, ""]];
        }

        // Default to string literal
        return [1, [10, valueStr]];
    }

    parseCondition(conditionStr, context) {
        conditionStr = conditionStr.trim();
        
        const comparisons = [
            { symbol: '<=', opcode: 'operator_lt' }, // Handle <= before <
            { symbol: '>=', opcode: 'operator_gt' }, // Handle >= before >
            { symbol: '<', opcode: 'operator_lt' },
            { symbol: '>', opcode: 'operator_gt' },
            { symbol: '=', opcode: 'operator_equals' }
        ];

        for (const { symbol, opcode } of comparisons) {
            const parts = conditionStr.split(symbol);
            if (parts.length === 2) {
                const id = this.generateId();
                context.extraBlocks[id] = {
                    opcode,
                    parent: context.parentId,
                    next: null,
                    shadow: false,
                    topLevel: false,
                    inputs: {
                        OPERAND1: this.parseValue(parts[0].trim(), context),
                        OPERAND2: this.parseValue(parts[1].trim(), context)
                    },
                    fields: {}
                };
                return id;
            }
        }

        // Handle special conditions
        if (conditionStr.startsWith('touching ')) {
            const targetName = conditionStr.replace('touching ', '').trim();
            const id = this.generateId();
            const shadowData = this.createShadowBlock('sensing_touchingobject', 'TOUCHINGOBJECTMENU', targetName, id);
            
            context.extraBlocks[id] = {
                opcode: 'sensing_touchingobject',
                parent: context.parentId,
                next: null,
                shadow: false,
                topLevel: false,
                inputs: { TOUCHINGOBJECTMENU: [1, shadowData.id] },
                fields: {}
            };
            context.extraBlocks[shadowData.id] = shadowData.block;
            return id;
        }

        // Default: treat as boolean variable
        const id = this.generateId();
        context.extraBlocks[id] = {
            opcode: 'operator_equals',
            parent: context.parentId,
            next: null,
            shadow: false,
            topLevel: false,
            inputs: {
                OPERAND1: this.parseValue(conditionStr, context),
                OPERAND2: [1, [10, 'true']]
            },
            fields: {}
        };
        return id;
    }

    parseCommand(line, target) {
        const context = { target, extraBlocks: {}, parentId: null };
        let match;

        // Motion commands - CHECK THESE FIRST before general "set ... to" pattern
        if ((match = line.match(/^move\s+(.+)\s+steps?$/i))) {
            const { id, block } = this.createBlock('motion_movesteps');
            block[id].inputs.STEPS = this.parseValue(match[1], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        if ((match = line.match(/^turn\s+(left|right)\s+(.+)\s+degrees?$/i))) {
            const opcode = match[1].toLowerCase() === 'left' ? 'motion_turnleft' : 'motion_turnright';
            const { id, block } = this.createBlock(opcode);
            block[id].inputs.DEGREES = this.parseValue(match[2], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        if ((match = line.match(/^go to x:\s*(.+?)\s+y:\s*(.+)$/i))) {
            const { id, block } = this.createBlock('motion_gotoxy');
            block[id].inputs.X = this.parseValue(match[1], context);
            block[id].inputs.Y = this.parseValue(match[2], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        if ((match = line.match(/^change x by\s+(.+)$/i))) {
            const { id, block } = this.createBlock('motion_changexby');
            block[id].inputs.DX = this.parseValue(match[1], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        if ((match = line.match(/^change y by\s+(.+)$/i))) {
            const { id, block } = this.createBlock('motion_changeyby');
            block[id].inputs.DY = this.parseValue(match[1], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        // CRITICAL: Check motion set x/y BEFORE general variable setting
        if ((match = line.match(/^set x to\s+(.+)$/i))) {
            const { id, block } = this.createBlock('motion_setx');
            block[id].inputs.X = this.parseValue(match[1], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        if ((match = line.match(/^set y to\s+(.+)$/i))) {
            const { id, block } = this.createBlock('motion_sety');
            block[id].inputs.Y = this.parseValue(match[1], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        if ((match = line.match(/^point in direction\s+(.+)$/i))) {
            const { id, block } = this.createBlock('motion_pointindirection');
            block[id].inputs.DIRECTION = this.parseValue(match[1], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        // Data commands - AFTER motion commands to avoid conflicts
        if ((match = line.match(/^set\s+(.+?)\s+to\s+(.+)$/i))) {
            const variable = this.getOrCreateVariable(match[1].trim(), target);
            const { id, block } = this.createBlock('data_setvariableto');
            block[id].inputs.VALUE = this.parseValue(match[2], context);
            block[id].fields.VARIABLE = [variable.name, variable.id];
            return { block, extraBlocks: context.extraBlocks };
        }

        if ((match = line.match(/^change\s+(.+?)\s+by\s+(.+)$/i))) {
            const variable = this.getOrCreateVariable(match[1].trim(), target);
            const { id, block } = this.createBlock('data_changevariableby');
            block[id].inputs.VALUE = this.parseValue(match[2], context);
            block[id].fields.VARIABLE = [variable.name, variable.id];
            return { block, extraBlocks: context.extraBlocks };
        }

        // Looks commands
        if ((match = line.match(/^say\s+(.+?)(?:\s+for\s+(.+)\s+seconds?)?$/i))) {
            const opcode = match[2] ? 'looks_sayforsecs' : 'looks_say';
            const { id, block } = this.createBlock(opcode);
            block[id].inputs.MESSAGE = this.parseValue(match[1], context);
            if (match[2]) {
                block[id].inputs.SECS = this.parseValue(match[2], context);
            }
            return { block, extraBlocks: context.extraBlocks };
        }

        if ((match = line.match(/^think\s+(.+?)(?:\s+for\s+(.+)\s+seconds?)?$/i))) {
            const opcode = match[2] ? 'looks_thinkforsecs' : 'looks_think';
            const { id, block } = this.createBlock(opcode);
            block[id].inputs.MESSAGE = this.parseValue(match[1], context);
            if (match[2]) {
                block[id].inputs.SECS = this.parseValue(match[2], context);
            }
            return { block, extraBlocks: context.extraBlocks };
        }

        if (line.toLowerCase() === 'show') {
            return { block: this.createBlock('looks_show').block, extraBlocks: {} };
        }

        if (line.toLowerCase() === 'hide') {
            return { block: this.createBlock('looks_hide').block, extraBlocks: {} };
        }

        if ((match = line.match(/^switch costume to\s+(.+)$/i))) {
            const { id, block } = this.createBlock('looks_switchcostumeto');
            block[id].inputs.COSTUME = this.parseValue(match[1], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        if (line.toLowerCase() === 'next costume') {
            return { block: this.createBlock('looks_nextcostume').block, extraBlocks: {} };
        }

        if ((match = line.match(/^change size by\s+(.+)$/i))) {
            const { id, block } = this.createBlock('looks_changesizeby');
            block[id].inputs.CHANGE = this.parseValue(match[1], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        if ((match = line.match(/^set size to\s+(.+)$/i))) {
            const { id, block } = this.createBlock('looks_setsizeto');
            block[id].inputs.SIZE = this.parseValue(match[1], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        // Sound commands
        if ((match = line.match(/^play sound\s+(.+)$/i))) {
            const { id, block } = this.createBlock('sound_play');
            block[id].inputs.SOUND_MENU = this.parseValue(match[1], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        if ((match = line.match(/^play sound\s+(.+)\s+until done$/i))) {
            const { id, block } = this.createBlock('sound_playuntildone');
            block[id].inputs.SOUND_MENU = this.parseValue(match[1], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        if (line.toLowerCase() === 'stop all sounds') {
            return { block: this.createBlock('sound_stopallsounds').block, extraBlocks: {} };
        }

        if ((match = line.match(/^change volume by\s+(.+)$/i))) {
            const { id, block } = this.createBlock('sound_changevolumeby');
            block[id].inputs.VOLUME = this.parseValue(match[1], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        if ((match = line.match(/^set volume to\s+(.+)$/i))) {
            const { id, block } = this.createBlock('sound_setvolumeto');
            block[id].inputs.VOLUME = this.parseValue(match[1], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        // Pen commands
        if (line.toLowerCase() === 'clear') {
            // Add pen extension if not already added
            if (!this.project.extensions.includes('pen')) {
                this.project.extensions.push('pen');
            }
            return { block: this.createBlock('pen_clear').block, extraBlocks: {} };
        }

        if (line.toLowerCase() === 'pen down') {
            if (!this.project.extensions.includes('pen')) {
                this.project.extensions.push('pen');
            }
            return { block: this.createBlock('pen_penDown').block, extraBlocks: {} };
        }

        if (line.toLowerCase() === 'pen up') {
            if (!this.project.extensions.includes('pen')) {
                this.project.extensions.push('pen');
            }
            return { block: this.createBlock('pen_penUp').block, extraBlocks: {} };
        }

        if ((match = line.match(/^set pen color to\s+(.+)$/i))) {
            if (!this.project.extensions.includes('pen')) {
                this.project.extensions.push('pen');
            }
            const { id, block } = this.createBlock('pen_setPenColorToColor');
            block[id].inputs.COLOR = this.parseValue(match[1], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        if ((match = line.match(/^change pen size by\s+(.+)$/i))) {
            if (!this.project.extensions.includes('pen')) {
                this.project.extensions.push('pen');
            }
            const { id, block } = this.createBlock('pen_changePenSizeBy');
            block[id].inputs.SIZE = this.parseValue(match[1], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        if ((match = line.match(/^set pen size to\s+(.+)$/i))) {
            if (!this.project.extensions.includes('pen')) {
                this.project.extensions.push('pen');
            }
            const { id, block } = this.createBlock('pen_setPenSizeTo');
            block[id].inputs.SIZE = this.parseValue(match[1], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        // Sensing commands
        if ((match = line.match(/^ask\s+(.+?)\s+and wait$/i))) {
            const { id, block } = this.createBlock('sensing_askandwait');
            block[id].inputs.QUESTION = this.parseValue(match[1], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        if (line.toLowerCase() === 'answer') {
            return { block: this.createBlock('sensing_answer').block, extraBlocks: {} };
        }

        if (line.toLowerCase() === 'mouse x') {
            return { block: this.createBlock('sensing_mousex').block, extraBlocks: {} };
        }

        if (line.toLowerCase() === 'mouse y') {
            return { block: this.createBlock('sensing_mousey').block, extraBlocks: {} };
        }

        if (line.toLowerCase() === 'mouse down?') {
            return { block: this.createBlock('sensing_mousedown').block, extraBlocks: {} };
        }

        if (line.toLowerCase() === 'timer') {
            return { block: this.createBlock('sensing_timer').block, extraBlocks: {} };
        }

        if (line.toLowerCase() === 'reset timer') {
            return { block: this.createBlock('sensing_resettimer').block, extraBlocks: {} };
        }

        // Control commands
        if ((match = line.match(/^wait\s+(.+)\s+seconds?$/i))) {
            const { id, block } = this.createBlock('control_wait');
            block[id].inputs.DURATION = this.parseValue(match[1], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        if (line.toLowerCase() === 'stop all') {
            const { id, block } = this.createBlock('control_stop');
            block[id].fields.STOP_OPTION = ['all', null];
            return { block, extraBlocks: {} };
        }

        // Event commands
        if ((match = line.match(/^when\s+(.+?)\s+key\s+pressed/i))) {
            let key = match[1].toLowerCase().trim();
            
            // Fix key name formatting for Scratch compatibility
            const keyMap = {
                'left arrow': 'left arrow',
                'right arrow': 'right arrow', 
                'up arrow': 'up arrow',
                'down arrow': 'down arrow',
                'leftarrow': 'left arrow',
                'rightarrow': 'right arrow',
                'uparrow': 'up arrow',
                'downarrow': 'down arrow',
                'space': 'space'
            };
            
            key = keyMap[key] || key;
            
            const { id, block } = this.createBlock('event_whenkeypressed', { topLevel: true });
            block[id].fields.KEY_OPTION = [key, null];
            return { block, extraBlocks: {} };
        }

        if (line.includes('flag clicked')) {
            return { 
                block: this.createBlock('event_whenflagclicked', { topLevel: true }).block, 
                extraBlocks: {} 
            };
        }

        if ((match = line.match(/^broadcast\s+(.+)$/i))) {
            const { id, block } = this.createBlock('event_broadcast');
            block[id].inputs.BROADCAST_INPUT = this.parseValue(match[1], context);
            return { block, extraBlocks: context.extraBlocks };
        }

        throw new ParseError(`Unknown command: "${line}"`);
    }

    createStage() {
        return {
            isStage: true,
            name: "Stage",
            variables: {},
            lists: {},
            broadcasts: {},
            blocks: {},
            comments: {},
            currentCostume: 0,
            costumes: [{
                assetId: "cd21514d0531fdffb22204e0ec5ed84a",
                name: "backdrop1",
                md5ext: "cd21514d0531fdffb22204e0ec5ed84a.svg",
                dataFormat: "svg",
                rotationCenterX: 240,
                rotationCenterY: 180
            }],
            sounds: [{
                assetId: "83a9787d4cb6f3b7632b4ddfebf74367",
                name: "Pop",
                dataFormat: "wav",
                rate: 48000,
                sampleCount: 1123,
                md5ext: "83a9787d4cb6f3b7632b4ddfebf74367.wav"
            }],
            volume: 100,
            layerOrder: 0,
            tempo: 60,
            videoTransparency: 50,
            videoState: "on",
            textToSpeechLanguage: null
        };
    }

    createSprite(name) {
        return {
            isStage: false,
            name,
            variables: {},
            lists: {},
            broadcasts: {},
            blocks: {},
            comments: {},
            currentCostume: 0,
            costumes: [{
                assetId: "bcf454acf82e4504149f7ffe07081dbc",
                name: "costume1",
                md5ext: "bcf454acf82e4504149f7ffe07081dbc.svg",
                dataFormat: "svg",
                rotationCenterX: 48,
                rotationCenterY: 50
            }],
            sounds: [{
                assetId: "83c36d806dc92327b9e7049a565c6bff",
                name: "Meow",
                dataFormat: "wav",
                rate: 48000,
                sampleCount: 40681,
                md5ext: "83c36d806dc92327b9e7049a565c6bff.wav"
            }],
            volume: 100,
            layerOrder: 1,
            visible: true,
            x: 0,
            y: 0,
            size: 100,
            direction: 90,
            draggable: false,
            rotationStyle: "all around"
        };
    }

    parse(pseudocode) {
        this.reset();
        if (!pseudocode.trim()) {
            throw new ParseError("Pseudocode is empty");
        }

        const lines = pseudocode.split('\n');
        const getIndent = (s) => s.match(/^\s*/)[0].length;

        const stage = this.createStage();
        this.project.targets.push(stage);
        let currentTarget = stage;

        const parseStructure = (startIndex, indentLevel, target) => {
            let i = startIndex;
            let firstBlockId = null;
            let lastBlockId = null;
            const allBlocks = {};

            const linkBlock = (newBlockData) => {
                if (!newBlockData || !newBlockData.block) return;
                const newId = Object.keys(newBlockData.block)[0];
                Object.assign(allBlocks, newBlockData.extraBlocks || {}, newBlockData.block);
                
                if (!firstBlockId) firstBlockId = newId;
                if (lastBlockId) {
                    allBlocks[lastBlockId].next = newId;
                    allBlocks[newId].parent = lastBlockId;
                }
                lastBlockId = newId;
            };

            while (i < lines.length) {
                const line = lines[i];
                if (!line.trim()) { 
                    i++; 
                    continue; 
                }
                
                const currentIndent = getIndent(line);
                if (currentIndent < indentLevel) break;
                if (currentIndent > indentLevel) {
                    this.warnings.push(`Skipping line with unexpected indentation: "${line.trim()}"`);
                    i++;
                    continue;
                }

                const trimmed = line.trim();

                if (trimmed.endsWith(':')) {
                    let newBlockData;
                    const context = { target, extraBlocks: {}, parentId: null };

                    if (trimmed.startsWith('FOREVER')) {
                        newBlockData = { 
                            block: this.createBlock('control_forever').block, 
                            extraBlocks: {} 
                        };
                    } else if (trimmed.startsWith('REPEAT')) {
                        const times = trimmed.match(/REPEAT\s+(.+?):/i)[1];
                        const { id, block } = this.createBlock('control_repeat');
                        block[id].inputs.TIMES = this.parseValue(times, context);
                        newBlockData = { block, extraBlocks: context.extraBlocks };
                    } else if (trimmed.startsWith('IF')) {
                        const condition = trimmed.match(/IF\s+(.+?)\s+THEN:/i)[1];
                        const { id, block } = this.createBlock('control_if');
                        context.parentId = id;
                        const condId = this.parseCondition(condition, context);
                        block[id].inputs.CONDITION = [2, condId];
                        newBlockData = { block, extraBlocks: context.extraBlocks };
                    } else if (trimmed.startsWith('ELSE')) {
                        // Find the parent IF block to convert to IF_ELSE
                        if (lastBlockId && allBlocks[lastBlockId] && allBlocks[lastBlockId].opcode === 'control_if') {
                            allBlocks[lastBlockId].opcode = 'control_if_else';
                            const childResult = parseStructure(i + 1, currentIndent + 2, target);
                            if (childResult.firstBlockId) {
                                allBlocks[lastBlockId].inputs.SUBSTACK2 = [2, childResult.firstBlockId];
                                childResult.blocks[childResult.firstBlockId].parent = lastBlockId;
                                Object.assign(allBlocks, childResult.blocks);
                            }
                            i = childResult.endIndex;
                            continue;
                        } else {
                            this.warnings.push('ELSE block without matching IF block');
                        }
                    }

                    if (newBlockData) {
                        const childResult = parseStructure(i + 1, currentIndent + 2, target);
                        const blockId = Object.keys(newBlockData.block)[0];
                        
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
                    try {
                        linkBlock(this.parseCommand(trimmed, target));
                    } catch (error) {
                        if (error.isSB3Error) {
                            this.warnings.push(error.message);
                        } else {
                            throw error;
                        }
                    }
                }
                i++;
            }

            return { blocks: allBlocks, firstBlockId, endIndex: i };
        };

        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            const trimmed = line.trim();
            
            if (!trimmed || trimmed.startsWith('#')) { 
                i++; 
                continue; 
            }

            if (trimmed.startsWith('SPRITE') || trimmed.startsWith('STAGE')) {
                if (trimmed.startsWith('SPRITE')) {
                    const name = trimmed.match(/SPRITE\s+(.+?):/i)[1];
                    currentTarget = this.createSprite(name);
                    this.project.targets.push(currentTarget);
                } else {
                    currentTarget = stage;
                }
                i++;
            } else if (trimmed.startsWith('WHEN')) {
                try {
                    const eventData = this.parseCommand(trimmed, currentTarget);
                    const eventId = Object.keys(eventData.block)[0];
                    
                    eventData.block[eventId].topLevel = true;
                    eventData.block[eventId].x = 50 + (this.scriptCount % 3) * 350;
                    eventData.block[eventId].y = 50 + Math.floor(this.scriptCount / 3) * 300;
                    this.scriptCount++;
                    
                    const nextLineIndent = (i + 1 < lines.length) ? getIndent(lines[i + 1]) : 0;
                    const result = parseStructure(i + 1, nextLineIndent, currentTarget);
                    
                    if (result.firstBlockId) {
                        eventData.block[eventId].next = result.firstBlockId;
                        result.blocks[result.firstBlockId].parent = eventId;
                    }

                    Object.assign(currentTarget.blocks, eventData.block, eventData.extraBlocks || {}, result.blocks);
                    i = result.endIndex;
                } catch (error) {
                    if (error.isSB3Error) {
                        this.warnings.push(`Error in line "${trimmed}": ${error.message}`);
                        i++;
                    } else {
                        throw error;
                    }
                }
            } else {
                this.warnings.push(`Ignoring line not associated with a script: "${trimmed}"`);
                i++;
            }
        }

        return this.project;
    }

    async generateSB3() {
        if (!this.project) {
            throw new ValidationError('No project to generate');
        }

        const zip = new JSZip();
        zip.file('project.json', JSON.stringify(this.project));

        // Add default assets
        const stageAsset = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0,0,480,360"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" /><stop offset="100%" style="stop-color:#98FB98;stop-opacity:1" /></linearGradient></defs><rect width="480" height="360" fill="url(#bg)"/></svg>`;
        const spriteAsset = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="96" height="100" viewBox="-2 -2 100 104"><g><ellipse cx="47" cy="50" rx="45" ry="38" fill="#FF8C00" stroke="#000000" stroke-width="2"/><ellipse cx="32" cy="40" rx="8" ry="10" fill="#FFFFFF" stroke="#000000" stroke-width="1"/><ellipse cx="62" cy="40" rx="8" ry="10" fill="#FFFFFF" stroke="#000000" stroke-width="1"/><circle cx="32" cy="42" r="4" fill="#000000"/><circle cx="62" cy="42" r="4" fill="#000000"/><path d="M 25 65 Q 47 75 70 65" stroke="#000000" stroke-width="2" fill="none"/></g></svg>`;

        zip.file('cd21514d0531fdffb22204e0ec5ed84a.svg', stageAsset);
        zip.file('bcf454acf82e4504149f7ffe07081dbc.svg', spriteAsset);
        
        // Create minimal WAV files
        const silentWav = new Uint8Array([82, 73, 70, 70, 36, 0, 0, 0, 87, 65, 86, 69, 102, 109, 116, 32, 16, 0, 0, 0, 1, 0, 1, 0, 68, 172, 0, 0, 136, 88, 1, 0, 2, 0, 16, 0, 100, 97, 116, 97, 0, 0, 0, 0]);
        zip.file('83a9787d4cb6f3b7632b4ddfebf74367.wav', silentWav);
        zip.file('83c36d806dc92327b9e7049a565c6bff.wav', silentWav);

        // Add custom assets
        for (const [assetId, assetData] of this.assets) {
            zip.file(assetData.filename, assetData.data);
        }

        this.generatedSB3 = await zip.generateAsync({ type: 'blob' });
        return this.generatedSB3;
    }

    validate() {
        this.errors = [];
        
        // Check for sprites without costumes
        for (const target of this.project.targets) {
            if (!target.costumes || target.costumes.length === 0) {
                this.errors.push(`${target.name} has no costumes`);
            }
        }

        // Check for scripts
        const scriptsFound = this.project.targets.reduce((acc, t) => 
            acc + Object.values(t.blocks || {}).filter(b => b.topLevel).length, 0
        );

        if (scriptsFound === 0 && this.errors.length === 0) {
            this.warnings.push("No scripts found. Scripts must start with 'WHEN'.");
        }

        return {
            isValid: this.errors.length === 0,
            errors: this.errors,
            parsingWarnings: this.warnings,
            scriptsFound,
            variablesCreated: this.variables.size,
            targets: this.project.targets.length
        };
    }

    // Add method to handle SVG uploads
    async addSVGAsset(file, name, targetIndex = 1) {
        if (!file.type.includes('svg')) {
            throw new AssetError('File must be an SVG');
        }

        const svgText = await file.text();
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = svgDoc.querySelector('svg');
        
        if (!svgElement) {
            throw new AssetError('Invalid SVG file');
        }

        // Extract dimensions
        const width = parseFloat(svgElement.getAttribute('width')) || 240;
        const height = parseFloat(svgElement.getAttribute('height')) || 180;
        
        const assetId = this.generateId();
        const filename = `${assetId}.svg`;
        
        // Store asset data
        this.assets.set(assetId, {
            type: 'svg',
            data: svgText,
            filename,
            metadata: { width, height }
        });

        // Create costume object
        const costume = {
            assetId,
            name,
            md5ext: filename,
            dataFormat: 'svg',
            rotationCenterX: width / 2,
            rotationCenterY: height / 2
        };

        // Add to target
        if (this.project.targets[targetIndex]) {
            this.project.targets[targetIndex].costumes.push(costume);
        }

        return { assetId, costume };
    }
}

export default EnhancedSB3Creator;