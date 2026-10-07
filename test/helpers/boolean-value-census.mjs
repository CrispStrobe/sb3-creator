/**
 * Every Boolean form of the dialect, driven in every value position (task D7).
 *
 * A Boolean FORM is anything the dialect reads as a truth value: the forms of
 * parseCondition's grammar (comparisons, and / or / not, the predicate words —
 * touching, key pressed, mouse down, contains, the device predicates, the
 * keypad phrases), and the Boolean reporters the value grammar reads as
 * blocks (micro:bit, SPIKE, EV3, MATRIX8X8, Arcade / array-reference words,
 * a Boolean custom-block parameter). BOOLEAN_FORMS lists one instance of
 * each; `formOpcodeCensus` (in the test) checks that every Boolean opcode the
 * parser can build has a form here, so the list cannot fall behind silently.
 *
 * A VALUE position is anywhere parseValue reads: every value slot of every
 * statement rule of parseCommand (enumerated from the source by
 * statement-rules.mjs), every value slot of the EV3 and Arcade command words,
 * a custom-block argument, and an operand of a value expression.
 *
 * Each cell is classified by what the statement's slot ended up holding:
 *   value          a Boolean block in the round slot (Scratch's own shape)
 *   text           the literal text of the form
 *   variable       a variable named after the form (nothing writes it)
 *   refused        parse() threw UnparsedLinesError for the line
 *   error          parse() threw anything else
 *   other          none of the above (named)
 * each with `+warning` when the parser warned on the line and ` SILENT`
 * when it did not (value cells are never called silent: a block is a block).
 */
import fs from 'node:fs';
import { statementRules, maskLine, valueSlotInstances } from './statement-rules.mjs';
import { EV3_WORDS } from '../../src/utils/ev3Dialect.js';
import { ARCADE_WORDS } from '../../src/utils/arcadeDialect.js';

const MB = 'DEVICE MICROBIT';
const SPIKE = 'DEVICE SPIKE';
const EV3 = 'DEVICE EV3';
const KEYPAD = 'DEVICE STC12C5A60S2\nPART keys = KEYPAD4X4 ROWS P1.7 P1.6 P1.5 P1.4 COLS P1.3 P1.2 P1.1 P1.0';
const MATRIX = 'DEVICE STC89C52RC\nPART screen = MATRIX8X8 ROWS 74HC595 DATA P3.4 CLOCK P3.6 LATCH P3.5 COLUMNS P0';
const UNO_BTN = 'DEVICE ARDUINO-UNO\nCLOCK 16000000\nPIN btn = D2 INPUT ACTIVE LOW';

/**
 * [family, form, device preamble, Boolean opcode the form builds as a condition].
 * `inProc` marks a form that only exists inside a DEFINE (a Boolean parameter).
 */
