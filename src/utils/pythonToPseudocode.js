// Python (restricted subset) -> Brickwright pseudocode.
//
// This is the back half of the round-trip: blocks -> Python (generatePython) and
// Python -> pseudocode -> blocks (this file + SB3Creator.parse). It targets exactly
// the "algorithmic subset" the emitter produces — assignments, if/elif/else, while,
// for-range, print/input, def, arithmetic, comparisons, `_eq`, and list ops — plus
// idiomatic hand-written Python in the same shape. Anything outside the subset (real
// sprite/pen/sensing behaviour) lives in the blocks, not the text, so it is dropped
// with a warning rather than guessed at.
//
// Pipeline: tokenize (indentation-aware) -> parse to a small statement/expression AST
// -> translate to pseudocode lines. Kept dependency-free and self-contained so it can
// be unit-tested and vendored into the editor alongside the compiler.

// ---- Tokenizer -------------------------------------------------------------------

const KEYWORDS = new Set([
    'if', 'elif', 'else', 'while', 'for', 'in', 'def', 'return', 'pass', 'del',
    'and', 'or', 'not', 'True', 'False', 'None', 'global', 'import', 'from', 'as',
    'break', 'continue', 'range'
]);

const OPS = [
    '**', '//', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '%=',
    '(', ')', '[', ']', '{', '}', ',', ':', '.', '+', '-', '*', '/', '%',
    '<', '>', '='
];

class Tokenizer {
    constructor (src) {
        this.src = src.replace(/\r\n?/g, '\n');
        this.i = 0;
        this.line = 1;
        this.tokens = [];
        this.indents = [0];
        this.bracketDepth = 0;
        this.atLineStart = true;
    }

    error (msg) {
        const e = new Error(`Python parse error (line ${this.line}): ${msg}`);
        e.isPyParseError = true;
        throw e;
    }

    tokenize () {
        const s = this.src;
        while (this.i < s.length) {
            if (this.atLineStart && this.bracketDepth === 0) { this.handleIndent(); if (this.i >= s.length) break; }
            const c = s[this.i];
            if (c === '\n') {
                this.i++;
                if (this.bracketDepth === 0) { this.pushNewline(); this.atLineStart = true; this.line++; } else { this.line++; }
                continue;
            }
            if (c === ' ' || c === '\t') { this.i++; continue; }
            if (c === '#') { while (this.i < s.length && s[this.i] !== '\n') this.i++; continue; }
            if (c === '\\' && s[this.i + 1] === '\n') { this.i += 2; this.line++; continue; }
            if (c === '"' || c === "'") { this.readString(c); continue; }
            if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[this.i + 1] || ''))) { this.readNumber(); continue; }
            if (/[A-Za-z_]/.test(c)) { this.readName(); continue; }
            this.readOp();
        }
        // close out any open indents
        if (this.tokens.length && this.tokens[this.tokens.length - 1].type !== 'NEWLINE') this.pushNewline();
        while (this.indents.length > 1) { this.indents.pop(); this.push('DEDENT'); }
        this.push('EOF');
        return this.tokens;
    }

    handleIndent () {
        const s = this.src;
        let width = 0;
        const start = this.i;
        while (this.i < s.length && (s[this.i] === ' ' || s[this.i] === '\t')) {
            width += s[this.i] === '\t' ? 8 - (width % 8) : 1;
            this.i++;
        }
        // Blank or comment-only line: no indent tokens.
        if (this.i >= s.length || s[this.i] === '\n' || s[this.i] === '#') {
            this.atLineStart = false;
            if (s[this.i] === '#') { while (this.i < s.length && s[this.i] !== '\n') this.i++; }
            return;
        }
        this.atLineStart = false;
        const cur = this.indents[this.indents.length - 1];
        if (width > cur) { this.indents.push(width); this.push('INDENT'); } else if (width < cur) {
            while (this.indents.length > 1 && width < this.indents[this.indents.length - 1]) { this.indents.pop(); this.push('DEDENT'); }
            if (this.indents[this.indents.length - 1] !== width) this.error(`inconsistent indentation`);
        }
        void start;
    }

    pushNewline () {
        const last = this.tokens[this.tokens.length - 1];
        if (last && last.type !== 'NEWLINE' && last.type !== 'INDENT' && last.type !== 'DEDENT') this.push('NEWLINE');
    }

    push (type, value) { this.tokens.push({ type, value, line: this.line }); }

    readString (quote) {
        const s = this.src;
        // triple-quoted?
        const triple = s.slice(this.i, this.i + 3) === quote + quote + quote;
        this.i += triple ? 3 : 1;
        let out = '';
        while (this.i < s.length) {
            const c = s[this.i];
            if (c === '\\') {
                const n = s[this.i + 1];
                const map = { n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'", '"': '"', '0': '\0' };
                out += map[n] !== undefined ? map[n] : n;
                this.i += 2;
                continue;
            }
            if (triple && s.slice(this.i, this.i + 3) === quote + quote + quote) { this.i += 3; this.push('STRING', out); return; }
            if (!triple && c === quote) { this.i++; this.push('STRING', out); return; }
            if (!triple && c === '\n') this.error('unterminated string');
            if (c === '\n') this.line++;
            out += c;
            this.i++;
        }
        this.error('unterminated string');
    }

    readNumber () {
        const s = this.src;
        let out = '';
        while (this.i < s.length && /[0-9._eExXaAbBcCdDfF+-]/.test(s[this.i])) {
            // stop a trailing +/- that isn't part of an exponent
            if ((s[this.i] === '+' || s[this.i] === '-') && !/[eE]/.test(s[this.i - 1])) break;
            out += s[this.i]; this.i++;
        }
        this.push('NUMBER', out);
    }

    readName () {
        const s = this.src;
        let out = '';
        while (this.i < s.length && /[A-Za-z0-9_]/.test(s[this.i])) { out += s[this.i]; this.i++; }
        this.push(KEYWORDS.has(out) ? out : 'NAME', out);
    }

    readOp () {
        const s = this.src;
        for (const op of OPS) {
            if (s.slice(this.i, this.i + op.length) === op) {
                if (op === '(' || op === '[' || op === '{') this.bracketDepth++;
                if (op === ')' || op === ']' || op === '}') this.bracketDepth = Math.max(0, this.bracketDepth - 1);
                this.push('OP', op); this.i += op.length; return;
            }
        }
        this.error(`unexpected character "${s[this.i]}"`);
    }
}

