/**
 * The statement rules of `parseCommand`, enumerated from the source, and a
 * census that drives every MULTI-SLOT rule with unbracketed multi-word
 * reporters (task D6).
 *
 * A multi-slot rule is one with a value slot (`val(match[n])`) that has another
 * capture group after it: `set voxel (\S+) (\S+) (\S+) to (.+)`, `start tank
 * (\S+) (\S+)`, `insert (.+?) at (.+?) of (.+)`. Every slot of a statement reads
 * one term, so a reporter written without brackets — `pick random 1 to 10`,
 * `round a`, `x position`, `a + 1` — either fits nowhere (the rule does not
 * match, and D5 refuses the line) or, worse, its words land in the next slots
 * and the line builds a block with the wrong values. The census finds the
 * second outcome.
 *
 * Each cell is one (rule, slot, probe, shape):
 *  - shape `keep`: the reporter in the slot, the other slots kept — the task's
 *    own `set voxel pick random 1 to 10 1 1 to 1`;
 *  - shape `fit`: the reporter's extra words take the place of the following
 *    positional value slots, so the word count FITS (`set voxel round a 5 to 5`).
 * Outcomes: `ok` (the statement's own block, holding the reporter), `refused`
 * (UnparsedLinesError), `WRONG VALUE` (its block without the reporter),
 * `WRONG BLOCK (op)`, `NO BLOCK`; a rule with no instance is `NO INSTANCE`.
 */
import fs from 'node:fs';
import * as acorn from 'acorn';

/** Every `if ((match = matchTopLevel(line, /re/)…))` rule in parseCommand. */
export function statementRules(srcText) {
    const ast = acorn.parse(srcText, { ecmaVersion: 'latest', sourceType: 'module' });
    let parseCommand = null;
    (function find(n) {
        if (!n || typeof n !== 'object' || parseCommand) return;
        if (n.type === 'MethodDefinition' && n.key.name === 'parseCommand') { parseCommand = n; return; }
        for (const k in n) {
            const v = n[k];
            if (Array.isArray(v)) v.forEach(find); else if (v && typeof v.type === 'string') find(v);
        }
    })(ast);
    if (!parseCommand) throw new Error('parseCommand not found');
    const rules = [];
    (function walk(n) {
        if (!n || typeof n !== 'object') return;
        if (n.type === 'IfStatement') {
            const calls = [];
            (function c(x) {
                if (!x || typeof x !== 'object') return;
                if (x.type === 'CallExpression' && x.callee.name === 'matchTopLevel' && x.arguments[0]
                    && x.arguments[0].name === 'line' && x.arguments[1] && x.arguments[1].regex) calls.push(x.arguments[1].regex);
                for (const k in x) {
                    const v = x[k];
                    if (Array.isArray(v)) v.forEach(c); else if (v && typeof v.type === 'string') c(v);
                }
            })(n.test);
            if (calls.length === 1) {
                const body = srcText.slice(n.consequent.start, n.consequent.end);
                const valSlots = [...new Set([...body.matchAll(/\bval\(match\[(\d+)\]/g)].map((m) => +m[1]))];
                const re = new RegExp(calls[0].pattern, calls[0].flags);
                const groups = new RegExp(`${re.source}|`).exec('').length - 1;
                const op = (body.match(/(?:cmd|createBlock)\('(\w+)'/) || [])[1];
                rules.push({ re, groups, valSlots, op, line: srcText.slice(0, n.start).split('\n').length });
            }
        }
        for (const k in n) {
            const v = n[k];
            if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === 'string') walk(v);
        }
    })(parseCommand.value.body);
    return rules;
}

export const isMultiSlot = (r) => r.valSlots.some((s) => s < r.groups);

/** The line with the insides of (…) and "…" masked, as matchTopLevel sees it. */
export function maskLine(line) {
    let depth = 0, inStr = false, m = '';
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inStr && ch === '\\' && i + 1 < line.length) { m += '\u0001\u0001'; i++; continue; }
        if (ch === '"') { inStr = !inStr; m += ch; continue; }
        if (!inStr && ch === '(') { depth++; m += depth === 1 ? ch : '\u0001'; continue; }
        if (!inStr && ch === ')') { m += depth === 1 ? ch : '\u0001'; depth = Math.max(0, depth - 1); continue; }
        m += (inStr || depth > 0) ? '\u0001' : ch;
    }
    return m;
}

