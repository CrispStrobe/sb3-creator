// C (the STC12 / 8051 subset) -> Brickwright pseudocode.
//
// The fourth front end, alongside pythonToPseudocode.js and javascriptToPseudocode.js, and
// the piece that makes C two-way. It reads two kinds of C:
//
//  1. **Our own output.** `generateC` emits an `@bw` marker header carrying everything the
//     flat C form cannot say for itself — the device (an `#include <stc12.h>` cannot tell a
//     stc12c5a60s2 from a stc15f2k60s2), the pin table, the original variable names before
//     `cName` mangled them, each custom block's proccode with its %s/%b positions, and where
//     one script ends and the next begins. With that header this is a bounded parser, not a
//     guessing game, and the round-trip is exact.
//
//  2. **Hand-written C**, like this project's own `src/01-blink/main.c`. No header, so the
//     facts are inferred: pins from `#define LED1 P1_0` / `sbit LED1 = P1^0;`, polarity from
//     the `#define LED_ON 0` idiom (an "on" that is 0 *is* active-low wiring), the clock from
//     `#define FOSC_HZ`, directions from how each pin is used. Everything inferred rather
//     than known is reported in `warnings` — this never guesses silently.
//
// Deliberately a subset. C that does not map onto Scratch blocks (pointers, structs, arrays,
// bit fiddling on whole ports) is dropped with a warning rather than mistranslated.

// ---- lexer -----------------------------------------------------------------------

const C_OPS = ['<<=', '>>=', '&&', '||', '==', '!=', '<=', '>=', '<<', '>>', '++', '--',
    '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '->',
    '+', '-', '*', '/', '%', '=', '<', '>', '!', '~', '&', '|', '^', '?', ':',
    '(', ')', '{', '}', '[', ']', ';', ',', '.'];

function tokenize (src) {
    const out = [];
    let i = 0;
    while (i < src.length) {
        const c = src[i];
        if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
        if (/[A-Za-z_]/.test(c)) {
            let j = i; while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
            out.push({ t: 'id', v: src.slice(i, j) }); i = j; continue;
        }
        if (/[0-9]/.test(c)) {
            let j = i;
            if (src[i] === '0' && /[xX]/.test(src[i + 1] || '')) { j = i + 2; while (j < src.length && /[0-9a-fA-F]/.test(src[j])) j++; }
            else { while (j < src.length && /[0-9.]/.test(src[j])) j++; }
            while (j < src.length && /[uUlL]/.test(src[j])) j++;   // integer suffixes
            out.push({ t: 'num', v: src.slice(i, j) }); i = j; continue;
        }
        if (c === '"' || c === "'") {
            let j = i + 1; while (j < src.length && src[j] !== c) { if (src[j] === '\\') j++; j++; }
            out.push({ t: 'str', v: src.slice(i, j + 1) }); i = j + 1; continue;
        }
        const op = C_OPS.find((o) => src.startsWith(o, i));
        if (op) { out.push({ t: 'op', v: op }); i += op.length; continue; }
        i++;   // anything else is not part of the subset; skip it
    }
    return out;
}

// ---- preprocessor-lite -----------------------------------------------------------
// Enough of one to read real firmware: object-like #defines (which is how this project's
// board.h names its pins and their polarity) and #include of supplied headers. Conditionals
// are not evaluated — both arms are read, which is right for the guard-only usage here and
// is reported when it could matter.

const DIRECTIVE = /^[ \t]*#[ \t]*(\w+)[ \t]*(.*)$/;