// ---- Parser (statements + Pratt expressions) -------------------------------------

class Parser {
    constructor (tokens) { this.toks = tokens; this.p = 0; }
    peek (k = 0) { return this.toks[this.p + k] || { type: 'EOF' }; }
    next () { return this.toks[this.p++]; }
    at (type, value) { const t = this.peek(); return t.type === type && (value === undefined || t.value === value); }
    eat (type, value) { if (!this.at(type, value)) this.err(`expected ${value || type}, got ${this.peek().type} ${this.peek().value || ''}`); return this.next(); }
    err (msg) { const e = new Error(`Python parse error (line ${this.peek().line || '?'}): ${msg}`); e.isPyParseError = true; throw e; }

    parseProgram () {
        const body = [];
        while (!this.at('EOF')) {
            if (this.at('NEWLINE')) { this.next(); continue; }
            const st = this.parseStatement();
            if (st) body.push(st);
        }
        return { type: 'Program', body };
    }

    // A suite is either a single inline simple-statement after ':' or an INDENT block.
    parseSuite () {
        this.eat('OP', ':');
        if (this.at('NEWLINE')) {
            this.eat('NEWLINE');
            this.eat('INDENT');
            const body = [];
            while (!this.at('DEDENT') && !this.at('EOF')) {
                if (this.at('NEWLINE')) { this.next(); continue; }
                const st = this.parseStatement();
                if (st) body.push(st);
            }
            if (this.at('DEDENT')) this.next();
            return body;
        }
        // inline: one or more simple statements on the same line (rare)
        const body = [];
        const st = this.parseSimpleStatement();
        if (st) body.push(st);
        if (this.at('NEWLINE')) this.next();
        return body;
    }

    parseStatement () {
        const t = this.peek();
        if (t.type === 'if') return this.parseIf();
        if (t.type === 'while') return this.parseWhile();
        if (t.type === 'for') return this.parseFor();
        if (t.type === 'def') return this.parseDef();
        if (t.type === 'import' || t.type === 'from') { this.skipToNewline(); return null; }
        if (t.type === 'global') { this.skipToNewline(); return null; }
        return this.parseSimpleStatement();
    }

    skipToNewline () { while (!this.at('NEWLINE') && !this.at('EOF')) this.next(); if (this.at('NEWLINE')) this.next(); }