export const BOOLEAN_FORMS = [
    // ---- operators (parseCondition) ----
    ['operator', 'a < b', '', 'operator_lt'],
    ['operator', 'a > b', '', 'operator_gt'],
    ['operator', 'a = b', '', 'operator_equals'],
    ['operator', 'a != b', '', 'operator_not'],
    ['operator', 'a <= b', '', 'operator_not'],
    ['operator', 'a >= b', '', 'operator_not'],
    ['operator', 'a > 1 and b < 2', '', 'operator_and'],
    ['operator', '(a > 1) and (b < 2)', '', 'operator_and'],
    ['operator', 'a > 1 or b < 2', '', 'operator_or'],
    ['operator', '(a > 1) or (b < 2)', '', 'operator_or'],
    ['operator', 'not (a > b)', '', 'operator_not'],
    ['operator', 'not a > b', '', 'operator_not'],
    ['operator', 'not (touching edge)', '', 'operator_not'],
    ['operator', 'not touching edge', '', 'operator_not'],
    ['operator', 'not (mouse down?)', '', 'operator_not'],
    ['operator', 'not read btn', UNO_BTN, 'operator_not'],
    // ---- predicate words (parseCondition) ----
    ['predicate', 'a is multiple of 3', '', 'planetemaths_multiple'],
    ['predicate', 'array "xs" contains 5', '', 'arrays_contains'],
    ['predicate', 'things contains 5', '', 'data_listcontainsitem'],
    ['predicate', '"abc" contains "b"', '', 'operator_contains'],
    ['predicate', 'touching edge', '', 'sensing_touchingobject'],
    // The value grammar splits `mouse-pointer` at its `-` (subtraction) before
    // anything else: what warns is the left operand, `touching mouse`.
    ['predicate', 'touching mouse-pointer', '', 'sensing_touchingobject', { splitsAt: 'touching mouse' }],
    ['predicate', 'touching color #ff0000', '', 'sensing_touchingcolor'],
    ['predicate', 'key space pressed?', '', 'sensing_keypressed'],
    ['predicate', 'key space pressed', '', 'sensing_keypressed'],
    ['predicate', 'mouse down?', '', 'sensing_mousedown'],
    ['predicate', 'mouse down', '', 'sensing_mousedown'],
    ['predicate', '"btn" pressed?', '', 'devices_pressed'],
    ['predicate', 'light above 50', '', 'devices_above'],
    ['predicate', 'sonar closer than 10', '', 'devices_closer'],
    ['predicate', 'motion detected on pir', '', 'devices_motion'],
    ['predicate', 'tilt tilted?', '', 'devices_tilted'],
    ['predicate', 'relay energised?', '', 'devices_energised'],
    ['predicate', 'a key is pressed', KEYPAD, 'operator_not'],
    ['predicate', 'key 3 is pressed', KEYPAD, 'operator_equals'],
    ['predicate', 'key 3 is released', KEYPAD, 'operator_not'],
    // ---- Boolean reporters (read by the value grammar too) ----
    ['reporter', 'flag', '', 'argument_reporter_boolean', { inProc: true }],
    ['reporter', 'button a pressed', MB, 'microbitplus_isbutton'],
    ['reporter', 'read button_a', MB, 'microbitplus_isbutton'],
    ['reporter', 'shake happening', MB, 'microbitplus_isgesture'],
    ['reporter', 'pin P0 touched', MB, 'microbitplus_istouch'],
    ['reporter', 'pin P0 is high', MB, 'microbitplus_ispinhigh'],
    ['reporter', 'logo touched', MB, 'microbitplus_islogo'],
    ['reporter', 'game is over', MB, 'microbitplus_isgameover'],
    ['reporter', 'game is running', MB, 'microbitplus_isrunning'],
    ['reporter', 'game is paused', MB, 'microbitplus_ispaused'],
    ['reporter', 'point x 1 y 2', MB, 'microbitplus_point'],
    ['reporter', 'pixel x 1 y 2 of image img', MB, 'microbitplus_imagepixel'],
    ['reporter', 'sprite s touching edge', MB, 'microbitplus_spritetouchingedge'],
    ['reporter', 'sprite s touching sprite t', MB, 'microbitplus_spritetouching'],
    ['reporter', 'sprite s deleted', MB, 'microbitplus_spritedeleted'],
    ['reporter', 'spike force sensor A pressed', SPIKE, 'spikeprime_isForceSensorPressed'],
    ['reporter', 'spike button left pressed', SPIKE, 'spikeprime_isButtonPressed'],
    ['reporter', 'spike gesture shaken', SPIKE, 'spikeprime_isGesture'],
    ['reporter', 'spike color A is red', SPIKE, 'spikeprime_isColor'],
    ['reporter', 'pixel 1 2 is on', MATRIX, 'stc12_matrix_getpx'],
    ...EV3_WORDS.filter((w) => w.kind === 'boolean').map((w) => ['reporter', fillWord(w.words), EV3, `ev3comprehensive_${w.op}`]),
    ...ARCADE_WORDS.filter((w) => w.kind === 'boolean' && !w.alias).map((w) => ['reporter', fillWord(w.words), '', w.op]),
].map(([family, form, device, opcode, opts = {}]) => ({ family, form, device, opcode, ...opts }));

