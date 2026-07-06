// JavaScript (restricted subset) -> Brickwright pseudocode.
//
// The mirror of javascript generation (generateJavaScript). It parses the same
// algorithmic subset the emitter produces — `let` state, `function` defs, `if/else`,
// `while`, C-style `for` counters, `console.log`/`prompt`, arithmetic, `===`/`&&`/`!`,
// `_eq`/`_rand`, and array ops (`push`/`splice`/`length`) — into the SAME AST the Python
// front-end builds, then hands it to the shared Translator. JS idioms are normalised to
// the translator's Python-flavoured nodes (`console.log`→`print`, `.push`→`append`,
// `String(x)`→`str(x)`, `Math.floor`→`math.floor`, …) as the tree is built.

import { Translator } from './pythonToPseudocode.js';

// ---- Tokenizer -------------------------------------------------------------------

const JS_KEYWORDS = new Set(['function', 'if', 'else', 'while', 'for', 'return', 'let',
    'const', 'var', 'true', 'false', 'null', 'undefined', 'new', 'typeof', 'break', 'continue']);

const JS_OPS = ['===', '!==', '**', '==', '!=', '<=', '>=', '&&', '||', '++', '--',
    '+=', '-=', '*=', '/=', '%=', '(', ')', '{', '}', '[', ']', ';', ',', '.',
    '+', '-', '*', '/', '%', '<', '>', '=', '!', '?', ':'];