function preprocess (source, headers, warn, seen = new Set()) {
    const defines = new Map();
    const includes = [];
    const body = [];
    for (const raw of source.replace(/\\\r?\n/g, ' ').split('\n')) {
        const d = raw.match(DIRECTIVE);
        if (!d) { body.push(raw); continue; }
        const [, name, rest] = d;
        if (name === 'define') {
            const m = rest.match(/^(\w+)\s*(\(([^)]*)\))?\s*(.*)$/);
            if (m && !m[2]) defines.set(m[1], (m[4] || '').trim());
            continue;
        }
        if (name === 'include') {
            const m = rest.match(/[<"]([^>"]+)[>"]/);
            if (m) includes.push({ name: m[1], system: rest.trim().startsWith('<') });
            continue;
        }
        if (name === 'ifndef' || name === 'ifdef' || name === 'if' || name === 'else'
            || name === 'elif' || name === 'endif') continue;
        body.push('');
    }
    // Pull in any header we were handed, so `#define LED1 P1_0` in board.h is visible here.
    for (const inc of includes) {
        const key = Object.keys(headers).find((k) => k.replace(/\\/g, '/').split('/').pop().toLowerCase()
            === inc.name.replace(/\\/g, '/').split('/').pop().toLowerCase());
        if (key === undefined) continue;
        if (seen.has(key)) continue;
        seen.add(key);
        const sub = preprocess(headers[key], headers, warn, seen);
        for (const [k, v] of sub.defines) if (!defines.has(k)) defines.set(k, v);
        includes.push(...sub.includes);   // <stc12.h> is usually reached via board.h
        body.unshift(...sub.body);
    }
    return { defines, includes, body };
}

// Resolve a #define chain to a literal (LED_ON -> 0, LED1 -> P1_0), with a depth cap so a
// self-referential macro cannot spin.
function expand (name, defines, depth = 0) {
    if (depth > 8 || !defines.has(name)) return name;
    const v = defines.get(name).trim();
    return /^[A-Za-z_]\w*$/.test(v) ? expand(v, defines, depth + 1) : v;
}

// ---- the @bw marker header -------------------------------------------------------

function readMarkers (source) {
    const block = source.match(/@bw-begin([\s\S]*?)@bw-end/);
    if (!block) return null;
    const h = { device: null, clock: null, pins: [], vars: new Map(), procs: new Map(), scripts: new Map() };
    const str = (s) => { try { return JSON.parse(s); } catch { return s; } };
    for (const line of block[1].split('\n')) {
        const m = line.match(/@bw\s+(.*?)\s*$/);
        if (!m) continue;
        const a = m[1].match(/^(\w+)\s*(.*)$/);
        if (!a) continue;
        const [, kind, rest] = a;
        if (kind === 'device') h.device = rest.trim();
        else if (kind === 'clock') h.clock = Number(rest.trim());
        else if (kind === 'pin') {
            const p = rest.match(/^(\w+)\s+P(\d)\.(\d)\s+(\w+)(\s+active-low)?/);
            if (p) h.pins.push({ name: p[1], port: +p[2], bit: +p[3], direction: p[4], activeLow: !!p[5] });
        } else if (kind === 'var') {
            const v = rest.match(/^(\w+)\s+("(?:[^"\\]|\\.)*")(?:\s+sprite\s+("(?:[^"\\]|\\.)*"))?/);
            if (v) h.vars.set(v[1], { name: str(v[2]), sprite: v[3] ? str(v[3]) : null });
        } else if (kind === 'proc') {
            const p = rest.match(/^(\w+)\s+("(?:[^"\\]|\\.)*")\s+warp=(\d)/);
            if (p) h.procs.set(p[1], { proccode: str(p[2]), warp: p[3] === '1' });
        } else if (kind === 'script') {
            const s = rest.match(/^(\w+)\s+(\d+)\s+(stage|sprite\s+("(?:[^"\\]|\\.)*"))/);
            if (s) h.scripts.set(s[1], { index: +s[2], sprite: s[4] ? str(s[4]) : null });
        }
    }
    return h;
}

// ---- token cursor + expressions --------------------------------------------------