/** A word of a dialect table with every slot filled by a plain instance. */
export function fillWord(words, fill = {}) {
    return words.replace(/\{([A-Z0-9_]+)(?::([^}]+))?\}/g, (m, n, spec) => {
        if (n in fill) return fill[n];
        if (spec === 'motor') return 'B';
        if (spec === 'sensor') return '3';
        if (spec === 'name') return 'nm';
        if (spec === 'bool' || spec === 'cond') return '1';
        if (spec?.startsWith('menu:')) return spec.split(':')[2].split('|')[0];
        if (spec && spec.startsWith('text:')) return spec.slice(5).split('|')[0];
        // Quoted choices can themselves contain '=' (e.g. Arrays '==').
        // Only unquoted legacy slots use '=' to separate a default.
        if (spec?.startsWith('"')) return spec.split('|')[0];
        if (spec) return spec.split('|')[0].split('=')[0];
        return '5';
    });
}

/** Every Boolean opcode a form builds, plus Scratch's own Boolean shapes. */
export const BOOLEAN_OPCODES = new Set([
    'operator_lt', 'operator_gt', 'operator_equals', 'operator_and', 'operator_or', 'operator_not',
    'operator_contains', 'data_listcontainsitem', 'sensing_touchingobject', 'sensing_touchingcolor',
    'sensing_keypressed', 'sensing_mousedown', 'argument_reporter_boolean',
    ...BOOLEAN_FORMS.map((f) => f.opcode),
]);

const MARK = 'zzmark';

/** One program: the form's device, the slot's declarations, a marker, the line. */
export function program(form, line, { device = '', decls = [] } = {}) {
    const dev = form.device || device;
    const head = [dev, ...decls.filter((d) => !(form.device && /^(DEVICE|CLOCK)\b/i.test(d)))].filter(Boolean).join('\n');
    const body = `  set a to 3\n  set b to 4\n  set ${MARK} to 1\n  ${line}\n`;
    if (form.inProc) {
        return `${head}\nLIST things\nDEFINE probe <flag>:\n${body}WHEN flag clicked:\n  probe (1 = 1)\n`;
    }
    return `${head}\nLIST things\nWHEN flag clicked:\n${body}`;
}

/** Parse, and find the statement after the marker. */
export function build(SB3Creator, src) {
    const c = new SB3Creator();
    try {
        c.parse(src);
    } catch (e) {
        if (e.code === 'DIALECT_UNPARSED_LINES') return { refused: e.lines.map((l) => l.reason).join(' | '), c };
        return { error: `${e.name}: ${e.message}`, c };
    }
    const all = {};
    for (const t of c.project.targets) Object.assign(all, t.blocks);
    const mark = Object.values(all).find((b) => b.opcode === 'data_setvariableto' && b.fields.VARIABLE[0] === MARK);
    const variables = new Set();
    for (const t of c.project.targets) for (const v of Object.values(t.variables || {})) variables.add(v[0]);
    return { c, all, stmt: mark && all[mark.next], variables, warnings: c.warnings.slice() };
}

/** The literal texts, variables and Boolean blocks a statement holds (any depth). */
function contents(all, stmt, only = null) {
    const out = { texts: [], vars: [], bools: [] };
    const seen = new Set();
    const walk = (b, top = false) => {
        for (const [key, input] of Object.entries(b.inputs || {})) {
            if (top && only && key !== only) continue;
            if (!Array.isArray(input)) continue;
            for (const part of input.slice(1)) {
                if (Array.isArray(part)) {
                    if (part[0] === 10) out.texts.push(String(part[1]));
                    if (part[0] === 12) out.vars.push(String(part[1]));
                } else if (typeof part === 'string' && all[part] && !seen.has(part)) {
                    seen.add(part);
                    const child = all[part];
                    if (BOOLEAN_OPCODES.has(child.opcode)) out.bools.push(child.opcode);
                    if (child.opcode === 'data_variable') out.vars.push(child.fields.VARIABLE[0]);
                    walk(child);
                }
            }
        }
    };
    walk(stmt, true);
    return out;
}