    parseIf (isElif) {
        this.eat(isElif ? 'elif' : 'if');
        const test = this.parseExpr();
        const body = this.parseSuite();
        let orelse = [];
        if (this.at('elif')) orelse = [this.parseIf(true)];
        else if (this.at('else')) { this.eat('else'); orelse = this.parseSuite(); }
        return { type: 'If', test, body, orelse };
    }

    parseWhile () {
        this.eat('while');
        const test = this.parseExpr();
        const body = this.parseSuite();
        return { type: 'While', test, body };
    }

    parseFor () {
        this.eat('for');
        const target = this.eat('NAME').value;
        this.eat('in');
        const iter = this.parseExpr();
        const body = this.parseSuite();
        return { type: 'For', target, iter, body };
    }

    parseDef () {
        this.eat('def');
        const name = this.eat('NAME').value;
        this.eat('OP', '(');
        const args = [];
        while (!this.at('OP', ')')) {
            args.push(this.eat('NAME').value);
            if (this.at('OP', ',')) this.next();
        }
        this.eat('OP', ')');
        // Emitter helper defs (`_eq`, `_rand`) use try/except etc. outside the subset —
        // they're re-emitted by generatePython, so drop them wholesale here.
        if (name.startsWith('_')) { this.skipSuite(); return null; }
        const body = this.parseSuite();
        return { type: 'Def', name, args, body };
    }

    // Consume a suite's tokens without parsing them (for unsupported/helper blocks).
    skipSuite () {
        this.eat('OP', ':');
        if (!this.at('NEWLINE')) { this.skipToNewline(); return; }
        this.eat('NEWLINE');
        if (!this.at('INDENT')) return;
        this.eat('INDENT');
        let depth = 1;
        while (depth > 0 && !this.at('EOF')) {
            if (this.at('INDENT')) depth++;
            else if (this.at('DEDENT')) depth--;
            this.next();
        }
    }

    parseSimpleStatement () {
        const t = this.peek();
        if (t.type === 'pass') { this.next(); this.endSimple(); return { type: 'Pass' }; }
        if (t.type === 'break') { this.next(); this.endSimple(); return { type: 'Break' }; }
        if (t.type === 'continue') { this.next(); this.endSimple(); return { type: 'Continue' }; }
        if (t.type === 'return') { this.next(); let val = null; if (!this.at('NEWLINE') && !this.at('EOF')) val = this.parseExpr(); this.endSimple(); return { type: 'Return', value: val }; }
        if (t.type === 'del') { this.next(); const target = this.parseExpr(); this.endSimple(); return { type: 'Del', target }; }
        // expression / assignment / aug-assign
        const target = this.parseExpr();
        if (this.at('OP', '=')) { this.next(); const value = this.parseExpr(); this.endSimple(); return { type: 'Assign', target, value }; }
        for (const aug of ['+=', '-=', '*=', '/=', '%=']) {
            if (this.at('OP', aug)) { this.next(); const value = this.parseExpr(); this.endSimple(); return { type: 'AugAssign', op: aug[0], target, value }; }
        }
        this.endSimple();
        return { type: 'Expr', value: target };
    }

    endSimple () { if (this.at('NEWLINE')) this.next(); }

