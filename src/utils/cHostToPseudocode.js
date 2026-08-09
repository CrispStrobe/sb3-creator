// Host C → pseudocode. The way back from the target `generateHostC` emits.
//
// This is a different problem from cToPseudocode.js, which reads C a human
// wrote for an 8051 and has to infer what the pins mean. Here the C is machine
// written, in a shape this repo controls, and carries its own structure:
// `bw_structure()` holds the sprite/costume/variable markers, `scratch_*` calls
// map back through the same OP_TO_SCRATCH table that emitted them, and
// `/* @bw-program */` says where the runtime stops. So the reader is a small
// recursive-descent pass over a known subset rather than a C parser.
//
// The point of it is the round trip: blocks → C → pseudocode → blocks has to
// land on the same project, which is what proves the emission loses nothing.

import { scratchCallToPseudo, stripSpritePrefix } from './scratchRuntime.js';

const BOUNDARY = '/* @bw-program';

// The emitter's arity-suffixed names, undone.
const UNSUFFIX = { say_for: 'say', think_for: 'think' };

// Markers that describe the project rather than doing anything.
const STRUCTURAL = new Set(['stage', 'sprite', 'sprite_shape', 'local', 'local_list',
    'costume', 'sound', 'defblock', 'global_var', 'global_list']);

/** Split a C argument list on top-level commas. */
function splitArgs(text) {
    const out = [];
    let depth = 0, cur = '', inStr = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inStr) {
            cur += ch;
            if (ch === '\\') { cur += text[++i] || ''; continue; }
            if (ch === '"') inStr = false;
            continue;
        }
        if (ch === '"') { inStr = true; cur += ch; continue; }
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
        cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
}