const SENTINEL = 'zzslot';

/** The input of the statement a slot fills: the one holding the sentinel text. */
export function slotInput(all, stmt) {
    for (const key of Object.keys(stmt.inputs || {})) {
        if (contents(all, stmt, key).texts.includes(SENTINEL)) return key;
    }
    return null;
}

const norm = (s) => String(s).replace(/^\(+|\)+$/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * Classify a statement built from `line` with `form` in a value slot.
 * `baseline` (the same line with a plain number in the slot) tells a block
 * the statement always holds from one the form brought.
 */
export function classify(SB3Creator, form, pos, text, ctx) {
    return classifyProgram(SB3Creator, form, program(form, pos.line(text), ctx), pos.opcode,
        program(form, pos.line(`"${SENTINEL}"`), ctx));
}

/** The value positions, each a function form -> [{position, line, ctx, opcode}]. */
export function valuePositions(SB3Creator, srcText, corpus) {
    const positions = [];
    // Every value slot of every statement rule (statement-rules.mjs).
    for (const inst of valueSlotInstances(SB3Creator, srcText, corpus)) {
        positions.push({
            family: 'statement', name: `${inst.opcode} slot ${inst.slot} (line ${inst.rule})`,
            device: inst.device, decls: inst.decls, opcode: inst.opcode,
            line: (text) => inst.line.slice(0, inst.span[0]) + text + inst.line.slice(inst.span[1]),
            last: inst.last,
        });
    }
    // Every value slot of every EV3 command word.
    for (const w of EV3_WORDS.filter((e) => e.kind === 'command')) {
        for (const [, name, spec] of w.words.matchAll(/\{([A-Z0-9_]+)(?::([^}]+))?\}/g)) {
            if (spec) continue;
            positions.push({
                family: 'ev3', name: `ev3comprehensive_${w.op}.${name}`, device: EV3, decls: [], opcode: `ev3comprehensive_${w.op}`,
                line: (text) => fillWord(w.words, { [name]: text }),
                last: new RegExp(`\\{${name}\\}$`).test(w.words),
            });
        }
    }
    // Every plain value slot of every Arcade / array-reference command word.
    for (const w of ARCADE_WORDS.filter((e) => e.kind === 'command' && !e.alias)) {
        for (const [, name, spec] of w.words.matchAll(/\{([A-Z0-9_]+)(?::([^}]+))?\}/g)) {
            if (spec) continue;   // fields, names, and the slots that TAKE a condition
            positions.push({
                family: 'arcade', name: `${w.op}.${name}`, device: '', decls: [], opcode: w.op,
                line: (text) => fillWord(w.words, { [name]: text }),
                last: new RegExp(`\\{${name}\\}$`).test(w.words),
            });
        }
    }
    // A custom-block argument, and an operand of a value expression.
    positions.push({ family: 'procedure', name: 'custom-block argument', device: '', decls: ['DEFINE show (v):\n  say v'],
        opcode: 'procedures_call', line: (text) => `show ${text}`, last: false, paren: true });
    positions.push({ family: 'operand', name: 'operand of +', device: '', decls: [], opcode: 'data_setvariableto',
        line: (text) => `set v to ${text} + 1`, last: false, paren: true });
    positions.push({ family: 'operand', name: 'operand of join', device: '', decls: [], opcode: 'data_setvariableto',
        line: (text) => `set v to join ${text} "!"`, last: false, paren: true });
    return positions;
}

/**
 * The census: every form in every compatible position, parenthesised, and bare
 * where the slot is the last thing on the line (`set x to a < b`).
 */