    // Pratt-style expression parser. Precedence low->high: or, and, not, compare,
    // add/sub, mul/div/mod, unary, power, atom (call/subscript/attribute).
    parseExpr () { return this.parseOr(); }
    parseOr () { let l = this.parseAnd(); while (this.at('or')) { this.next(); l = { type: 'Bool', op: 'or', left: l, right: this.parseAnd() }; } return l; }
    parseAnd () { let l = this.parseNot(); while (this.at('and')) { this.next(); l = { type: 'Bool', op: 'and', left: l, right: this.parseNot() }; } return l; }
    parseNot () { if (this.at('not')) { this.next(); return { type: 'Not', operand: this.parseNot() }; } return this.parseCompare(); }
    parseCompare () {
        let l = this.parseAdd();
        const cmp = () => {
            if (this.at('OP', '<')) return '<'; if (this.at('OP', '>')) return '>';
            if (this.at('OP', '<=')) return '<='; if (this.at('OP', '>=')) return '>=';
            if (this.at('OP', '==')) return '=='; if (this.at('OP', '!=')) return '!=';
            if (this.at('in')) return 'in';
            if (this.at('not') && this.peek(1).type === 'in') return 'notin';
            return null;
        };
        let op;
        while ((op = cmp())) {
            if (op === 'notin') { this.next(); this.next(); } else if (op === 'in') this.next(); else this.next();
            const right = this.parseAdd();
            l = { type: 'Compare', op, left: l, right };
        }
        return l;
    }
    parseAdd () { let l = this.parseMul(); while (this.at('OP', '+') || this.at('OP', '-')) { const op = this.next().value; l = { type: 'BinOp', op, left: l, right: this.parseMul() }; } return l; }
    parseMul () { let l = this.parseUnary(); while (this.at('OP', '*') || this.at('OP', '/') || this.at('OP', '%') || this.at('OP', '//')) { const op = this.next().value; l = { type: 'BinOp', op, left: l, right: this.parseUnary() }; } return l; }
    parseUnary () { if (this.at('OP', '-') || this.at('OP', '+')) { const op = this.next().value; return { type: 'Unary', op, operand: this.parseUnary() }; } return this.parsePower(); }
    parsePower () { let l = this.parseAtom(); if (this.at('OP', '**')) { this.next(); l = { type: 'BinOp', op: '**', left: l, right: this.parseUnary() }; } return l; }

    parseAtom () {
        let node = this.parsePrimary();
        // trailers: call, subscript, attribute
        for (;;) {
            if (this.at('OP', '(')) {
                this.next();
                const args = [];
                while (!this.at('OP', ')')) { args.push(this.parseExpr()); if (this.at('OP', ',')) this.next(); }
                this.eat('OP', ')');
                node = { type: 'Call', func: node, args };
            } else if (this.at('OP', '[')) {
                this.next();
                const index = this.parseExpr();
                this.eat('OP', ']');
                node = { type: 'Subscript', value: node, index };
            } else if (this.at('OP', '.')) {
                this.next();
                const attr = this.eat('NAME').value;
                node = { type: 'Attribute', value: node, attr };
            } else break;
        }
        return node;
    }

    parsePrimary () {
        const t = this.peek();
        if (t.type === 'NUMBER') { this.next(); return { type: 'Num', value: t.value }; }
        if (t.type === 'STRING') { this.next(); return { type: 'Str', value: t.value }; }
        if (t.type === 'True') { this.next(); return { type: 'Const', value: true }; }
        if (t.type === 'False') { this.next(); return { type: 'Const', value: false }; }
        if (t.type === 'None') { this.next(); return { type: 'Const', value: null }; }
        if (t.type === 'range') { this.next(); return { type: 'Name', id: 'range' }; }
        if (t.type === 'NAME') { this.next(); return { type: 'Name', id: t.value }; }
        if (this.at('OP', '(')) { this.next(); const e = this.parseExpr(); this.eat('OP', ')'); return e; }
        if (this.at('OP', '[')) {
            this.next();
            const elts = [];
            while (!this.at('OP', ']')) { elts.push(this.parseExpr()); if (this.at('OP', ',')) this.next(); }
            this.eat('OP', ']');
            return { type: 'List', elts };
        }
        this.err(`unexpected ${t.type} ${t.value || ''}`);
        return null;
    }
}

// ---- Translator (AST -> pseudocode) ----------------------------------------------

class Translator {
    constructor () {
        this.warnings = [];
        this.lists = new Set();      // names known to be lists
        this.scalars = new Set();    // module-level scalar names (for GLOBAL decls)
        this.usesAnswer = false;
    }

    warn (m) { this.warnings.push(m); }

    // Map a def name (possibly mangled by the emitter) back to a WHEN hat header,
    // or null if it should be treated as a custom block DEFINE.
    hatHeader (name, args) {
        if (name === 'when_flag_clicked') return 'WHEN flag clicked:';
        if (name === 'when_clicked') return 'WHEN sprite clicked:';
        if (name === 'when_clone_starts') return 'WHEN I start as a clone:';
        let m;
        if ((m = /^when_(.+)_key$/.exec(name))) return `WHEN ${m[1].replace(/_/g, ' ')} key pressed:`;
        if ((m = /^on_(.+)$/.exec(name))) return `WHEN I receive "${m[1].replace(/_/g, ' ')}":`;
        if (args.length === 0 && /^handler/.test(name)) return 'WHEN flag clicked:';
        return null;
    }