class Cursor {
    constructor (tokens) { this.k = tokens; this.i = 0; }
    peek (n = 0) { return this.k[this.i + n] || { t: 'eof', v: '' }; }
    next () { return this.k[this.i++] || { t: 'eof', v: '' }; }
    is (v, n = 0) { return this.peek(n).v === v; }
    eat (v) { if (this.is(v)) { this.i++; return true; } return false; }
    expect (v) { if (!this.eat(v)) throw new Error(`expected '${v}' near '${this.peek().v}'`); }
    /** Skip a balanced pair, cursor sitting on the opener. */
    skip (open, close) {
        let d = 0;
        do {
            const t = this.next();
            if (t.t === 'eof') return;
            if (t.v === open) d++; else if (t.v === close) d--;
        } while (d > 0);
    }
}

// C precedence -> pseudocode. Pseudocode's own levels are or < and < compare < +- < */%,
// so parenthesise only where the pseudocode grammar would otherwise re-associate.
// Bitwise and shift operators have no pseudocode equivalent; they are parsed only so that
// register setup does not throw, and any statement containing one is dropped with a warning.
const BIN = [
    [['||'], 'or', 0], [['&&'], 'and', 1],
    [['|'], null, 2], [['^'], null, 3], [['&'], null, 4],
    [['==', '!=', '<', '>', '<=', '>='], null, 5],
    [['<<', '>>'], null, 6],
    [['+', '-'], null, 7], [['*', '/', '%'], null, 8]
];
const TO_PSEUDO = { '==': '=', '!=': '!=', '<': '<', '>': '>', '<=': '<=', '>=': '>=', '%': 'mod' };

class ExprParser {
    constructor (cur, ctx) { this.c = cur; this.ctx = ctx; }

    parse (level = 0) {
        if (level >= BIN.length) return this.unary();
        const [ops, word] = BIN[level];
        let left = this.parse(level + 1);
        for (;;) {
            const v = this.c.peek().v;
            if (!ops.includes(v)) return left;
            this.c.next();
            const right = this.parse(level + 1);
            const op = word || TO_PSEUDO[v] || v;
            const bitwise = left.bitwise || right.bitwise || ['|', '^', '&', '<<', '>>'].includes(v);
            left = { text: `${wrap(left, level)} ${op} ${wrap(right, level + 1)}`, level, bitwise };
        }
    }

    unary () {
        if (this.c.eat('!')) { const x = this.unary(); return { text: `not ${wrap(x, 99)}`, level: 99 }; }
        if (this.c.eat('~')) { const x = this.unary(); return { text: x.text, level: 99, bitwise: true }; }
        if (this.c.eat('-')) { const x = this.unary(); return { text: `-${wrap(x, 99)}`, level: 99 }; }
        if (this.c.eat('+')) return this.unary();
        return this.atom();
    }

    atom () {
        const t = this.c.next();
        if (t.v === '(') {
            // A cast — `(unsigned int)(x)` / `(int)(y)` — is noise here; step over it.
            if (t.t === 'op' && this.isCast()) { this.c.skip('(', ')'); this.c.i--; this.c.next(); return this.unary(); }
            const inner = this.parse(0);
            this.c.expect(')');
            return inner;
        }
        if (t.t === 'num') {
            const n = Number(String(t.v).replace(/[uUlL]+$/, ''));
            return { text: Number.isFinite(n) ? String(n) : '0', level: 99 };
        }
        if (t.t === 'id') {
            if (this.c.is('(')) return this.call(t.v);
            return { text: this.ctx.readName(t.v), level: 99 };
        }
        return { text: '0', level: 9 };
    }

    isCast () {
        // cursor is just past '('; a cast is a type keyword run then ')'
        let n = 0;
        const types = new Set(['unsigned', 'signed', 'int', 'char', 'long', 'short', 'void', 'float', 'double']);
        while (this.c.peek(n).t === 'id' && types.has(this.c.peek(n).v)) n++;
        return n > 0 && this.c.peek(n).v === ')';
    }