// A crude sample from the rule itself: literals kept, a group -> `5`,
// an alternation -> its first branch, a character class -> its first letter.
function synth(re) {
    let s = re.source.replace(/^\^/, '').replace(/\$$/, '');
    s = s.replace(/\(\?:[^()]*\)\?/g, '');
    s = s.replace(/\\s\*|\\s\+|\\s/g, ' ');
    s = s.replace(/\((?:\\S\+\??|\.\+\??|\.\*\??|\\d\+|[^()|]*\\d[^()|]*)\)/g, '5');
    s = s.replace(/\(([^()|]+)\|[^()]*\)/g, '$1');
    s = s.replace(/\(\?:([^()|]+)\|[^()]*\)/g, '$1');
    s = s.replace(/\[\^?\\?(\w)[^\]]*\]\??/g, '$1').replace(/\\(.)/g, '$1').replace(/[?*+]/g, '').replace(/[()]/g, '');
    return s.replace(/ +/g, ' ').trim();
}

// Instances no synthesis reaches, by hand: [rule source contains, device, line].
const HAND = [
    ['set\\s+buzzer', 'DEVICE MICROBIT', 'set buzzer to 440 hz for 100 ms'],
    ['play\\s+tone', 'DEVICE MICROBIT', 'play tone 440 hz for 100 ms'],
    ['range', '', 'new array "xs" = range 1 to 10'],
    ['^push', '', 'push 5 to array "xs"'],
    ['set item\\s+row', '', 'set item row 1 col 2 of array "xs" to 5'],
    ['^set item\\s+(.+?)\\s+of array', '', 'set item 1 of array "xs" to 5'],
    ['^insert\\s+(.+?)\\s+at\\s+(.+?)\\s+of array', '', 'insert 5 at 1 of array "xs"'],
    ['^remove item', '', 'remove item 1 of array "xs"'],
    ['^add\\s', '', 'add 5 to things'],
    ['^delete\\s', '', 'delete 1 of things'],
];
// Preambles a rule may need (its device, or the part its verb addresses).
const PRE = ['', 'DEVICE SPIKE', 'DEVICE MICROBIT', 'DEVICE STC12C5A60S2\nLEDCUBE 4', 'DEVICE EV3',
    'DEVICE STC89C52RC\nPART w = SEVENSEG8 SEGMENTS P0 SELECT P2.2 P2.3 P2.4',
    'DEVICE STC89C52RC\nPART w = LEDBANK8 ON P1',
    'DEVICE STC89C52RC\nPART screen = MATRIX8X8 ROWS 74HC595 DATA P3.4 CLOCK P3.6 LATCH P3.5 COLUMNS P0'];

export const SPILL_PROBES = [
    // an unbracketed multi-word reporter, and the opcode the slot should hold
    ['pick random 1 to 10', 'operator_random'],
    ['round a', 'operator_round'],
    ['abs of a', 'operator_mathop'],
    ['x position', 'motion_xposition'],
    ['length of a', 'operator_length'],
    ['item 1 of things', 'data_itemoflist'],
    ['letter 1 of a', 'operator_letter_of'],
    ['a + 1', 'operator_add'],
    ['a mod 2', 'operator_mod'],
];

function build(SB3Creator, device, decls, line) {
    const prog = `${device ? `${device}\n` : ''}${decls.join('\n')}\nLIST things\nWHEN flag clicked:\n  set a to 3\n  ${line}\n`;
    const c = new SB3Creator();
    try { c.parse(prog); } catch (e) {
        if (e.code !== 'DIALECT_UNPARSED_LINES') throw e;
        return { refused: (e.lines.find((x) => x.text === line) || e.lines[0]).reason };
    }
    const all = {};
    for (const t of c.project.targets) Object.assign(all, t.blocks);
    const set = Object.values(all).find((b) => b.opcode === 'data_setvariableto' && b.fields.VARIABLE[0] === 'a');
    return { all, stmt: set && all[set.next] };
}

function holdsOp(all, stmt, op) {
    const seen = new Set();
    const walk = (b) => {
        for (const input of Object.values(b.inputs || {})) {
            const ref = typeof input[1] === 'string' ? input[1] : null;
            if (ref && all[ref] && !seen.has(ref)) {
                seen.add(ref);
                if (all[ref].opcode === op || walk(all[ref])) return true;
            }
        }
        return false;
    };
    return walk(stmt);
}