    // Strip coercion wrappers the emitter adds so pseudocode reads cleanly.
    unwrap (node) {
        while (node && node.type === 'Call' && node.func.type === 'Name' &&
            ['str', 'int', 'float'].includes(node.func.id) && node.args.length === 1) node = node.args[0];
        return node;
    }

    expr (nodeRaw) {
        const node = nodeRaw;
        if (!node) return '';
        switch (node.type) {
            case 'Num': return node.value;
            case 'Str': return JSON.stringify(node.value);
            case 'Const': return node.value === true ? 'true' : node.value === false ? 'false' : '""';
            case 'Name': return node.id;
            case 'Unary': {
                const x = this.expr(node.operand);
                if (node.op === '-') return node.operand.type === 'Num' ? `-${x}` : `(0 - ${x})`;
                return x;
            }
            case 'Not': return `(not ${this.expr(node.operand)})`;
            case 'Bool': return `(${this.expr(node.left)} ${node.op} ${this.expr(node.right)})`;
            case 'Compare': return this.compare(node);
            case 'BinOp': return this.binop(node);
            case 'Call': return this.callExpr(node);
            case 'Subscript': return this.subscript(node);
            case 'List': return node.elts.length ? `[${node.elts.map((e) => this.expr(e)).join(', ')}]` : '""';
            case 'Ternary': this.warn('ternary expression flattened to its true branch'); return this.expr(node.then);
            case 'Attribute':
                // JS `x.length` (string or list length); other members aren't in the subset.
                if (node.attr === 'length') return `(length of ${this.expr(node.value)})`;
                this.warn(`dropped attribute access .${node.attr}`); return '""';
            default: this.warn(`unsupported expression ${node.type}`); return '""';
        }
    }

    compare (node) {
        const map = { '<': '<', '>': '>', '<=': '<=', '>=': '>=' };
        if (map[node.op]) return `(${this.expr(node.left)} ${map[node.op]} ${this.expr(node.right)})`;
        if (node.op === '==') return `(${this.expr(node.left)} = ${this.expr(node.right)})`;
        if (node.op === '!=') return `(not (${this.expr(node.left)} = ${this.expr(node.right)}))`;
        // a in b  ->  (b contains a)   (list-contains or string-contains)
        if (node.op === 'in') return `(${this.expr(this.unwrap(node.right))} contains ${this.expr(this.unwrap(node.left))})`;
        if (node.op === 'notin') return `(not (${this.expr(this.unwrap(node.right))} contains ${this.expr(this.unwrap(node.left))}))`;
        return `(${this.expr(node.left)} = ${this.expr(node.right)})`;
    }

    binop (node) {
        const L = node.left, R = node.right;
        // str(a) + str(b)  ->  join
        if (node.op === '+' && this.isStrCall(L) && this.isStrCall(R)) return `(${this.expr(L.args[0])} join ${this.expr(R.args[0])})`;
        const map = { '+': '+', '-': '-', '*': '*', '/': '/', '%': 'mod', '//': '/', '**': '^' };
        return `(${this.expr(L)} ${map[node.op] || node.op} ${this.expr(R)})`;
    }

    isStrCall (n) { return n && n.type === 'Call' && n.func.type === 'Name' && n.func.id === 'str' && n.args.length === 1; }

    callExpr (node) {
        const f = node.func;
        const a = node.args;
        // math.* / random.*
        if (f.type === 'Attribute' && f.value.type === 'Name') {
            const q = `${f.value.id}.${f.attr}`;
            if (q === 'random.randint') return `(pick random ${this.expr(a[0])} to ${this.expr(a[1])})`;
            const mathUnary = {
                'math.floor': 'floor', 'math.ceil': 'ceiling', 'math.sqrt': 'sqrt',
                'math.sin': 'sin', 'math.cos': 'cos', 'math.tan': 'tan',
                'math.log': 'ln', 'math.log10': 'log', 'math.exp': 'e ^'
            };
            if (mathUnary[q]) {
                // math.sin(math.radians(x)) -> sin of x
                let arg = a[0];
                if (arg && arg.type === 'Call' && arg.func.type === 'Attribute' && arg.func.attr === 'radians') arg = arg.args[0];
                return `(${mathUnary[q]} of ${this.expr(arg)})`;
            }
        }
        if (f.type === 'Name') {
            const id = f.id;
            if (id === '_eq') return `(${this.expr(a[0])} = ${this.expr(a[1])})`;
            if (id === '_rand') return `(pick random ${this.expr(a[0])} to ${this.expr(a[1])})`;
            if (id === 'abs') return `(abs of ${this.expr(a[0])})`;
            if (id === 'round') return `(round ${this.expr(a[0])})`;
            if (id === 'len') {
                const x = this.unwrap(a[0]);
                if (x.type === 'Name' && this.lists.has(x.id)) return `(length of ${x.id})`;
                return `(length of ${this.expr(x)})`;
            }
            if (id === 'str' || id === 'int' || id === 'float') return this.expr(a[0]);
            if (id === 'input') { this.usesAnswer = true; return 'answer'; }
        }
        this.warn(`dropped call in expression`);
        return '""';
    }