/** `name(args)` at the very start and end of `text`, or null. */
function asCall(text) {
    const m = /^([A-Za-z_]\w*)\s*\(/.exec(text.trim());
    if (!m) return null;
    const body = text.trim();
    let depth = 0;
    for (let i = m[0].length - 1; i < body.length; i++) {
        if (body[i] === '(') depth++;
        else if (body[i] === ')') {
            depth--;
            if (depth === 0) {
                if (i !== body.length - 1) return null;      // trailing operators: not a bare call
                return { name: m[1], args: splitArgs(body.slice(m[0].length, i)) };
            }
        }
    }
    return null;
}

class Reader {
    constructor() {
        this.params = null;          // param name -> '%s' | '%b', inside a DEFINE
        this.warnings = [];
        this.lists = new Set();
        this.renames = new Map();       // C identifier -> original Scratch name
        this.procs = new Map();         // C function name -> {proccode, warp}
    }

    warn(m) { if (!this.warnings.includes(m)) this.warnings.push(m); }

    name(id) {
        if (id === 'bw_answer') return 'answer';   // the emitter's spelling of sensing_answer
        // Inside a custom block, a parameter is an argument reporter, not a
        // variable, and the dialect spells it (name) for %s and <name> for %b.
        // Bare, it reparses as an ordinary variable — which is how the two
        // largest examples grew a dozen phantom globals.
        if (this.params && this.params.has(id)) {
            return this.params.get(id) === '%b' ? `<${id}>` : `(${id})`;
        }
        const bare = stripSpritePrefix(id);
        return this.renames.get(id) || this.renames.get(bare) || bare;
    }

    // ---- expressions -------------------------------------------------------
    // Everything the emitter produces is either a bw_* helper call, a scratch_*
    // shim call, a literal wrapper, or a variable.
    expr(text) {
        // List indices and bit operators arrive cast; the cast is C's bookkeeping,
        // not part of the expression the blocks describe.
        const t = String(text).trim().replace(/^\((?:int|long|double)\)\s*/, '');
        if (!t) return '""';
        const call = asCall(t);
        if (call) return this.callExpr(call, t);
        // (a + b) style arithmetic the emitter wraps inside bw_num(...)
        if (/^\(.*\)$/.test(t) && this.balanced(t.slice(1, -1))) return this.expr(t.slice(1, -1));
        const bin = this.splitBinary(t);
        if (bin) return `(${this.expr(bin.left)} ${bin.op} ${this.expr(bin.right)})`;
        if (/^-?\d+(\.\d+)?$/.test(t)) return t;
        // The dialect writes strings with their contents verbatim (its own parser
        // handles the inner quotes), so undo C's escaping rather than passing it on.
        if (/^".*"$/.test(t)) {
            try { return `"${JSON.parse(t)}"`; } catch { return t; }
        }
        if (/^[A-Za-z_]\w*$/.test(t)) return this.name(t);
        this.warn(`cannot read expression ${t}`);
        return '""';
    }

    balanced(t) {
        let d = 0;
        for (const ch of t) { if (ch === '(') d++; if (ch === ')') { d--; if (d < 0) return false; } }
        return d === 0;
    }

    /** Top-level binary operator in a C expression, lowest precedence first. */
    splitBinary(t) {
        const levels = [['||'], ['&&'], ['==', '!=', '<=', '>=', '<', '>'], ['+', '-'], ['*', '/']];
        for (const ops of levels) {
            let depth = 0, inStr = false;
            for (let i = t.length - 1; i >= 0; i--) {
                const ch = t[i];
                if (ch === '"' && t[i - 1] !== '\\') inStr = !inStr;
                if (inStr) continue;
                if (ch === ')') depth++;
                if (ch === '(') depth--;
                if (depth !== 0) continue;
                for (const op of ops) {
                    if (t.startsWith(op, i) && i > 0) {
                        // not a unary minus, and not part of a longer operator
                        const before = t[i - 1], after = t[i + op.length];
                        if ('=<>!&|+-*/'.includes(before) || after === '=') continue;
                        const left = t.slice(0, i).trim(), right = t.slice(i + op.length).trim();
                        if (!left || !right) continue;
                        const ps = { '==': '=', '&&': 'and', '||': 'or' }[op] || op;
                        return { left, op: ps, right };
                    }
                }
            }
        }
        return null;
    }

    callExpr(call, whole) {
        const { name, args } = call;
        switch (name) {
            case 'bw_num': case 'bw_n': case 'bw_bool': return this.expr(args[0]);
            case 'bw_str': case 'bw_s': return this.expr(args[0]);
            case 'bw_join': return `(${this.expr(args[0])} join ${this.expr(args[1])})`;
            case 'bw_letter': return `(letter ${this.expr(args[1])} of ${this.expr(args[0])})`;
            case 'bw_length': return `(length of ${this.expr(args[0])})`;
            case 'bw_contains': return `(${this.expr(args[0])} contains ${this.expr(args[1])})`;
            case 'bw_mod': return `(${this.expr(args[0])} mod ${this.expr(args[1])})`;
            case 'bw_random': return `(pick random ${this.expr(args[0])} to ${this.expr(args[1])})`;
            case 'bw_mathop': return `(${unquote(args[0])} of ${this.expr(args[1])})`;
            case 'bw_cmp': return `${this.expr(args[0])} ?cmp? ${this.expr(args[1])}`;
            case 'bw_list_item': return `(item ${this.expr(args[1])} of ${this.listName(args[0])})`;
            case 'bw_list_index': return `(item # of ${this.expr(args[1])} in ${this.listName(args[0])})`;
            case 'bw_list_length': return `(length of ${this.listName(args[0])})`;
            case 'bw_list_contains': return `(${this.listName(args[0])} contains ${this.expr(args[1])})`;
            case 'round': return `(round ${this.expr(args[0])})`;
            case 'floor': case 'ceil': case 'sqrt': case 'fabs':
                return `(${{ floor: 'floor', ceil: 'ceiling', sqrt: 'sqrt', fabs: 'abs' }[name]} of ${this.expr(args[0])})`;
            case 'tgamma': return `(factorial of ${this.expr(String(args[0]).replace(/\s*\+\s*1$/, ''))})`;
            case 'pow': return `(${this.expr(args[0])} to the power of ${this.expr(args[1])})`;
            case 'fmin': return `(min of ${this.expr(args[0])} and ${this.expr(args[1])})`;
            case 'fmax': return `(max of ${this.expr(args[0])} and ${this.expr(args[1])})`;
            case 'bw_ask': return 'answer';
            default: break;
        }
        if (name.startsWith('scratch_')) {
            const r = this.scratch(name, args);
            if (r) return `(${r})`;
            return '""';
        }
        this.warn(`cannot read call ${name}() in ${whole}`);
        return '""';
    }

    listName(ref) { return this.name(String(ref).replace(/^&/, '').trim()); }

    /** A scratch_* call back to its pseudocode phrase via the shared table. */
    scratch(cname, args) {
        let method = cname.slice('scratch_'.length);
        method = UNSUFFIX[method] || method;
        const r = scratchCallToPseudo(method, args.map((a) => this.expr(a)));
        if (r) return r.text;
        this.warn(`unknown scratch_${method}`);
        return null;
    }

    // ---- conditions --------------------------------------------------------
    // The emitter writes comparisons as bw_cmp(a,b) OP 0 and truthiness as
    // bw_n(x) != 0; both read back as the pseudocode they came from.
    cond(text) {
        let t = String(text).trim();
        while (/^\(.*\)$/.test(t) && this.balanced(t.slice(1, -1))) t = t.slice(1, -1).trim();
        let m;
        if ((m = /^bw_cmp\s*\((.*)\)\s*(==|!=|<=|>=|<|>)\s*0$/s.exec(t))) {
            const [a, b] = splitArgs(m[1]);
            const op = { '==': '=', '!=': '!=', '<': '<', '>': '>', '<=': '<=', '>=': '>=' }[m[2]];
            return `${this.expr(a)} ${op} ${this.expr(b)}`;
        }
        if ((m = /^bw_n\s*\((.*)\)\s*!=\s*0$/s.exec(t))) return this.expr(m[1]);
        if (t.startsWith('!')) return `not ${this.cond(t.slice(1))}`;
        const bin = this.splitBinary(t);
        if (bin && (bin.op === 'and' || bin.op === 'or')) {
            return `${this.cond(bin.left)} ${bin.op} ${this.cond(bin.right)}`;
        }
        return this.expr(t);
    }
}

function unquote(s) { return String(s).trim().replace(/^"|"$/g, ''); }

/**
 * The whole translation. Returns pseudocode text; `.warnings` on the function
 * result is not used — warnings are appended as `# ` comments, as the other
 * readers do, so nothing is silently lost.
 */
export default function cHostToPseudocode(source) {
    const r = new Reader();
    const text = String(source);
    const start = text.indexOf(BOUNDARY);
    const program = start >= 0 ? text.slice(text.indexOf('\n', start) + 1) : text;
    const lines = program.split('\n');

    // Pass 1 — the structure block tells us the sprites, the locals and the
    // original names, which every later line depends on.
    const struct = [];
    let inStruct = false;
    for (const raw of lines) {
        const line = raw.trim();
        if (line.startsWith('static void bw_structure')) { inStruct = true; continue; }
        if (inStruct) {
            if (line === '}') { inStruct = false; continue; }
            const call = asCall(line.replace(/;$/, ''));
            if (call && call.name.startsWith('scratch_')) {
                struct.push({ m: call.name.slice('scratch_'.length), a: call.args.map(unquoteArg) });
            }
        }
    }
    // Original Scratch names, so `my score` comes back as `my score` and not `my_score`.
    for (const s of struct) {
        if (['global_var', 'global_list', 'local', 'local_list'].includes(s.m)) {
            r.renames.set(sanitize(s.a[0]), s.a[0]);
            if (s.m.endsWith('list')) r.lists.add(s.a[0]);
        }
    }

    const out = [];
    for (const s of struct) {
        if (s.m === 'global_var') out.push(`GLOBAL ${s.a[0]}`);
        else if (s.m === 'global_list') out.push(`GLOBAL LIST ${s.a[0]}`);
    }

    // Pass 1b — every custom block's proccode, so a CALL can be written the way
    // the dialect writes it: the label with the arguments interleaved.
    for (let k = 0; k < lines.length; k++) {
        const def = /^(?:void|static void)\s+([A-Za-z_]\w*)\s*\(/.exec(lines[k].trim());
        if (!def) continue;
        for (let j = k + 1; j < Math.min(k + 6, lines.length); j++) {
            const t = lines[j].trim();
            if (t.startsWith('scratch_defblock(')) {
                const call = asCall(t.replace(/;$/, ''));
                r.procs.set(def[1], unquoteArg(call.args[0]));
                break;
            }
            if (t && t !== '{' && !t.startsWith('/*')) break;
        }
    }

    // Pass 2 — the functions, under the section header their prefix names.
    // `s0_` is the first section, `s1_` the second, in the order bw_structure()
    // introduced them, which is how the emitter assigned the prefixes.
    const sections = [];
    for (const s of struct) {
        if (s.m === 'stage') sections.push({ head: 'STAGE:', shape: [], locals: [], lists: [], costumes: [], sounds: [] });
        else if (s.m === 'sprite' || s.m === 'sprite_shape') {
            const sec = { head: `SPRITE ${s.a[0]}:`, shape: [], locals: [], lists: [], costumes: [], sounds: [] };
            if (s.m === 'sprite_shape') sec.shape.push(`  SHAPE ${s.a[1]}`);
            sections.push(sec);
        } else if (sections.length) {
            const cur = sections[sections.length - 1];
            if (s.m === 'local') cur.locals.push(`  LOCAL ${s.a[0]}`);
            else if (s.m === 'local_list') cur.lists.push(`  LOCAL LIST ${s.a[0]}`);
            else if (s.m === 'costume') cur.costumes.push(`  COSTUME ${s.a[0]}`);
            else if (s.m === 'sound') cur.sounds.push(`  SOUND ${s.a[0]}`);
        }
    }
    const emitted = new Set();
    // `//` lines ahead of a function are the script's own comment; the emitter's
    // own remarks are /* */ and are not carried back.
    let pending = [];

    let i = 0;
    while (i < lines.length) {
        const line = lines[i].trim();
        const fn = /^(?:void|static void)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*$/.exec(line);
        if (fn && lines[i + 1] && lines[i + 1].trim() === '{' && fn[1] !== 'bw_structure') {
            const { body, next } = takeBlock(lines, i + 1);
            i = next;
            const sidx = Number((/^s(\d+)_/.exec(fn[1]) || [0, 0])[1]);
            const section = sections[sidx];
            if (section && !emitted.has(sidx)) {
                emitted.add(sidx);
                out.push('', section.head, ...section.shape, ...section.locals,
                    ...section.lists, ...section.costumes, ...section.sounds);
            }
            const indent = section ? 1 : 0;
            r.params = null;                     // scoped to one DEFINE; header() sets it
            out.push('', ...pending.map((c) => '  '.repeat(indent) + c),
                ...header(r, fn[1], fn[2], body).map((h) => '  '.repeat(indent) + h),
                ...stmts(r, body, indent + 1));
            pending = [];
            continue;
        }
        if (/^int main\s*\(/.test(line)) { const { next } = takeBlock(lines, i + 1); i = next; continue; }
        if (line.startsWith('//')) pending.push('#' + line.slice(2));
        else if (line && !line.startsWith('/*') && !line.startsWith('*')) pending = [];
        i++;
    }

    for (const w of r.warnings) out.unshift(`# ${w}`);
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

function unquoteArg(a) {
    const m = /^bw_str\s*\(\s*"((?:[^"\\]|\\.)*)"\s*\)$/.exec(String(a).trim());
    if (m) return JSON.parse(`"${m[1]}"`);
    const n = /^bw_num\s*\(\s*(-?[\d.]+)\s*\)$/.exec(String(a).trim());
    return n ? n[1] : String(a).trim();
}

function sanitize(name) { return String(name).replace(/[^A-Za-z0-9_]+/g, '_').replace(/^_+|_+$/g, ''); }

/**
 * The `{ … }` starting at `open`: its inner lines, and where to carry on.
 *
 * `} else {` is the subtle case — it closes and opens in one line, so counting
 * braces alone never sees the if-block end and the else-body lands inside the
 * if. At depth 1 it is treated as the closing brace, and `next` points AT it so
 * the caller can see the else.
 */
function takeBlock(lines, open) {
    let depth = 0, i = open;
    const body = [];
    for (; i < lines.length; i++) {
        const t = lines[i].trim();
        if (depth === 1 && /^\}\s*else\s*\{$/.test(t)) return { body, next: i, hasElse: true };
        // The else line is also the opener of the else block: when the caller
        // restarts here, its leading `}` belongs to the if and must not count.
        const isElseOpener = i === open && /^\}\s*else\s*\{$/.test(t);
        const opens = isElseOpener ? 1 : (t.match(/\{/g) || []).length;
        const closes = isElseOpener ? 0 : (t.match(/\}/g) || []).length;
        if (depth > 0 || (depth === 0 && opens === 0)) body.push(lines[i]);
        depth += opens - closes;
        if (depth === 0 && i > open - 1 && (opens || closes)) { i++; break; }
    }
    return { body: body.slice(0, -1), next: i };
}

/** A function's pseudocode header: a WHEN hat, or a DEFINE for a custom block. */
function header(r, cname, params, body) {
    const bare = stripSpritePrefix(cname).replace(/_\d+$/, '');
    const def = body.map((l) => l.trim()).find((l) => l.startsWith('scratch_defblock('));
    if (def) {
        const call = asCall(def.replace(/;$/, ''));
        const proccode = unquoteArg(call.args[0]);
        const warp = unquoteArg(call.args[1]) === '1';
        const names = (params.match(/bw_val\s+(\w+)/g) || []).map((p) => p.split(/\s+/)[1]);
        let k = 0;
        // `%b` is a boolean parameter and the dialect spells it <name>, not (name).
        r.params = new Map();
        const label = String(proccode).replace(/%[sb]/g, (tok) => {
            const nm = names[k++] || 'arg';
            r.params.set(nm, tok);
            return tok === '%b' ? `<${nm}>` : `(${nm})`;
        });
        return [`DEFINE ${warp ? 'FAST ' : ''}${label}:`];
    }
    if (bare === 'when_flag_clicked') return ['WHEN flag clicked:'];
    if (bare === 'when_clicked') return ['WHEN sprite clicked:'];
    if (bare === 'when_clone_starts') return ['WHEN I start as a clone:'];
    let m;
    if ((m = /^when_(.+)_key$/.exec(bare))) return [`WHEN ${m[1].replace(/_/g, ' ')} key pressed:`];
    if ((m = /^on_(.+)$/.exec(bare))) return [`WHEN I receive "${m[1].replace(/_/g, ' ')}":`];
    r.warn(`unrecognised function ${cname} — read as a flag script`);
    return ['WHEN flag clicked:'];
}

/** Statements of one block. */
function stmts(r, lines, depth) {
    const pad = '  '.repeat(depth);
    const out = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i].trim();
        if (!line || line === '{' || line === '}') { i++; continue; }
        let m;
        const openBlock = (headerText) => {
            const { body, next } = takeBlock(lines, i);
            out.push(pad + headerText, ...stmts(r, body, depth + 1));
            i = next;
        };
        if (line === 'for (;;) {') { openBlock('FOREVER:'); continue; }
        if ((m = /^for \(long \w+ = \(long\)(.+); \w+-- > 0; \) \{$/.exec(line))) {
            openBlock(`REPEAT ${r.expr(m[1])}:`); continue;
        }
        if ((m = /^while \(!(.+)\) \{$/.exec(line))) { openBlock(`REPEAT UNTIL ${r.cond(m[1])}:`); continue; }
        if ((m = /^while \((.+)\) \{$/.exec(line))) { openBlock(`WHILE ${r.cond(m[1])}:`); continue; }
        if ((m = /^if \((.+)\) \{$/.exec(line))) {
            const taken = takeBlock(lines, i);
            out.push(pad + `IF ${r.cond(m[1])} THEN:`, ...stmts(r, taken.body, depth + 1));
            i = taken.next;
            if (taken.hasElse) {
                const e = takeBlock(lines, i);      // `} else {` is this block's opener
                out.push(pad + 'ELSE:', ...stmts(r, e.body, depth + 1));
                i = e.next;
            }
            continue;
        }
        out.push(...simple(r, line, pad));
        i++;
    }
    return out;
}

function simple(r, line, pad) {
    const text = line.replace(/;$/, '').trim();
    let m;
    if (text === 'return') return [pad + 'stop this script'];
    if ((m = /^\/\* (.*) \*\/$/.exec(text))) return [`${pad}# ${m[1]}`];
    if (text.startsWith('//')) return [`${pad}#${text.slice(2)}`];
    if ((m = /^while \(!(.+)\)$/.exec(text))) return [pad + `wait until ${r.cond(m[1])}`];
    // assignment: name = expr  /  name = bw_num(bw_n(name) + expr)
    if ((m = /^([A-Za-z_]\w*)\s*=\s*(.+)$/s.exec(text))) {
        const target = r.name(m[1]);
        if (/^bw_ask\(/.test(m[2].trim())) {
            const call = asCall(m[2].trim());
            return [pad + `ask ${r.expr(call.args[0])} and wait`];
        }
        return [pad + `set ${target} to ${r.expr(m[2])}`];
    }
    const call = asCall(text);
    if (!call) { r.warn(`cannot read statement ${text}`); return []; }
    const listOps = {
        bw_list_add: (a) => `add ${r.expr(a[1])} to ${r.listName(a[0])}`,
        bw_list_delete: (a) => `delete ${r.expr(a[1])} of ${r.listName(a[0])}`,
        bw_list_delete_all: (a) => `delete all of ${r.listName(a[0])}`,
        bw_list_insert: (a) => `insert ${r.expr(a[2])} at ${r.expr(a[1])} of ${r.listName(a[0])}`,
        bw_list_replace: (a) => `replace item ${r.expr(a[1])} of ${r.listName(a[0])} with ${r.expr(a[2])}`,
    };
    if (listOps[call.name]) return [pad + listOps[call.name](call.args.map(stripCast))];
    if (call.name === 'bw_change') {
        return [pad + `change ${r.listName(call.args[0])} by ${r.expr(call.args[1])}`];
    }
    if (call.name === 'bw_wait') return [pad + `wait ${r.expr(call.args[0])} seconds`];
    if (call.name === 'scratch_defblock') return [];
    if (call.name.startsWith('scratch_')) {
        const method = call.name.slice('scratch_'.length);
        if (STRUCTURAL.has(method)) return [];
        const p = r.scratch(call.name, call.args);
        return p ? [pad + p] : [];
    }
    // A call to another generated function is a custom-block call. Its proccode
    // carries where the arguments sit among the label words, which a flat C name
    // cannot: `set cell %s %s to %s` is called `set cell 3 4 to 7`.
    const proccode = r.procs.get(call.name);
    if (proccode) {
        let k = 0;
        const args = call.args.map((a) => r.expr(a));
        const text = String(proccode).replace(/%[sb]/g, () => {
            const v = args[k++];
            return v === undefined ? '' : v;
        }).replace(/\s+/g, ' ').trim();
        return [pad + text];
    }
    const bare = stripSpritePrefix(call.name).replace(/^do_/, '').replace(/_/g, ' ');
    r.warn(`call to ${call.name} has no DEFINE marker`);
    return [pad + (call.args.length
        ? `${bare} ${call.args.map((a) => r.expr(a)).join(' ')}` : bare)];
}

function stripCast(a) { return String(a).replace(/^\(int\)\s*/, '').trim(); }

export { Reader };