class JsTokenizer {
    constructor (src) { this.s = src.replace(/\r\n?/g, '\n'); this.i = 0; this.line = 1; this.toks = []; }
    error (m) { const e = new Error(`JavaScript parse error (line ${this.line}): ${m}`); e.isJsParseError = true; throw e; }
    push (type, value) { this.toks.push({ type, value, line: this.line }); }
    tokenize () {
        const s = this.s;
        while (this.i < s.length) {
            const c = s[this.i];
            if (c === '\n') { this.line++; this.i++; continue; }
            if (c === ' ' || c === '\t') { this.i++; continue; }
            if (c === '/' && s[this.i + 1] === '/') { while (this.i < s.length && s[this.i] !== '\n') this.i++; continue; }
            if (c === '/' && s[this.i + 1] === '*') { this.i += 2; while (this.i < s.length && !(s[this.i] === '*' && s[this.i + 1] === '/')) { if (s[this.i] === '\n') this.line++; this.i++; } this.i += 2; continue; }
            if (c === '"' || c === "'" || c === '`') { this.readString(c); continue; }
            if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[this.i + 1] || ''))) { this.readNumber(); continue; }
            if (/[A-Za-z_$]/.test(c)) { this.readName(); continue; }
            this.readOp();
        }
        this.push('EOF');
        return this.toks;
    }
    readString (q) {
        const s = this.s; this.i++;
        let out = '';
        while (this.i < s.length) {
            const c = s[this.i];
            if (c === '\\') { const n = s[this.i + 1]; const map = { n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'", '"': '"', '`': '`', '0': '\0' }; out += map[n] !== undefined ? map[n] : n; this.i += 2; continue; }
            if (c === q) { this.i++; this.push('STRING', out); return; }
            if (c === '\n') this.line++;
            out += c; this.i++;
        }
        this.error('unterminated string');
    }
    readNumber () {
        const s = this.s; let out = '';
        while (this.i < s.length && /[0-9._eExXaAbBcCdDfF]/.test(s[this.i])) { out += s[this.i]; this.i++; }
        this.push('NUMBER', out);
    }
    readName () {
        const s = this.s; let out = '';
        while (this.i < s.length && /[A-Za-z0-9_$]/.test(s[this.i])) { out += s[this.i]; this.i++; }
        this.push(JS_KEYWORDS.has(out) ? out : 'NAME', out);
    }
    readOp () {
        const s = this.s;
        for (const op of JS_OPS) { if (s.slice(this.i, this.i + op.length) === op) { this.push('OP', op); this.i += op.length; return; } }
        this.error(`unexpected character "${s[this.i]}"`);
    }
}

// ---- Parser ----------------------------------------------------------------------

class JsParser {
    constructor (toks) { this.toks = toks; this.p = 0; }
    peek (k = 0) { return this.toks[this.p + k] || { type: 'EOF' }; }
    next () { return this.toks[this.p++]; }
    at (type, value) { const t = this.peek(); return t.type === type && (value === undefined || t.value === value); }
    eat (type, value) { if (!this.at(type, value)) this.err(`expected ${value || type}, got ${this.peek().type} ${this.peek().value || ''}`); return this.next(); }
    err (m) { const e = new Error(`JavaScript parse error (line ${this.peek().line || '?'}): ${m}`); e.isJsParseError = true; throw e; }
    semi () { while (this.at('OP', ';')) this.next(); }

    parseProgram () {
        const body = [];
        while (!this.at('EOF')) { if (this.at('OP', ';')) { this.next(); continue; } const st = this.parseStatement(); if (st) body.push(st); }
        return { type: 'Program', body };
    }

    parseBlockOrStmt () {
        if (this.at('OP', '{')) return this.parseBlock();
        const st = this.parseStatement();
        return st ? [st] : [];
    }
    parseBlock () {
        this.eat('OP', '{');
        const body = [];
        while (!this.at('OP', '}') && !this.at('EOF')) { if (this.at('OP', ';')) { this.next(); continue; } const st = this.parseStatement(); if (st) body.push(st); }
        this.eat('OP', '}');
        return body;
    }

    parseStatement () {
        const t = this.peek();
        if (t.type === 'function') return this.parseFunction();
        if (t.type === 'if') return this.parseIf();
        if (t.type === 'while') return this.parseWhile();
        if (t.type === 'for') return this.parseFor();
        if (t.type === 'return') { this.next(); let v = null; if (!this.at('OP', ';') && !this.at('OP', '}') && !this.at('EOF')) v = this.parseExpr(); this.semi(); return { type: 'Return', value: v }; }
        if (t.type === 'break') { this.next(); this.semi(); return { type: 'Break' }; }
        if (t.type === 'continue') { this.next(); this.semi(); return { type: 'Continue' }; }
        if (t.type === 'let' || t.type === 'const' || t.type === 'var') return this.parseDeclaration();
        if (this.at('OP', '{')) return { type: 'BlockStmt', body: this.parseBlock() };
        return this.parseExprStatement();
    }

    parseDeclaration () {
        this.next(); // let/const/var
        // support `let a = 0, b = 0;`
        const decls = [];
        for (;;) {
            const name = this.eat('NAME').value;
            let value = { type: 'Const', value: null };
            if (this.at('OP', '=')) { this.next(); value = this.parseExpr(); }
            decls.push({ type: 'Assign', target: { type: 'Name', id: name }, value });
            if (this.at('OP', ',')) { this.next(); continue; }
            break;
        }
        this.semi();
        return decls.length === 1 ? decls[0] : { type: 'BlockStmt', body: decls };
    }

    parseFunction () {
        this.eat('function');
        const name = this.eat('NAME').value;
        this.eat('OP', '(');
        const args = [];
        while (!this.at('OP', ')')) { args.push(this.eat('NAME').value); if (this.at('OP', ',')) this.next(); }
        this.eat('OP', ')');
        // Emitter helpers (`_eq`, `_rand`, `_fact`, `_sumdigits`) may use arrow functions
        // etc. outside the subset — skip their body raw (they're re-emitted anyway).
        if (name.startsWith('_')) { this.skipBraces(); return null; }
        const body = this.parseBlock();
        return { type: 'Def', name, args, body };
    }

    // Consume a balanced `{ ... }` without parsing (string tokens keep braces out of OPs).
    skipBraces () {
        this.eat('OP', '{');
        let depth = 1;
        while (depth > 0 && !this.at('EOF')) {
            if (this.at('OP', '{')) depth++;
            else if (this.at('OP', '}')) depth--;
            this.next();
        }
    }

    parseIf () {
        this.eat('if'); this.eat('OP', '(');
        const test = this.parseExpr();
        this.eat('OP', ')');
        const body = this.parseBlockOrStmt();
        let orelse = [];
        if (this.at('else')) { this.eat('else'); orelse = this.at('if') ? [this.parseIf()] : this.parseBlockOrStmt(); }
        return { type: 'If', test, body, orelse };
    }

    parseWhile () {
        this.eat('while'); this.eat('OP', '(');
        const test = this.parseExpr();
        this.eat('OP', ')');
        return { type: 'While', test, body: this.parseBlockOrStmt() };
    }

    // C-style `for (let i = 0; i < n; i++)` -> range(n); anything fancier is dropped to a warn.
    parseFor () {
        this.eat('for'); this.eat('OP', '(');
        if (this.at('let') || this.at('const') || this.at('var')) this.next();
        let target = 'i';
        if (this.at('NAME')) { target = this.next().value; if (this.at('OP', '=')) { this.next(); this.parseExpr(); } }
        this.eat('OP', ';');
        const test = this.at('OP', ';') ? null : this.parseExpr();
        this.eat('OP', ';');
        // update (e.g. `i++`) is ignored — skip tokens to the matching ')'
        let depth = 0;
        while (!this.at('EOF')) {
            if (this.at('OP', '(')) depth++;
            else if (this.at('OP', ')')) { if (depth === 0) break; depth--; }
            this.next();
        }
        this.eat('OP', ')');
        const body = this.parseBlockOrStmt();
        let n = { type: 'Num', value: '0' };
        if (test && test.type === 'Compare' && (test.op === '<' || test.op === '<=')) n = test.op === '<' ? test.right : { type: 'BinOp', op: '+', left: test.right, right: { type: 'Num', value: '1' } };
        return { type: 'For', target, iter: { type: 'Call', func: { type: 'Name', id: 'range' }, args: [n] }, body };
    }

    parseExprStatement () {
        const expr = this.parseExpr();
        if (this.at('OP', '=')) { this.next(); const value = this.parseExpr(); this.semi(); return { type: 'Assign', target: expr, value }; }
        for (const aug of ['+=', '-=', '*=', '/=', '%=']) if (this.at('OP', aug)) { this.next(); const value = this.parseExpr(); this.semi(); return { type: 'AugAssign', op: aug[0], target: expr, value }; }
        if (this.at('OP', '++') || this.at('OP', '--')) { const op = this.next().value; this.semi(); return { type: 'AugAssign', op: op[0], target: expr, value: { type: 'Num', value: '1' } }; }
        this.semi();
        // splice statements become Del / insert at build time (see normalizeCall)
        return { type: 'Expr', value: expr };
    }

    // ---- expressions (Pratt) ----
    parseExpr () { return this.parseTernary(); }
    parseTernary () {
        const c = this.parseOr();
        if (this.at('OP', '?')) { this.next(); const a = this.parseExpr(); this.eat('OP', ':'); const b = this.parseExpr(); return { type: 'Ternary', test: c, then: a, other: b }; }
        return c;
    }
    parseOr () { let l = this.parseAnd(); while (this.at('OP', '||')) { this.next(); l = { type: 'Bool', op: 'or', left: l, right: this.parseAnd() }; } return l; }
    parseAnd () { let l = this.parseEquality(); while (this.at('OP', '&&')) { this.next(); l = { type: 'Bool', op: 'and', left: l, right: this.parseEquality() }; } return l; }
    parseEquality () {
        let l = this.parseRel();
        for (;;) {
            if (this.at('OP', '===') || this.at('OP', '==')) { this.next(); l = { type: 'Compare', op: '==', left: l, right: this.parseRel() }; }
            else if (this.at('OP', '!==') || this.at('OP', '!=')) { this.next(); l = { type: 'Compare', op: '!=', left: l, right: this.parseRel() }; }
            else break;
        }
        return l;
    }
    parseRel () {
        let l = this.parseAdd();
        for (;;) {
            let op = null;
            if (this.at('OP', '<=')) op = '<='; else if (this.at('OP', '>=')) op = '>='; else if (this.at('OP', '<')) op = '<'; else if (this.at('OP', '>')) op = '>';
            if (!op) break;
            this.next();
            l = { type: 'Compare', op, left: l, right: this.parseAdd() };
        }
        return l;
    }
    parseAdd () { let l = this.parseMul(); while (this.at('OP', '+') || this.at('OP', '-')) { const op = this.next().value; l = { type: 'BinOp', op, left: l, right: this.parseMul() }; } return l; }
    parseMul () { let l = this.parseUnary(); while (this.at('OP', '*') || this.at('OP', '/') || this.at('OP', '%')) { const op = this.next().value; l = { type: 'BinOp', op, left: l, right: this.parseUnary() }; } return l; }
    parseUnary () {
        if (this.at('OP', '!')) { this.next(); return { type: 'Not', operand: this.parseUnary() }; }
        if (this.at('OP', '-') || this.at('OP', '+')) { const op = this.next().value; return { type: 'Unary', op, operand: this.parseUnary() }; }
        if (this.at('typeof')) { this.next(); this.parseUnary(); return { type: 'Str', value: 'number' }; }
        return this.parsePower();
    }
    parsePower () { let l = this.parseAtom(); if (this.at('OP', '**')) { this.next(); l = { type: 'BinOp', op: '**', left: l, right: this.parseUnary() }; } return l; }

    parseAtom () {
        let node = this.parsePrimary();
        for (;;) {
            if (this.at('OP', '(')) {
                this.next();
                const args = [];
                while (!this.at('OP', ')')) { args.push(this.parseExpr()); if (this.at('OP', ',')) this.next(); }
                this.eat('OP', ')');
                node = this.normalizeCall(node, args);
            } else if (this.at('OP', '[')) {
                this.next(); const index = this.parseExpr(); this.eat('OP', ']');
                node = { type: 'Subscript', value: node, index };
            } else if (this.at('OP', '.')) {
                this.next(); const attr = this.eat('NAME').value;
                node = { type: 'Attribute', value: node, attr };
            } else break;
        }
        return node;
    }

    // Map JS callables to the translator's Python-flavoured nodes.
    normalizeCall (callee, args) {
        if (callee.type === 'Attribute') {
            const obj = callee.value, attr = callee.attr;
            if (attr === 'includes') return { type: 'Compare', op: 'in', left: args[0], right: obj };       // contains
            if (obj.type === 'Name' && obj.id === 'console' && attr === 'log') return { type: 'Call', func: { type: 'Name', id: 'print' }, args };
            if (obj.type === 'Name' && obj.id === 'Math') return this.mathCall(attr, args);
            if (attr === 'push') return { type: 'Call', func: { type: 'Attribute', value: obj, attr: 'append' }, args };
            // .splice / .toLowerCase etc stay as Attribute calls; splice handled in the translator
            return { type: 'Call', func: callee, args };
        }
        if (callee.type === 'Name') {
            const id = callee.id;
            if (id === 'String') return { type: 'Call', func: { type: 'Name', id: 'str' }, args };
            if (id === 'Number' || id === 'parseFloat') return { type: 'Call', func: { type: 'Name', id: 'float' }, args };
            if (id === 'parseInt') return { type: 'Call', func: { type: 'Name', id: 'int' }, args };
            if (id === 'prompt') return { type: 'Call', func: { type: 'Name', id: 'input' }, args };
        }
        return { type: 'Call', func: callee, args };
    }
    mathCall (attr, args) {
        if (attr === 'abs') return { type: 'Call', func: { type: 'Name', id: 'abs' }, args };
        if (attr === 'round') return { type: 'Call', func: { type: 'Name', id: 'round' }, args };
        // floor/ceil/sqrt/sin/cos/tan/log/log10/exp -> math.<attr> Attribute node
        return { type: 'Call', func: { type: 'Attribute', value: { type: 'Name', id: 'math' }, attr }, args };
    }

    parsePrimary () {
        const t = this.peek();
        if (t.type === 'NUMBER') { this.next(); return { type: 'Num', value: t.value }; }
        if (t.type === 'STRING') { this.next(); return { type: 'Str', value: t.value }; }
        if (t.type === 'true') { this.next(); return { type: 'Const', value: true }; }
        if (t.type === 'false') { this.next(); return { type: 'Const', value: false }; }
        if (t.type === 'null' || t.type === 'undefined') { this.next(); return { type: 'Const', value: null }; }
        if (t.type === 'NAME') { this.next(); return { type: 'Name', id: t.value }; }
        if (this.at('OP', '(')) { this.next(); const e = this.parseExpr(); this.eat('OP', ')'); return e; }
        if (this.at('OP', '[')) {
            this.next(); const elts = [];
            while (!this.at('OP', ']')) { elts.push(this.parseExpr()); if (this.at('OP', ',')) this.next(); }
            this.eat('OP', ']');
            return { type: 'List', elts };
        }
        this.err(`unexpected ${t.type} ${t.value || ''}`);
        return null;
    }
}

// Flatten BlockStmt (from `let a=0,b=0;` and bare `{}`) into their parent statement list
// so the shared Translator, which doesn't know BlockStmt, sees a flat body.
function flatten (stmts) {
    const out = [];
    for (const s of stmts) {
        if (!s) continue;
        if (s.type === 'BlockStmt') { out.push(...flatten(s.body)); continue; }
        for (const k of ['body', 'orelse']) if (Array.isArray(s[k])) s[k] = flatten(s[k]);
        out.push(s);
    }
    return out;
}

export default function javascriptToPseudocode (source) {
    if (!source || !source.trim()) throw new Error('JavaScript source is empty');
    const tokens = new JsTokenizer(source).tokenize();
    const ast = new JsParser(tokens).parseProgram();
    ast.body = flatten(ast.body);
    const t = new Translator();
    const pseudocode = t.program(ast);
    return { pseudocode, warnings: t.warnings };
}