    subscript (node) {
        // recover 1-based Scratch index from `base[int(i) - 1]` (or `base[i]`)
        const base = node.value;
        let idx = this.unwrap(node.index);
        let oneBased;
        if (idx.type === 'BinOp' && idx.op === '-' && idx.right.type === 'Num' && Number(idx.right.value) === 1) {
            oneBased = this.expr(this.unwrap(idx.left));
        } else {
            oneBased = `(${this.expr(idx)} + 1)`;
        }
        if (base.type === 'Name' && this.lists.has(base.id)) return `(item ${oneBased} of ${base.id})`;
        // string subscript -> letter of
        return `(letter ${oneBased} of ${this.expr(this.unwrap(base))})`;
    }

    // Translate a list of statements to indented pseudocode lines.
    block (stmts, indent) {
        const out = [];
        for (const s of stmts) out.push(...this.stmt(s, indent));
        return out;
    }

    pad (n) { return '    '.repeat(n); }

    stmt (s, indent) {
        const p = this.pad(indent);
        switch (s.type) {
            case 'Pass': case 'Break': case 'Continue': return [];
            case 'Return': return [p + 'stop this script'];
            case 'Assign': return this.assign(s, indent);
            case 'AugAssign': {
                const val = s.op === '-' ? `(0 - ${this.expr(s.value)})` : this.expr(s.value);
                return [p + `change ${this.expr(s.target)} by ${val}`];
            }
            case 'Del': {
                if (s.target.type === 'Subscript') { const { name, oneBased } = this.listIndex(s.target); if (name) return [p + `delete item ${oneBased} of ${name}`]; }
                return [];
            }
            case 'Expr': return this.exprStmt(s.value, indent);
            case 'If': return this.ifStmt(s, indent);
            case 'While': return this.whileStmt(s, indent);
            case 'For': return this.forStmt(s, indent);
            case 'Def': this.warn('nested def is not supported'); return [];
            default: this.warn(`unsupported statement ${s.type}`); return [];
        }
    }

    listIndex (sub) {
        const base = sub.value;
        let idx = this.unwrap(sub.index);
        let oneBased;
        if (idx.type === 'BinOp' && idx.op === '-' && idx.right.type === 'Num' && Number(idx.right.value) === 1) oneBased = this.expr(this.unwrap(idx.left));
        else oneBased = `(${this.expr(idx)} + 1)`;
        return { name: base.type === 'Name' ? base.id : null, oneBased };
    }

    assign (s, indent) {
        const p = this.pad(indent);
        // list[i] = v  ->  replace item i of list with v
        if (s.target.type === 'Subscript') { const { name, oneBased } = this.listIndex(s.target); if (name) return [p + `replace item ${oneBased} of ${name} with ${this.expr(s.value)}`]; }
        // JS `xs.length = 0`  ->  clear the list
        if (s.target.type === 'Attribute' && s.target.attr === 'length' && s.target.value.type === 'Name') {
            this.lists.add(s.target.value.id);
            return [p + `delete all of ${s.target.value.id}`];
        }
        if (s.target.type !== 'Name') { this.warn('unsupported assignment target'); return []; }
        const name = s.target.id;
        // x = input(prompt)  ->  ask prompt and wait  (+ bind if not `answer`)
        if (s.value.type === 'Call' && s.value.func.type === 'Name' && s.value.func.id === 'input') {
            this.usesAnswer = true;
            let q = s.value.args[0];
            // emitter wraps as  str(<q>) + " "  -> recover <q>
            if (q && q.type === 'BinOp' && q.op === '+' && this.isStrCall(q.left)) q = q.left.args[0];
            const out = [p + `ask ${this.expr(q)} and wait`];
            if (name !== 'answer') out.push(p + `set ${name} to answer`);
            return out;
        }
        // x = []  ->  reset list
        if (s.value.type === 'List' && s.value.elts.length === 0) { this.lists.add(name); return [p + `delete all of ${name}`]; }
        return [p + `set ${name} to ${this.expr(s.value)}`];
    }