/**
 * The census. `corpus` is a list of {text, device, decls} programs to take
 * real instances from (a rule's first matching statement line wins).
 */
export function slotSpillCensus(SB3Creator, srcText, corpus = []) {
    const rules = statementRules(srcText);
    const multi = rules.filter(isMultiSlot);
    const instances = new Map();
    for (const prog of corpus) {
        for (const raw of prog.text.split(/\r?\n/)) {
            if (!/^\s+\S/.test(raw)) continue;
            const l = raw.trim();
            const m = maskLine(l);
            for (const r of multi) {
                if (instances.has(r)) continue;
                r.re.lastIndex = 0;
                if (r.re.test(m)) { instances.set(r, [prog.device, prog.decls, l]); break; }
            }
        }
    }
    const rows = [];
    for (const r of multi) {
        const tries = instances.has(r) ? [instances.get(r)] : [];
        for (const [k, dev, l] of HAND) if (r.re.source.includes(k)) tries.push([dev, [], l]);
        const s = synth(r.re);
        for (const p of PRE) tries.push([p, [], s]);
        let base = null, ctx = null;
        for (const [device, decls, line] of tries) {
            r.re.lastIndex = 0;
            if (!r.re.test(maskLine(line))) continue;
            const b = build(SB3Creator, device, decls, line);
            if (b.stmt && (!r.op || b.stmt.opcode === r.op)) { base = b; ctx = { device, decls, line }; break; }
        }
        if (!base) { rows.push({ rule: r.line, re: String(r.re), outcome: 'NO INSTANCE', sample: s }); continue; }
        const m = new RegExp(r.re.source, `${r.re.flags.replace('g', '')}d`).exec(maskLine(ctx.line));
        for (const slot of r.valSlots) {
            if (slot >= r.groups || !m.indices[slot]) continue;
            if (!m.indices.slice(slot + 1).some(Boolean)) continue;   // nothing after it in this instance
            for (const [probe, op] of SPILL_PROBES) {
                const [a, b] = m.indices[slot];
                const variants = [['keep', ctx.line.slice(0, a) + probe + ctx.line.slice(b)]];
                const extra = probe.split(' ').length - 1;
                const span = m.indices.slice(slot, slot + extra + 1);
                const positional = extra > 0 && span.length === extra + 1 && span.every(Boolean)
                    && span.every((sp, i) => i === 0 || /^\s+$/.test(ctx.line.slice(span[i - 1][1], sp[0])))
                    && span.every((sp, i) => r.valSlots.includes(slot + i));
                if (positional) variants.push(['fit', ctx.line.slice(0, a) + probe + ctx.line.slice(span[extra][1])]);
                for (const [shape, line] of variants) {
                    const got = build(SB3Creator, ctx.device, ctx.decls, line);
                    let outcome;
                    if (got.refused) outcome = 'refused';
                    else if (!got.stmt) outcome = 'NO BLOCK';
                    else if (got.stmt.opcode !== base.stmt.opcode) outcome = `WRONG BLOCK (${got.stmt.opcode})`;
                    else if (holdsOp(got.all, got.stmt, op)) outcome = 'ok';
                    else outcome = 'WRONG VALUE';
                    rows.push({ rule: r.line, re: String(r.re), opcode: base.stmt.opcode, slot, shape, probe, line, outcome,
                        reason: got.refused });
                }
            }
        }
    }
    return { rules: rules.length, multiSlot: multi.length, instancesFromCorpus: instances.size, rows };
}

/** Programs of a directory tree of `.bw` files, as census corpus entries. */
export function corpusFrom(files) {
    return files.map((f) => {
        const text = fs.readFileSync(f, 'utf8');
        const lines = text.split(/\r?\n/);
        return {
            text,
            device: (lines.find((l) => /^\s*DEVICE\s/i.test(l)) || '').trim(),
            decls: lines.filter((l) => /^\s*(PIN|PORT|PART|TABLE|LEDCUBE|MAP|CHIP|CLOCK|LIST|GLOBAL)\b/i.test(l)).map((l) => l.trim()),
        };
    });
}
