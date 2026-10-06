/**
 * Every Boolean form in every value position follows ONE rule (task D7).
 *
 * THE DEFECT (found by E3, Lite #665). `set x to a < b` kept the comparison as
 * TEXT with a warning, per docs/BOOLEAN-IN-VALUE-POSITION.md, but `set x to not
 * (a > b)` became the text `not (a > b)` with NO warning. Driven over the whole
 * set — every Boolean form of the dialect (helpers/boolean-value-census.mjs)
 * in every value position (every value slot of every statement rule, EV3 and
 * Arcade command word, a custom-block argument, an operand) — the silence was
 * not one form but most of them (2026-10-06, a69547b7, 38,260 cells):
 *
 *   comparisons, unbracketed and/or/not over one   text + warning
 *   `(a) and (b)`, `(a) or (b)`, `not (…)`         text, SILENT
 *   `not touching edge`, `not read btn`            a variable nothing writes, SILENT
 *   touching / key pressed / mouse down / contains /
 *   is multiple of / device predicates / keypad    text or a phantom variable, SILENT
 *   Boolean reporter WORDS (micro:bit, SPIKE, EV3,
 *   MATRIX8X8, Arcade, array reference, parameter) the Boolean block (a value)
 *
 * THE RULE (docs/BOOLEAN-IN-VALUE-POSITION.md, "The rule"). A value position
 * reads the VALUE grammar. A Boolean reporter WORD is part of it: its block in a
 * round slot, as Scratch allows. Every form of the CONDITION grammar has no
 * value form: the parser warns (one message, naming the branch form) and the
 * slot holds the literal text — never a phantom variable, never silence. A
 * name the program has (or writes anywhere) stays that name, and an operator
 * over names nothing has (`not found`) is a multi-word name, not a condition.
 */