    exprStmt (e, indent) {
        const p = this.pad(indent);
        if (e.type !== 'Call') return [];
        const f = e.func;
        // list method calls
        if (f.type === 'Attribute' && f.value.type === 'Name') {
            const list = f.value.id;
            if (f.attr === 'append') { this.lists.add(list); return [p + `add ${this.expr(e.args[0])} to ${list}`]; }
            if (f.attr === 'clear') { this.lists.add(list); return [p + `delete all of ${list}`]; }
            if (f.attr === 'insert') { this.lists.add(list); const oneBased = this.recoverIndex(e.args[0]); return [p + `insert ${this.expr(e.args[1])} at ${oneBased} of ${list}`]; }
            // JS list ops: xs.splice(i-1, 1) delete; xs.splice(i-1, 0, item) insert
            if (f.attr === 'splice') {
                this.lists.add(list);
                const oneBased = this.recoverIndex(e.args[0]);
                if (e.args.length >= 3) return [p + `insert ${this.expr(e.args[2])} at ${oneBased} of ${list}`];
                return [p + `delete item ${oneBased} of ${list}`];
            }
            if (list === 'time' && f.attr === 'sleep') return [p + `wait ${this.expr(e.args[0])} seconds`];
        }
        if (f.type === 'Name') {
            const id = f.id;
            if (['print'].includes(id)) return [p + `say ${e.args.map((x) => this.expr(x)).join(' join ')}`];
            // a bare call to a hat function at any level is the emitter's "# run" invocation
            if (this.hatHeader(id, e.args) && e.args.length === 0) return [];
            // otherwise a custom-block call
            const blockName = id.replace(/^do_/, '').replace(/_/g, ' ');
            const args = e.args.map((x) => this.expr(x)).join(' ');
            return [p + `call: ${blockName}${args ? ' ' + args : ''}`];
        }
        this.warn('dropped expression statement');
        return [];
    }

    recoverIndex (node) {
        const idx = this.unwrap(node);
        if (idx.type === 'BinOp' && idx.op === '-' && idx.right.type === 'Num' && Number(idx.right.value) === 1) return this.expr(this.unwrap(idx.left));
        return `(${this.expr(idx)} + 1)`;
    }

    ifStmt (s, indent) {
        const p = this.pad(indent);
        const out = [p + `IF ${this.stripOuterParens(this.expr(s.test))} THEN:`, ...this.block(s.body, indent + 1)];
        if (s.orelse && s.orelse.length) {
            out.push(p + 'ELSE:');
            out.push(...this.block(s.orelse, indent + 1));
        }
        return out;
    }

    whileStmt (s, indent) {
        const p = this.pad(indent);
        // while True -> FOREVER
        if (s.test.type === 'Const' && s.test.value === true) return [p + 'FOREVER:', ...this.block(s.body, indent + 1)];
        // while not (COND): pass  -> wait until COND
        const onlyPass = s.body.every((b) => b.type === 'Pass');
        if (s.test.type === 'Not') {
            const cond = this.stripOuterParens(this.expr(s.test.operand));
            if (onlyPass) return [p + `wait until ${cond}`];
            return [p + `REPEAT UNTIL ${cond}:`, ...this.block(s.body, indent + 1)];
        }
        // general while cond -> REPEAT UNTIL (not cond)
        const inv = `(not ${this.expr(s.test)})`;
        if (onlyPass) return [p + `wait until ${this.expr(s.test)}`];
        return [p + `REPEAT UNTIL ${inv}:`, ...this.block(s.body, indent + 1)];
    }

    forStmt (s, indent) {
        const p = this.pad(indent);
        // for _ in range(n)
        if (s.iter.type === 'Call' && s.iter.func.type === 'Name' && s.iter.func.id === 'range') {
            const n = this.unwrap(s.iter.args[s.iter.args.length - 1]);
            return [p + `REPEAT ${this.expr(n)}:`, ...this.block(s.body, indent + 1)];
        }
        this.warn('only `for _ in range(n)` loops are supported');
        return this.block(s.body, indent);
    }

