import JSZip from 'jszip';


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
 * SB3 Creator: compiles the pseudocode language into a Scratch 3.0 project.
 */
class SB3Creator {
    constructor() {
        this.reset();
    }

    reset() {
        this.project = {
            targets: [],
            monitors: [],
            extensions: [],
            meta: { semver: "3.0.0", vm: "4.6.0", agent: "SB3 Creator/1.0.0" }
        };
        this.usedIds = new Set();
        this.variables = new Map(); // scope:name -> {id, name, isGlobal}
        this.lists = new Map(); // scope:name -> {id, name, isGlobal}
        this.broadcasts = new Map(); // name -> id
        this.assets = new Map(); // assetId -> {type, data, metadata}
        // Explicit scope declarations (GLOBAL / LOCAL / LIST) override the magic-name fallback.
        this.declaredGlobals = new Set(); // var names forced global
        this.declaredLocals = new Set(); // `${scope}:${name}` forced local
        this.declaredGlobalLists = new Set(); // list names forced global
        this.declaredLocalLists = new Set(); // `${scope}:${name}` forced local
        this.spriteColorIndex = 0;
        this.procedures = []; // registered custom blocks (for call-site matching)
        this.currentProcArgs = null; // param name -> {type} while parsing a definition body
        this.targetNames = new Set(['Stage']); // all sprite/stage names (for sensing_of)
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

    // Filesystem-safe id for asset filenames (mirrors Scratch's md5-hex names).
    // The full block-id alphabet contains '/' and '.', which JSZip path-normalizes
    // and would desync a costume's md5ext from its stored zip entry.
    generateAssetId() {
        const hex = '0123456789abcdef';
        let id;
        do {
            id = '';
            for (let i = 0; i < 32; i++) id += hex[Math.floor(Math.random() * 16)];
        } while (this.usedIds.has(id));
        this.usedIds.add(id);
        return id;
    }

    // Determine if a variable should be global.
    // Explicit GLOBAL/LOCAL declarations win; otherwise fall back to the legacy
    // magic-name list (kept only for backwards compatibility) or Stage scope.
    isGlobalVariable(name, target) {
        if (this.declaredLocals.has(`${target.name}:${name}`)) return false;
        if (this.declaredGlobals.has(name)) return true;
        if (target.isStage) return true;
        const globalVars = ['health', 'score', 'game active', 'speed', 'lives', 'level', 'time', 'points'];
        return globalVars.includes(name.toLowerCase());
    }

    isGlobalList(name, target) {
        if (this.declaredLocalLists.has(`${target.name}:${name}`)) return false;
        if (this.declaredGlobalLists.has(name)) return true;
        return target.isStage;
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

    getOrCreateList(name, target) {
        const isGlobal = this.isGlobalList(name, target);
        const scope = isGlobal ? 'Stage' : target.name;
        const key = `${scope}:${name}`;

        if (!this.lists.has(key)) {
            const id = this.generateId();
            this.lists.set(key, { id, name, isGlobal });

            const listTarget = isGlobal ? this.project.targets.find(t => t.isStage) : target;
            if (listTarget) {
                if (!listTarget.lists) listTarget.lists = {};
                listTarget.lists[id] = [name, []];
                this.createMonitor(id, name, 'data_listcontents');
            }
        }
        return this.lists.get(key);
    }

    // Does a variable already exist in scope? Used to disambiguate reporter phrases
    // (e.g. `size`) from user variables of the same name.
    variableExists(name, target) {
        return this.variables.has(`Stage:${name}`) || this.variables.has(`${target.name}:${name}`);
    }

    listExists(name, target) {
        return this.lists.has(`Stage:${name}`) || this.lists.has(`${target.name}:${name}`);
    }

    getOrCreateBroadcast(name) {
        if (!this.broadcasts.has(name)) {
            const id = this.generateId();
            this.broadcasts.set(name, id);
            const stage = this.project.targets.find(t => t.isStage);
            if (stage) {
                if (!stage.broadcasts) stage.broadcasts = {};
                stage.broadcasts[id] = name;
            }
        }
        return { id: this.broadcasts.get(name), name };
    }

    createMonitor(varId, varName, opcode = 'data_variable') {
        if (this.project.monitors.find(m => m.id === varId)) return;

        const isList = opcode === 'data_listcontents';
        const monitorY = 5 + this.project.monitors.length * 28;
        this.project.monitors.push({
            id: varId,
            mode: isList ? "list" : "default",
            opcode,
            params: isList ? { LIST: varName } : { VARIABLE: varName },
            spriteName: null,
            value: isList ? [] : 0,
            width: isList ? 100 : 0,
            height: isList ? 120 : 0,
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

    // ---- Expression engine helpers -------------------------------------------------

    // Register a reporter/boolean block and return its id.
    pushBlock(context, opcode, inputs = {}, fields = {}) {
        const id = this.generateId();
        context.extraBlocks[id] = {
            opcode,
            parent: context.parentId,
            next: null,
            shadow: false,
            topLevel: false,
            inputs,
            fields
        };
        return id;
    }

    // Register a dropdown menu shadow block and return an input array [1, id].
    menuInput(context, opcode, field, value) {
        const id = this.generateId();
        context.extraBlocks[id] = {
            opcode,
            parent: context.parentId,
            next: null,
            shadow: true,
            topLevel: false,
            inputs: {},
            fields: { [field]: [value, null] }
        };
        return [1, id];
    }

    valueOfBlock(id) { return [3, id, [4, "0"]]; }

    // Index of the ')' matching the '(' at position `open`, or -1.
    matchParen(s, open) {
        let depth = 0, inStr = false;
        for (let i = open; i < s.length; i++) {
            const c = s[i];
            if (c === '"') { inStr = !inStr; continue; }
            if (inStr) continue;
            if (c === '(') depth++;
            else if (c === ')') { depth--; if (depth === 0) return i; }
        }
        return -1;
    }

    stripOuterParens(s) {
        s = s.trim();
        while (s.startsWith('(') && this.matchParen(s, 0) === s.length - 1) {
            s = s.slice(1, -1).trim();
        }
        return s;
    }

    prevMeaningful(s, i) {
        for (let j = i - 1; j >= 0; j--) {
            if (s[j] !== ' ') return s[j];
        }
        return null;
    }

    // Split `s` at the rightmost top-level occurrence of any operator in `ops`
    // (left-associative). Respects parentheses and quotes. Returns {left,right,op} or null.
    splitBinary(s, ops, opts = {}) {
        const ci = !!opts.ci;
        let depth = 0, inStr = false, best = null;
        for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            if (ch === '"') { inStr = !inStr; continue; }
            if (inStr) continue;
            if (ch === '(') { depth++; continue; }
            if (ch === ')') { depth--; continue; }
            if (depth !== 0) continue;
            for (const op of ops) {
                const seg = s.substr(i, op.length);
                if (ci ? seg.toLowerCase() !== op.toLowerCase() : seg !== op) continue;
                if (op === '+' || op === '-') {
                    const prev = this.prevMeaningful(s, i);
                    if (prev === null || '+-*/(,'.includes(prev)) continue; // unary sign, not a binary op
                }
                if (op === '<' && s[i + 1] === '=') continue;
                if (op === '>' && s[i + 1] === '=') continue;
                if (op === '=' && (s[i - 1] === '<' || s[i - 1] === '>' || s[i + 1] === '=')) continue;
                if (!s.slice(0, i).trim() || !s.slice(i + op.length).trim()) continue;
                best = { index: i, op };
            }
        }
        if (!best) return null;
        return {
            left: s.slice(0, best.index).trim(),
            right: s.slice(best.index + best.op.length).trim(),
            op: best.op.trim()
        };
    }

    // Parse a numeric/string value expression into a Scratch input array.
    parseValue(valueStr, context) {
        let s = this.stripOuterParens((valueStr || '').trim());

        // Literals
        if (/^-?\d+(\.\d+)?$/.test(s)) return [1, [4, s]];
        if (s.length >= 2 && s.startsWith('"') && s.endsWith('"') && this.matchQuote(s) === s.length - 1) {
            return [1, [10, s.slice(1, -1)]];
        }
        if (/^(true|false)$/i.test(s)) return [1, [10, s.toLowerCase()]];
        if (/^#[0-9a-fA-F]{6}$/.test(s)) return [1, [9, s.toLowerCase()]];

        // Binary operators, loosest binding first
        let sp;
        if ((sp = this.splitBinary(s, [' join ']))) {
            return this.valueOfBlock(this.pushBlock(context, 'operator_join', {
                STRING1: this.parseValue(sp.left, context),
                STRING2: this.parseValue(sp.right, context)
            }));
        }
        if ((sp = this.splitBinary(s, ['+', '-']))) {
            const op = sp.op === '+' ? 'operator_add' : 'operator_subtract';
            return this.valueOfBlock(this.pushBlock(context, op, {
                NUM1: this.parseValue(sp.left, context),
                NUM2: this.parseValue(sp.right, context)
            }));
        }
        if ((sp = this.splitBinary(s, ['*', '/', ' mod ']))) {
            const op = sp.op === '*' ? 'operator_multiply' : sp.op === '/' ? 'operator_divide' : 'operator_mod';
            return this.valueOfBlock(this.pushBlock(context, op, {
                NUM1: this.parseValue(sp.left, context),
                NUM2: this.parseValue(sp.right, context)
            }));
        }

        // Unary minus applied to a non-literal (e.g. `-score`)
        if (s.startsWith('-') && s.length > 1) {
            return this.valueOfBlock(this.pushBlock(context, 'operator_subtract', {
                NUM1: [1, [4, "0"]],
                NUM2: this.parseValue(s.slice(1).trim(), context)
            }));
        }

        // Reporter phrases
        const reporter = this.parseReporter(s, context);
        if (reporter) return reporter;

        // Identifier -> list or variable reporter
        if (/^[a-zA-Z_][a-zA-Z0-9_\s]*$/.test(s)) {
            if (this.listExists(s, context.target)) {
                const list = this.getOrCreateList(s, context.target);
                return [3, [13, list.name, list.id], [10, ""]];
            }
            const variable = this.getOrCreateVariable(s, context.target);
            return [3, [12, variable.name, variable.id], [10, ""]];
        }

        // Fallback: string literal
        return [1, [10, s]];
    }

    matchQuote(s) {
        for (let i = 1; i < s.length; i++) {
            if (s[i] === '"') return i;
        }
        return -1;
    }

    // Reporter phrases (blocks that report a value). Returns an input array or null.
    parseReporter(s, context) {
        const B = (op, inputs = {}, fields = {}) => this.valueOfBlock(this.pushBlock(context, op, inputs, fields));
        let m;

        // Custom-block parameters resolve to argument reporters inside their definition.
        if (this.currentProcArgs && this.currentProcArgs.has(s)) {
            const arg = this.currentProcArgs.get(s);
            const op = arg.type === 'b' ? 'argument_reporter_boolean' : 'argument_reporter_string_number';
            return B(op, {}, { VALUE: [s, null] });
        }

        if ((m = s.match(/^pick random\s+(.+)$/i))) {
            const parts = this.splitBinary(m[1], [' to '], { ci: true });
            if (parts) {
                return B('operator_random', {
                    FROM: this.parseValue(parts.left, context),
                    TO: this.parseValue(parts.right, context)
                });
            }
        }
        if ((m = s.match(/^round\s+(.+)$/i))) {
            return B('operator_round', { NUM: this.parseValue(m[1], context) });
        }
        if ((m = s.match(/^(abs|floor|ceiling|sqrt|sin|cos|tan|asin|acos|atan|ln|log)\s+of\s+(.+)$/i))) {
            return B('operator_mathop', { NUM: this.parseValue(m[2], context) }, { OPERATOR: [m[1].toLowerCase(), null] });
        }
        if ((m = s.match(/^letter\s+(.+?)\s+of\s+(.+)$/i))) {
            return B('operator_letter_of', {
                LETTER: this.parseValue(m[1], context),
                STRING: this.parseValue(m[2], context)
            });
        }
        if ((m = s.match(/^item\s+#\s+of\s+(.+)\s+in\s+(.+)$/i))) {
            const list = this.getOrCreateList(m[2].trim(), context.target);
            return B('data_itemnumoflist', { ITEM: this.parseValue(m[1], context) }, { LIST: [list.name, list.id] });
        }
        if ((m = s.match(/^item\s+(.+?)\s+of\s+(.+)$/i)) && this.listExists(m[2].trim(), context.target)) {
            const list = this.getOrCreateList(m[2].trim(), context.target);
            return B('data_itemoflist', { INDEX: this.parseValue(m[1], context) }, { LIST: [list.name, list.id] });
        }
        if ((m = s.match(/^length of\s+(.+)$/i))) {
            const arg = m[1].trim();
            if (this.listExists(arg, context.target)) {
                const list = this.getOrCreateList(arg, context.target);
                return B('data_lengthoflist', {}, { LIST: [list.name, list.id] });
            }
            return B('operator_length', { STRING: this.parseValue(arg, context) });
        }
        if ((m = s.match(/^distance to\s+(.+)$/i))) {
            const target = /^mouse(-pointer)?$/i.test(m[1].trim()) ? '_mouse_' : m[1].trim();
            return B('sensing_distanceto', { DISTANCETOMENU: this.menuInput(context, 'sensing_distancetomenu', 'DISTANCETOMENU', target) });
        }

        // [property] of [Sprite|Stage] -> sensing_of (only when the object is a real target).
        if ((m = s.match(/^(.+?)\s+of\s+(.+)$/i)) && this.targetExists(m[2].trim())) {
            const objName = m[2].trim();
            const object = /^stage$/i.test(objName) ? '_stage_' : objName;
            const propMap = {
                'x position': 'x position', 'y position': 'y position', 'direction': 'direction',
                'costume number': 'costume #', 'costume name': 'costume name', 'size': 'size',
                'volume': 'volume', 'backdrop number': 'backdrop #', 'backdrop name': 'backdrop name'
            };
            const prop = propMap[m[1].trim().toLowerCase()] || m[1].trim();
            return B('sensing_of', { OBJECT: this.menuInput(context, 'sensing_of_object_menu', 'OBJECT', object) }, { PROPERTY: [prop, null] });
        }

        // current date/time
        if ((m = s.match(/^current (year|month|date|hour|minute|second)$/i))) {
            return B('sensing_current', {}, { CURRENTMENU: [m[1].toUpperCase(), null] });
        }
        if (/^day of week$/i.test(s)) return B('sensing_current', {}, { CURRENTMENU: ['DAYOFWEEK', null] });

        // Zero-argument reporters. Single ambiguous words defer to an existing variable.
        const simple = {
            'x position': 'motion_xposition',
            'y position': 'motion_yposition',
            'mouse x': 'sensing_mousex',
            'mouse y': 'sensing_mousey',
            'days since 2000': 'sensing_dayssince2000'
        };
        const key = s.toLowerCase();
        if (simple[key]) return B(simple[key]);
        if (key === 'answer') return B('sensing_answer');
        if (key === 'timer') return B('sensing_timer');
        if (key === 'loudness') return B('sensing_loudness');
        if (key === 'username') return B('sensing_username');
        if (key === 'costume number') return B('looks_costumenumbername', {}, { NUMBER_NAME: ['number', null] });
        if (key === 'costume name') return B('looks_costumenumbername', {}, { NUMBER_NAME: ['name', null] });
        if (key === 'backdrop number') return B('looks_backdropnumbername', {}, { NUMBER_NAME: ['number', null] });
        if (key === 'backdrop name') return B('looks_backdropnumbername', {}, { NUMBER_NAME: ['name', null] });
        const ambiguous = { direction: 'motion_direction', size: 'looks_size', volume: 'sound_volume' };
        if (ambiguous[key] && !this.variableExists(s, context.target)) return B(ambiguous[key]);

        return null;
    }

    targetExists(name) {
        const lower = name.toLowerCase();
        for (const n of this.targetNames) if (n.toLowerCase() === lower) return true;
        return false;
    }

    // Normalize a key name for KEY_OPTION / WHEN key pressed menus.
    normalizeKey(key) {
        key = key.toLowerCase().trim();
        const keyMap = {
            'leftarrow': 'left arrow', 'rightarrow': 'right arrow',
            'uparrow': 'up arrow', 'downarrow': 'down arrow',
            'left': 'left arrow', 'right': 'right arrow',
            'up': 'up arrow', 'down': 'down arrow'
        };
        return keyMap[key] || key;
    }

    // Parse a boolean condition expression into a block id.
    parseCondition(conditionStr, context) {
        let s = this.stripOuterParens((conditionStr || '').trim());
        const push = (op, inputs = {}, fields = {}) => this.pushBlock(context, op, inputs, fields);

        // not / or / and (loosest binding first)
        if (/^not\s+/i.test(s)) {
            const child = this.parseCondition(s.replace(/^not\s+/i, ''), context);
            return push('operator_not', { OPERAND: [2, child] });
        }
        let sp;
        if ((sp = this.splitBinary(s, [' or '], { ci: true }))) {
            return push('operator_or', {
                OPERAND1: [2, this.parseCondition(sp.left, context)],
                OPERAND2: [2, this.parseCondition(sp.right, context)]
            });
        }
        if ((sp = this.splitBinary(s, [' and '], { ci: true }))) {
            return push('operator_and', {
                OPERAND1: [2, this.parseCondition(sp.left, context)],
                OPERAND2: [2, this.parseCondition(sp.right, context)]
            });
        }

        // Comparisons. Scratch 3.0 has no native <= / >=, so build them from not().
        if ((sp = this.splitBinary(s, ['<=']))) {
            const gt = push('operator_gt', { OPERAND1: this.parseValue(sp.left, context), OPERAND2: this.parseValue(sp.right, context) });
            return push('operator_not', { OPERAND: [2, gt] });
        }
        if ((sp = this.splitBinary(s, ['>=']))) {
            const lt = push('operator_lt', { OPERAND1: this.parseValue(sp.left, context), OPERAND2: this.parseValue(sp.right, context) });
            return push('operator_not', { OPERAND: [2, lt] });
        }
        for (const [sym, op] of [['<', 'operator_lt'], ['>', 'operator_gt'], ['=', 'operator_equals']]) {
            if ((sp = this.splitBinary(s, [sym]))) {
                return push(op, { OPERAND1: this.parseValue(sp.left, context), OPERAND2: this.parseValue(sp.right, context) });
            }
        }

        // Predicates
        let m;
        if ((m = s.match(/^touching color\s+(.+)$/i))) {
            const color = this.parseValue(m[1].trim(), context);
            return push('sensing_touchingcolor', { COLOR: color });
        }
        if ((m = s.match(/^touching\s+(.+)$/i))) {
            let name = m[1].trim();
            if (/^edge$/i.test(name)) name = '_edge_';
            else if (/^mouse(-pointer)?$/i.test(name)) name = '_mouse_';
            return push('sensing_touchingobject', {
                TOUCHINGOBJECTMENU: this.menuInput(context, 'sensing_touchingobjectmenu', 'TOUCHINGOBJECTMENU', name)
            });
        }
        if ((m = s.match(/^key\s+(.+?)\s+pressed\??$/i))) {
            return push('sensing_keypressed', {
                KEY_OPTION: this.menuInput(context, 'sensing_keyoptions', 'KEY_OPTION', this.normalizeKey(m[1]))
            });
        }
        if (/^mouse down\??$/i.test(s)) {
            return push('sensing_mousedown');
        }
        if ((sp = this.splitBinary(s, [' contains '], { ci: true }))) {
            const left = sp.left.trim();
            if (this.listExists(left, context.target)) {
                const list = this.getOrCreateList(left, context.target);
                return push('data_listcontainsitem', { ITEM: this.parseValue(sp.right, context) }, { LIST: [list.name, list.id] });
            }
            return push('operator_contains', {
                STRING1: this.parseValue(sp.left, context),
                STRING2: this.parseValue(sp.right, context)
            });
        }

        // A boolean custom-block parameter used directly as a condition.
        if (this.currentProcArgs && this.currentProcArgs.get(s)?.type === 'b') {
            return push('argument_reporter_boolean', {}, { VALUE: [s, null] });
        }

        // Default: treat as a boolean-ish value compared to true.
        return push('operator_equals', {
            OPERAND1: this.parseValue(s, context),
            OPERAND2: [1, [10, 'true']]
        });
    }

    unquote(s) {
        s = s.trim();
        if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1);
        return s;
    }

    // Parse `DEFINE [FAST] <signature>:` into {proccode, argNames, argTypes, warp, regexParts}.
    parseSignature(headerLine) {
        let sig = headerLine.replace(/^DEFINE\s+/i, '').replace(/:\s*$/, '').trim();
        let warp = false;
        if (/^FAST\s+/i.test(sig)) { warp = true; sig = sig.replace(/^FAST\s+/i, ''); }

        const tokens = sig.match(/\([^)]*\)|<[^>]*>|[^\s]+/g) || [];
        const procParts = [];
        const template = []; // per proccode word: { lit } or { arg: true }
        const argNames = [];
        const argTypes = [];
        for (const tok of tokens) {
            if (tok.startsWith('(') || tok.startsWith('<')) {
                const type = tok.startsWith('<') ? 'b' : 's';
                argNames.push(tok.slice(1, -1).trim());
                argTypes.push(type);
                procParts.push(type === 'b' ? '%b' : '%s');
                template.push({ arg: true });
            } else {
                procParts.push(tok);
                template.push({ lit: tok });
            }
        }
        return { proccode: procParts.join(' '), argNames, argTypes, warp, template };
    }

    // Split a line into top-level tokens: parenthesized groups and quoted strings
    // count as a single token, so custom-block args like `(pr + 1)` stay intact.
    tokenizeTop(s) {
        const tokens = [];
        let i = 0;
        s = s.trim();
        while (i < s.length) {
            if (s[i] === ' ') { i++; continue; }
            if (s[i] === '(') {
                let depth = 0, j = i;
                for (; j < s.length; j++) {
                    if (s[j] === '(') depth++;
                    else if (s[j] === ')') { depth--; if (depth === 0) { j++; break; } }
                }
                tokens.push(s.slice(i, j)); i = j; continue;
            }
            if (s[i] === '"') {
                let j = i + 1;
                while (j < s.length && s[j] !== '"') j++;
                j++; tokens.push(s.slice(i, j)); i = j; continue;
            }
            let j = i;
            while (j < s.length && s[j] !== ' ' && s[j] !== '(' && s[j] !== '"') j++;
            tokens.push(s.slice(i, j)); i = j;
        }
        return tokens;
    }

    // First-pass registration so calls resolve even before the DEFINE appears.
    registerProcedure(headerLine) {
        const sig = this.parseSignature(headerLine);
        if (this.procedures.some(p => p.proccode === sig.proccode)) return;
        this.procedures.push({
            proccode: sig.proccode,
            argIds: sig.argNames.map(() => this.generateId()),
            argNames: sig.argNames,
            argTypes: sig.argTypes,
            warp: sig.warp,
            template: sig.template
        });
        // Longest templates first so a more specific signature wins call matching.
        this.procedures.sort((a, b) => b.template.length - a.template.length);
    }

    // Build the definition blocks. Returns { block, extraBlocks, args } where `args`
    // maps param names to their type so the body emits argument reporters.
    parseDefine(headerLine, target) {
        const context = { target, extraBlocks: {}, parentId: null };
        const sig = this.parseSignature(headerLine);
        const proc = this.procedures.find(p => p.proccode === sig.proccode);
        const argIds = proc.argIds;
        const argDefaults = sig.argTypes.map(t => (t === 'b' ? 'false' : ''));
        const args = new Map();
        sig.argNames.forEach((name, i) => args.set(name, { type: sig.argTypes[i] }));

        const defId = this.generateId();
        const protoId = this.generateId();
        const protoInputs = {};
        sig.argNames.forEach((name, i) => {
            const repId = this.generateId();
            context.extraBlocks[repId] = {
                opcode: sig.argTypes[i] === 'b' ? 'argument_reporter_boolean' : 'argument_reporter_string_number',
                next: null, parent: protoId, inputs: {}, fields: { VALUE: [name, null] },
                shadow: true, topLevel: false
            };
            protoInputs[argIds[i]] = [1, repId];
        });
        context.extraBlocks[protoId] = {
            opcode: 'procedures_prototype',
            next: null, parent: defId, inputs: protoInputs, fields: {},
            shadow: true, topLevel: false,
            mutation: {
                tagName: 'mutation', children: [], proccode: sig.proccode,
                argumentids: JSON.stringify(argIds),
                argumentnames: JSON.stringify(sig.argNames),
                argumentdefaults: JSON.stringify(argDefaults),
                warp: String(sig.warp)
            }
        };
        const block = {
            [defId]: {
                opcode: 'procedures_definition',
                next: null, parent: null, inputs: { custom_block: [1, protoId] }, fields: {},
                shadow: false, topLevel: true
            }
        };
        return { block, extraBlocks: context.extraBlocks, args };
    }

    // Try to resolve a line as a call to a registered custom block, matching the
    // call's top-level tokens against the procedure's template token-for-token.
    tryProcedureCall(line, target) {
        const tokens = this.tokenizeTop(line);
        for (const proc of this.procedures) {
            if (proc.template.length !== tokens.length) continue;
            const rawArgs = [];
            let ok = true;
            for (let i = 0; i < proc.template.length; i++) {
                const t = proc.template[i];
                if (t.lit) { if (tokens[i] !== t.lit) { ok = false; break; } }
                else rawArgs.push(tokens[i]);
            }
            if (!ok) continue;

            const context = { target, extraBlocks: {}, parentId: null };
            const { id, block } = this.createBlock('procedures_call');
            context.parentId = id;
            const inputs = {};
            proc.argIds.forEach((argId, i) => {
                inputs[argId] = proc.argTypes[i] === 'b'
                    ? [2, this.parseCondition(rawArgs[i], context)]
                    : this.parseValue(rawArgs[i], context);
            });
            block[id].inputs = inputs;
            block[id].mutation = {
                tagName: 'mutation', children: [], proccode: proc.proccode,
                argumentids: JSON.stringify(proc.argIds), warp: String(proc.warp)
            };
            return { block, extraBlocks: context.extraBlocks };
        }
        return null;
    }

    parseCommand(line, target) {
        // Event hats reach here with their trailing ':' — strip it so the hat
        // patterns can anchor cleanly.
        if (/^when\b/i.test(line)) line = line.replace(/\s*:\s*$/, '');
        const context = { target, extraBlocks: {}, parentId: null };
        let match;

        // Create a stack command block and make it the parent for any reporter/menu
        // blocks parsed into its inputs.
        const cmd = (opcode, opts = {}) => {
            const { id, block } = this.createBlock(opcode, opts);
            context.parentId = id;
            return { id, block };
        };
        const ret = (block) => ({ block, extraBlocks: context.extraBlocks });
        const ext = (n) => { if (!this.project.extensions.includes(n)) this.project.extensions.push(n); };
        const val = (s) => this.parseValue(s, context);

        // ---- Event hats (routed here from the main loop) ---------------------------
        if (/^when I start as a clone$/i.test(line)) {
            return { block: this.createBlock('control_start_as_clone', { topLevel: true }).block, extraBlocks: {} };
        }
        if ((match = line.match(/^when I receive\s+(.+)$/i))) {
            const bc = this.getOrCreateBroadcast(this.unquote(match[1]));
            const { id, block } = this.createBlock('event_whenbroadcastreceived', { topLevel: true });
            block[id].fields.BROADCAST_OPTION = [bc.name, bc.id];
            return { block, extraBlocks: {} };
        }
        if (/^when (this )?sprite clicked$/i.test(line)) {
            return { block: this.createBlock('event_whenthisspriteclicked', { topLevel: true }).block, extraBlocks: {} };
        }
        if ((match = line.match(/^when\s+(.+?)\s+key\s+pressed$/i))) {
            const { id, block } = this.createBlock('event_whenkeypressed', { topLevel: true });
            block[id].fields.KEY_OPTION = [this.normalizeKey(match[1]), null];
            return { block, extraBlocks: {} };
        }
        if (line.includes('flag clicked')) {
            return { block: this.createBlock('event_whenflagclicked', { topLevel: true }).block, extraBlocks: {} };
        }

        // ---- Motion ----------------------------------------------------------------
        if ((match = line.match(/^move\s+(.+)\s+steps?$/i))) {
            const { id, block } = cmd('motion_movesteps'); block[id].inputs.STEPS = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^turn\s+(left|right)\s+(.+)\s+degrees?$/i))) {
            const { id, block } = cmd(match[1].toLowerCase() === 'left' ? 'motion_turnleft' : 'motion_turnright');
            block[id].inputs.DEGREES = val(match[2]); return ret(block);
        }
        if ((match = line.match(/^turn\s+(.+)\s+degrees?$/i))) {
            const { id, block } = cmd('motion_turnright'); block[id].inputs.DEGREES = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^go to x:\s*(.+?)\s+y:\s*(.+)$/i))) {
            const { id, block } = cmd('motion_gotoxy');
            block[id].inputs.X = val(match[1]); block[id].inputs.Y = val(match[2]); return ret(block);
        }
        if ((match = line.match(/^glide\s+(.+?)\s+secs?\s+to x:\s*(.+?)\s+y:\s*(.+)$/i))) {
            const { id, block } = cmd('motion_glidesecstoxy');
            block[id].inputs.SECS = val(match[1]); block[id].inputs.X = val(match[2]); block[id].inputs.Y = val(match[3]);
            return ret(block);
        }
        if ((match = line.match(/^glide\s+(.+?)\s+secs?\s+to\s+(.+)$/i))) {
            const { id, block } = cmd('motion_glideto');
            block[id].inputs.SECS = val(match[1]);
            block[id].inputs.TO = this.menuInput(context, 'motion_glideto_menu', 'TO', this.spriteMenuValue(match[2]));
            return ret(block);
        }
        if ((match = line.match(/^go to\s+(.+)$/i))) {
            const { id, block } = cmd('motion_goto');
            block[id].inputs.TO = this.menuInput(context, 'motion_goto_menu', 'TO', this.spriteMenuValue(match[1]));
            return ret(block);
        }
        if ((match = line.match(/^change x by\s+(.+)$/i))) {
            const { id, block } = cmd('motion_changexby'); block[id].inputs.DX = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^change y by\s+(.+)$/i))) {
            const { id, block } = cmd('motion_changeyby'); block[id].inputs.DY = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^set x to\s+(.+)$/i))) {
            const { id, block } = cmd('motion_setx'); block[id].inputs.X = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^set y to\s+(.+)$/i))) {
            const { id, block } = cmd('motion_sety'); block[id].inputs.Y = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^point in direction\s+(.+)$/i))) {
            const { id, block } = cmd('motion_pointindirection'); block[id].inputs.DIRECTION = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^point towards\s+(.+)$/i))) {
            const { id, block } = cmd('motion_pointtowards');
            block[id].inputs.TOWARDS = this.menuInput(context, 'motion_pointtowards_menu', 'TOWARDS', this.spriteMenuValue(match[1]));
            return ret(block);
        }
        if (/^if on edge,?\s*bounce$/i.test(line)) {
            return { block: this.createBlock('motion_ifonedgebounce').block, extraBlocks: {} };
        }
        if ((match = line.match(/^set rotation style\s+(.+)$/i))) {
            const { id, block } = cmd('motion_setrotationstyle');
            block[id].fields.STYLE = [match[1].trim(), null]; return ret(block);
        }

        // ---- Looks -----------------------------------------------------------------
        if ((match = line.match(/^say\s+(.+?)(?:\s+for\s+(.+)\s+seconds?)?$/i))) {
            const { id, block } = cmd(match[2] ? 'looks_sayforsecs' : 'looks_say');
            block[id].inputs.MESSAGE = val(match[1]);
            if (match[2]) block[id].inputs.SECS = val(match[2]);
            return ret(block);
        }
        if ((match = line.match(/^think\s+(.+?)(?:\s+for\s+(.+)\s+seconds?)?$/i))) {
            const { id, block } = cmd(match[2] ? 'looks_thinkforsecs' : 'looks_think');
            block[id].inputs.MESSAGE = val(match[1]);
            if (match[2]) block[id].inputs.SECS = val(match[2]);
            return ret(block);
        }
        if (line.toLowerCase() === 'show') return { block: this.createBlock('looks_show').block, extraBlocks: {} };
        if (line.toLowerCase() === 'hide') return { block: this.createBlock('looks_hide').block, extraBlocks: {} };
        if ((match = line.match(/^switch costume to\s+(.+)$/i))) {
            const { id, block } = cmd('looks_switchcostumeto'); block[id].inputs.COSTUME = val(match[1]); return ret(block);
        }
        if (line.toLowerCase() === 'next costume') return { block: this.createBlock('looks_nextcostume').block, extraBlocks: {} };
        if ((match = line.match(/^switch backdrop to\s+(.+)$/i))) {
            const { id, block } = cmd('looks_switchbackdropto');
            block[id].inputs.BACKDROP = this.menuInput(context, 'looks_backdrops', 'BACKDROP', this.unquote(match[1]));
            return ret(block);
        }
        if (line.toLowerCase() === 'next backdrop') return { block: this.createBlock('looks_nextbackdrop').block, extraBlocks: {} };
        if ((match = line.match(/^change size by\s+(.+)$/i))) {
            const { id, block } = cmd('looks_changesizeby'); block[id].inputs.CHANGE = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^set size to\s+(.+)$/i))) {
            const { id, block } = cmd('looks_setsizeto'); block[id].inputs.SIZE = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^change\s+(color|fisheye|whirl|pixelate|mosaic|brightness|ghost)\s+effect by\s+(.+)$/i))) {
            const { id, block } = cmd('looks_changeeffectby');
            block[id].fields.EFFECT = [match[1].toUpperCase(), null]; block[id].inputs.CHANGE = val(match[2]); return ret(block);
        }
        if ((match = line.match(/^set\s+(color|fisheye|whirl|pixelate|mosaic|brightness|ghost)\s+effect to\s+(.+)$/i))) {
            const { id, block } = cmd('looks_seteffectto');
            block[id].fields.EFFECT = [match[1].toUpperCase(), null]; block[id].inputs.VALUE = val(match[2]); return ret(block);
        }
        if (/^clear graphic effects$/i.test(line)) return { block: this.createBlock('looks_cleargraphiceffects').block, extraBlocks: {} };
        if (/^go to front$/i.test(line)) {
            const { id, block } = this.createBlock('looks_gotofrontback'); block[id].fields.FRONT_BACK = ['front', null];
            return { block, extraBlocks: {} };
        }
        if (/^go to back$/i.test(line)) {
            const { id, block } = this.createBlock('looks_gotofrontback'); block[id].fields.FRONT_BACK = ['back', null];
            return { block, extraBlocks: {} };
        }
        if ((match = line.match(/^go (forward|backward|back)\s+(.+?)\s+layers?$/i))) {
            const { id, block } = cmd('looks_goforwardbackwardlayers');
            block[id].fields.FORWARD_BACKWARD = [match[1].toLowerCase() === 'forward' ? 'forward' : 'backward', null];
            block[id].inputs.NUM = val(match[2]); return ret(block);
        }

        // ---- Sound -----------------------------------------------------------------
        if ((match = line.match(/^play sound\s+(.+)\s+until done$/i))) {
            const { id, block } = cmd('sound_playuntildone'); block[id].inputs.SOUND_MENU = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^play sound\s+(.+)$/i))) {
            const { id, block } = cmd('sound_play'); block[id].inputs.SOUND_MENU = val(match[1]); return ret(block);
        }
        if (line.toLowerCase() === 'stop all sounds') return { block: this.createBlock('sound_stopallsounds').block, extraBlocks: {} };
        if ((match = line.match(/^change volume by\s+(.+)$/i))) {
            const { id, block } = cmd('sound_changevolumeby'); block[id].inputs.VOLUME = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^set volume to\s+(.+)$/i))) {
            const { id, block } = cmd('sound_setvolumeto'); block[id].inputs.VOLUME = val(match[1]); return ret(block);
        }

        // ---- Pen -------------------------------------------------------------------
        if (line.toLowerCase() === 'clear') { ext('pen'); return { block: this.createBlock('pen_clear').block, extraBlocks: {} }; }
        if (line.toLowerCase() === 'stamp') { ext('pen'); return { block: this.createBlock('pen_stamp').block, extraBlocks: {} }; }
        if (line.toLowerCase() === 'pen down') { ext('pen'); return { block: this.createBlock('pen_penDown').block, extraBlocks: {} }; }
        if (line.toLowerCase() === 'pen up') { ext('pen'); return { block: this.createBlock('pen_penUp').block, extraBlocks: {} }; }
        if ((match = line.match(/^set pen color to\s+(.+)$/i))) {
            ext('pen'); const { id, block } = cmd('pen_setPenColorToColor'); block[id].inputs.COLOR = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^change pen size by\s+(.+)$/i))) {
            ext('pen'); const { id, block } = cmd('pen_changePenSizeBy'); block[id].inputs.SIZE = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^set pen size to\s+(.+)$/i))) {
            ext('pen'); const { id, block } = cmd('pen_setPenSizeTo'); block[id].inputs.SIZE = val(match[1]); return ret(block);
        }

        // ---- Sensing ---------------------------------------------------------------
        if ((match = line.match(/^ask\s+(.+?)\s+and wait$/i))) {
            const { id, block } = cmd('sensing_askandwait'); block[id].inputs.QUESTION = val(match[1]); return ret(block);
        }
        if (line.toLowerCase() === 'reset timer') return { block: this.createBlock('sensing_resettimer').block, extraBlocks: {} };
        if ((match = line.match(/^set drag mode\s+(draggable|not draggable)$/i))) {
            const { id, block } = this.createBlock('sensing_setdragmode');
            block[id].fields.DRAG_MODE = [match[1].toLowerCase(), null];
            return { block, extraBlocks: {} };
        }

        // ---- Music (extension) -----------------------------------------------------
        if ((match = line.match(/^play note\s+(.+?)\s+for\s+(.+)\s+beats?$/i))) {
            ext('music'); const { id, block } = cmd('music_playNoteForBeats');
            block[id].inputs.NOTE = val(match[1]); block[id].inputs.BEATS = val(match[2]); return ret(block);
        }
        if ((match = line.match(/^play drum\s+(.+?)\s+for\s+(.+)\s+beats?$/i))) {
            ext('music'); const { id, block } = cmd('music_playDrumForBeats');
            block[id].inputs.DRUM = this.menuInput(context, 'music_menu_DRUM', 'DRUM', match[1].trim());
            block[id].inputs.BEATS = val(match[2]); return ret(block);
        }
        if ((match = line.match(/^rest for\s+(.+)\s+beats?$/i))) {
            ext('music'); const { id, block } = cmd('music_restForBeats'); block[id].inputs.BEATS = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^set tempo to\s+(.+)$/i))) {
            ext('music'); const { id, block } = cmd('music_setTempo'); block[id].inputs.TEMPO = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^change tempo by\s+(.+)$/i))) {
            ext('music'); const { id, block } = cmd('music_changeTempo'); block[id].inputs.TEMPO = val(match[1]); return ret(block);
        }

        // ---- Lists (before the generic variable set/change) ------------------------
        if ((match = line.match(/^add\s+(.+?)\s+to\s+(.+)$/i)) && this.isListTarget(match[2], target)) {
            const list = this.getOrCreateList(match[2].trim(), target);
            const { id, block } = cmd('data_addtolist');
            block[id].inputs.ITEM = val(match[1]); block[id].fields.LIST = [list.name, list.id]; return ret(block);
        }
        if ((match = line.match(/^delete all of\s+(.+)$/i))) {
            const list = this.getOrCreateList(match[1].trim(), target);
            const { id, block } = this.createBlock('data_deletealloflist'); block[id].fields.LIST = [list.name, list.id];
            return { block, extraBlocks: {} };
        }
        if ((match = line.match(/^delete\s+(.+?)\s+of\s+(.+)$/i)) && this.isListTarget(match[2], target)) {
            const list = this.getOrCreateList(match[2].trim(), target);
            const { id, block } = cmd('data_deleteoflist');
            block[id].inputs.INDEX = val(match[1]); block[id].fields.LIST = [list.name, list.id]; return ret(block);
        }
        if ((match = line.match(/^insert\s+(.+?)\s+at\s+(.+?)\s+of\s+(.+)$/i))) {
            const list = this.getOrCreateList(match[3].trim(), target);
            const { id, block } = cmd('data_insertatlist');
            block[id].inputs.ITEM = val(match[1]); block[id].inputs.INDEX = val(match[2]);
            block[id].fields.LIST = [list.name, list.id]; return ret(block);
        }
        if ((match = line.match(/^replace item\s+(.+?)\s+of\s+(.+?)\s+with\s+(.+)$/i))) {
            const list = this.getOrCreateList(match[2].trim(), target);
            const { id, block } = cmd('data_replaceitemoflist');
            block[id].inputs.INDEX = val(match[1]); block[id].inputs.ITEM = val(match[3]);
            block[id].fields.LIST = [list.name, list.id]; return ret(block);
        }
        if ((match = line.match(/^show list\s+(.+)$/i))) {
            const list = this.getOrCreateList(match[1].trim(), target);
            const { id, block } = this.createBlock('data_showlist'); block[id].fields.LIST = [list.name, list.id];
            return { block, extraBlocks: {} };
        }
        if ((match = line.match(/^hide list\s+(.+)$/i))) {
            const list = this.getOrCreateList(match[1].trim(), target);
            const { id, block } = this.createBlock('data_hidelist'); block[id].fields.LIST = [list.name, list.id];
            return { block, extraBlocks: {} };
        }
        if ((match = line.match(/^show variable\s+(.+)$/i))) {
            const v = this.getOrCreateVariable(match[1].trim(), target);
            const { id, block } = this.createBlock('data_showvariable'); block[id].fields.VARIABLE = [v.name, v.id];
            return { block, extraBlocks: {} };
        }
        if ((match = line.match(/^hide variable\s+(.+)$/i))) {
            const v = this.getOrCreateVariable(match[1].trim(), target);
            const { id, block } = this.createBlock('data_hidevariable'); block[id].fields.VARIABLE = [v.name, v.id];
            return { block, extraBlocks: {} };
        }

        // ---- Control ---------------------------------------------------------------
        if ((match = line.match(/^wait\s+(.+)\s+seconds?$/i))) {
            const { id, block } = cmd('control_wait'); block[id].inputs.DURATION = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^wait until\s+(.+)$/i))) {
            const { id, block } = cmd('control_wait_until');
            block[id].inputs.CONDITION = [2, this.parseCondition(match[1], context)]; return ret(block);
        }
        if (line.toLowerCase() === 'stop all') {
            const { id, block } = this.createBlock('control_stop'); block[id].fields.STOP_OPTION = ['all', null];
            block[id].mutation = { tagName: 'mutation', children: [], hasnext: 'false' };
            return { block, extraBlocks: {} };
        }
        if (/^stop this script$/i.test(line)) {
            const { id, block } = this.createBlock('control_stop'); block[id].fields.STOP_OPTION = ['this script', null];
            block[id].mutation = { tagName: 'mutation', children: [], hasnext: 'false' };
            return { block, extraBlocks: {} };
        }
        if (/^stop other scripts in sprite$/i.test(line)) {
            const { id, block } = this.createBlock('control_stop'); block[id].fields.STOP_OPTION = ['other scripts in sprite', null];
            block[id].mutation = { tagName: 'mutation', children: [], hasnext: 'true' };
            return { block, extraBlocks: {} };
        }
        if ((match = line.match(/^create clone of\s+(.+)$/i))) {
            const { id, block } = cmd('control_create_clone_of');
            block[id].inputs.CLONE_OPTION = this.menuInput(context, 'control_create_clone_of_menu', 'CLONE_OPTION', this.cloneMenuValue(match[1]));
            return ret(block);
        }
        if (/^delete this clone$/i.test(line)) {
            return { block: this.createBlock('control_delete_this_clone').block, extraBlocks: {} };
        }

        // ---- Broadcasts ------------------------------------------------------------
        if ((match = line.match(/^broadcast\s+(.+?)\s+and wait$/i))) {
            const bc = this.getOrCreateBroadcast(this.unquote(match[1]));
            const { id, block } = cmd('event_broadcastandwait');
            block[id].inputs.BROADCAST_INPUT = [1, [11, bc.name, bc.id]]; return ret(block);
        }
        if ((match = line.match(/^broadcast\s+(.+)$/i))) {
            const bc = this.getOrCreateBroadcast(this.unquote(match[1]));
            const { id, block } = cmd('event_broadcast');
            block[id].inputs.BROADCAST_INPUT = [1, [11, bc.name, bc.id]]; return ret(block);
        }

        // ---- Custom block calls (before the generic variable fallback) -------------
        if (this.procedures.length) {
            const call = this.tryProcedureCall(line, target);
            if (call) return call;
        }

        // ---- Generic variable set / change (LAST so specific commands win) ---------
        if ((match = line.match(/^set\s+(.+?)\s+to\s+(.+)$/i))) {
            const variable = this.getOrCreateVariable(match[1].trim(), target);
            const { id, block } = cmd('data_setvariableto');
            block[id].inputs.VALUE = val(match[2]); block[id].fields.VARIABLE = [variable.name, variable.id]; return ret(block);
        }
        if ((match = line.match(/^change\s+(.+?)\s+by\s+(.+)$/i))) {
            const variable = this.getOrCreateVariable(match[1].trim(), target);
            const { id, block } = cmd('data_changevariableby');
            block[id].inputs.VALUE = val(match[2]); block[id].fields.VARIABLE = [variable.name, variable.id]; return ret(block);
        }

        throw new ParseError(`Unknown command: "${line}"`);
    }

    // Menu value helpers ------------------------------------------------------------
    spriteMenuValue(name) {
        name = this.unquote(name).trim();
        if (/^mouse(-pointer)?$/i.test(name)) return '_mouse_';
        if (/^random( position)?$/i.test(name)) return '_random_';
        return name;
    }
    cloneMenuValue(name) {
        name = this.unquote(name).trim();
        if (/^(myself|me|this sprite)$/i.test(name)) return '_myself_';
        return name;
    }
    // Only treat `add/delete X of Y` as a list op when Y is plausibly a list.
    isListTarget(name, target) {
        name = name.trim();
        return this.listExists(name, target) ||
            this.declaredGlobalLists.has(name) ||
            this.declaredLocalLists.has(`${target.name}:${name}`);
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

    // Build a distinct colored costume SVG so sprites don't all render identically.
    createSpriteCostume(name) {
        const palette = ['#4C97FF', '#FF6680', '#59C059', '#FFAB19', '#9966FF', '#FF8C1A', '#0FBD8C', '#DB6E00'];
        const color = palette[this.spriteColorIndex++ % palette.length];
        const letter = (name.trim()[0] || 'S').toUpperCase().replace(/[<>&"]/g, '');
        const assetId = this.generateAssetId();
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" fill="${color}" stroke="#000000" stroke-width="3"/><text x="40" y="53" font-size="40" text-anchor="middle" fill="#ffffff" font-family="Helvetica, Arial, sans-serif">${letter}</text></svg>`;
        this.assets.set(assetId, { type: 'svg', data: svg, filename: `${assetId}.svg`, metadata: { width: 80, height: 80 } });
        return { assetId, name: 'costume1', md5ext: `${assetId}.svg`, dataFormat: 'svg', rotationCenterX: 40, rotationCenterY: 40 };
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
            costumes: [this.createSpriteCostume(name)],
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
                    } else if (/^REPEAT\s+UNTIL\b/i.test(trimmed)) {
                        const m = trimmed.match(/^REPEAT\s+UNTIL\s+(.+):$/i);
                        if (!m) {
                            this.warnings.push(`Malformed REPEAT UNTIL (expected "REPEAT UNTIL <condition>:"): "${trimmed}"`);
                            i++; continue;
                        }
                        const { id, block } = this.createBlock('control_repeat_until');
                        context.parentId = id;
                        block[id].inputs.CONDITION = [2, this.parseCondition(m[1], context)];
                        newBlockData = { block, extraBlocks: context.extraBlocks };
                    } else if (trimmed.startsWith('REPEAT')) {
                        const m = trimmed.match(/REPEAT\s+(.+?):/i);
                        if (!m) {
                            this.warnings.push(`Malformed REPEAT (expected "REPEAT <count>:"): "${trimmed}"`);
                            i++; continue;
                        }
                        const { id, block } = this.createBlock('control_repeat');
                        context.parentId = id;
                        block[id].inputs.TIMES = this.parseValue(m[1], context);
                        newBlockData = { block, extraBlocks: context.extraBlocks };
                    } else if (trimmed.startsWith('IF')) {
                        const m = trimmed.match(/IF\s+(.+?)\s+THEN:/i);
                        if (!m) {
                            this.warnings.push(`Malformed IF (expected "IF <condition> THEN:"): "${trimmed}"`);
                            i++; continue;
                        }
                        const { id, block } = this.createBlock('control_if');
                        context.parentId = id;
                        const condId = this.parseCondition(m[1], context);
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

        // First pass: collect sprite names and register all custom-block signatures so
        // forward references (sensing_of a later sprite, calling a later DEFINE) resolve.
        for (const l of lines) {
            const t = l.trim();
            const sm = t.match(/^SPRITE\s+(.+?):/i);
            if (sm) this.targetNames.add(sm[1].trim());
            if (/^DEFINE\b/i.test(t)) this.registerProcedure(t);
        }

        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('#')) {
                i++;
                continue;
            }

            // Explicit scope declarations
            let decl;
            if ((decl = trimmed.match(/^(GLOBAL|LOCAL)\s+LIST\s+(.+)$/i))) {
                const name = decl[2].trim();
                if (decl[1].toUpperCase() === 'GLOBAL') this.declaredGlobalLists.add(name);
                else this.declaredLocalLists.add(`${currentTarget.name}:${name}`);
                this.getOrCreateList(name, currentTarget);
                i++; continue;
            }
            if ((decl = trimmed.match(/^LIST\s+(.+)$/i))) {
                const name = decl[1].trim();
                if (currentTarget.isStage) this.declaredGlobalLists.add(name);
                else this.declaredLocalLists.add(`${currentTarget.name}:${name}`);
                this.getOrCreateList(name, currentTarget);
                i++; continue;
            }
            if ((decl = trimmed.match(/^(GLOBAL|LOCAL)\s+(.+)$/i))) {
                const name = decl[2].trim();
                if (decl[1].toUpperCase() === 'GLOBAL') this.declaredGlobals.add(name);
                else this.declaredLocals.add(`${currentTarget.name}:${name}`);
                this.getOrCreateVariable(name, currentTarget);
                i++; continue;
            }

            if (trimmed.startsWith('SPRITE') || trimmed.startsWith('STAGE')) {
                if (trimmed.startsWith('SPRITE')) {
                    const m = trimmed.match(/SPRITE\s+(.+?):/i);
                    if (!m) {
                        this.warnings.push(`Malformed SPRITE header (expected "SPRITE <name>:"): "${trimmed}"`);
                        i++; continue;
                    }
                    currentTarget = this.createSprite(m[1].trim());
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
            } else if (trimmed.startsWith('DEFINE')) {
                try {
                    const defData = this.parseDefine(trimmed, currentTarget);
                    const defId = Object.keys(defData.block)[0];
                    defData.block[defId].x = 50 + (this.scriptCount % 3) * 350;
                    defData.block[defId].y = 50 + Math.floor(this.scriptCount / 3) * 300;
                    this.scriptCount++;

                    this.currentProcArgs = defData.args;
                    const nextLineIndent = (i + 1 < lines.length) ? getIndent(lines[i + 1]) : 0;
                    const result = parseStructure(i + 1, nextLineIndent, currentTarget);

                    if (result.firstBlockId) {
                        defData.block[defId].next = result.firstBlockId;
                        result.blocks[result.firstBlockId].parent = defId;
                    }

                    Object.assign(currentTarget.blocks, defData.block, defData.extraBlocks || {}, result.blocks);
                    this.currentProcArgs = null;
                    i = result.endIndex;
                } catch (error) {
                    this.currentProcArgs = null;
                    if (error.isSB3Error) {
                        this.warnings.push(`Error in DEFINE "${trimmed}": ${error.message}`);
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
        for (const assetData of this.assets.values()) {
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

    // Deep referential-integrity check of the generated project graph.
    // Returns an array of human-readable problems (empty === healthy).
    checkIntegrity(project = this.project) {
        const issues = [];
        const allVarIds = new Set();
        const allListIds = new Set();
        const broadcastIds = new Set();
        for (const t of project.targets) {
            for (const id of Object.keys(t.variables || {})) allVarIds.add(id);
            for (const id of Object.keys(t.lists || {})) allListIds.add(id);
            if (t.isStage) for (const id of Object.keys(t.broadcasts || {})) broadcastIds.add(id);
        }

        for (const t of project.targets) {
            const blocks = t.blocks || {};
            const ids = new Set(Object.keys(blocks));
            const where = (bid) => `${t.isStage ? 'Stage' : t.name}/${bid}`;

            const checkInput = (bid, key, input) => {
                if (!Array.isArray(input)) return;
                const shadowType = input[0];
                const check = (ref, kind) => {
                    if (typeof ref === 'string') {
                        if (!ids.has(ref)) issues.push(`${where(bid)} input ${key} references missing ${kind} block ${ref}`);
                    } else if (Array.isArray(ref)) {
                        if (ref[0] === 12 && !allVarIds.has(ref[2])) issues.push(`${where(bid)} input ${key} references undeclared variable ${ref[1]}`);
                        if (ref[0] === 13 && !allListIds.has(ref[2])) issues.push(`${where(bid)} input ${key} references undeclared list ${ref[1]}`);
                        if (ref[0] === 11 && !broadcastIds.has(ref[2])) issues.push(`${where(bid)} input ${key} references undeclared broadcast ${ref[1]}`);
                    }
                };
                if (shadowType === 2 || shadowType === 3) check(input[1], 'block'); // boolean/obscured value
                if (shadowType === 1) check(input[1], 'shadow'); // shadow primitive or menu id
                if (shadowType === 3 && input[2] !== undefined) check(input[2], 'shadow');
            };

            for (const [bid, b] of Object.entries(blocks)) {
                if (b.next && !ids.has(b.next)) issues.push(`${where(bid)} .next points to missing block ${b.next}`);
                if (b.parent && !ids.has(b.parent)) issues.push(`${where(bid)} .parent points to missing block ${b.parent}`);
                for (const [key, input] of Object.entries(b.inputs || {})) checkInput(bid, key, input);
                for (const [fname, fval] of Object.entries(b.fields || {})) {
                    if (fname === 'VARIABLE' && Array.isArray(fval) && !allVarIds.has(fval[1])) issues.push(`${where(bid)} field VARIABLE references undeclared variable ${fval[0]}`);
                    if (fname === 'LIST' && Array.isArray(fval) && !allListIds.has(fval[1])) issues.push(`${where(bid)} field LIST references undeclared list ${fval[0]}`);
                    if (fname === 'BROADCAST_OPTION' && Array.isArray(fval) && !broadcastIds.has(fval[1])) issues.push(`${where(bid)} field BROADCAST_OPTION references undeclared broadcast ${fval[0]}`);
                }
            }

            // Every referenced costume/sound asset must be present in the project.
            for (const c of t.costumes || []) {
                if (!c.assetId || !c.md5ext) issues.push(`${where('costume')} ${c.name} missing asset id`);
            }
        }
        return issues;
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
        
        const assetId = this.generateAssetId();
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

export default SB3Creator;