import {describe, test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import SB3Creator from '../src/utils/sb3Creator.js';
import {corpusFrom} from './helpers/statement-rules.mjs';
import {BOOLEAN_FORMS, BOOLEAN_OPCODES, booleanValueCensus, tabulate} from './helpers/boolean-value-census.mjs';

const SRC = fs.readFileSync(new URL('../src/utils/sb3Creator.js', import.meta.url), 'utf8');
const EXAMPLES = new URL('../examples/', import.meta.url);
const corpus = corpusFrom(fs.readdirSync(EXAMPLES, {withFileTypes: true})
    .filter((d) => d.isDirectory())
    .flatMap((d) => fs.readdirSync(new URL(`${d.name}/`, EXAMPLES)).filter((f) => f.endsWith('.bw'))
        .map((f) => path.join(EXAMPLES.pathname, d.name, f))));

const parse = (src) => {
    const c = new SB3Creator();
    c.parse(src);
    return c;
};
const blocksOf = (c) => Object.assign({}, ...c.project.targets.map((t) => t.blocks));

describe('the forms are the whole set', () => {
    test('every Boolean opcode parseCondition builds has a form in the census', () => {
        const start = SRC.indexOf('    parseCondition(conditionStr, context) {');
        const end = SRC.indexOf('\n    unquote(s) {', start);
        assert.ok(start > 0 && end > start, 'parseCondition not found');
        const pushed = new Set([...SRC.slice(start, end).matchAll(/push\('(\w+)'/g)].map((m) => m[1]));
        // Reporters a condition wraps in a comparison (`read <pin>` is `read <pin> > 0`).
        for (const inner of ['stc12_read', 'stc12_readport']) pushed.delete(inner);
        assert.ok(pushed.size >= 20, `only ${pushed.size} opcodes found in parseCondition (counted 23 on 2026-10-06)`);
        const formOps = new Set(BOOLEAN_FORMS.map((f) => f.opcode));
        const missing = [...pushed].filter((op) => !formOps.has(op) && !BOOLEAN_OPCODES.has(op));
        assert.deepEqual(missing, [], 'a Boolean opcode of the condition grammar with no form in the census');
        for (const op of ['operator_lt', 'operator_gt', 'operator_equals', 'operator_and', 'operator_or']) {
            assert.ok(formOps.has(op), `no form builds ${op}`);
        }
    });

    test('every Boolean word of the EV3 and Arcade tables is a form', () => {
        const ops = new Set(BOOLEAN_FORMS.map((f) => f.opcode));
        // counted 2026-10-06: 5 EV3 Boolean words, 11 Arcade / array-reference Boolean words.
        assert.equal([...ops].filter((o) => o.startsWith('ev3comprehensive_')).length, 5);
        assert.equal([...ops].filter((o) => /^(arcade|arrays)_/.test(o) && o !== 'arrays_contains').length, 11);
    });
});

describe('the census: every form in every value position', () => {
    const {positions, rows} = booleanValueCensus(SB3Creator, SRC, corpus);

    test('it is the whole set, not a sample', () => {
        // counted 2026-10-06 at a69547b7 + D7: 434 value positions, 38,260 cells.
        assert.ok(positions >= 434, `only ${positions} value positions`);
        assert.ok(rows.length >= 38000, `only ${rows.length} cells (counted 38,260 on 2026-10-06)`);
    });

    // Cells where the bare line is claimed by ANOTHER statement (the slot is
    // not where the form lands), named so a new one is red.
    const OTHER_STATEMENT = new Set([
        'display text "abc" contains "b"',          // `display X` reads `text "abc" contains "b"`
        'display text "btn" pressed?',              // likewise
        'plot x 5 y 5 brightness pixel 1 2 is on',  // `plot x X y Y` (MATRIX preamble) claims it
    ]);

    test('a condition-grammar form is never silent: warning + literal text, or refused', () => {
        const split = new Set(BOOLEAN_FORMS.filter((f) => f.splitsAt).map((f) => f.form));
        const bad = rows.filter((r) => r.family !== 'reporter'
            && !['text+warning', 'refused', 'no baseline'].includes(r.outcome) && !OTHER_STATEMENT.has(r.line)
            && !(split.has(r.form) && r.outcome === 'other+warning'));
        assert.deepEqual(bad.slice(0, 10).map((r) => `${r.outcome}: ${r.line} (${r.position})`), [],
            `${bad.length} cells: ${JSON.stringify(tabulate(bad, (r) => r.form))}`);
        // and the warning is THE warning, naming the branch form
        for (const r of rows.filter((x) => x.outcome === 'text+warning' || x.outcome === 'other+warning')) {
            assert.ok(r.warnings.some((w) => /is a (COMPARISON|CONDITION) used where a value is expected/.test(w)
                && /branch on it and assign 1 or 0/.test(w)), `${r.line}: ${JSON.stringify(r.warnings)}`);
        }
    });

    test('a Boolean reporter word is a value: its block, no warning', () => {
        const bad = rows.filter((r) => r.family === 'reporter'
            && !['value', 'refused', 'no baseline'].includes(r.outcome) && !OTHER_STATEMENT.has(r.line));
        assert.deepEqual(bad.slice(0, 10).map((r) => `${r.outcome}: ${r.line}`), [], `${bad.length} cells`);
    });

    test('every form reaches the rule somewhere (no form is refused everywhere)', () => {
        const byForm = tabulate(rows, (r) => r.form);
        for (const f of BOOLEAN_FORMS) {
            const t = byForm[f.form] || {};
            const want = f.family === 'reporter' ? 'value' : f.splitsAt ? 'other+warning' : 'text+warning';
            assert.ok((t[want] || 0) > 100, `${f.form}: ${JSON.stringify(t)} (counted 2026-10-06: every form >= 400 cells)`);
        }
    });
});

describe('the rule, form by form', () => {
    const stage = (line, pre = '') => `${pre}\nLIST things\nWHEN flag clicked:\n  set a to 3\n  set b to 4\n  ${line}\n`;

    for (const f of BOOLEAN_FORMS.filter((x) => x.family !== 'reporter')) {
        test(`\`set v to ${f.form}\` warns, keeps the text, and round-trips`, () => {
            const c = parse(stage(`set v to ${f.form}`, f.device));
            assert.equal(c.warnings.length, 1, JSON.stringify(c.warnings));
            if (f.splitsAt) {
                assert.match(c.warnings[0], new RegExp(`^Line \\d+: "${f.splitsAt}" is a CONDITION`));
                return;
            }
            assert.match(c.warnings[0], new RegExp(`"${f.form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" is a (COMPARISON|CONDITION)`));
            const set = Object.values(blocksOf(c)).find((b) => b.opcode === 'data_setvariableto' && b.fields.VARIABLE[0] === 'v');
            assert.deepEqual(set.inputs.VALUE, [1, [10, f.form]]);
            const once = c.decompile();
            const again = parse(once);
            assert.deepEqual(again.warnings, [], 'the decompiled text is quoted text, and says nothing');
            assert.equal(again.decompile(), once, 'not a fixed point');
        });
    }

    for (const f of BOOLEAN_FORMS.filter((x) => x.family === 'reporter' && !x.inProc)) {
        test(`\`set v to ${f.form}\` is the Boolean block, and round-trips`, () => {
            const c = parse(stage(`set v to ${f.form}`, f.device));
            assert.deepEqual(c.warnings, []);
            const all = blocksOf(c);
            const set = Object.values(all).find((b) => b.opcode === 'data_setvariableto' && b.fields.VARIABLE[0] === 'v');
            assert.equal(all[set.inputs.VALUE[1]].opcode, f.opcode);
            const once = c.decompile();
            assert.equal(parse(once).decompile(), once);
        });
    }

    test('a Boolean parameter in a value slot is its reporter', () => {
        const c = parse('DEFINE probe <flag>:\n  set v to flag\nWHEN flag clicked:\n  probe (1 = 1)\n');
        assert.deepEqual(c.warnings, []);
        const all = blocksOf(c);
        const set = Object.values(all).find((b) => b.opcode === 'data_setvariableto');
        assert.equal(all[set.inputs.VALUE[1]].opcode, 'argument_reporter_boolean');
    });

    test('names stay names: one the program has, writes anywhere, or that only names phantoms', () => {
        for (const prog of [
            stage('set touching edge to 5\n  say touching edge'),    // has it
            stage('say mouse down\n  set mouse down to 1'),            // writes it later
            stage('say not found'),                                    // `found` is named nowhere
            stage('say salt and pepper'),                              // neither is `salt` / `pepper`
            stage('set high score to 10\n  say high score'),
        ]) {
            assert.deepEqual(parse(prog).warnings, [], prog);
        }
        // Words the cheap pre-filter sees (`pressed`, `touching`, `is pressed`)
        // in a name no condition reads: parseCondition's last resort hands the
        // same text back to the value grammar, which must not ask again (that
        // recursion did not end).
        for (const prog of [stage('say hello pressed'), stage('say door is pressed'), stage('say touching')]) {
            assert.deepEqual(parse(prog).warnings, [], prog);
        }
        // …while an operator over names the program HAS is a condition.
        assert.equal(parse(stage('say not a')).warnings.length, 1);
        assert.equal(parse(stage('say a and b')).warnings.length, 1);
    });

    test('a slot that TAKES a condition takes every condition form (Arcade `cond` / `bool` slots)', () => {
        const c = parse(stage('arcade say 5 text 5 for 5 ms animated (touching edge) text color 5 box color 5 mode "text"'));
        assert.deepEqual(c.warnings, []);
        assert.ok(Object.values(blocksOf(c)).some((b) => b.opcode === 'sensing_touchingobject'));
    });
});

describe('the decompiler writes a Boolean block in a round slot as its condition', () => {
    // A Scratch project may hold one (a hexagon dropped in a round slot). It
    // used to be written as its OPCODE, which re-read as a variable called
    // `operator_gt` — silently. Now it reads back as the condition, and the
    // rule above says so.
    for (const [cond, want] of [['a > b', 'a > b'], ['touching edge', 'touching edge'],
        ['not (mouse down?)', 'not (mouse down?)'], ['key space pressed?', 'key space pressed?']]) {
        test(`say <${cond}>`, () => {
            const c = parse(`WHEN flag clicked:\n  set a to 1\n  set b to 2\n  say 1\n  IF ${cond} THEN:\n    say 2\n`);
            const all = blocksOf(c);
            const say = Object.values(all).find((b) => b.opcode === 'looks_say' && b.inputs.MESSAGE[1][1] === '1');
            const iff = Object.values(all).find((b) => b.opcode === 'control_if');
            say.inputs.MESSAGE = [3, iff.inputs.CONDITION[1], [10, '']];
            const text = c.decompile();
            assert.match(text, new RegExp(`say \\(${want.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`));
            assert.doesNotMatch(text, /say \((operator|sensing)_/);
            assert.equal(parse(text).warnings.length, 1, 're-reading it warns instead of inventing a variable');
        });
    }
});