    stripOuterParens (str) {
        if (str[0] !== '(' || str[str.length - 1] !== ')') return str;
        let depth = 0;
        for (let i = 0; i < str.length; i++) {
            if (str[i] === '(') depth++;
            else if (str[i] === ')') { depth--; if (depth === 0 && i !== str.length - 1) return str; }
        }
        return str.slice(1, -1);
    }

    // ---- top level ----
    program (ast) {
        // First pass: collect module-level scalar/list names and pre-scan lists so
        // subscripts/`in` translate as list ops even before their first append.
        const preScanLists = (stmts) => {
            for (const s of stmts) {
                if (s.type === 'Assign' && s.target.type === 'Name' && s.value.type === 'List') this.lists.add(s.target.id);
                if (s.type === 'Expr' && s.value.type === 'Call' && s.value.func.type === 'Attribute' &&
                    s.value.func.value.type === 'Name' && ['append', 'clear', 'insert'].includes(s.value.func.attr)) this.lists.add(s.value.func.value.id);
                for (const k of ['body', 'orelse']) if (s[k]) preScanLists(s[k]);
            }
        };
        preScanLists(ast.body);

        const hats = [];
        const defs = [];
        const moduleStmts = [];
        for (const s of ast.body) {
            if (s.type === 'Def') {
                const header = this.hatHeader(s.name, s.args);
                if (header) hats.push({ header, body: s.body });
                else defs.push(s);
            } else if (s.type === 'Assign' && s.target.type === 'Name') {
                // module-level state init: declare, don't emit a set (blocks init to 0/[] anyway,
                // but keep an explicit set so a non-zero initial value survives)
                if (s.value.type === 'List') this.lists.add(s.target.id);
                else this.scalars.add(s.target.id);
                moduleStmts.push(s);
            } else if (s.type === 'Expr') {
                // a bare hat-call ("# run") — drop; anything else is stray, drop with note
                const v = s.value;
                if (!(v.type === 'Call' && v.func.type === 'Name' && this.hatHeader(v.func.id, v.args))) this.warn('dropped top-level statement');
            } else {
                this.warn(`dropped top-level ${s.type}`);
            }
        }

        const lines = ['SPRITE Main:'];
        for (const n of this.scalars) if (n !== 'answer') lines.push('    GLOBAL ' + n);
        for (const n of this.lists) lines.push('    LIST ' + n);
        lines.push('');

        // module-level non-zero initialisers become a flag-clicked prologue
        const initLines = [];
        for (const s of moduleStmts) {
            if (s.value.type === 'List') continue; // list starts empty
            if (s.value.type === 'Num' && Number(s.value.value) === 0) continue; // default
            if (s.value.type === 'Str' && s.value.value === '') continue;
            initLines.push('        set ' + s.target.id + ' to ' + this.expr(s.value));
        }

        // custom block DEFINEs
        for (const d of defs) {
            const sig = d.name.replace(/^do_/, '').replace(/_/g, ' ');
            const params = d.args.map((a) => `(${a})`).join(' ');
            lines.push(`    DEFINE ${sig}${params ? ' ' + params : ''}:`);
            const body = this.block(d.body, 2);
            lines.push(...(body.length ? body : ['        stop this script']).map((l) => l));
            lines.push('');
        }

        // hats
        let flagEmitted = false;
        for (const h of hats) {
            lines.push('    ' + h.header);
            let body = this.block(h.body, 2);
            if (h.header === 'WHEN flag clicked:' && !flagEmitted && initLines.length) { body = [...initLines, ...body]; flagEmitted = true; }
            lines.push(...(body.length ? body : ['        say ""']));
            lines.push('');
        }
        // if there were module inits but no flag hat, add one
        if (initLines.length && !flagEmitted) {
            lines.push('    WHEN flag clicked:');
            lines.push(...initLines);
            lines.push('');
        }

        return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
    }
}

export default function pythonToPseudocode (source) {
    if (!source || !source.trim()) throw new Error('Python source is empty');
    const tokens = new Tokenizer(source).tokenize();
    const ast = new Parser(tokens).parseProgram();
    const t = new Translator();
    const pseudocode = t.program(ast);
    return { pseudocode, warnings: t.warnings };
}

// The AST -> pseudocode translator is language-agnostic: the JavaScript front-end
// (javascriptToPseudocode.js) produces the same node shapes and reuses it.
export { Translator };
