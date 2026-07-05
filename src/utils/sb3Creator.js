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
        this.spriteColors = new Map(); // sprite name -> costume colour (for extra costumes)
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

    // Push a warning tagged with its 1-based source line number.
    warn(lineIndex, message) {
        this.warnings.push(`Line ${lineIndex + 1}: ${message}`);
    }

    // Strip a trailing `// comment` that is outside any double-quoted string.
    stripComment(line) {
        let inStr = false;
        for (let i = 0; i < line.length - 1; i++) {
            const c = line[i];
            if (c === '"') inStr = !inStr;
            else if (!inStr && c === '/' && line[i + 1] === '/') return line.slice(0, i);
        }
        return line;
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

        // Bounded reporters (item/letter/pick random) are recognized before operator
        // splitting: their trailing `of`/`to`/`in` keyword bounds an index/argument
        // expression that may itself contain operators (e.g. `item (r*8+c)+1 of board`).
        // Unbounded reporters (abs/round/…) stay after operators so that
        // `abs of vx * -1` keeps its `(abs of vx) * -1` meaning.
        if (/^(item|letter|pick random)\b/i.test(s)) {
            const early = this.parseReporter(s, context);
            if (early) return early;
        }

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

    // Generate an audible 16-bit PCM mono WAV sine tone (with short fades to avoid clicks).
    // 22.05 kHz keeps a beep perfectly clear while roughly halving the file size.
    makeToneWav(freq, durationSec, rate = 22050) {
        const sampleCount = Math.max(1, Math.floor(rate * durationSec));
        const dataSize = sampleCount * 2;
        const buf = new ArrayBuffer(44 + dataSize);
        const dv = new DataView(buf);
        const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i)); };
        writeStr(0, 'RIFF'); dv.setUint32(4, 36 + dataSize, true); writeStr(8, 'WAVE');
        writeStr(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
        dv.setUint32(24, rate, true); dv.setUint32(28, rate * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
        writeStr(36, 'data'); dv.setUint32(40, dataSize, true);
        const fade = Math.min(Math.floor(sampleCount / 8), 400);
        for (let i = 0; i < sampleCount; i++) {
            let amp = 0.35;
            if (i < fade) amp *= i / fade;
            else if (i > sampleCount - fade) amp *= (sampleCount - i) / fade;
            const s = Math.sin((2 * Math.PI * freq * i) / rate) * amp;
            dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 32767, true);
        }
        return { data: new Uint8Array(buf), sampleCount, rate };
    }

    // Register a generated tone as a sound asset and return its sound descriptor.
    registerSound(name, freq, durationSec) {
        const { data, sampleCount, rate } = this.makeToneWav(freq, durationSec);
        const assetId = this.generateAssetId();
        this.assets.set(assetId, { type: 'wav', data, filename: `${assetId}.wav`, metadata: {} });
        return { assetId, name, dataFormat: 'wav', rate, sampleCount, md5ext: `${assetId}.wav` };
    }

    // Build a distinct costume SVG. `variant` slightly squishes the shape so cycling
    // through a sprite's costumes reads as a simple animation.
    buildCostume(spriteName, color, variant, costumeName) {
        const letter = (spriteName.trim()[0] || 'S').toUpperCase().replace(/[<>&"]/g, '');
        const ry = 36 - (variant % 3) * 6; // bob up/down across frames
        const cy = 40 + (variant % 3) * 3;
        const assetId = this.generateAssetId();
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><ellipse cx="40" cy="${cy}" rx="36" ry="${ry}" fill="${color}" stroke="#000000" stroke-width="3"/><text x="40" y="${cy + 13}" font-size="40" text-anchor="middle" fill="#ffffff" font-family="Helvetica, Arial, sans-serif">${letter}</text></svg>`;
        this.assets.set(assetId, { type: 'svg', data: svg, filename: `${assetId}.svg`, metadata: { width: 80, height: 80 } });
        return { assetId, name: costumeName, md5ext: `${assetId}.svg`, dataFormat: 'svg', rotationCenterX: 40, rotationCenterY: 40 };
    }

    // Build a solid-colour backdrop SVG.
    buildBackdrop(color, name) {
        const assetId = this.generateAssetId();
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360"><rect width="480" height="360" fill="${color}"/></svg>`;
        this.assets.set(assetId, { type: 'svg', data: svg, filename: `${assetId}.svg`, metadata: { width: 480, height: 360 } });
        return { assetId, name, md5ext: `${assetId}.svg`, dataFormat: 'svg', rotationCenterX: 240, rotationCenterY: 180 };
    }

    // Build a plain geometric costume at true size. Kinds: rect/square/circle/ellipse/
    // triangle, or `polygon` with an arbitrary list of x,y points (custom SVG art).
    buildShapeCostume(color, kind, dims) {
        const s = 2;
        let w, h, shape;
        if (kind === 'polygon') {
            const pts = [];
            for (let i = 0; i + 1 < dims.length; i += 2) pts.push([dims[i], dims[i + 1]]);
            while (pts.length < 3) pts.push([0, 0]);
            const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
            const minX = Math.min(...xs), minY = Math.min(...ys);
            w = Math.max(...xs) - minX || 40;
            h = Math.max(...ys) - minY || 40;
            const pointsStr = pts.map((p) => `${p[0] - minX + s},${p[1] - minY + s}`).join(' ');
            const W0 = w + 2 * s, H0 = h + 2 * s;
            shape = `<polygon points="${pointsStr}" fill="${color}" stroke="#000000" stroke-width="${s}" stroke-linejoin="round"/>`;
            const svg0 = `<svg xmlns="http://www.w3.org/2000/svg" width="${W0}" height="${H0}" viewBox="0 0 ${W0} ${H0}">${shape}</svg>`;
            const assetId0 = this.generateAssetId();
            this.assets.set(assetId0, { type: 'svg', data: svg0, filename: `${assetId0}.svg`, metadata: { width: W0, height: H0 } });
            return { assetId: assetId0, name: 'costume1', md5ext: `${assetId0}.svg`, dataFormat: 'svg', rotationCenterX: W0 / 2, rotationCenterY: H0 / 2 };
        }
        if (kind === 'rect' || kind === 'ellipse') { w = dims[0] || 40; h = dims[1] || dims[0] || 40; }
        else { w = dims[0] || 40; h = w; } // square / circle / triangle
        const W = w + 2 * s, H = h + 2 * s;
        if (kind === 'circle') shape = `<circle cx="${W / 2}" cy="${H / 2}" r="${w / 2}" fill="${color}" stroke="#000000" stroke-width="${s}"/>`;
        else if (kind === 'ellipse') shape = `<ellipse cx="${W / 2}" cy="${H / 2}" rx="${w / 2}" ry="${h / 2}" fill="${color}" stroke="#000000" stroke-width="${s}"/>`;
        else if (kind === 'triangle') shape = `<polygon points="${W / 2},${s} ${W - s},${H - s} ${s},${H - s}" fill="${color}" stroke="#000000" stroke-width="${s}"/>`;
        else shape = `<rect x="${s}" y="${s}" width="${w}" height="${h}" rx="3" fill="${color}" stroke="#000000" stroke-width="${s}"/>`;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${shape}</svg>`;
        const assetId = this.generateAssetId();
        this.assets.set(assetId, { type: 'svg', data: svg, filename: `${assetId}.svg`, metadata: { width: W, height: H } });
        return { assetId, name: 'costume1', md5ext: `${assetId}.svg`, dataFormat: 'svg', rotationCenterX: W / 2, rotationCenterY: H / 2 };
    }

    // SHAPE <kind> <dims...> [#hex]: replace a sprite's first costume with a real shape.
    setShape(target, spec, lineIndex) {
        if (target.isStage) { this.warn(lineIndex, 'SHAPE has no effect on the Stage (use BACKDROP)'); return; }
        const tokens = spec.split(/\s+/).filter(Boolean);
        const kind = (tokens[0] || '').toLowerCase();
        if (!['rect', 'square', 'circle', 'ellipse', 'triangle', 'polygon'].includes(kind)) {
            this.warn(lineIndex, `Unknown SHAPE "${tokens[0]}" (use rect/square/circle/ellipse/triangle/polygon)`);
            return;
        }
        const hex = tokens.find((t) => /^#[0-9a-fA-F]{6}$/.test(t));
        const dims = tokens.slice(1).filter((t) => /^\d+(\.\d+)?$/.test(t)).map(Number);
        const color = hex ? hex.toLowerCase() : (this.spriteColors.get(target.name) || '#4C97FF');
        const old = target.costumes[0];
        if (old && old.assetId) this.assets.delete(old.assetId);
        target.costumes[0] = this.buildShapeCostume(color, kind, dims.length ? dims : [40]);
    }

    // Add an extra costume/backdrop to a target (used by COSTUME / BACKDROP declarations).
    addCostume(target, name) {
        if (target.isStage) {
            const palette = ['#576065', '#4a6fa5', '#8a5a83', '#3d7068', '#a5794a'];
            target.costumes.push(this.buildBackdrop(palette[(target.costumes.length - 1) % palette.length], name));
        } else {
            const color = this.spriteColors.get(target.name) || '#4C97FF';
            target.costumes.push(this.buildCostume(target.name, color, target.costumes.length, name));
        }
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
            sounds: [this.registerSound('Pop', 800, 0.12)],
            volume: 100,
            layerOrder: 0,
            tempo: 60,
            videoTransparency: 50,
            videoState: "on",
            textToSpeechLanguage: null
        };
    }

    // Build a distinct colored first costume so sprites don't all render identically.
    createSpriteCostume(name) {
        const palette = ['#4C97FF', '#FF6680', '#59C059', '#FFAB19', '#9966FF', '#FF8C1A', '#0FBD8C', '#DB6E00'];
        const color = palette[this.spriteColorIndex++ % palette.length];
        this.spriteColors.set(name, color);
        return this.buildCostume(name, color, 0, 'costume1');
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
            sounds: [this.registerSound('Meow', 320, 0.25)],
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

        // Normalise line endings and expand leading tabs so tab- or CRLF-indented files
        // parse the same as space-indented ones.
        const lines = pseudocode.replace(/\r\n?/g, '\n').split('\n').map((raw) => {
            const line = this.stripComment(raw);
            const lead = line.match(/^[ \t]*/)[0].replace(/\t/g, '  ');
            return lead + line.slice(line.match(/^[ \t]*/)[0].length);
        });
        const getIndent = (s) => s.match(/^\s*/)[0].length;
        // Indentation of the next non-blank line after `idx` (or -1 if none).
        const nextIndent = (idx) => {
            for (let j = idx + 1; j < lines.length; j++) {
                if (lines[j].trim()) return getIndent(lines[j]);
            }
            return -1;
        };
        // Child-block indent: the actual indent of the following line when it is deeper
        // than the block header, so any consistent indent step (2, 4, tab…) works.
        const childIndent = (idx, headerIndent) => {
            const ni = nextIndent(idx);
            return ni > headerIndent ? ni : headerIndent + 2;
        };

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
                    this.warn(i, `Skipping line with unexpected indentation: "${line.trim()}"`);
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
                            this.warn(i, `Malformed REPEAT UNTIL (expected "REPEAT UNTIL <condition>:"): "${trimmed}"`);
                            i++; continue;
                        }
                        const { id, block } = this.createBlock('control_repeat_until');
                        context.parentId = id;
                        block[id].inputs.CONDITION = [2, this.parseCondition(m[1], context)];
                        newBlockData = { block, extraBlocks: context.extraBlocks };
                    } else if (trimmed.startsWith('REPEAT')) {
                        const m = trimmed.match(/REPEAT\s+(.+?):/i);
                        if (!m) {
                            this.warn(i, `Malformed REPEAT (expected "REPEAT <count>:"): "${trimmed}"`);
                            i++; continue;
                        }
                        const { id, block } = this.createBlock('control_repeat');
                        context.parentId = id;
                        block[id].inputs.TIMES = this.parseValue(m[1], context);
                        newBlockData = { block, extraBlocks: context.extraBlocks };
                    } else if (trimmed.startsWith('IF')) {
                        const m = trimmed.match(/IF\s+(.+?)\s+THEN:/i);
                        if (!m) {
                            this.warn(i, `Malformed IF (expected "IF <condition> THEN:"): "${trimmed}"`);
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
                            const childResult = parseStructure(i + 1, childIndent(i, currentIndent), target);
                            if (childResult.firstBlockId) {
                                allBlocks[lastBlockId].inputs.SUBSTACK2 = [2, childResult.firstBlockId];
                                childResult.blocks[childResult.firstBlockId].parent = lastBlockId;
                                Object.assign(allBlocks, childResult.blocks);
                            }
                            i = childResult.endIndex;
                            continue;
                        } else {
                            this.warn(i, 'ELSE block without matching IF block');
                        }
                    }

                    if (newBlockData) {
                        const childResult = parseStructure(i + 1, childIndent(i, currentIndent), target);
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
                            this.warn(i, error.message);
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

            // Asset declarations: shape, extra costumes (animation frames), backdrops, sounds.
            if ((decl = trimmed.match(/^SHAPE\s+(.+)$/i))) {
                this.setShape(currentTarget, decl[1].trim(), i);
                i++; continue;
            }
            if ((decl = trimmed.match(/^COSTUME\s+(.+)$/i))) {
                this.addCostume(currentTarget, this.unquote(decl[1].trim()));
                i++; continue;
            }
            if ((decl = trimmed.match(/^BACKDROP\s+(.+)$/i))) {
                this.addCostume(stage, this.unquote(decl[1].trim()));
                i++; continue;
            }
            if ((decl = trimmed.match(/^SOUND\s+(.+?)(?:\s+(\d+))?$/i))) {
                const freq = decl[2] ? Number(decl[2]) : 440;
                currentTarget.sounds.push(this.registerSound(this.unquote(decl[1].trim()), freq, 0.3));
                i++; continue;
            }

            if (trimmed.startsWith('SPRITE') || trimmed.startsWith('STAGE')) {
                if (trimmed.startsWith('SPRITE')) {
                    const m = trimmed.match(/SPRITE\s+(.+?):/i);
                    if (!m) {
                        this.warn(i, `Malformed SPRITE header (expected "SPRITE <name>:"): "${trimmed}"`);
                        i++; continue;
                    }
                    const spriteName = m[1].trim();
                    if (this.project.targets.some((t) => !t.isStage && t.name === spriteName)) {
                        this.warn(i, `Duplicate sprite name "${spriteName}" — sprite names must be unique`);
                    }
                    currentTarget = this.createSprite(spriteName);
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
                        this.warn(i, `Error in "${trimmed}": ${error.message}`);
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
                        this.warn(i, `Error in DEFINE "${trimmed}": ${error.message}`);
                        i++;
                    } else {
                        throw error;
                    }
                }
            } else {
                this.warn(i, `Ignoring line not associated with a script: "${trimmed}"`);
                i++;
            }
        }

        this.validateReferences();
        return this.project;
    }

    // Warn about menu blocks (touching, clone of, ... of, point/go towards) that name a
    // sprite which doesn't exist — usually a typo that would silently do nothing.
    validateReferences() {
        const MENUS = {
            sensing_touchingobjectmenu: ['TOUCHINGOBJECTMENU', ['_edge_', '_mouse_']],
            control_create_clone_of_menu: ['CLONE_OPTION', ['_myself_']],
            sensing_of_object_menu: ['OBJECT', ['_stage_']],
            motion_pointtowards_menu: ['TOWARDS', ['_mouse_', '_random_']],
            motion_goto_menu: ['TO', ['_mouse_', '_random_']],
            motion_glideto_menu: ['TO', ['_mouse_', '_random_']],
            sensing_distancetomenu: ['DISTANCETOMENU', ['_mouse_']],
        };
        const known = new Set([...this.targetNames].map((n) => n.toLowerCase()));
        const seen = new Set();
        // Every sound name defined anywhere (a sprite may reference by shared name).
        const allSounds = new Set();
        for (const t of this.project.targets) for (const s of t.sounds || []) allSounds.add(s.name);

        // Literal string value of an input like COSTUME / SOUND_MENU (else null).
        const literal = (input) => (Array.isArray(input) && input[0] === 1 && Array.isArray(input[1]) && input[1][0] === 10 ? input[1][1] : null);

        for (const target of this.project.targets) {
            const costumeNames = new Set((target.costumes || []).map((c) => c.name));
            for (const block of Object.values(target.blocks || {})) {
                const menu = MENUS[block.opcode];
                if (menu) {
                    const [field, allowed] = menu;
                    const value = block.fields?.[field]?.[0];
                    if (typeof value === 'string' && !allowed.includes(value) && !known.has(value.toLowerCase()) && !seen.has(value)) {
                        seen.add(value);
                        this.warnings.push(`References unknown sprite "${value}" (not a defined sprite)`);
                    }
                }
                if (block.opcode === 'looks_switchcostumeto') {
                    const name = literal(block.inputs?.COSTUME);
                    if (name && !/^\d+$/.test(name) && !costumeNames.has(name) && !seen.has('c:' + name)) {
                        seen.add('c:' + name);
                        this.warnings.push(`Switches to unknown costume "${name}" (declare it with COSTUME ${name})`);
                    }
                }
                if (block.opcode === 'sound_play' || block.opcode === 'sound_playuntildone') {
                    const name = literal(block.inputs?.SOUND_MENU);
                    if (name && !allSounds.has(name) && !seen.has('s:' + name)) {
                        seen.add('s:' + name);
                        this.warnings.push(`Plays unknown sound "${name}" (declare it with SOUND ${name})`);
                    }
                }
            }
        }
    }

    async generateSB3() {
        if (!this.project) {
            throw new ValidationError('No project to generate');
        }

        const zip = new JSZip();
        zip.file('project.json', JSON.stringify(this.project));

        // The Stage's default backdrop is the one fixed asset id (a soft gradient).
        // Everything else — sprite costumes, extra costumes/backdrops, and the generated
        // tone sounds — is produced on the fly and lives in `this.assets`.
        const stageAsset = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0,0,480,360"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" /><stop offset="100%" style="stop-color:#98FB98;stop-opacity:1" /></linearGradient></defs><rect width="480" height="360" fill="url(#bg)"/></svg>`;
        zip.file('cd21514d0531fdffb22204e0ec5ed84a.svg', stageAsset);

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

    // Read width/height from raw SVG text (attributes first, then viewBox), no DOM.
    svgDimensions(svgText) {
        const wm = svgText.match(/\bwidth\s*=\s*"([\d.]+)/i);
        const hm = svgText.match(/\bheight\s*=\s*"([\d.]+)/i);
        let w = wm ? parseFloat(wm[1]) : 0;
        let h = hm ? parseFloat(hm[1]) : 0;
        if (!w || !h) {
            const vb = svgText.match(/viewBox\s*=\s*"\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)/i);
            if (vb) { w = w || parseFloat(vb[1]); h = h || parseFloat(vb[2]); }
        }
        return { width: w || 80, height: h || 80 };
    }

    // Bake a user-supplied SVG in as a named sprite's costume (replacing costume 1).
    // Returns true if the sprite exists. Used by the app's SVG-upload feature.
    applyCustomSVG(spriteName, svgText) {
        const target = this.project.targets.find(t => !t.isStage && t.name === spriteName);
        if (!target) return false;
        const { width, height } = this.svgDimensions(svgText);
        const assetId = this.generateAssetId();
        this.assets.set(assetId, { type: 'svg', data: svgText, filename: `${assetId}.svg`, metadata: { width, height } });
        const old = target.costumes[0];
        if (old && old.assetId) this.assets.delete(old.assetId);
        target.costumes[0] = {
            assetId, name: 'costume1', md5ext: `${assetId}.svg`, dataFormat: 'svg',
            rotationCenterX: width / 2, rotationCenterY: height / 2
        };
        return true;
    }

    // ===== Decompiler: project blocks -> pseudocode (inverse of the parser) =========

    // Decompile a whole project back into pseudocode.
    decompile(project = this.project) {
        const out = [];
        const stage = project.targets.find(t => t.isStage);
        for (const v of Object.values(stage.variables || {})) out.push(`GLOBAL ${v[0]}`);
        for (const l of Object.values(stage.lists || {})) out.push(`GLOBAL LIST ${l[0]}`);
        for (const bd of (stage.costumes || []).slice(1)) out.push(`BACKDROP ${bd.name}`);
        for (const snd of (stage.sounds || []).slice(1)) out.push(`SOUND ${snd.name}`);
        if (out.length) out.push('');

        for (const t of project.targets) {
            const scripts = this.decompileTargetScripts(t);
            if (t.isStage) {
                if (scripts.length) {
                    out.push('STAGE:');
                    out.push(...scripts.map(l => (l ? `  ${l}` : l)));
                    out.push('');
                }
            } else {
                out.push(`SPRITE ${t.name}:`);
                for (const v of Object.values(t.variables || {})) out.push(`  LOCAL ${v[0]}`);
                for (const l of Object.values(t.lists || {})) out.push(`  LOCAL LIST ${l[0]}`);
                for (const cos of (t.costumes || []).slice(1)) out.push(`  COSTUME ${cos.name}`);
                for (const snd of (t.sounds || []).slice(1)) out.push(`  SOUND ${snd.name}`);
                out.push(...scripts.map(l => (l ? `  ${l}` : l)));
                out.push('');
            }
        }
        return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
    }

    decompileTargetScripts(target) {
        const blocks = target.blocks || {};
        const lines = [];
        const tops = Object.entries(blocks).filter(([, b]) => b.topLevel && !b.shadow);
        for (const [, b] of tops) {
            const hat = this.decompileHat(b, blocks);
            if (hat === null) continue;
            lines.push(hat);
            lines.push(...this.decompileStackFrom(b.next, blocks, 1));
            lines.push('');
        }
        return lines;
    }

    decompileStackFrom(firstId, blocks, level) {
        const lines = [];
        let id = firstId;
        while (id && blocks[id]) {
            lines.push(...this.decompileStackBlock(blocks[id], blocks, level));
            id = blocks[id].next;
        }
        return lines;
    }

    // Decompile a value input -> pseudocode expression. Compound reporters are wrapped
    // in parens so the result is always a single top-level token.
    dval(input, blocks) {
        if (!Array.isArray(input)) return '';
        const inner = input[1];
        if (Array.isArray(inner)) {
            const [type, a, b] = inner;
            if (type === 4) return String(a);
            if (type === 10) return `"${a}"`;
            if (type === 9) return String(a);
            if (type === 11) return `"${a}"`;      // broadcast
            if (type === 12) return String(a);      // variable name
            if (type === 13) return String(a);      // list name
            return String(a);
            void b;
        }
        // block reference (a reporter)
        return `(${this.drep(blocks[inner], blocks)})`;
    }

    // Decompile a reporter block (without outer parens).
    drep(b, blocks) {
        if (!b) return '';
        const v = (k) => this.dval(b.inputs[k], blocks);
        const f = (k) => (b.fields[k] ? b.fields[k][0] : '');
        switch (b.opcode) {
            case 'operator_add': return `${v('NUM1')} + ${v('NUM2')}`;
            case 'operator_subtract': return `${v('NUM1')} - ${v('NUM2')}`;
            case 'operator_multiply': return `${v('NUM1')} * ${v('NUM2')}`;
            case 'operator_divide': return `${v('NUM1')} / ${v('NUM2')}`;
            case 'operator_mod': return `${v('NUM1')} mod ${v('NUM2')}`;
            case 'operator_random': return `pick random ${v('FROM')} to ${v('TO')}`;
            case 'operator_round': return `round ${v('NUM')}`;
            case 'operator_mathop': return `${f('OPERATOR')} of ${v('NUM')}`;
            case 'operator_join': return `${v('STRING1')} join ${v('STRING2')}`;
            case 'operator_letter_of': return `letter ${v('LETTER')} of ${v('STRING')}`;
            case 'operator_length': return `length of ${v('STRING')}`;
            case 'operator_contains': return `${v('STRING1')} contains ${v('STRING2')}`;
            case 'data_itemoflist': return `item ${v('INDEX')} of ${f('LIST')}`;
            case 'data_itemnumoflist': return `item # of ${v('ITEM')} in ${f('LIST')}`;
            case 'data_lengthoflist': return `length of ${f('LIST')}`;
            case 'data_listcontainsitem': return `${f('LIST')} contains ${v('ITEM')}`;
            case 'motion_xposition': return 'x position';
            case 'motion_yposition': return 'y position';
            case 'motion_direction': return 'direction';
            case 'looks_size': return 'size';
            case 'looks_costumenumbername': return `costume ${f('NUMBER_NAME')}`;
            case 'looks_backdropnumbername': return `backdrop ${f('NUMBER_NAME')}`;
            case 'sound_volume': return 'volume';
            case 'sensing_answer': return 'answer';
            case 'sensing_timer': return 'timer';
            case 'sensing_mousex': return 'mouse x';
            case 'sensing_mousey': return 'mouse y';
            case 'sensing_loudness': return 'loudness';
            case 'sensing_username': return 'username';
            case 'sensing_dayssince2000': return 'days since 2000';
            case 'sensing_distanceto': return `distance to ${this.dmenu(b.inputs.DISTANCETOMENU, blocks, 'DISTANCETOMENU')}`;
            case 'sensing_current': return f('CURRENTMENU') === 'DAYOFWEEK' ? 'day of week' : `current ${f('CURRENTMENU').toLowerCase()}`;
            case 'sensing_of': return `${this.dprop(f('PROPERTY'))} of ${this.dmenu(b.inputs.OBJECT, blocks, 'OBJECT')}`;
            case 'argument_reporter_string_number':
            case 'argument_reporter_boolean': return f('VALUE');
            default: return b.opcode;
        }
    }

    dprop(p) { return p === 'costume #' ? 'costume number' : p === 'backdrop #' ? 'backdrop number' : p; }

    // Decompile a boolean input/block -> condition text.
    dcond(ref, blocks) {
        const b = typeof ref === 'string' ? blocks[ref] : blocks[ref];
        if (!b) return '';
        const v = (k) => this.dval(b.inputs[k], blocks);
        const c = (k) => this.dcond(b.inputs[k][1], blocks);
        switch (b.opcode) {
            case 'operator_gt': return `${v('OPERAND1')} > ${v('OPERAND2')}`;
            case 'operator_lt': return `${v('OPERAND1')} < ${v('OPERAND2')}`;
            case 'operator_equals': return `${v('OPERAND1')} = ${v('OPERAND2')}`;
            case 'operator_and': return `(${c('OPERAND1')}) and (${c('OPERAND2')})`;
            case 'operator_or': return `(${c('OPERAND1')}) or (${c('OPERAND2')})`;
            case 'operator_not': return `not (${c('OPERAND')})`;
            case 'operator_contains': return `${v('STRING1')} contains ${v('STRING2')}`;
            case 'data_listcontainsitem': return `${b.fields.LIST[0]} contains ${v('ITEM')}`;
            case 'sensing_touchingobject': return `touching ${this.dmenu(b.inputs.TOUCHINGOBJECTMENU, blocks, 'TOUCHINGOBJECTMENU')}`;
            case 'sensing_touchingcolor': return `touching color ${v('COLOR')}`;
            case 'sensing_keypressed': return `key ${this.dmenu(b.inputs.KEY_OPTION, blocks, 'KEY_OPTION')} pressed?`;
            case 'sensing_mousedown': return 'mouse down?';
            case 'argument_reporter_boolean': return b.fields.VALUE[0];
            default: return this.drep(b, blocks);
        }
    }

    // Read a dropdown menu shadow's value and map internal names back to pseudocode.
    dmenu(input, blocks, field) {
        if (!Array.isArray(input)) return '';
        const shadow = blocks[input[1]];
        const val = shadow && shadow.fields && shadow.fields[field] ? shadow.fields[field][0] : '';
        const map = { _edge_: 'edge', _mouse_: 'mouse-pointer', _myself_: 'myself', _random_: 'random position', _stage_: 'Stage' };
        return map[val] || val;
    }

    decompileHat(b, blocks) {
        const f = (k) => (b.fields[k] ? b.fields[k][0] : '');
        switch (b.opcode) {
            case 'event_whenflagclicked': return 'WHEN flag clicked:';
            case 'event_whenkeypressed': return `WHEN ${f('KEY_OPTION')} key pressed:`;
            case 'event_whenthisspriteclicked': return 'WHEN sprite clicked:';
            case 'event_whenbroadcastreceived': return `WHEN I receive "${f('BROADCAST_OPTION')}":`;
            case 'control_start_as_clone': return 'WHEN I start as a clone:';
            case 'procedures_definition': {
                const proto = blocks[b.inputs.custom_block[1]];
                const m = proto.mutation;
                const names = JSON.parse(m.argumentnames || '[]');
                let ai = 0;
                const sig = m.proccode.replace(/%[sb]/g, (tok) => {
                    const nm = names[ai++];
                    return tok === '%b' ? `<${nm}>` : `(${nm})`;
                });
                return `DEFINE ${m.warp === 'true' ? 'FAST ' : ''}${sig}:`;
            }
            default: return null;
        }
    }

    // Decompile a stack block (and any nested substacks) into pseudocode lines.
    decompileStackBlock(b, blocks, level) {
        const pad = '  '.repeat(level);
        const v = (k) => this.dval(b.inputs[k], blocks);
        const f = (k) => (b.fields[k] ? b.fields[k][0] : '');
        const sub = (k, lvl) => (b.inputs[k] ? this.decompileStackFrom(b.inputs[k][1], blocks, lvl) : []);
        const line = (txt) => [pad + txt];

        switch (b.opcode) {
            // ---- control structures ----
            case 'control_forever': return [pad + 'FOREVER:', ...sub('SUBSTACK', level + 1)];
            case 'control_repeat': return [pad + `REPEAT ${v('TIMES')}:`, ...sub('SUBSTACK', level + 1)];
            case 'control_repeat_until': return [pad + `REPEAT UNTIL ${this.dcond(b.inputs.CONDITION[1], blocks)}:`, ...sub('SUBSTACK', level + 1)];
            case 'control_if': return [pad + `IF ${this.dcond(b.inputs.CONDITION[1], blocks)} THEN:`, ...sub('SUBSTACK', level + 1)];
            case 'control_if_else': return [
                pad + `IF ${this.dcond(b.inputs.CONDITION[1], blocks)} THEN:`, ...sub('SUBSTACK', level + 1),
                pad + 'ELSE:', ...sub('SUBSTACK2', level + 1)
            ];
            case 'control_wait': return line(`wait ${v('DURATION')} seconds`);
            case 'control_wait_until': return line(`wait until ${this.dcond(b.inputs.CONDITION[1], blocks)}`);
            case 'control_stop': return line(f('STOP_OPTION') === 'all' ? 'stop all' : f('STOP_OPTION') === 'this script' ? 'stop this script' : 'stop other scripts in sprite');
            case 'control_create_clone_of': return line(`create clone of ${this.dmenu(b.inputs.CLONE_OPTION, blocks, 'CLONE_OPTION')}`);
            case 'control_delete_this_clone': return line('delete this clone');
            // ---- motion ----
            case 'motion_movesteps': return line(`move ${v('STEPS')} steps`);
            case 'motion_turnright': return line(`turn right ${v('DEGREES')} degrees`);
            case 'motion_turnleft': return line(`turn left ${v('DEGREES')} degrees`);
            case 'motion_gotoxy': return line(`go to x: ${v('X')} y: ${v('Y')}`);
            case 'motion_glidesecstoxy': return line(`glide ${v('SECS')} secs to x: ${v('X')} y: ${v('Y')}`);
            case 'motion_glideto': return line(`glide ${v('SECS')} secs to ${this.dmenu(b.inputs.TO, blocks, 'TO')}`);
            case 'motion_goto': return line(`go to ${this.dmenu(b.inputs.TO, blocks, 'TO')}`);
            case 'motion_changexby': return line(`change x by ${v('DX')}`);
            case 'motion_changeyby': return line(`change y by ${v('DY')}`);
            case 'motion_setx': return line(`set x to ${v('X')}`);
            case 'motion_sety': return line(`set y to ${v('Y')}`);
            case 'motion_pointindirection': return line(`point in direction ${v('DIRECTION')}`);
            case 'motion_pointtowards': return line(`point towards ${this.dmenu(b.inputs.TOWARDS, blocks, 'TOWARDS')}`);
            case 'motion_ifonedgebounce': return line('if on edge bounce');
            case 'motion_setrotationstyle': return line(`set rotation style ${f('STYLE')}`);
            // ---- looks ----
            case 'looks_sayforsecs': return line(`say ${v('MESSAGE')} for ${v('SECS')} seconds`);
            case 'looks_say': return line(`say ${v('MESSAGE')}`);
            case 'looks_thinkforsecs': return line(`think ${v('MESSAGE')} for ${v('SECS')} seconds`);
            case 'looks_think': return line(`think ${v('MESSAGE')}`);
            case 'looks_show': return line('show');
            case 'looks_hide': return line('hide');
            case 'looks_switchcostumeto': return line(`switch costume to ${v('COSTUME')}`);
            case 'looks_nextcostume': return line('next costume');
            case 'looks_switchbackdropto': return line(`switch backdrop to ${this.dmenu(b.inputs.BACKDROP, blocks, 'BACKDROP')}`);
            case 'looks_nextbackdrop': return line('next backdrop');
            case 'looks_changesizeby': return line(`change size by ${v('CHANGE')}`);
            case 'looks_setsizeto': return line(`set size to ${v('SIZE')}`);
            case 'looks_changeeffectby': return line(`change ${f('EFFECT').toLowerCase()} effect by ${v('CHANGE')}`);
            case 'looks_seteffectto': return line(`set ${f('EFFECT').toLowerCase()} effect to ${v('VALUE')}`);
            case 'looks_cleargraphiceffects': return line('clear graphic effects');
            case 'looks_gotofrontback': return line(f('FRONT_BACK') === 'back' ? 'go to back' : 'go to front');
            case 'looks_goforwardbackwardlayers': return line(`go ${f('FORWARD_BACKWARD')} ${v('NUM')} layers`);
            // ---- sound / pen / sensing / music ----
            case 'sound_playuntildone': return line(`play sound ${v('SOUND_MENU')} until done`);
            case 'sound_play': return line(`play sound ${v('SOUND_MENU')}`);
            case 'sound_stopallsounds': return line('stop all sounds');
            case 'sound_changevolumeby': return line(`change volume by ${v('VOLUME')}`);
            case 'sound_setvolumeto': return line(`set volume to ${v('VOLUME')}`);
            case 'pen_clear': return line('clear');
            case 'pen_stamp': return line('stamp');
            case 'pen_penDown': return line('pen down');
            case 'pen_penUp': return line('pen up');
            case 'pen_setPenColorToColor': return line(`set pen color to ${v('COLOR')}`);
            case 'pen_changePenSizeBy': return line(`change pen size by ${v('SIZE')}`);
            case 'pen_setPenSizeTo': return line(`set pen size to ${v('SIZE')}`);
            case 'sensing_askandwait': return line(`ask ${v('QUESTION')} and wait`);
            case 'sensing_resettimer': return line('reset timer');
            case 'sensing_setdragmode': return line(`set drag mode ${f('DRAG_MODE')}`);
            case 'music_playNoteForBeats': return line(`play note ${v('NOTE')} for ${v('BEATS')} beats`);
            case 'music_playDrumForBeats': return line(`play drum ${this.dmenu(b.inputs.DRUM, blocks, 'DRUM')} for ${v('BEATS')} beats`);
            case 'music_restForBeats': return line(`rest for ${v('BEATS')} beats`);
            case 'music_setTempo': return line(`set tempo to ${v('TEMPO')}`);
            case 'music_changeTempo': return line(`change tempo by ${v('TEMPO')}`);
            // ---- data ----
            case 'data_setvariableto': return line(`set ${f('VARIABLE')} to ${v('VALUE')}`);
            case 'data_changevariableby': return line(`change ${f('VARIABLE')} by ${v('VALUE')}`);
            case 'data_addtolist': return line(`add ${v('ITEM')} to ${f('LIST')}`);
            case 'data_deleteoflist': return line(`delete ${v('INDEX')} of ${f('LIST')}`);
            case 'data_deletealloflist': return line(`delete all of ${f('LIST')}`);
            case 'data_insertatlist': return line(`insert ${v('ITEM')} at ${v('INDEX')} of ${f('LIST')}`);
            case 'data_replaceitemoflist': return line(`replace item ${v('INDEX')} of ${f('LIST')} with ${v('ITEM')}`);
            case 'data_showlist': return line(`show list ${f('LIST')}`);
            case 'data_hidelist': return line(`hide list ${f('LIST')}`);
            case 'data_showvariable': return line(`show variable ${f('VARIABLE')}`);
            case 'data_hidevariable': return line(`hide variable ${f('VARIABLE')}`);
            // ---- broadcasts ----
            case 'event_broadcast': return line(`broadcast ${this.dbroadcast(b.inputs.BROADCAST_INPUT)}`);
            case 'event_broadcastandwait': return line(`broadcast ${this.dbroadcast(b.inputs.BROADCAST_INPUT)} and wait`);
            // ---- custom block calls ----
            case 'procedures_call': {
                const m = b.mutation;
                const argIds = JSON.parse(m.argumentids || '[]');
                let ai = 0;
                const text = m.proccode.replace(/%[sb]/g, (tok) => {
                    const input = b.inputs[argIds[ai++]];
                    if (tok === '%b') return `(${this.dcond(input[1], blocks)})`;
                    return this.dval(input, blocks);
                });
                return line(text);
            }
            default: return line(`# unsupported: ${b.opcode}`);
        }
    }

    dbroadcast(input) {
        if (Array.isArray(input) && Array.isArray(input[1]) && input[1][0] === 11) return `"${input[1][1]}"`;
        return '"message1"';
    }

    // Append a user-supplied SVG as an extra costume (animation frame) on a sprite.
    addCustomSVGCostume(spriteName, svgText, costumeName) {
        const target = this.project.targets.find(t => !t.isStage && t.name === spriteName);
        if (!target) return false;
        const { width, height } = this.svgDimensions(svgText);
        const assetId = this.generateAssetId();
        this.assets.set(assetId, { type: 'svg', data: svgText, filename: `${assetId}.svg`, metadata: { width, height } });
        target.costumes.push({
            assetId,
            name: costumeName || `costume${target.costumes.length + 1}`,
            md5ext: `${assetId}.svg`, dataFormat: 'svg',
            rotationCenterX: width / 2, rotationCenterY: height / 2
        });
        return true;
    }
}

export default SB3Creator;