    call (name) {
        this.c.expect('(');
        const args = [];
        if (!this.c.is(')')) {
            for (;;) { args.push(this.parse(0)); if (!this.c.eat(',')) break; }
        }
        this.c.expect(')');
        return this.ctx.readCall(name, args);
    }
}

function wrap (node, parentLevel) {
    return node.level < parentLevel ? `(${node.text})` : node.text;
}

// ---- the translator --------------------------------------------------------------

export default function cToPseudocode (source, opts = {}) {
    const warnings = [];
    const warn = (m) => { if (!warnings.includes(m)) warnings.push(m); };
    const markers = readMarkers(source);

    const stripped = source
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/\/\/[^\n]*/g, ' ');
    const pre = preprocess(stripped, opts.headers || {}, warn);

    // ---- device + clock ----
    let device = markers && markers.device;
    if (!device) {
        const inc = pre.includes.find((i) => /^(stc12|8052|8051)\.h$/i.test(i.name.split('/').pop()));
        const head = inc ? inc.name.split('/').pop().toLowerCase() : null;
        device = head === '8052.h' || head === '8051.h' ? 'stc89c52rc' : 'stc12c5a60s2';
        if (head === 'stc12.h') warn(`<stc12.h> serves several parts — assuming DEVICE ${device.toUpperCase()}; set it explicitly if that is wrong`);
        else if (head) warn(`inferred DEVICE ${device.toUpperCase()} from <${head}>`);
        else warn(`no register header found — assuming DEVICE ${device.toUpperCase()}`);
    }
    let clock = markers && markers.clock;
    if (!clock) {
        for (const key of ['FOSC_HZ', 'FOSC', 'F_CPU', 'SYSCLK']) {
            if (pre.defines.has(key)) {
                const n = Number(String(pre.defines.get(key)).replace(/[uUlL]+$/, ''));
                if (Number.isFinite(n) && n > 0) { clock = n; break; }
            }
        }
        if (clock) warn(`inferred CLOCK ${clock} from a #define`);
        else { clock = 11059200; warn('no clock #define found — assuming CLOCK 11059200'); }
    }

    // ---- pins ----
    // From the marker header when we have it; otherwise from `#define NAME P1_0`,
    // `sbit NAME = P1^0;`, and the `#define NAME_ON 0` polarity idiom.
    const pins = new Map();       // c-expression (P1_0) -> {name, port, bit, direction, activeLow}
    const byName = new Map();     // source spelling (LED1) -> the same record
    const addPin = (rec, aliases) => {
        pins.set(`P${rec.port}_${rec.bit}`, rec);
        for (const a of aliases) byName.set(a, rec);
    };
    if (markers) {
        for (const p of markers.pins) addPin({ ...p }, [p.name, `P${p.port}_${p.bit}`]);
    } else {
        const seen = new Map();
        for (const [k, v] of pre.defines) {
            const m = String(v).match(/^P([0-4])_([0-7])$/);
            if (m) seen.set(k, { port: +m[1], bit: +m[2] });
        }
        for (const line of pre.body) {
            const m = line.match(/\bsbit\s+(\w+)\s*=\s*P([0-4])\s*\^\s*([0-7])/);
            if (m) seen.set(m[1], { port: +m[2], bit: +m[3] });
        }
        const text = pre.body.join('\n');
        for (const [alias, where] of seen) {
            // Polarity: an `_ON` companion that is 0 means the pin is wired active-low.
            // Two idioms carry polarity. A per-pin companion (`#define LED1_ON 0`), or the
            // shared-constant form this project's own board.h uses:
            //     #define LED_ON 0        LED1 = LED_ON;
            // An "on" that writes 0 IS active-low wiring, so the C says so without saying so.
            let on = ['_ON', '_ACTIVE', '_LIT'].map((sfx) => pre.defines.get(alias + sfx))
                .find((x) => x !== undefined);
            let via = on !== undefined ? `${alias}_ON is ${on}` : null;
            if (on === undefined) {
                // Scan EVERY write, not just the first: a board_init() that parks the LED
                // with `LED1 = LED_OFF;` usually comes before any `= LED_ON`, and taking the
                // first match reads the polarity exactly backwards.
                // Either constant settles it, and a pin is often only ever written one of
                // them: `X = SOMETHING_ON` that is 0 means active-low, and so does
                // `X = SOMETHING_OFF` that is 1. Prefer the ON evidence when both appear.
                let off = null, offVia = null;
                for (const w of text.matchAll(new RegExp(`\\b${alias}\\s*=\\s*(\\w+)\\s*;`, 'g'))) {
                    const val = expand(w[1], pre.defines);
                    if (!/^-?\d+$/.test(val)) continue;
                    if (/_(ON|ACTIVE|LIT)$/i.test(w[1])) { on = val; via = w[1]; break; }
                    if (/_(OFF|INACTIVE|DARK|CLEAR)$/i.test(w[1]) && off === null) { off = val; offVia = w[1]; }
                }
                if (on === undefined && off !== null) { on = String(Number(off) === 0 ? 1 : 0); via = `${offVia} is ${off}`; }
                else if (via && on !== undefined) via = `${via} is ${on}`;
            }
            const activeLow = on !== undefined && Number(on) === 0;
            if (on === undefined) warn(`polarity of "${alias}" is unknown — assuming active high`);
            else if (activeLow) warn(`"${alias}" read as ACTIVE LOW because ${via}`);
            // Direction: written -> output; only read -> input.
            const written = new RegExp(`\\b${alias}\\s*=[^=]`).test(text);
            addPin({ name: alias.toLowerCase(), port: where.port, bit: where.bit, activeLow,
                direction: written ? 'output' : 'input' }, [alias, `P${where.port}_${where.bit}`]);
        }
        if (!seen.size) warn('no pins found — declare them with #define NAME P1_0 or sbit NAME = P1^0');
    }

    // ---- naming ----
    const varName = (c) => (markers && markers.vars.has(c) ? markers.vars.get(c).name : c);
    const usedVars = new Set();

    const ctx = {
        readName (id) {
            const lit = expand(id, pre.defines);
            if (/^-?\d+$/.test(lit)) return lit;
            if (/^0x[0-9a-f]+$/i.test(lit)) return String(parseInt(lit, 16));
            const pin = byName.get(id) || pins.get(lit);
            if (pin) return `read ${pin.name}`;
            const n = varName(id);
            usedVars.add(n);
            return n;
        },
        readCall (name, args) {
            if (name === 'adc_read' && args.length === 1) {
                const ch = Number(args[0].text);
                for (const p of pins.values()) if (p.direction === 'analog' && p.bit === ch) return { text: `read ${p.name}`, level: 99 };
                return { text: `read P1.${args[0].text}`, level: 99 };
            }
            if (name === 'bw_now') return { text: '0', level: 99 };
            warn(`no pseudocode for the call "${name}(…)" — emitted as 0`);
            return { text: '0', level: 99 };
        }
    };

    // ---- statements ----
    // Special-function registers and generated helpers: setup, never program logic.
    const SFRS = /^(P[0-5]|P[0-5]M[01]|P[0-5]_[0-7]|P1ASF|P4SW|AUXR1?|TMOD|TCON|T[HL][01]|TR[01]|TF[01]|IE|IP|EA|ET[01]|EX[01]|SCON|SBUF|S2CON|S2BUF|BRT|PCON|PSW|CLK_DIV|ADC_CONTR|ADC_RES|ADC_RESL|CCON|CMOD|CCAPM[01]|C[LH]|CCAP[01]H|PCA_PWM[01]|WDT_CONTR|bw_ms|bw_task\d+_(state|until)|bw_i\d+)$/;
    const DELAYS = new Set(['delay_ms', 'bw_block_ms', 'Delay_ms', 'delayms', 'delay']);
    const SETUP = new Set(['board_init', 'delay_init', 'adc_init', 'uart_init', 'init', 'bw_setup']);

    // Parse a `{ … }` block into pseudocode lines at `depth`.
    function block (cur, depth) {
        const pad = '  '.repeat(depth);
        const lines = [];
        cur.expect('{');
        while (!cur.is('}') && cur.peek().t !== 'eof') lines.push(...statement(cur, depth));
        cur.expect('}');
        return lines.length ? lines : [`${pad}stop`];
    }

    function bodyOf (cur, depth) {
        return cur.is('{') ? block(cur, depth) : statement(cur, depth);
    }

    function expr (cur) { return new ExprParser(cur, ctx).parse(0); }

    function statement (cur, depth) {
        const pad = '  '.repeat(depth);
        const t = cur.peek();

        if (cur.eat(';')) return [];
        if (cur.is('{')) return block(cur, depth);

        // A local declaration (`unsigned char i;`) carries no meaning here.
        if (t.t === 'id' && ['unsigned', 'signed', 'int', 'char', 'long', 'short', 'static', 'volatile', 'const', 'float', 'double'].includes(t.v)) {
            while (!cur.is(';') && cur.peek().t !== 'eof') {
                if (cur.is('{')) cur.skip('{', '}'); else cur.next();
            }
            cur.eat(';');
            return [];
        }

        if (t.v === 'for') {
            cur.next(); cur.expect('(');
            // `for (;;)` is FOREVER; `for (i = 0; i < N; i++)` is REPEAT N.
            if (cur.is(';') && cur.is(';', 1) && cur.is(')', 2)) {
                cur.next(); cur.next(); cur.expect(')');
                const inner = bodyOf(cur, depth + 1);
                return [`${pad}FOREVER:`, ...inner];
            }
            const start = cur.i;
            cur.i = start;
            let count = null;
            const init = [];
            while (!cur.is(';') && cur.peek().t !== 'eof') init.push(cur.next().v);
            cur.eat(';');
            const cond = [];
            while (!cur.is(';') && cur.peek().t !== 'eof') cond.push(cur.next().v);
            cur.eat(';');
            while (!cur.is(')') && cur.peek().t !== 'eof') cur.next();
            cur.expect(')');
            const cm = cond.join(' ').match(/^(\w+)\s*<\s*(.+)$/);
            if (cm && init.join(' ').replace(/\s+/g, '').startsWith(`${cm[1]}=0`)) {
                count = cm[2].replace(/\s*\)\s*$/, '').replace(/^\(\s*/, '').trim();
            }
            const inner = bodyOf(cur, depth + 1);
            if (count === null) {
                warn('a `for` loop that is not `for(;;)` or a simple counter became REPEAT UNTIL false');
                return [`${pad}REPEAT UNTIL 1 = 1:`, ...inner];
            }
            return [`${pad}REPEAT ${count}:`, ...inner];
        }

        if (t.v === 'while') {
            cur.next(); cur.expect('(');
            const c = expr(cur);
            cur.expect(')');
            if (cur.eat(';')) return [`${pad}wait until ${negate(c.text)}`];
            const inner = bodyOf(cur, depth + 1);
            return [`${pad}REPEAT UNTIL ${negate(c.text)}:`, ...inner];
        }

        if (t.v === 'if') {
            cur.next(); cur.expect('(');
            const c = expr(cur);
            cur.expect(')');
            const then = bodyOf(cur, depth + 1);
            const out = [`${pad}IF ${c.text} THEN:`, ...then];
            if (cur.peek().v === 'else') {
                cur.next();
                out.push(`${pad}ELSE:`, ...bodyOf(cur, depth + 1));
            }
            return out;
        }

        if (t.v === 'do' || t.v === 'switch' || t.v === 'goto') {
            warn(`\`${t.v}\` has no pseudocode equivalent — skipped`);
            cur.next();
            if (cur.is('(')) cur.skip('(', ')');
            if (cur.is('{')) cur.skip('{', '}');
            while (!cur.is(';') && !cur.is('}') && cur.peek().t !== 'eof') cur.next();
            cur.eat(';');
            return [];
        }

        if (t.v === 'return') { cur.next(); while (!cur.is(';') && cur.peek().t !== 'eof') cur.next(); cur.eat(';'); return [`${pad}stop this script`]; }
        if (t.v === 'break' || t.v === 'continue') { cur.next(); cur.eat(';'); warn(`\`${t.v}\` has no pseudocode equivalent — skipped`); return []; }

        // assignment / call / expression statement
        const start = cur.i;
        if (t.t === 'id') {
            const name = cur.next().v;
            // `X = expr;`  /  `X += expr;`
            if (cur.is('&=') || cur.is('|=') || cur.is('^=') || cur.is('<<=') || cur.is('>>=')) {
                cur.next(); while (!cur.is(';') && cur.peek().t !== 'eof') cur.next(); cur.eat(';');
                if (!SFRS.test(name)) warn(`"${name}" is modified bitwise, which pseudocode cannot express — skipped`);
                return [];
            }
            if (cur.is('=') || cur.is('+=') || cur.is('-=')) {
                const op = cur.next().v;
                const rhs = expr(cur);
                cur.eat(';');
                // A declared pin IS an SFR bit, so check it BEFORE the register filter,
                // or every `P1_0 = 0;` is mistaken for setup and the program disappears.
                const pin = byName.get(name) || pins.get(expand(name, pre.defines));
                if (!pin && SFRS.test(name)) return [];       // register setup, not program logic
                if (rhs.bitwise) { warn(`"${name} ${op} <bitwise>" has no pseudocode equivalent — skipped`); return []; }
                if (pin) {
                    if (op !== '=') { warn(`"${name} ${op}" on a pin is not expressible — skipped`); return []; }
                    if (rhs.text === `not read ${pin.name}` || rhs.text === `read ${pin.name}`) return [`${pad}toggle ${pin.name}`];
                    return [`${pad}${pinWrite(pin, rhs.text)}`];
                }
                const v = varName(name); usedVars.add(v);
                if (op === '=') return [`${pad}set ${v} to ${rhs.text}`];
                return [`${pad}change ${v} by ${op === '-=' ? negNum(rhs.text) : rhs.text}`];
            }
            if (cur.is('++') || cur.is('--')) {
                const op = cur.next().v; cur.eat(';');
                const v = varName(name); usedVars.add(v);
                return [`${pad}change ${v} by ${op === '++' ? 1 : -1}`];
            }
            if (cur.is('(')) {
                cur.i = start;
                const call = expr(cur);
                cur.eat(';');
                const m = String(call.raw || '').length ? null : null;   // (call already folded)
                void m;
                if (call.stmt) return [`${pad}${call.stmt}`];
                return [];
            }
        }
        cur.i = start;
        while (!cur.is(';') && !cur.is('}') && cur.peek().t !== 'eof') { if (cur.is('{')) cur.skip('{', '}'); else cur.next(); }
        cur.eat(';');
        return [];
    }

    // A call in statement position: delays become `wait`, known procedures become calls.
    const origReadCall = ctx.readCall;
    ctx.readCall = (name, args) => {
        if (DELAYS.has(name)) {
            const ms = Number(args[0] ? args[0].text : 0);
            const secs = Number.isFinite(ms) ? +(ms / 1000).toFixed(6) : null;
            return { text: '0', level: 99, stmt: secs === null ? `wait ${args[0].text} ms` : `wait ${secs} seconds` };
        }
        if (SETUP.has(name)) return { text: '0', level: 99, stmt: null };
        if (markers && markers.procs.has(name)) {
            const { proccode } = markers.procs.get(name);
            let i = 0;
            const label = proccode.replace(/%[sb]/g, () => (args[i] ? args[i++].text : '0'));
            return { text: '0', level: 99, stmt: label };
        }
        return origReadCall(name, args);
    };

    function pinWrite (pin, valueText) {
        const n = Number(valueText);
        if (!Number.isFinite(n)) {
            warn(`"${pin.name}" is assigned a computed value; pseudocode can only set a level`);
            return `toggle ${pin.name}`;
        }
        const high = n !== 0;
        const on = pin.activeLow ? !high : high;
        return `turn ${on ? 'on' : 'off'} ${pin.name}`;
    }

    const negate = (text) => (text.startsWith('not ') ? text.slice(4) : `not (${text})`);
    const negNum = (text) => (/^-?\d+$/.test(text) ? String(-Number(text)) : `0 - (${text})`);

    // ---- top level: find the functions ----
    const tokens = tokenize(pre.body.join('\n'));
    const cur = new Cursor(tokens);
    const funcs = [];
    while (cur.peek().t !== 'eof') {
        const start = cur.i;
        // scan a declarator: <type words> name ( params ) {   |   ... ;
        let name = null;
        while (cur.peek().t !== 'eof' && !cur.is('{') && !cur.is(';')) {
            if (cur.peek().t === 'id' && cur.is('(', 1)) name = cur.peek().v;
            if (cur.is('(')) { cur.skip('(', ')'); continue; }
            cur.next();
        }
        if (cur.is('{') && name) {
            const bodyStart = cur.i;
            cur.skip('{', '}');
            funcs.push({ name, from: bodyStart, to: cur.i });
        } else { cur.eat(';'); if (cur.i === start) cur.next(); }
    }

    const linesFor = (f, depth) => {
        const sub = new Cursor(tokens.slice(f.from, f.to));
        try { return block(sub, depth); } catch (e) { warn(`could not parse ${f.name}(): ${e.message}`); return []; }
    };

    // ---- assemble ----
    const out = [`DEVICE ${device.toUpperCase()}`, `CLOCK ${clock}`];
    const pinList = [...new Set(pins.values())];
    if (pinList.length) {
        out.push('');
        for (const p of pinList) {
            out.push(`PIN ${p.name} = P${p.port}.${p.bit} ${p.direction.toUpperCase()}${p.activeLow ? ' ACTIVE LOW' : ''}`);
        }
    }

    const IGNORE_FNS = new Set(['bw_setup', 'bw_tick', 'bw_now', 'bw_block_ms', 'delay_ms', 'adc_read',
        'board_init', 'delay_init']);
    const procFns = funcs.filter((f) => markers && markers.procs.has(f.name));
    const scriptFns = funcs.filter((f) => !IGNORE_FNS.has(f.name)
        && (markers ? markers.scripts.has(f.name) : f.name === 'main'));
    if (!scriptFns.length) {
        const main = funcs.find((f) => f.name === 'main');
        if (main) scriptFns.push(main);
        else warn('no main() and no @bw script markers — nothing to translate');
    }

    for (const f of procFns) {
        const { proccode } = markers.procs.get(f.name);
        let n = 0;
        const sig = proccode.replace(/%[sb]/g, (tok) => `${tok === '%b' ? '<' : '('}arg${++n}${tok === '%b' ? '>' : ')'}`);
        out.push('', `DEFINE ${sig}:`, ...linesFor(f, 1));
    }

    const isTask = markers && [...markers.scripts.keys()].some((k) => k.startsWith('bw_task'));
    if (isTask) {
        warn('this C uses the cooperative-scheduler form; its scripts are state machines and '
            + 'are not inverted here — re-generate from blocks for an exact round-trip');
    }
    for (const f of scriptFns) {
        out.push('', 'WHEN flag clicked:');
        const body = linesFor(f, 1).filter((l) => l.trim() !== 'stop');
        out.push(...(body.length ? body : ['  stop']));
    }

    return { pseudocode: out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n', warnings };
}
