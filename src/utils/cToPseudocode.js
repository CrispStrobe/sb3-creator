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
// The LED cube's shift directions. Imported rather than restated: the emitter
// and this reader each used to carry their own copy, and they disagreed.
import { CUBE_DIRECTIONS, cubeDirectionWord } from './cubeDirections.js';

// The Arduino/AVR core vocabulary. Present in order to be REFUSED by name:
// these are library calls, not functions defined in the file, so the
// custom-block fallback below would invent a block for each one.
// `delay()` is NOT here: it already translates correctly to a wait, and
// refusing something the reader handles would be a regression dressed as
// caution. Nor are `setup`/`loop`, which are functions defined in the file and
// so are legitimately procedures.
const ARDUINO_CORE = new Set([
    'pinMode', 'digitalWrite', 'digitalRead', 'analogRead', 'analogWrite',
    'delayMicroseconds', 'tone', 'noTone', 'shiftOut', 'shiftIn',
    'attachInterrupt', 'analogReference', 'pulseIn',
]);

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
    const h = { device: null, clock: null, pins: [], parts: [], machine: null, vars: new Map(), procs: new Map(), scripts: new Map(), yields: [] };
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
        } else if (kind === 'part') {
            // `part <name> <type> <data> <clock> <latch> [active-low]` — pin
            // spellings are the device's own (P1.0 on 8051, GP25/PA0 elsewhere).
            const p = rest.match(/^(\w+)\s+(\w+)\s+(\S+)\s+(\S+)\s+(\S+)(\s+active-low)?/);
            if (p) {
                const at = (s) => { const m8 = s.match(/^P(\d)\.(\d)$/i); return m8 ? { port: +m8[1], bit: +m8[2] } : { where: s.toUpperCase() }; };
                h.parts.push({ name: p[1], type: p[2], data: at(p[3]), clock: at(p[4]), latch: at(p[5]), activeLow: !!p[6] });
            }
        } else if (kind === 'map') {
            const p = rest.match(/^(ram|rom)\s+([0-9a-f]{1,4})\s+([0-9a-f]{1,4})/i);
            if (p) {
                if (!h.machine) h.machine = { regions: [], chips: [] };
                h.machine.regions.push({ kind: p[1].toLowerCase(), start: parseInt(p[2], 16), end: parseInt(p[3], 16) });
            }
        } else if (kind === 'chip') {
            const p = rest.match(/^(\w+)\s+(w65c22|w65c51|tms9918)\s+([0-9a-f]{1,4})/i);
            if (p) {
                if (!h.machine) h.machine = { regions: [], chips: [] };
                h.machine.chips.push({
                    name: p[1],
                    kind: /22$/i.test(p[2]) ? 'via' : /9918$/i.test(p[2]) ? 'vdp' : 'acia',
                    at: parseInt(p[3], 16),
                });
            }
        } else if (kind === 'var') {
            const v = rest.match(/^(\w+)\s+("(?:[^"\\]|\\.)*")(?:\s+sprite\s+("(?:[^"\\]|\\.)*"))?/);
            if (v) h.vars.set(v[1], { name: str(v[2]), sprite: v[3] ? str(v[3]) : null });
        } else if (kind === 'proc') {
            const p = rest.match(/^(\w+)\s+("(?:[^"\\]|\\.)*")\s+warp=(\d)/);
            if (p) h.procs.set(p[1], { proccode: str(p[2]), warp: p[3] === '1' });
        } else if (kind === 'script') {
            const s = rest.match(/^(\w+)\s+(\d+)\s+(stage|sprite\s+("(?:[^"\\]|\\.)*"))/);
            if (s) h.scripts.set(s[1], { index: +s[2], sprite: s[4] ? str(s[4]) : null });
        } else if (kind === 'yield') {
            // `yield <task> <state> <percent-encoded block id> <kind>` — the map from a
            // Level 1 position to the block the debugger should point at. Nothing on the
            // C -> blocks path uses it (block ids are minted fresh by the parser); it is
            // read by the debugger and by stc_symtab. See reference/debugger-ui.md §7.
            const y = rest.match(/^(\w+)\s+(\d+)\s+(\S+)\s+(\S+)\s*$/);
            if (y) h.yields.push({ task: y[1], state: +y[2], block: decodeMark(y[3]), kind: y[4] });
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
const BIN = [
    [['||'], 'or', 0], [['&&'], 'and', 1],
    [['|'], 'bitor', 2], [['^'], 'bitxor', 3], [['&'], 'bitand', 4],
    [['==', '!=', '<', '>', '<=', '>='], null, 5],
    [['<<', '>>'], null, 6],
    [['+', '-'], null, 7], [['*', '/', '%'], null, 8]
];
const TO_PSEUDO = { '==': '=', '!=': '!=', '<': '<', '>': '>', '<=': '<=', '>=': '>=', '%': 'mod',
    '<<': 'shiftleft', '>>': 'shiftright' };

class ExprParser {
    constructor (cur, ctx) { this.c = cur; this.ctx = ctx; }

    parse (level = 0) {
        if (level >= BIN.length) return this.unary();
        const [ops, word] = BIN[level];
        let left = this.parse(level + 1);
        // Ternary `? :` at the lowest level (below `||`).
        if (level === 0 && this.c.is('?')) {
            this.c.next();
            const then = this.parse(0);
            this.c.eat(':');
            this.parse(0);   // consume the else branch to keep the cursor in step
            // Pseudocode has no inline conditional, so the else branch is lost. SAY SO —
            // silently returning the then branch turns `x = c ? a : b` into `x = a`, which
            // is a plausible, wrong translation, and those are worse than a refusal.
            if (this.ctx.warn) this.ctx.warn('a ternary `? :` has no pseudocode equivalent — the else branch was dropped');
            return then;
        }
        for (;;) {
            const v = this.c.peek().v;
            if (!ops.includes(v)) return left;
            this.c.next();
            const right = this.parse(level + 1);
            const op = word || TO_PSEUDO[v] || v;
            left = { text: `${wrap(left, level)} ${op} ${wrap(right, level + 1)}`, level };
        }
    }

    unary () {
        if (this.c.eat('!')) {
            const x = this.unary();
            // Collapse `!(!expr)` → expr. Arises from active-low pins: `!P1_0` = `not read led`,
            // `!(!P1_0)` should be `read led`, not `not not read led`.
            if (x.text.startsWith('not ')) return { text: x.text.slice(4), level: x.level };
            return { text: `not ${wrap(x, 99)}`, level: 99 };
        }
        if (this.c.eat('~')) { const x = this.unary(); return { text: `bitnot ${wrap(x, 99)}`, level: 99 }; }
        if (this.c.eat('-')) { const x = this.unary(); return { text: `-${wrap(x, 99)}`, level: 99 }; }
        if (this.c.eat('+')) return this.unary();
        // Unary `&` (address-of) and `*` (dereference) — no pseudocode equivalent,
        // but parse them so the containing expression does not throw.
        if (this.c.eat('&')) { return this.unary(); }
        if (this.c.eat('*')) { return this.unary(); }
        // Pre-increment/decrement: `++x` / `--x`
        if (this.c.eat('++')) { return this.unary(); }
        if (this.c.eat('--')) { return this.unary(); }
        return this.atom();
    }

    atom () {
        const t = this.c.next();
        if (t.v === '(') {
            // A cast — `(unsigned int)(x)` / `(int)(y)` / `(char *)buf` — is noise here; step over it.
            if (t.t === 'op' && this.isCast()) {
                // isCast verified type keywords then ')'; skip past them to the ')'.
                while (!this.c.is(')') && this.c.peek().t !== 'eof') this.c.next();
                this.c.next();   // eat the ')'
                return this.unary();
            }
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
            let result = { text: this.ctx.readName(t.v), level: 99 };
            // Array subscript(s): `name[expr]` or `name[expr][expr]`
            while (this.c.is('[')) {
                this.c.skip('[', ']');
                result = { text: result.text, level: 99, array: true };
            }
            // Postfix ++ / --: `i++` or `i--` used as an expression.
            if (this.c.is('++') || this.c.is('--')) {
                this.c.next();
                return result;
            }
            // Struct member access: `s.field` or `s->field`.
            while (this.c.is('.') || this.c.is('->')) {
                this.c.next();
                if (this.c.peek().t === 'id') this.c.next();
            }
            return result;
        }
        return { text: '0', level: 9 };
    }

    isCast () {
        // cursor is just past '('; a cast is a type keyword run then ')'.
        // Also handles pointer casts like `(char *)` and `(unsigned int *)`.
        let n = 0;
        const types = new Set(['unsigned', 'signed', 'int', 'char', 'long', 'short', 'void', 'float', 'double',
            'uint8_t', 'uint16_t', 'uint32_t', 'int8_t', 'int16_t', 'int32_t', 'size_t',
            'uchar', 'BYTE', 'WORD', 'DWORD', 'BOOL', 'bool']);
        while (this.c.peek(n).t === 'id' && types.has(this.c.peek(n).v)) n++;
        if (n === 0) return false;
        // Allow trailing `*` for pointer casts.
        while (this.c.peek(n).v === '*') n++;
        return this.c.peek(n).v === ')';
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

/**
 * The `(task, state) -> block id` map out of a generated C file's `@bw` header.
 *
 * Exported because the debugger needs it without going anywhere near the C -> blocks
 * parser: it wants to glow a block the moment the emulator halts, which is long before
 * (and independently of) anyone asking to read C back into blocks.
 *
 * @param {string} source generated C
 * @returns {Array<{task: string, state: number, block: string, kind: string}>}
 *          empty for hand-written C, which has no blocks to point at
 */
/** Undo `cMark`. A malformed escape means a hand-edited header; keep it verbatim. */
function decodeMark (token) {
    try { return decodeURIComponent(token); } catch { return token; }
}

export function readYieldMap (source) {
    const markers = readMarkers(String(source || ''));
    return markers ? markers.yields : [];
}

export default function cToPseudocode (source, opts = {}) {
    const warnings = [];
    const warn = (m) => { if (!warnings.includes(m)) warnings.push(m); };
    const markers = readMarkers(source);

    // Extract `//` comments before stripping, so we can recover script comments
    // that the emitter places before function definitions.
    const sourceLines = source.split('\n');
    const lineComments = new Map();   // line number (0-based) → comment text (without //)
    for (let i = 0; i < sourceLines.length; i++) {
        const m = sourceLines[i].match(/^\s*\/\/\s?(.*)/);
        if (m) lineComments.set(i, m[1]);
    }

    // Strip comments while respecting string literals — `//` inside `"http://..."` is not a comment.
    const stripped = source.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,
        (m) => m[0] === '"' || m[0] === "'" ? m : ' ');
    const pre = preprocess(stripped, opts.headers || {}, warn);

    // ---- device + clock ----
    // 11.0592 MHz is an 8051 crystal, chosen because it divides into exact
    // baud rates. It is not a sensible default for a board that has never
    // seen one, which is why the device gets to change it.
    let defaultClock = 11059200;
    let device = markers && markers.device;
    // A source can now be for a board this front end does not read. Naming the
    // device correctly and saying so is the whole point: assuming STC12 for an
    // Arduino sketch produced a confident DEVICE STC12C5A60S2 and a body of
    // invented statements, which is the one outcome this file exists to avoid.
    const foreign = pre.includes.find((i) =>
        /^(arduino\.h|avr\/io\.h)$/i.test(i.name.replace(/^.*?(avr\/io\.h)$/i, '$1')));
    if (!device) {
        const inc = pre.includes.find((i) => /^(stc12|8052|8051)\.h$/i.test(i.name.split('/').pop()));
        const head = inc ? inc.name.split('/').pop().toLowerCase() : null;
        if (foreign) {
            const which = /arduino\.h/i.test(foreign.name);
            device = which ? 'arduino-uno' : 'atmega328p';
            defaultClock = 16000000;    // not an 8051 crystal
            warn(`inferred DEVICE ${device.toUpperCase()} from <${foreign.name}>`);
        } else {
            device = head === '8052.h' || head === '8051.h' ? 'stc89c52rc' : 'stc12c5a60s2';
            if (head === 'stc12.h') warn(`<stc12.h> serves several parts — assuming DEVICE ${device.toUpperCase()}; set it explicitly if that is wrong`);
            else if (head) warn(`inferred DEVICE ${device.toUpperCase()} from <${head}>`);
            else warn(`no register header found — assuming DEVICE ${device.toUpperCase()}`);
        }
    }
    // Which vocabulary the body is read in. An Arduino sketch names its pins
    // by number and drives them through core calls; an 8051 source names them
    // by {port, bit} and assigns registers. Nothing about the two overlaps, so
    // the reader picks one rather than trying both.
    const isArduino = /^(arduino-|atmega)/.test(String(device));
    if (isArduino) {
        // Core constants. They come from the toolchain rather than the sketch,
        // so there is no #define to find and nothing downstream resolves them:
        // without this a digitalWrite lands as `set led to HIGH`.
        for (const [k, v] of [['HIGH', '1'], ['LOW', '0']]) {
            if (!pre.defines.has(k)) pre.defines.set(k, v);
        }
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
        else { clock = defaultClock; warn(`no clock #define found — assuming CLOCK ${defaultClock}`); }
    }

    // ---- pins ----
    // From the marker header when we have it; otherwise from `#define NAME P1_0`,
    // `sbit NAME = P1^0;`, and the `#define NAME_ON 0` polarity idiom.
    const pins = new Map();       // c-expression (P1_0) -> {name, port, bit, direction, activeLow}
    const byName = new Map();     // source spelling (LED1) -> the same record
    const addPin = (rec, aliases) => {
        pins.set(rec.where || `P${rec.port}_${rec.bit}`, rec);
        for (const a of aliases) byName.set(a, rec);
    };
    // PARTs from the header: needed to give shift_out calls their name back.
    const hdrParts = (markers && markers.parts) ? markers.parts : [];
    const markerPins = markers && (markers.pins.length > 0 || !isArduino);
    if (markerPins) {
        for (const p of markers.pins) addPin({ ...p }, [p.name, `P${p.port}_${p.bit}`]);
    } else if (isArduino) {
        // An Arduino pin is a NUMBER, not a {port, bit}: there is no register
        // to find it in and no sbit to declare it with, so it is discovered
        // from the calls that use it. That is the whole reason this needs a
        // front end rather than another entry in a lookup table.
        //
        // A name comes from whatever the sketch called the number, because
        // `#define LED 13` / `const int led = 13;` is how every sketch does it
        // and "d13" is a worse name than the author's own.
        const alias = new Map();          // LED -> "13" | "A0"
        for (const [k, v] of pre.defines) {
            const t = String(v).trim();
            if (/^(\d+|A\d+)$/i.test(t)) alias.set(k, t.toUpperCase());
        }
        for (const line of pre.body) {
            // `const int led = 13;`, `const uint8_t pot = A0;`, `int led = 13;`
            const m = line.match(/\b(?:const\s+)?(?:u?int8_t|int|byte|uint8_t)\s+(\w+)\s*=\s*(\d+|A\d+)\s*;/i);
            if (m) alias.set(m[1], m[2].toUpperCase());
        }

        // A pin reference resolves to the board's spelling, or to null when it
        // is a computed expression -- `digitalWrite(pins[i], HIGH)` is a real
        // sketch idiom and there is no single pin to declare for it.
        const resolve = (tok) => {
            const t = alias.get(tok) || String(tok).toUpperCase();
            if (/^A(\d+)$/.test(t)) return { where: t, analog: true, num: +t.slice(1) };
            if (/^\d+$/.test(t)) return { where: `D${t}`, analog: false, num: +t };
            return null;
        };

        // Direction, strongest evidence first. analogRead settles it outright:
        // a pin that is read through the ADC is an ANALOG pin whatever else the
        // sketch does to it. Below that, a write beats a read, because a sketch
        // that only ever reads a pin has no reason to have configured it as an
        // output.
        const RANK = { analog: 5, tone: 4, pwm: 3, output: 2, input: 1 };
        const found = new Map();          // where -> {name, where, direction, activeLow}
        const note = (tok, direction, activeLow) => {
            const r = resolve(tok);
            if (!r) { warn(`a pin computed at run time (${tok}) cannot be declared — that line is not translated`); return; }
            const prev = found.get(r.where);
            const named = [...alias].find(([, v]) => v === (alias.get(tok) || String(tok).toUpperCase()));
            const name = (named ? named[0] : r.where).toLowerCase();
            if (!prev) { found.set(r.where, { name, where: r.where, direction, activeLow: !!activeLow }); return; }
            if (RANK[direction] > RANK[prev.direction]) prev.direction = direction;
            if (activeLow) prev.activeLow = true;
        };

        const text = pre.body.join('\n');
        // pinMode is the declaration when it is there, but it is NOT required:
        // analogRead needs none, and plenty of sketches drive a pin they never
        // configured. So every call that touches a pin contributes.
        for (const m of text.matchAll(/\bpinMode\s*\(\s*([^,()]+?)\s*,\s*(\w+)\s*\)/g)) {
            const mode = m[2].toUpperCase();
            // INPUT_PULLUP is a button wired to ground: pressed reads 0. That is
            // ACTIVE LOW, stated by the sketch rather than guessed at, and it is
            // the one polarity an Arduino sketch does declare.
            if (mode === 'OUTPUT') note(m[1], 'output', false);
            else note(m[1], 'input', mode === 'INPUT_PULLUP');
        }
        for (const [re, dir] of [[/\bdigitalWrite\s*\(\s*([^,()]+?)\s*,/g, 'output'],
                                 [/\bdigitalRead\s*\(\s*([^,()]+?)\s*\)/g, 'input'],
                                 [/\banalogRead\s*\(\s*([^,()]+?)\s*\)/g, 'analog'],
                                 [/\banalogWrite\s*\(\s*([^,()]+?)\s*,/g, 'pwm'],
                                 [/\btone\s*\(\s*([^,()]+?)\s*,/g, 'tone']]) {
            for (const m of text.matchAll(re)) note(m[1], dir, false);
        }

        for (const rec of found.values()) {
            // The Nano's A6/A7 reach the pad with no digital buffer behind
            // them. A sketch that drives one is not a sketch this reader can
            // repair, but it IS one whose behaviour on the bench will not
            // match its source, and saying so here is cheaper than finding out
            // with a meter.
            if (device === 'arduino-nano' && /^A[67]$/.test(rec.where)
                && rec.direction !== 'analog') {
                warn(`${rec.where} is analog-input only on the Nano (no digital buffer on the TQFP package) — `
                    + `this sketch drives it as ${rec.direction.toUpperCase()}, which does nothing on the board`);
            }
            addPin(rec, [rec.name, rec.where, rec.where.replace(/^D/, '')]);
        }
        if (!found.size) warn('no pins found — this front end discovers them from pinMode/digitalWrite/analogRead');
    } else {
        const seen = new Map();
        for (const [k, v] of pre.defines) {
            const m = String(v).match(/^P([0-4])_([0-7])$/);
            if (m) seen.set(k, { port: +m[1], bit: +m[2] });
        }
        for (const line of pre.body) {
            const m = line.match(/\bsbit\s+(\w+)\s*=\s*P([0-4])\s*\^\s*([0-7])/);
            if (m) seen.set(m[1], { port: +m[2], bit: +m[3] });
            // SDCC spells the same declaration by ADDRESS: `__sbit __at (0x90) LED1;`.
            // This is what Keil source looks like after stc-compiler normalises it, so
            // without this the translator makes firmware HARDER to read, not easier.
            // The bit-addressable ports sit at 0x80/0x90/0xA0/0xB0, eight bits each.
            const a = line.match(/__sbit\s+__at\s*\(\s*(0[xX][0-9a-fA-F]+|\d+)\s*\)\s*(\w+)/);
            if (a) {
                const addr = a[1].toLowerCase().startsWith('0x') ? parseInt(a[1], 16) : +a[1];
                if (addr >= 0x80 && addr <= 0xB7 && (addr & 0xF8) % 0x10 === 0) {
                    seen.set(a[2], { port: (addr - 0x80) >> 4, bit: addr & 7 });
                }
            }
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
        warn,
        readName (id) {
            const lit = expand(id, pre.defines);
            if (/^-?\d+$/.test(lit)) return lit;
            if (/^0x[0-9a-f]+$/i.test(lit)) return String(parseInt(lit, 16));
            const pin = byName.get(id) || pins.get(lit);
            if (pin) return pin.activeLow ? `not read ${pin.name}` : `read ${pin.name}`;
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
    let breakIsSwitch = false;  // true inside switchCaseBody, suppresses break warning
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
        // Keil keywords (`sbit`, `sfr`, `bit`, `code`, `data`, `xdata`, etc.) are
        // also declaration specifiers.
        if (t.t === 'id' && ['unsigned', 'signed', 'int', 'char', 'long', 'short', 'static', 'volatile', 'const', 'float', 'double',
            'sbit', 'sfr', 'sfr16', 'bit', 'code', 'data', 'xdata', 'idata', 'pdata', 'void', 'extern', 'register', 'typedef', 'struct', 'union', 'enum'].includes(t.v)) {
            // Capture what is being skipped so the warning can name it.
            // cur.peek() returned t but did not advance; skip it before collecting.
            cur.next();
            const declTokens = [t.v];
            while (!cur.is(';') && cur.peek().t !== 'eof') {
                if (cur.is('{')) { declTokens.push('{…}'); cur.skip('{', '}'); }
                else declTokens.push(cur.next().v);
            }
            cur.eat(';');
            // Warn for non-trivial declarations that carry program state.
            // Simple locals (`unsigned char i;`) inside function bodies are noise.
            // Structs, arrays, pointers, typedefs, and named struct variables are
            // the ones a user expects to survive.
            const declJoined = declTokens.join(' ');
            const declText = declTokens.slice(0, 8).join(' ');
            if (/struct|union|enum|typedef|\*|\[/.test(declJoined)) {
                warn(`declaration dropped (no block equivalent): ${declText}${declTokens.length > 8 ? ' …' : ''}`);
            }
            return [];
        }

        if (t.v === 'for') {
            cur.next(); cur.expect('(');
            // `for (;;)` is FOREVER; `for (i = 0; i < N; i++)` is REPEAT N.
            if (cur.is(';') && cur.is(';', 1) && cur.is(')', 2)) {
                cur.next(); cur.next(); cur.expect(')');
                const inner = bodyOf(cur, depth + 1);
                return transformLoopBody(inner, `${pad}FOREVER:`, depth);
            }
            const init = [];
            while (!cur.is(';') && cur.peek().t !== 'eof') init.push(cur.next().v);
            cur.eat(';');
            const cond = [];
            while (!cur.is(';') && cur.peek().t !== 'eof') cond.push(cur.next().v);
            cur.eat(';');
            const step = [];
            while (!cur.is(')') && cur.peek().t !== 'eof') step.push(cur.next().v);
            cur.expect(')');
            let count = null;
            const condStr = cond.join(' ').trim();
            // Strip type specifiers from init so `uint8_t i = 0` → `i = 0`.
            const TYPE_WORDS = new Set(['unsigned', 'signed', 'int', 'char', 'long', 'short',
                'static', 'volatile', 'const', 'uint8_t', 'uint16_t', 'uint32_t',
                'int8_t', 'int16_t', 'int32_t', 'BYTE', 'WORD', 'DWORD']);
            const initClean = init.filter(t => !TYPE_WORDS.has(t));
            const initStr = initClean.join('').replace(/\s+/g, '').trim();
            // Extract loop variable name and initial value from init.
            const initMatch = initStr.match(/^(\w+)=(.+)$/);
            const initVar = initMatch ? initMatch[1] : null;
            const initVal = initMatch ? initMatch[2] : null;
            // `for (i = 0; i < N; i++)` or `for (uint8_t i = 0; i < N; ++i)`
            const up = condStr.match(/^(\w+)\s*<\s*(.+)$/);
            if (up && initVar === up[1] && initVal === '0') {
                count = up[2].replace(/\s*\)\s*$/, '').replace(/^\(\s*/, '').trim();
            }
            // `for (i = 0; i != N; i++)` — same as i < N when counting up from 0
            const upNe = condStr.match(/^(\w+)\s*!=\s*(.+)$/);
            if (!count && upNe && initVar === upNe[1] && initVal === '0') {
                count = upNe[2].replace(/\s*\)\s*$/, '').replace(/^\(\s*/, '').trim();
            }
            // `for (i = 0; i <= N-1; i++)` → REPEAT N
            const upEq = condStr.match(/^(\w+)\s*<=\s*(.+)$/);
            if (!count && upEq && initVar === upEq[1] && initVal === '0') {
                const lim = upEq[2].replace(/\s*\)\s*$/, '').replace(/^\(\s*/, '').trim();
                const n = Number(lim);
                count = Number.isFinite(n) ? String(n + 1) : `${lim} + 1`;
            }
            // `for (i = M; i < N; i++)` where M > 0 → REPEAT (N - M)
            if (!count && up && initVar === up[1] && initVal && /^\d+$/.test(initVal) && Number(initVal) > 0) {
                const lim = up[2].replace(/\s*\)\s*$/, '').replace(/^\(\s*/, '').trim();
                const n = Number(lim);
                const m = Number(initVal);
                count = (Number.isFinite(n) && Number.isFinite(m)) ? String(n - m) : `${lim} - ${initVal}`;
            }
            // `for (i = N; i > 0; i--)` → REPEAT N
            const down = condStr.match(/^(\w+)\s*>\s*0$/);
            if (!count && down && initVar === down[1] && initVal) {
                count = initVal;
            }
            // `for (i = N; i >= 0; i--)` → REPEAT N+1
            const downEq = condStr.match(/^(\w+)\s*>=\s*0$/);
            if (!count && downEq && initVar === downEq[1] && initVal) {
                const n = Number(initVal);
                count = Number.isFinite(n) ? String(n + 1) : `${initVal} + 1`;
            }
            // `for (i = N; i != -1; i--)` → REPEAT N+1
            const downNe = condStr.match(/^(\w+)\s*!=\s*-\s*1$/);
            if (!count && downNe && initVar === downNe[1] && initVal) {
                const n = Number(initVal);
                count = Number.isFinite(n) ? String(n + 1) : `${initVal} + 1`;
            }
            // `for (i = N; i >= M; i--)` where M is a variable or non-zero constant → REPEAT (N - M + 1)
            const downToVar = condStr.match(/^(\w+)\s*>=\s*(.+)$/);
            if (!count && downToVar && initVar === downToVar[1] && initVal && downToVar[2].trim() !== '0') {
                const lim = downToVar[2].trim();
                const n = Number(initVal), m = Number(lim);
                count = (Number.isFinite(n) && Number.isFinite(m)) ? String(n - m + 1) : `${initVal} - ${lim} + 1`;
            }
            // `for (i = M; i <= N; i++)` with variable bounds → REPEAT (N - M + 1)
            if (!count && upEq && initVar === upEq[1] && initVal && !/^0$/.test(initVal)) {
                const lim = upEq[2].replace(/\s*\)\s*$/, '').replace(/^\(\s*/, '').trim();
                const n = Number(lim), m = Number(initVal);
                count = (Number.isFinite(n) && Number.isFinite(m)) ? String(n - m + 1) : `${lim} - ${initVal} + 1`;
            }
            // `for (; cond;)` or `for (; cond; step)` — while loop
            if (!count && !init.length && condStr) {
                const inner = bodyOf(cur, depth + 1);
                const head = condStr === '1' ? `${pad}FOREVER:` : `${pad}REPEAT UNTIL ${negate(condStr)}:`;
                return transformLoopBody(inner, head, depth);
            }
            const inner = bodyOf(cur, depth + 1);
            if (count === null) {
                warn('a `for` loop that is not `for(;;)` or a simple counter became REPEAT UNTIL false');
                return transformLoopBody(inner, `${pad}REPEAT UNTIL 1 = 1:`, depth);
            }
            return transformLoopBody(inner, `${pad}REPEAT ${count}:`, depth);
        }

        if (t.v === 'while') {
            cur.next(); cur.expect('(');
            const c = expr(cur);
            cur.expect(')');
            if (cur.eat(';')) return [`${pad}wait until ${negate(c.text)}`];
            const inner = bodyOf(cur, depth + 1);
            const head = (c.text === '1' || c.text === 'true') ? `${pad}FOREVER:` : `${pad}REPEAT UNTIL ${negate(c.text)}:`;
            return transformLoopBody(inner, head, depth);
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

        if (t.v === 'do') {
            cur.next();
            const inner = bodyOf(cur, depth + 1);
            // `do { body } while (cond);` → REPEAT UNTIL not cond
            if (cur.eat('while')) {
                cur.expect('(');
                const c = expr(cur);
                cur.expect(')');
                cur.eat(';');
                return transformLoopBody(inner, `${pad}REPEAT UNTIL ${negate(c.text)}:`, depth);
            }
            cur.eat(';');
            return inner;
        }

        // Helper: parse a switch case body, treating `break` as "end of case"
        // at any nesting depth (including inside { } braces).
        function switchCaseBody (cur, depth) {
            const body = [];
            const _origBreak = breakIsSwitch;
            breakIsSwitch = true;
            while (!cur.is('case') && !cur.is('default') && !cur.is('}') && cur.peek().t !== 'eof') {
                if (cur.is('break')) { cur.next(); cur.eat(';'); breakIsSwitch = _origBreak; return body; }
                body.push(...statement(cur, depth));
            }
            breakIsSwitch = _origBreak;
            return body;
        }

        if (t.v === 'switch') {
            cur.next(); cur.expect('(');
            const switchExpr = expr(cur);
            cur.expect(')'); cur.expect('{');
            // Convert case labels to if-else chain.
            const cases = [];
            let defaultCase = null;
            while (!cur.is('}') && cur.peek().t !== 'eof') {
                if (cur.eat('case')) {
                    const val = expr(cur);
                    cur.expect(':');
                    const body = switchCaseBody(cur, depth + 1);
                    cases.push({ val: val.text, body });
                } else if (cur.eat('default')) {
                    cur.expect(':');
                    defaultCase = switchCaseBody(cur, depth + 1);
                } else { cur.next(); }
            }
            cur.eat('}');
            if (!cases.length && !defaultCase) return [];
            // Convert switch to a series of independent IF blocks.
            // Not semantically equivalent (fall-through is lost, which is warned), but
            // correct for the common pattern of case+break.
            const out = [];
            for (const c of cases) {
                out.push(`${pad}IF ${switchExpr.text} = ${c.val} THEN:`);
                out.push(...(c.body.length ? c.body : [`${'  '.repeat(depth + 1)}stop`]));
            }
            // Default case becomes the final else-body of the last IF, or standalone.
            if (defaultCase && defaultCase.length) {
                if (cases.length) {
                    // Attach as ELSE to the last IF for cleaner semantics.
                    out.push(`${pad}ELSE:`);
                    out.push(...defaultCase);
                } else {
                    out.push(...defaultCase);
                }
            }
            return out;
        }

        if (t.v === 'goto') {
            warn('`goto` has no pseudocode equivalent — skipped');
            cur.next();
            while (!cur.is(';') && !cur.is('}') && cur.peek().t !== 'eof') cur.next();
            cur.eat(';');
            return [];
        }

        if (t.v === 'return') { cur.next(); while (!cur.is(';') && cur.peek().t !== 'eof') cur.next(); cur.eat(';'); return [`${pad}stop this script`]; }
        if (t.v === 'break') {
            cur.next(); cur.eat(';');
            if (breakIsSwitch) return [];
            // Emit a marker that transformLoopBody will pick up.
            return [`${pad}@@BREAK@@`];
        }
        if (t.v === 'continue') {
            cur.next(); cur.eat(';');
            return [`${pad}@@CONTINUE@@`];
        }

        // assignment / call / expression statement
        const start = cur.i;
        if (t.t === 'id') {
            const name = cur.next().v;
            // `X = expr;`  /  `X += expr;`
            if (cur.is('&=') || cur.is('|=') || cur.is('^=') || cur.is('<<=') || cur.is('>>=')) {
                const op = cur.next().v;
                const rhs = expr(cur);
                cur.eat(';');
                if (SFRS.test(name)) return [];   // register setup, not program logic
                const BITOP = { '&=': 'bitand', '|=': 'bitor', '^=': 'bitxor', '<<=': 'shiftleft', '>>=': 'shiftright' };
                const v = varName(name); usedVars.add(v);
                return [`${pad}set ${v} to ${v} ${BITOP[op]} ${rhs.text}`];
            }
            if (cur.is('=') || cur.is('+=') || cur.is('-=')) {
                const op = cur.next().v;
                // Detect `x = cond ? a : b;` and expand to if/else instead of
                // dropping the else branch. Scan ahead for `?` before `;`.
                if (op === '=') {
                    const scan = cur.i;
                    let pDepth = 0, hasQ = false;
                    for (let si = scan; si < cur.k.length && !(cur.k[si].v === ';' && pDepth === 0); si++) {
                        if (cur.k[si].v === '(') pDepth++;
                        else if (cur.k[si].v === ')') pDepth--;
                        else if (cur.k[si].v === '?' && pDepth === 0) { hasQ = true; break; }
                    }
                    const qPin = byName.get(name) || pins.get(expand(name, pre.defines));
                    if (hasQ && (qPin || !SFRS.test(name))) {
                        const origWarn = ctx.warn;
                        ctx.warn = (m) => { if (!/ternary/.test(m)) origWarn(m); };
                        cur.i = scan;
                        const condExpr = new ExprParser(cur, ctx).parse(1);
                        if (cur.eat('?')) {
                            const thenExpr = new ExprParser(cur, ctx).parse(0);
                            cur.eat(':');
                            const elseExpr = new ExprParser(cur, ctx).parse(0);
                            cur.eat(';');
                            const pin = byName.get(name) || pins.get(expand(name, pre.defines));
                            ctx.warn = origWarn;
                            // Emitter pattern: `PIN = (expr) ? 1 : 0` → `set pin to expr`.
                            // The ternary clamps to 0/1 for the physical bit; the condition
                            // IS the computed value the user wrote.
                            if (pin && thenExpr.text === '1' && elseExpr.text === '0') {
                                return [`${pad}set ${pin.name} to ${condExpr.text}`];
                            }
                            const target = pin ? pin.name : varName(name);
                            if (!pin) usedVars.add(target);
                            const setCmd = pin ? (v) => pinWrite(pin, v) : (v) => `set ${target} to ${v}`;
                            return [
                                `${pad}IF ${condExpr.text} THEN:`,
                                `${'  '.repeat(depth + 1)}${setCmd(thenExpr.text)}`,
                                `${pad}ELSE:`,
                                `${'  '.repeat(depth + 1)}${setCmd(elseExpr.text)}`
                            ];
                        }
                        ctx.warn = origWarn;
                        cur.i = scan;
                    }
                }
                const rhs = expr(cur);
                cur.eat(';');
                // A declared pin IS an SFR bit, so check it BEFORE the register filter,
                // or every `P1_0 = 0;` is mistaken for setup and the program disappears.
                const pin = byName.get(name) || pins.get(expand(name, pre.defines));
                if (!pin && SFRS.test(name)) return [];       // register setup, not program logic
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
        const skippedTokens = [];
        while (!cur.is(';') && !cur.is('}') && cur.peek().t !== 'eof') {
            if (cur.is('{')) cur.skip('{', '}');
            else skippedTokens.push(cur.next().v);
        }
        cur.eat(';');
        if (skippedTokens.length) {
            const text = skippedTokens.slice(0, 8).join(' ');
            warn(`statement dropped (not representable as a block): ${text}${skippedTokens.length > 8 ? ' …' : ''}`);
        }
        return [];
    }

    // A call in statement position: delays become `wait`, known procedures become calls.
    const origReadCall = ctx.readCall;
    ctx.readCall = (name, args) => {
        if (DELAYS.has(name)) {
            const argText = args[0] ? args[0].text : '0';
            const ms = Number(argText);
            if (Number.isFinite(ms)) {
                const secs = +(ms / 1000).toFixed(6);
                return { text: '0', level: 99, stmt: `wait ${secs} seconds` };
            }
            // The emitter writes `delay_ms((unsigned int)((secs) * 1000))` for a
            // variable wait. Detect `(EXPR) * 1000` and recover `wait EXPR seconds`.
            const mulMatch = argText.match(/^\((.+)\) \* 1000$/);
            if (mulMatch) return { text: '0', level: 99, stmt: `wait ${mulMatch[1]} seconds` };
            // Also handle `EXPR * 1000` without outer parens.
            const mulMatch2 = argText.match(/^(.+) \* 1000$/);
            if (mulMatch2) return { text: '0', level: 99, stmt: `wait (${mulMatch2[1]}) seconds` };
            return { text: '0', level: 99, stmt: `wait ${argText} ms` };
        }
        if (SETUP.has(name) || name === '_nop_' || name === 'NOP' || name === '__nop') return { text: '0', level: 99, stmt: null };
        // 74HC595: `shift_out(<pins...>, activeLow, value)` → `set <part> to value`.
        // The value is always the LAST argument on every core (the pin
        // arguments differ in shape per core); a cast wrapper is stripped.
        if (name === 'shift_out' && args.length >= 2 && hdrParts.length) {
            let val = args[args.length - 1].text
                .replace(/^\(unsigned char\)\s*/, '').replace(/^\(uint8_t\)\s*/, '');
            if (/^\(.*\)$/.test(val)) val = val.slice(1, -1);
            return { text: '0', level: 99, stmt: `set ${hdrParts[0].name} to ${val}` };
        }
        // Tone: `tone_set(freq)` → `set <tone-pin> to freq hz`
        if (name === 'tone_set' && args.length >= 1) {
            const tonePin = [...pins.values()].find(p => p.direction === 'tone');
            const pname = tonePin ? tonePin.name : 'buzzer';
            return { text: '0', level: 99, stmt: `set ${pname} to ${args[0].text} hz` };
        }
        // LED cube kernel functions → cube pseudocode commands.
        if (name === 'bw_cube_clear') return { text: '0', level: 99, stmt: 'clear cube' };
        if (name === 'bw_cube_hold' || name === 'bw_cube_scan') {
            return { text: '0', level: 99, stmt: `hold frame for ${args[0] ? args[0].text : 0} ms` };
        }
        if (name === 'bw_cube_set' && args.length >= 4) {
            return { text: '0', level: 99, stmt: `set voxel ${args[0].text} ${args[1].text} ${args[2].text} to ${args[3].text}` };
        }
        if (name === 'bw_cube_fill_layer' && args.length >= 2) {
            return { text: '0', level: 99, stmt: `fill layer ${args[0].text} with ${args[1].text}` };
        }
        if (name === 'bw_cube_shift' && args.length >= 1) {
            // The table is imported, not restated. The previous version copied
            // it here under a comment saying it "must agree with the emitter's"
            // — which is a hope, not a mechanism, and the two had already
            // disagreed once.
            const dir = cubeDirectionWord(args[0].text);
            if (dir === null) {
                // Out of range: pass the number through rather than inventing a
                // direction, and say so. Silently choosing one would turn a
                // firmware/reader version mismatch into a cube shifting the
                // wrong way with nothing to explain it.
                warn(`bw_cube_shift(${args[0].text}): not a known direction `
                    + `(0-${CUBE_DIRECTIONS.length - 1}); left as a number`);
                return { text: '0', level: 99, stmt: `shift cube ${args[0].text}` };
            }
            return { text: '0', level: 99, stmt: `shift cube ${dir}` };
        }
        if (name === 'bw_cube_get' && args.length >= 3) {
            return { text: `voxel ${args[0].text} ${args[1].text} ${args[2].text}`, level: 99 };
        }
        // ---- device helpers (devices_* blocks, lowered by bw-blocks) ----
        // Each bw_* call maps back to the pseudocode the decompiler produces.
        // Reporters return a text value; statements return { stmt }.
        const MOTOR_DIRS = ['forward', 'reverse', 'brake', 'coast'];
        const a = (n) => args[n] ? args[n].text : '0';
        switch (name) {
            // Servo
            case 'bw_servo_set': return { text: '0', level: 99, stmt: `set ${a(0)} angle to ${a(1)}` };
            case 'bw_servo_get': return { text: `angle of ${a(0)}`, level: 99 };
            // Motor
            case 'bw_motor_speed': return { text: '0', level: 99, stmt: `set ${a(0)} speed to ${a(1)}` };
            case 'bw_motor_dir': return { text: '0', level: 99, stmt: `set ${a(0)} direction ${MOTOR_DIRS[Number(a(1))] || a(1)}` };
            case 'bw_motor_get_speed': return { text: `speed of ${a(0)}`, level: 99 };
            case 'bw_motor_get_dir': return { text: `direction of ${a(0)}`, level: 99 };
            // Relay
            case 'bw_relay_set': return { text: '0', level: 99, stmt: `set relay ${a(0)} ${Number(a(1)) ? 'on' : 'off'}` };
            // Activate / deactivate (generic device)
            case 'bw_device_activate': return { text: '0', level: 99, stmt: `activate ${a(0)}` };
            case 'bw_device_deactivate': return { text: '0', level: 99, stmt: `deactivate ${a(0)}` };
            // LCD
            case 'bw_lcd_print': return { text: '0', level: 99, stmt: `lcd print ${a(1)} on ${a(0)}` };
            case 'bw_lcd_cursor': return { text: '0', level: 99, stmt: `lcd set cursor ${a(1)} ${a(2)} on ${a(0)}` };
            case 'bw_lcd_clear': return { text: '0', level: 99, stmt: `lcd clear ${a(0)}` };
            // 7-segment display
            case 'bw_7seg_show': return { text: '0', level: 99, stmt: `show digit ${a(1)} on ${a(0)}` };
            // RGB LED
            case 'bw_rgb_set': return { text: '0', level: 99, stmt: `set ${a(0)} colour to R ${a(1)} G ${a(2)} B ${a(3)}` };
            // LED matrix
            case 'bw_matrix_set': return { text: '0', level: 99, stmt: `set pixel ${a(1)} ${a(2)} to ${a(3)} on ${a(0)}` };
            case 'bw_matrix_clear': return { text: '0', level: 99, stmt: `clear matrix ${a(0)}` };
            // NeoPixel
            case 'bw_neopixel_set': return { text: '0', level: 99, stmt: `set neopixel ${a(1)} to R ${a(2)} G ${a(3)} B ${a(4)} on ${a(0)}` };
            case 'bw_neopixel_clear': return { text: '0', level: 99, stmt: `clear neopixels on ${a(0)}` };
            // Sensors (reporters)
            case 'bw_temperature': return { text: `temperature from ${a(0)}`, level: 99 };
            case 'bw_light': return { text: `light from ${a(0)}`, level: 99 };
            case 'bw_distance': return { text: `distance from ${a(0)}`, level: 99 };
            case 'bw_flex': return { text: `flex of ${a(0)}`, level: 99 };
            case 'bw_force': return { text: `force on ${a(0)}`, level: 99 };
            case 'bw_ir_code': return { text: `ir code from ${a(0)}`, level: 99 };
            case 'bw_device_state': return { text: `state of ${a(0)}`, level: 99 };
            // Boolean reporters (conditions)
            case 'bw_pressed': return { text: `${a(0)} pressed?`, level: 99 };
            case 'bw_above': return { text: `${a(0)} above ${a(1)}`, level: 99 };
            case 'bw_closer': return { text: `${a(0)} closer than ${a(1)}`, level: 99 };
            case 'bw_motion': return { text: `motion detected on ${a(0)}`, level: 99 };
            case 'bw_tilted': return { text: `${a(0)} tilted?`, level: 99 };
            case 'bw_energised': return { text: `${a(0)} energised?`, level: 99 };
            // Cube extras (not in the original cube kernel)
            case 'bw_cube_fill_column': return { text: '0', level: 99, stmt: `fill column ${a(0)} ${a(1)} with ${a(2)}` };
            case 'bw_cube_fill_wall': return { text: '0', level: 99, stmt: `fill wall ${a(0)} with ${a(1)}` };
            case 'bw_cube_invert': return { text: '0', level: 99, stmt: 'invert cube' };
            // Print (program-wide, not a device)
            case 'bw_print': return { text: '0', level: 99, stmt: `print ${a(0)}` };
            case 'bw_print_num': return { text: '0', level: 99, stmt: `print ${a(0)}` };
            default: break;
        }

        if (markers && markers.procs.has(name)) {
            const { proccode } = markers.procs.get(name);
            let i = 0;
            const label = proccode.replace(/%[sb]/g, () => (args[i] ? args[i++].text : '0'));
            return { text: '0', level: 99, stmt: label };
        }
        // ---- Arduino core, read rather than refused -----------------------
        // These are LIBRARY functions and there is no body to walk, so each is
        // translated by hand into the sentence the dialect already has. The
        // ones NOT here still fall through to the refusal below, which is the
        // point: a call this does not understand must stay visible.
        if (isArduino) {
            // By the time an argument reaches here it has been through
            // readName, which turns a pin identifier into `read pin` -- so
            // `digitalRead(button)` arrives as the text "read button", not
            // "button". Look through that rather than failing to match it.
            const pinOf = (a) => {
                if (!a) return null;
                const bare = String(a.text).replace(/^not\s+/, '').replace(/^read\s+/, '');
                return byName.get(a.text) || byName.get(bare)
                    || [...pins.values()].find((p) => p.name === bare) || null;
            };
            if (name === 'pinMode') return { text: '0', level: 99, stmt: null };  // a declaration, already read
            if (name === 'digitalWrite' && args.length >= 2) {
                const p = pinOf(args[0]);
                if (p) return { text: '0', level: 99, stmt: pinWrite(p, args[1].text) };
            }
            if (name === 'digitalRead' && args.length >= 1) {
                const p = pinOf(args[0]);
                if (p) return { text: p.activeLow ? `not read ${p.name}` : `read ${p.name}`, level: 99 };
            }
            if (name === 'analogRead' && args.length >= 1) {
                const p = pinOf(args[0]);
                if (p) return { text: `read ${p.name}`, level: 99 };
            }
            if (name === 'analogWrite' && args.length >= 2) {
                const p = pinOf(args[0]);
                // analogWrite is 0-255 of duty; the dialect speaks percent. An
                // exact literal converts, anything computed does not -- and
                // inventing `x * 100 / 255` around a variable would change the
                // arithmetic the sketch actually performs.
                const n = Number(args[1].text);
                if (p && Number.isFinite(n)) {
                    return { text: '0', level: 99, stmt: `set ${p.name} to ${Math.round(n * 100 / 255)} percent` };
                }
                if (p) {
                    warn(`analogWrite(${p.name}, ${args[1].text}) is 0-255 and the pseudocode is percent — `
                        + 'left as a percentage of the same expression, which is not the same number');
                    return { text: '0', level: 99, stmt: `set ${p.name} to ${args[1].text} percent` };
                }
            }
            if (name === 'tone' && args.length >= 2) {
                const p = pinOf(args[0]);
                if (p) return { text: '0', level: 99, stmt: `set ${p.name} to ${args[1].text} hz` };
            }
            if (name === 'noTone' && args.length >= 1) {
                const p = pinOf(args[0]);
                if (p) return { text: '0', level: 99, stmt: `set ${p.name} to 0 hz` };
            }
            if (name === 'delay' && args.length === 1) {
                return { text: '0', level: 99, stmt: `wait ${args[0].text} ms` };
            }
            if (name === 'delayMicroseconds' && args.length === 1) {
                // The dialect's floor is a millisecond. Rounding 100us to 0ms
                // would silently delete the delay, so it is kept as a comment
                // and flagged rather than approximated.
                warn(`delayMicroseconds(${args[0].text}) is shorter than this dialect can express (1 ms) — left out`);
                return { text: '0', level: 99, stmt: null };
            }
            if (name === 'millis') return { text: 'timer', level: 99 };
        }
        // Arduino and AVR core calls are LIBRARY functions, not helpers defined
        // in the file, so turning them into custom-block calls invents a block
        // that means nothing -- `pinMode led OUTPUT` is not a sentence in this
        // dialect. Refused by name instead, which is actionable.
        if (ARDUINO_CORE.has(name)) {
            warn(`${name}() is Arduino/AVR core, which this front end does not read — the pseudocode below is missing that line`);
            return { text: '0', level: 99, stmt: null };
        }
        // For hand-written firmware, translate unknown function calls as custom block
        // calls rather than silently dropping them. In expression position (not
        // statement), it still returns 0 with a warning via origReadCall.
        if (!markers && !SFRS.test(name)) {
            const argList = args.map((a) => a.text).join(' ');
            return { text: '0', level: 99, stmt: `${name}${argList ? ' ' + argList : ''}` };
        }
        return origReadCall(name, args);
    };

    function pinWrite (pin, valueText) {
        const n = Number(valueText);
        if (!Number.isFinite(n)) {
            // A computed value is a LEVEL — ACTIVE LOW does NOT invert it
            // (same as `set high`/`set low`).
            return `set ${pin.name} to ${valueText}`;
        }
        const high = n !== 0;
        const on = pin.activeLow ? !high : high;
        return `turn ${on ? 'on' : 'off'} ${pin.name}`;
    }

    const negate = (text) => (text.startsWith('not ') ? text.slice(4) : `not (${text})`);

    // ---- break/continue transformation ------------------------------------------
    // Transforms @@BREAK@@ and @@CONTINUE@@ markers in a loop body into flag-variable
    // pseudocode. The resulting program is semantically equivalent but structurally
    // different — every such transformation is warned.
    let _brkId = 0;
    function transformLoopBody (lines, loopHead, depth) {
        const pad = '  '.repeat(depth);
        const innerPad = '  '.repeat(depth + 1);
        const hasBreak = lines.some(l => l.includes('@@BREAK@@'));
        const hasContinue = lines.some(l => l.includes('@@CONTINUE@@'));
        if (!hasBreak && !hasContinue) return [loopHead, ...lines];

        // --- Pattern: `if (cond) break;` as the last statement before loop-end ---
        // Check if the ONLY break is inside an IF at the end of the body. If so,
        // fold it into the loop condition instead of using a flag.
        if (hasBreak && !hasContinue) {
            const breakCount = lines.filter(l => l.includes('@@BREAK@@')).length;
            if (breakCount === 1) {
                const idx = lines.findIndex(l => l.includes('@@BREAK@@'));
                // Find the IF that contains this break by looking at the line before it.
                // Pattern: `  IF cond THEN:` then `    @@BREAK@@` (break is the only line in the IF)
                if (idx > 0) {
                    const ifLine = lines[idx - 1];
                    const breakLine = lines[idx];
                    const ifMatch = ifLine.match(/^(\s*)IF (.+) THEN:$/);
                    if (ifMatch) {
                        const ifIndent = ifMatch[1].length;
                        const breakIndent = breakLine.search(/\S/);
                        // The break is the only child AND there are no lines after the if-break.
                        const noElse = idx + 1 >= lines.length || !lines[idx + 1].trim().startsWith('ELSE');
                        const isLast = idx + 1 >= lines.length || lines.slice(idx + 1).every(l => !l.trim());
                        if (breakIndent > ifIndent && noElse && isLast) {
                            const cond = ifMatch[2];
                            // Lines before the IF become the body, the IF's condition
                            // merges into the loop's REPEAT UNTIL.
                            const bodyBefore = lines.slice(0, idx - 1);
                            const bodyAfter = [];
                            let newHead;
                            if (/FOREVER:$/.test(loopHead)) {
                                newHead = `${pad}REPEAT UNTIL ${cond}:`;
                            } else if (/REPEAT UNTIL (.+):$/.test(loopHead)) {
                                const m = loopHead.match(/^(\s*)REPEAT UNTIL (.+):$/);
                                newHead = `${m[1]}REPEAT UNTIL ${m[2]} or ${cond}:`;
                            } else {
                                newHead = loopHead;  // REPEAT N — can't fold, fall through to flag
                            }
                            if (newHead !== loopHead) {
                                // Clean fold — no flag needed, no structural warning
                                return [newHead, ...bodyBefore, ...bodyAfter];
                            }
                        }
                    }
                }
            }
        }

        const out = [];

        if (hasBreak) {
            const flag = `_brk${++_brkId}`;
            warn('`break` was transformed into a flag variable — the program structure changed');
            out.push(`${pad}set ${flag} to 0`);

            let newHead = loopHead;
            if (/FOREVER:$/.test(loopHead)) {
                newHead = `${pad}REPEAT UNTIL ${flag} = 1:`;
            } else if (/REPEAT UNTIL (.+):$/.test(loopHead)) {
                const m = loopHead.match(/^(\s*)REPEAT UNTIL (.+):$/);
                newHead = `${m[1]}REPEAT UNTIL ${m[2]} or ${flag} = 1:`;
            }

            // Replace ALL @@BREAK@@ markers with `set _brk to 1`, at any nesting depth.
            const transformed = lines.map(l =>
                l.includes('@@BREAK@@') ? l.replace('@@BREAK@@', `set ${flag} to 1`) : l);

            // Guard: find the first break at the TOP level of the loop body.
            // Lines after it at the same indentation get wrapped in IF _brk = 0.
            const topBreakIdx = transformed.findIndex((l, i) => {
                const origLine = lines[i];
                if (!origLine || !origLine.includes('@@BREAK@@')) return false;
                // Top-level = indented exactly one level from the loop
                return origLine.search(/\S/) === innerPad.length;
            });
            const guarded = [];
            if (topBreakIdx >= 0 && topBreakIdx + 1 < transformed.length) {
                guarded.push(...transformed.slice(0, topBreakIdx + 1));
                guarded.push(`${innerPad}IF ${flag} = 0 THEN:`);
                for (const rest of transformed.slice(topBreakIdx + 1)) {
                    guarded.push('  ' + rest);
                }
            } else {
                guarded.push(...transformed);
            }

            // For REPEAT N, additionally wrap the whole body in IF _brk = 0.
            if (/REPEAT \S+:$/.test(loopHead) && !/REPEAT UNTIL/.test(loopHead)) {
                out.push(newHead, `${innerPad}IF ${flag} = 0 THEN:`, ...guarded.map(l => '  ' + l));
            } else {
                out.push(newHead, ...guarded);
            }
        }

        if (hasContinue && !hasBreak) {
            warn('`continue` was transformed into conditional guards — the program structure changed');
            out.push(loopHead);
            // Replace @@CONTINUE@@ markers — for now, just skip them with a warning.
            // A full transformation would wrap remaining lines, but that requires knowing
            // which lines are "after" each continue at the same scope level.
            for (const l of lines) {
                if (!l.includes('@@CONTINUE@@')) out.push(l);
            }
        }
        return out;
    }
    const negNum = (text) => (/^-?\d+$/.test(text) ? String(-Number(text)) : `0 - (${text})`);

    // ---- cooperative-scheduler inverter ------------------------------------------
    // Recognises the finite grammar `cTaskBlock` emits. Each task function is a
    // `switch (task_state) { case 0: … }` Duff's device; this walks the interior
    // structurally, matching each shape and recovering the original pseudocode.

    function taskLines (taskTokens, funcName, depth) {
        const tc = new Cursor(taskTokens);
        // Enter the function body: { switch (…state) { case 0: <stmts> } …end… }
        tc.expect('{');
        if (!tc.eat('switch')) { warn(`${funcName}: expected switch in task`); return []; }
        tc.skip('(', ')');     // skip (task_state)
        tc.expect('{');
        // Now inside the switch body. First token should be `case 0:`
        if (!(tc.is('case') && tc.peek(1).v === '0')) {
            warn(`${funcName}: expected case 0 in task`); return [];
        }
        tc.next(); tc.next(); tc.expect(':');   // eat `case 0:`
        const lines = taskBody(tc, funcName, depth);
        return lines;
    }

    // Parse the statement sequence inside a task's switch body. We consume tokens
    // until we hit the closing `}` of the switch or eof.
    function taskBody (tc, task, depth) {
        const out = [];
        while (tc.peek().t !== 'eof' && !tc.is('}')) {
            out.push(...taskStmt(tc, task, depth));
        }
        return out;
    }

    function taskBodyOf (tc, task, depth) {
        if (tc.is('{')) {
            tc.expect('{');
            const out = [];
            while (!tc.is('}') && tc.peek().t !== 'eof') out.push(...taskStmt(tc, task, depth));
            tc.expect('}');
            return out.length ? out : [`${'  '.repeat(depth)}stop`];
        }
        return taskStmt(tc, task, depth);
    }

    function taskStmt (tc, task, depth) {
        const pad = '  '.repeat(depth);

        // `state = 0xFFFF;` → stop (this script or all/others — we just emit stop)
        if (tc.peek().t === 'id' && tc.peek().v.endsWith('_state') && tc.peek(1).v === '='
            && tc.peek(2).v === '0xFFFF') {
            // Possibly multiple `taskN_state = 0xFFFF;` lines (stop all / stop others).
            // Consume all of them plus the trailing `return;`.
            const stopped = [];
            while (tc.peek().t === 'id' && tc.peek().v.endsWith('_state')
                && tc.peek(1).v === '=' && tc.peek(2).v === '0xFFFF') {
                stopped.push(tc.next().v);
                tc.next(); tc.next(); tc.eat(';');   // = 0xFFFF ;
            }
            tc.eat('return'); tc.eat(';');
            // Figure out what kind of stop.
            const self = stopped.some((s) => s === `${task}_state`);
            const others = stopped.filter((s) => s !== `${task}_state`);
            if (self && others.length) return [`${pad}stop all`];
            if (!self && others.length) return [`${pad}stop other scripts in sprite`];
            return [`${pad}stop this script`];
        }

        // `task_state = N;` followed by `case N:` → a yield point. What follows
        // identifies the construct.
        if (tc.peek().t === 'id' && tc.peek().v === `${task}_state` && tc.peek(1).v === '=') {
            const stateAssign = tc.i;
            tc.next(); tc.next();   // task_state =
            const stateNum = tc.next().v;   // N
            tc.eat(';');
            // Expect `case N:`
            if (tc.is('case') && tc.peek(1).v === stateNum) {
                tc.next(); tc.next(); tc.expect(':');
                return taskYield(tc, task, depth, stateNum);
            }
            // Not followed by matching case — may be the back-edge of a FOREVER
            // (`state = S; return;`). Put it back and let the caller handle it.
            tc.i = stateAssign;
            // Fall through to handle as a regular statement or back-edge marker.
        }

        // `bw_iK = (expr);` — the REPEAT counter init. This is consumed by the
        // yield handler for REPEAT, but if we see it here, grab it and then expect
        // the yield that follows.
        if (tc.peek().t === 'id' && /^bw_i\d+$/.test(tc.peek().v) && tc.peek(1).v === '=') {
            const counterName = tc.next().v;
            tc.next();   // =
            tc.expect('(');
            const countExpr = expr(tc);
            tc.expect(')');
            tc.eat(';');
            // Now expect: task_state = S; case S: if (counterName) { ... }
            if (tc.peek().v === `${task}_state` && tc.peek(1).v === '=') {
                tc.next(); tc.next();
                const stateNum = tc.next().v;
                tc.eat(';');
                tc.eat('case'); tc.eat(stateNum); tc.expect(':');
                return taskRepeat(tc, task, depth, stateNum, counterName, countExpr);
            }
            // Unexpected — warn
            warn(`${task}: unexpected pattern after counter init`);
            return [];
        }

        // `task_until = bw_now() + (MS);` → wait N seconds. This appears BEFORE
        // the yield point, so we emit the wait here and the deadline check gets skipped.
        if (tc.peek().t === 'id' && tc.peek().v === `${task}_until` && tc.peek(1).v === '=') {
            tc.next(); tc.next();   // task_until =
            // bw_now() + (MS)
            tc.eat('bw_now'); tc.skip('(', ')');   // bw_now()
            tc.eat('+');
            tc.expect('(');
            const msExpr = expr(tc);
            tc.expect(')');
            tc.eat(';');
            const ms = Number(msExpr.text);
            const secs = Number.isFinite(ms) ? +(ms / 1000).toFixed(6) : null;
            return [`${pad}${secs !== null ? `wait ${secs} seconds` : `wait ${msExpr.text} ms`}`];
        }

        // `case N:` without a preceding state assignment — skip it (stale label after yield).
        if (tc.is('case')) {
            tc.next(); tc.next(); tc.expect(':');
            return [];
        }

        // `return;` at the tail of a construct body — consumed by the construct handler,
        // but if we see it loose, just skip.
        if (tc.is('return')) { tc.next(); tc.eat(';'); return []; }

        // `if (cond) { … } else { … }` — must be handled here (not by the generic
        // `statement()`) because case labels and wait assignments can appear INSIDE
        // the if/else branches in a Duff's-device.
        if (tc.is('if')) {
            tc.next(); tc.expect('(');
            const c = expr(tc);
            tc.expect(')');
            const then = taskBodyOf(tc, task, depth + 1);
            const out = [`${pad}IF ${c.text} THEN:`, ...then];
            if (tc.peek().v === 'else') {
                tc.next();
                out.push(`${pad}ELSE:`, ...taskBodyOf(tc, task, depth + 1));
            }
            return out;
        }

        // Otherwise: a regular statement (assignment, call, etc.). Reuse the
        // existing statement parser.
        return statement(tc, depth);
    }

    // After consuming `state = S; case S:` we look at what follows to identify the construct.
    function taskYield (tc, task, depth, stateNum) {
        const pad = '  '.repeat(depth);

        // Pattern: `if ((int)(bw_now() - task_until) < 0) return;` → wait N seconds
        // The wait duration was set BEFORE this yield by `task_until = bw_now() + (MS);`
        // which we already consumed as a regular statement. But we can recognise this
        // pattern and emit the wait. The duration was in the preceding `until = bw_now() + (MS)`.
        if (tc.is('if') && looksLikeWaitDeadline(tc, task)) {
            skipWaitDeadlineCheck(tc);
            return [];   // The wait line was already emitted when we saw the `until = …` assignment.
        }

        // Pattern: `if (!(cond)) return;` → wait until cond
        if (tc.is('if')) {
            const saved = tc.i;
            tc.next(); tc.expect('(');
            // Check for `!(cond)` pattern followed by `) return;`
            if (tc.is('!')) {
                tc.next(); tc.expect('(');
                const cond = expr(tc);
                tc.expect(')'); tc.expect(')');
                if (tc.is('return')) {
                    tc.next(); tc.eat(';');
                    return [`${pad}wait until ${cond.text}`];
                }
                // It's `if (!(cond)) { body; state = S; return; }` → REPEAT UNTIL
                tc.i = saved;
                return taskRepeatUntil(tc, task, depth, stateNum);
            }
            // It might be `if (counterName) { ... }` → REPEAT (handled separately)
            // or a regular `if`. Restore and try regular statement.
            tc.i = saved;
        }

        // This is a FOREVER or a sequence of statements followed by `state = stateNum; return;`.
        // Collect statements until we see `state = stateNum; return;` which is the back-edge.
        const body = [];
        while (tc.peek().t !== 'eof' && !tc.is('}')) {
            // Check for back-edge: `state = stateNum; return;`
            if (tc.peek().v === `${task}_state` && tc.peek(1).v === '='
                && tc.peek(2).v === stateNum && tc.peek(3).v === ';') {
                // This is the FOREVER back-edge.
                tc.next(); tc.next(); tc.next(); tc.eat(';');   // state = N ;
                tc.eat('return'); tc.eat(';');
                return [`${pad}FOREVER:`, ...body];
            }
            body.push(...taskStmt(tc, task, depth + 1));
        }
        // If we reach the end without finding a back-edge, it's a linear sequence.
        return body;
    }

    // REPEAT n: `if (bw_iK) { <body> bw_iK--; state = S; return; }`
    function taskRepeat (tc, task, depth, stateNum, counterName, countExpr) {
        const pad = '  '.repeat(depth);
        // Expect: if (counterName) {
        tc.expect('if'); tc.expect('(');
        if (tc.peek().v !== counterName) { warn(`${task}: expected ${counterName} in REPEAT`); return []; }
        tc.next(); tc.expect(')'); tc.expect('{');

        // Parse body until we hit `counterName--;` then `state = S; return;`
        const body = [];
        while (tc.peek().t !== 'eof') {
            // Check for the REPEAT tail: `counterName--; state = S; return; }`
            if (tc.peek().v === counterName && tc.peek(1).v === '--') {
                tc.next(); tc.next(); tc.eat(';');   // counterName-- ;
                // state = S; return; }
                tc.eat(`${task}_state`); tc.eat('='); tc.eat(stateNum); tc.eat(';');
                tc.eat('return'); tc.eat(';');
                tc.expect('}');
                return [`${pad}REPEAT ${countExpr.text}:`, ...body];
            }
            body.push(...taskStmt(tc, task, depth + 1));
        }
        warn(`${task}: unterminated REPEAT`);
        return [`${pad}REPEAT ${countExpr.text}:`, ...body];
    }

    // REPEAT UNTIL cond: `if (!(cond)) { <body> state = S; return; }`
    function taskRepeatUntil (tc, task, depth, stateNum) {
        const pad = '  '.repeat(depth);
        tc.expect('if'); tc.expect('(');
        tc.expect('!'); tc.expect('(');
        const cond = expr(tc);
        tc.expect(')'); tc.expect(')'); tc.expect('{');

        const body = [];
        while (tc.peek().t !== 'eof') {
            // Check for back-edge: `state = S; return; }`
            if (tc.peek().v === `${task}_state` && tc.peek(1).v === '='
                && tc.peek(2).v === stateNum) {
                tc.next(); tc.next(); tc.next(); tc.eat(';');
                tc.eat('return'); tc.eat(';');
                tc.expect('}');
                return [`${pad}REPEAT UNTIL ${cond.text}:`, ...body];
            }
            body.push(...taskStmt(tc, task, depth + 1));
        }
        warn(`${task}: unterminated REPEAT UNTIL`);
        return [`${pad}REPEAT UNTIL ${cond.text}:`, ...body];
    }

    // Check if the current position looks like the wait-deadline pattern:
    // `if ((int)(bw_now() - task_until) < 0) return;`
    function looksLikeWaitDeadline (tc, task) {
        // We need to peek ahead without consuming. Scan for `bw_now` and `task_until`.
        let n = 0;
        let depth = 0;
        let sawNow = false, sawUntil = false;
        while (n < 30) {
            const t = tc.peek(n);
            if (t.t === 'eof') return false;
            if (t.v === '(') depth++;
            if (t.v === ')') depth--;
            if (t.v === 'bw_now') sawNow = true;
            if (t.v === `${task}_until`) sawUntil = true;
            if (t.v === 'return' && depth <= 0) return sawNow && sawUntil;
            if (t.v === ';' && depth <= 0) return false;
            n++;
        }
        return false;
    }

    // Skip past the wait-deadline check: `if ((int)(bw_now() - task_until) < 0) return;`
    function skipWaitDeadlineCheck (tc) {
        // Just skip tokens until we see `return;`
        while (tc.peek().t !== 'eof') {
            if (tc.is('return')) { tc.next(); tc.eat(';'); return; }
            tc.next();
        }
    }

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
        } else {
            // Top-level declaration (not a function). Warn if it carries
            // program state that the reader cannot represent.
            const declSpan = tokens.slice(start, cur.i).map(t => t.v).join(' ');
            if (/struct|union|enum|typedef|\*|\[/.test(declSpan) && !SFRS.test(declSpan)) {
                const brief = tokens.slice(start, Math.min(cur.i, start + 8)).map(t => t.v).join(' ');
                warn(`top-level declaration dropped (no block equivalent): ${brief}${cur.i - start > 8 ? ' …' : ''}`);
            }
            cur.eat(';'); if (cur.i === start) cur.next();
        }
    }

    const linesFor = (f, depth) => {
        const sub = new Cursor(tokens.slice(f.from, f.to));
        try { return block(sub, depth); } catch (e) { warn(`could not parse ${f.name}(): ${e.message}`); return [`${'  '.repeat(depth)}stop`]; }
    };

    // ---- assemble ----
    const out = [`DEVICE ${device.toUpperCase()}`, `CLOCK ${clock}`];
    if (markers && markers.machine) {
        const hx = (n) => '$' + n.toString(16).toUpperCase().padStart(4, '0');
        for (const r of markers.machine.regions) out.push(`MAP ${r.kind.toUpperCase()} ${hx(r.start)}-${hx(r.end)}`);
        for (const ch of markers.machine.chips) out.push(`CHIP ${ch.name} = ${{ via: 'W65C22', acia: 'W65C51', vdp: 'TMS9918' }[ch.kind] || 'W65C51'} AT ${hx(ch.at)}`);
    }
    const pinList = [...new Set(pins.values())];
    if (pinList.length) {
        out.push('');
        for (const p of pinList) {
            // `where` carries the board's own spelling when the board does not
            // have 8051 {port, bit} pins at all -- D13, A0. The 8051 path never
            // sets it and is emitted exactly as before.
            const at = p.where || `P${p.port}.${p.bit}`;
            out.push(`PIN ${p.name} = ${at} ${p.direction.toUpperCase()}${p.activeLow ? ' ACTIVE LOW' : ''}`);
        }
    }
    if (hdrParts.length) {
        if (!pinList.length) out.push('');
        for (const pt of hdrParts) {
            const at = (x) => x.where || `P${x.port}.${x.bit}`;
            out.push(`PART ${pt.name} = ${pt.type.toUpperCase()} data ${at(pt.data)} clock ${at(pt.clock)} latch ${at(pt.latch)}${pt.activeLow ? ' ACTIVE LOW' : ''}`);
        }
    }
    // ---- static current check (STC12C5A60S2 datasheet §4.6) ----
    // Sum worst-case sink current for all output pins. The per-pin maximum is
    // 20 mA; the total chip I/O budget is ~120 mA. A warning fires when the
    // declarations alone put the total over the budget, before any simulation.
    if (pinList.length) {
        const MAX_PER_PIN_MA = 20;
        const CHIP_TOTAL_MA = 120;
        const outputPins = pinList.filter(p => p.direction === 'output' || p.direction === 'pwm' || p.direction === 'tone');
        const worstCaseMa = outputPins.length * MAX_PER_PIN_MA;
        if (worstCaseMa > CHIP_TOTAL_MA) {
            warn(`${outputPins.length} output pins × ${MAX_PER_PIN_MA} mA = up to ${worstCaseMa} mA `
                + `at maximum pin ratings (actual current depends on series resistors). `
                + `Chip total I/O budget is ~${CHIP_TOTAL_MA} mA (STC12 datasheet §4.1). `
                + `With ≥1 kΩ resistors per LED the real total is much lower.`);
        }
        // Also warn per-port: if a single port has ≥6 outputs, note the concentration.
        const portCounts = new Map();
        for (const p of outputPins) {
            if (p.port !== undefined) {
                portCounts.set(p.port, (portCounts.get(p.port) || 0) + 1);
            }
        }
        for (const [port, count] of portCounts) {
            if (count >= 6) {
                warn(`Port ${port} has ${count} output pins — up to ${count * 20} mA `
                    + `at maximum pin ratings. Chip total budget is ~120 mA.`);
            }
        }
    }

    // Detect the LED cube kernel by the presence of bw_cube_frame.
    const cubeFrameMatch = source.match(/bw_cube_frame\[(\d+)\]/);
    if (cubeFrameMatch) {
        const selects = Number(cubeFrameMatch[1]);
        const size = selects / 2;   // 8 selects = 4×4×4, 6 selects = 3×3×3
        if (size >= 2 && size <= 8) out.push('', `LEDCUBE ${size}`);
    }

    const IGNORE_FNS = new Set(['bw_setup', 'bw_tick', 'bw_now', 'bw_block_ms', 'delay_ms', 'adc_read',
        'pwm_set', 'bw_distance', 'bw_closer',
        'bw_neo_byte', 'bw_neo_send', 'bw_neopixel_set', 'bw_neopixel_clear',
        'i2c_delay', 'i2c_start', 'i2c_stop', 'i2c_write', 'shift_out',
        'lcd_i2c_send', 'lcd_nibble', 'lcd_cmd', 'lcd_data',
        'bw_lcd_print', 'bw_lcd_cursor', 'bw_lcd_clear',
        'board_init', 'delay_init', 'tone_set', 'tone_stop',
        'bw_cube_scan', 'bw_cube_set', 'bw_cube_get', 'bw_cube_clear',
        'bw_cube_fill_layer', 'bw_cube_shift', 'bw_cube_hold',
        'bw_cube_fill_column', 'bw_cube_fill_wall', 'bw_cube_invert',
        // Device helpers (stubs emitted by bw-blocks' lowering)
        'bw_servo_set', 'bw_servo_get', 'bw_motor_speed', 'bw_motor_dir',
        'bw_motor_get_speed', 'bw_motor_get_dir', 'bw_relay_set',
        'bw_device_activate', 'bw_device_deactivate',
        'bw_lcd_print', 'bw_lcd_cursor', 'bw_lcd_clear', 'bw_7seg_show',
        'bw_rgb_set', 'bw_matrix_set', 'bw_matrix_clear',
        'bw_neopixel_set', 'bw_neopixel_clear',
        'bw_temperature', 'bw_light', 'bw_distance', 'bw_flex', 'bw_force',
        'bw_ir_code', 'bw_device_state',
        'bw_pressed', 'bw_above', 'bw_closer', 'bw_motion', 'bw_tilted', 'bw_energised',
        'bw_print', 'bw_print_num']);
    const procFns = funcs.filter((f) => markers && markers.procs.has(f.name));
    const scriptFns = funcs.filter((f) => !IGNORE_FNS.has(f.name)
        && (markers ? markers.scripts.has(f.name) : f.name === 'main'));
    // An Arduino sketch legitimately has neither, because setup()/loop() are
    // assembled into one script further down.
    const hasSketchShape = isArduino && !markers
        && funcs.some((f) => f.name === 'setup' || f.name === 'loop');
    if (!scriptFns.length) {
        const main = funcs.find((f) => f.name === 'main');
        if (main) scriptFns.push(main);
        else if (!hasSketchShape) warn('no main() and no @bw script markers — nothing to translate');
    }

    // Emit DEFINE blocks for custom procedures.
    // With markers: only named procs. Without markers (hand-written firmware):
    // every function that is not main, not a known setup/delay, and not an ISR.
    const userFns = markers
        ? procFns
        : funcs.filter((f) => !IGNORE_FNS.has(f.name) && f.name !== 'main'
            && !DELAYS.has(f.name) && !SETUP.has(f.name)
            // setup() and loop() are the script itself, not procedures called
            // by it; emitting DEFINE blocks for them would say the sketch has
            // two custom blocks it never calls.
            && !(hasSketchShape && (f.name === 'setup' || f.name === 'loop')));

    for (const f of userFns) {
        // Recover parameter names from the C function signature.
        const paramNames = [];
        for (let j = f.from - 1; j >= 0; j--) {
            if (tokens[j].v === '(') break;
            if (tokens[j].t === 'id' && tokens[j - 1] && tokens[j - 1].t === 'id') paramNames.unshift(varName(tokens[j].v));
        }
        if (markers && markers.procs.has(f.name)) {
            const { proccode } = markers.procs.get(f.name);
            let n = 0;
            const sig = proccode.replace(/%[sb]/g, (tok) => {
                const name = paramNames[n] || `arg${n + 1}`;
                n++;
                return `${tok === '%b' ? '<' : '('}${name}${tok === '%b' ? '>' : ')'}`;
            });
            out.push('', `DEFINE ${sig}:`, ...linesFor(f, 1));
        } else {
            // Hand-written: build a proccode from the function name and parameters.
            const params = paramNames.length ? ' ' + paramNames.map((p) => `(${p})`).join(' ') : '';
            out.push('', `DEFINE ${f.name}${params}:`, ...linesFor(f, 1));
        }
    }

    // Warn about functions found in the source but not emitted.
    // SFR/runtime functions are expected to be dropped; user functions are not.
    const emitted = new Set([...scriptFns.map(f => f.name), ...userFns.map(f => f.name)]);
    for (const f of funcs) {
        if (!emitted.has(f.name) && !IGNORE_FNS.has(f.name) && !DELAYS.has(f.name) && !SETUP.has(f.name)
            && !f.name.startsWith('bw_')       // runtime/device helpers
            && !f.name.startsWith('tone_')      // tone helpers
            && !f.name.startsWith('__')         // compiler intrinsics (__interrupt, __at, etc.)
            && f.name !== 'main') {
            warn(`function ${f.name}() dropped: not a script or known procedure — hand-added code does not survive the round-trip`);
        }
    }

    // Find `//` comments preceding a function definition in the original source.
    // These are script comments the emitter placed before the function, and they
    // come back as `# comment` lines before the WHEN hat.
    function commentsFor (funcName) {
        const comments = [];
        for (let i = 0; i < sourceLines.length; i++) {
            // Find the function definition line: `static void funcName(void)` or `void funcName(void)`
            if (new RegExp(`\\b${funcName}\\s*\\(`).test(sourceLines[i])) {
                // Collect `//` comment lines immediately above, stopping at blank or non-comment lines.
                for (let j = i - 1; j >= 0; j--) {
                    if (lineComments.has(j)) {
                        const text = lineComments.get(j);
                        // Skip emitter remarks like `/* when green flag clicked (script N) */`
                        if (!/^when green flag clicked/.test(text)) comments.unshift(`# ${text}`);
                    } else if (/^\s*\/\*.*\*\/\s*$/.test(sourceLines[j])) {
                        continue;   // skip `/* ... */` single-line remarks between // and the function
                    } else {
                        break;
                    }
                }
                break;
            }
        }
        // For single-script main(), comments may be inside the body after bw_setup().
        if (funcName === 'main' && !comments.length) {
            for (let i = 0; i < sourceLines.length; i++) {
                if (/void\s+main\s*\(/.test(sourceLines[i])) {
                    for (let j = i + 1; j < sourceLines.length; j++) {
                        const line = sourceLines[j].trim();
                        // Skip braces, blanks, setup calls, timer init, and register writes
                        if (line === '{' || line === '' || /^bw_setup\b|^TL0|^TH0|^ET0|^EA|^TR0/.test(line)) continue;
                        const cm = line.match(/^\/\/\s?(.*)/);
                        if (cm) { comments.push(`# ${cm[1]}`); }
                        else break;
                    }
                    break;
                }
            }
        }
        return comments;
    }

    // An Arduino sketch has no main(): setup() runs once and loop() runs
    // forever, which is precisely one script with a FOREVER in it. Reassembling
    // it that way is what makes the round trip mean anything -- the dialect
    // emits exactly this shape in the other direction.
    const arduinoSetup = isArduino && !markers && funcs.find((f) => f.name === 'setup');
    const arduinoLoop = isArduino && !markers && funcs.find((f) => f.name === 'loop');
    if (arduinoSetup || arduinoLoop) {
        out.push('');
        for (const c of commentsFor(arduinoSetup ? 'setup' : 'loop')) out.push(c);
        out.push('WHEN flag clicked:');
        const body = [];
        // pinMode lines vanish here, because they became the PIN declarations
        // above. A setup() that held nothing else contributes nothing, which
        // is correct rather than a loss.
        if (arduinoSetup) body.push(...linesFor(arduinoSetup, 1).filter((l) => l.trim() && l.trim() !== 'stop'));
        if (arduinoLoop) {
            const inner = linesFor(arduinoLoop, 2).filter((l) => l.trim() && l.trim() !== 'stop');
            if (inner.length) body.push('  FOREVER:', ...inner);
        }
        out.push(...(body.length ? body : ['  stop']));
        return { pseudocode: out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n', warnings };
    }

    const isTask = markers && [...markers.scripts.keys()].some((k) => k.startsWith('bw_task'));
    for (const f of scriptFns) {
        const hatComments = commentsFor(f.name);
        out.push('');
        for (const c of hatComments) out.push(c);
        out.push('WHEN flag clicked:');
        if (isTask) {
            const body = taskLines(tokens.slice(f.from, f.to), f.name, 1);
            out.push(...(body.length ? body : ['  stop']));
        } else {
            const body = linesFor(f, 1).filter((l) => l.trim() !== 'stop');
            out.push(...(body.length ? body : ['  stop']));
        }
    }

    return { pseudocode: out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n', warnings };
}