export function booleanValueCensus(SB3Creator, srcText, corpus = [], forms = BOOLEAN_FORMS) {
    const positions = valuePositions(SB3Creator, srcText, corpus);
    const rows = [];
    for (const form of forms) {
        for (const pos of positions) {
            // A device form goes where that device is (or no device is).
            const posDevice = (pos.device || '').split('\n')[0].trim();
            const formDevice = (form.device || '').split('\n')[0].trim();
            if (formDevice && posDevice && formDevice !== posDevice) continue;
            if (pos.family === 'procedure' && form.inProc) continue;
            const decls = pos.family === 'procedure' ? [] : pos.decls;
            const ctx = { device: pos.device, decls };
            const shapes = [['paren', `(${form.form})`]];
            if (pos.last) shapes.push(['bare', form.form]);
            for (const [shape, text] of shapes) {
                const src = pos.line(text);
                let res;
                if (pos.family === 'procedure') {
                    const prog = (t) => `${form.device || ''}\nLIST things\nDEFINE show (v):\n  say v\nWHEN flag clicked:\n  set a to 3\n  set b to 4\n  set ${MARK} to 1\n  ${pos.line(t)}\n`;
                    res = classifyProgram(SB3Creator, form, prog(text), pos.opcode, prog(`"${SENTINEL}"`));
                } else {
                    res = classify(SB3Creator, form, pos, text, ctx);
                }
                rows.push({ family: form.family, form: form.form, position: pos.name, positionFamily: pos.family, shape, line: src, ...res });
            }
        }
    }
    return { positions: positions.length, rows };
}

const BASELINES = new Map();

function classifyProgram(SB3Creator, form, prog, expectOpcode, baseProg) {
    if (!BASELINES.has(baseProg)) BASELINES.set(baseProg, build(SB3Creator, baseProg));
    const base = BASELINES.get(baseProg);
    if (!base.stmt || base.stmt.opcode !== expectOpcode) return { outcome: 'no baseline', reason: base.refused || base.error };
    const key = slotInput(base.all, base.stmt);
    if (!key) return { outcome: 'no baseline', reason: 'the slot is not a value input' };
    const got = build(SB3Creator, prog);
    if (got.refused) return { outcome: 'refused', reason: got.refused };
    if (got.error) return { outcome: 'error', reason: got.error };
    if (!got.stmt) return { outcome: 'other (no statement)' };
    if (expectOpcode && got.stmt.opcode !== expectOpcode) return { outcome: `other (built ${got.stmt.opcode})` };
    const before = new Set(base.warnings.map((w) => w.replace(/^Line \d+: /, '')));
    const warnings = got.warnings.filter((w) => !before.has(w.replace(/^Line \d+: /, '')));
    const warned = warnings.length > 0;
    const tag = (kind) => `${kind}${warned ? '+warning' : ' SILENT'}`;
    // A custom block's inputs are keyed by generated ids: match by position.
    const at = Object.keys(base.stmt.inputs).indexOf(key);
    const has = contents(got.all, got.stmt, base.stmt.opcode === 'procedures_call' ? Object.keys(got.stmt.inputs)[at] : key);
    const f = norm(form.form);
    if (has.bools.length) return { outcome: warned ? 'value+warning' : 'value', warnings };
    if (has.texts.some((t) => norm(t) === f || norm(t).includes(f))) return { outcome: tag('text'), warnings };
    const phantom = has.vars.find((v) => norm(v) === f || f.includes(norm(v)) && /\s/.test(v));
    if (phantom) return { outcome: tag('variable'), warnings, variable: phantom };
    return { outcome: tag('other'), warnings, detail: JSON.stringify(has) };
}

/** Rows grouped as form-family x position-family -> outcome counts. */
export function tabulate(rows, key = (r) => `${r.family} | ${r.positionFamily}`) {
    const t = {};
    for (const r of rows) {
        const k = key(r);
        t[k] = t[k] || {};
        t[k][r.outcome] = (t[k][r.outcome] || 0) + 1;
    }
    return t;
}

export { maskLine, statementRules, fs };
