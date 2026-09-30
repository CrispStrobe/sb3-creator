/**
 * An unbracketed multi-word reporter does not spill over a statement's
 * positional slots (task D6, found by D5).
 *
 * THE DEFECT. `set voxel pick random 1 to 10 1 1 to 1` built a block: X read
 * the variable `pick`, Y the variable `random`, Z the number 1, and the colour
 * the text "10 1 1 to 1" — a wrong block, no warning. Every slot of a statement
 * reads ONE term (D5), so a slot followed by another slot takes one word, and
 * a reporter written without brackets hands its words to the slots after it
 * whenever the word count happens to fit: `start tank round a b`, `set pixel
 * x position 100`, `set voxel a + 1 to 5` (Y = the text "+"), `insert 5 at
 * length of a of things` (index `length`, list `a of things`).
 *
 * THE FIX (refuseSpilledReporter in parseCommand's `val`). A slot that has
 * another slot after it and holds a bare infix operator, or a bare word from
 * which the line — read on past the slot's end — spells a reporter (the same
 * reporter grammar, tried with a rollback), is refused with the fix in the
 * message: put the reporter in parentheses.
 *
 * THE WHOLE SET. The census enumerates every parseCommand rule with a value
 * slot that has another group after it (71 on 2026-09-30) from the source, finds
 * an instance of each (the example corpus, else a hand-written or synthesized
 * line), and drives each such slot with nine unbracketed multi-word reporters,
 * both keeping the other slots and letting the reporter's words take their
 * place. Before: 101 cells built a WRONG VALUE. After: every cell is the
 * statement's own block holding the reporter, or a refusal.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import SB3Creator from '../src/utils/sb3Creator.js';
import {slotSpillCensus, corpusFrom} from './helpers/statement-rules.mjs';
import {EV3_WORDS} from '../src/utils/ev3Dialect.js';

const SRC = fs.readFileSync(new URL('../src/utils/sb3Creator.js', import.meta.url), 'utf8');
const EXAMPLES = new URL('../examples/', import.meta.url);
const corpus = corpusFrom(fs.readdirSync(EXAMPLES, {withFileTypes: true})
    .filter((d) => d.isDirectory())
    .flatMap((d) => fs.readdirSync(new URL(`${d.name}/`, EXAMPLES)).filter((f) => f.endsWith('.bw'))
        .map((f) => path.join(EXAMPLES.pathname, d.name, f))));

function refusal(src) {
    try {
        new SB3Creator().parse(src);
    } catch (e) {
        if (e.code === 'DIALECT_UNPARSED_LINES') return e;
        throw e;
    }
    return null;
}

test('the task\'s own line is refused, naming the reporter and the fix', () => {
    const e = refusal('LEDCUBE 4\nWHEN flag clicked:\n  set voxel pick random 1 to 10 1 1 to 1\n');
    assert.ok(e, 'it built a block');
    assert.deepEqual(e.lines.map((l) => l.text), ['set voxel pick random 1 to 10 1 1 to 1']);
    assert.match(e.lines[0].reason, /"pick random 1 to 10" is a reporter written without brackets/);
    assert.match(e.lines[0].reason, /\(pick random 1 to 10\)/);
    // …and the bracketed line reads, with the reporter in X.
    const c = new SB3Creator();
    c.parse('LEDCUBE 4\nWHEN flag clicked:\n  set voxel (pick random 1 to 10) 1 1 to 1\n');
    const all = Object.assign({}, ...c.project.targets.map((t) => t.blocks));
    const voxel = Object.values(all).find((b) => b.opcode === 'ledcube_setvoxel');
    assert.equal(all[voxel.inputs.X[1]].opcode, 'operator_random');
});

test('an infix operator spread over the slots is refused', () => {
    const e = refusal('LEDCUBE 4\nWHEN flag clicked:\n  set voxel a + 1 to 5\n');
    assert.ok(e);
    assert.match(e.lines[0].reason, /"\+" in an argument slot is the middle of an expression/);
});

test('names, numbers, texts and bracketed reporters in positional slots read as before', () => {
    for (const line of ['set voxel x y z to 1', 'set voxel 1 2 3 to pick random 1 to 10',
        'set voxel (round a) (x position) 3 to 1', 'set voxel -1 2 3 to "red"',
        'set voxel pick 2 3 to 1']) {
        // `pick` alone is a variable: nothing after it spells a reporter.
        assert.equal(refusal(`LEDCUBE 4\nWHEN flag clicked:\n  ${line}\n`), null, line);
    }
    // A name the program already has reads as that name when only the
    // positional slots make the other reading…
    assert.equal(refusal('DEVICE SPIKE\nWHEN flag clicked:\n  set round to 3\n  start tank round 50\n'), null);
    // …and is refused, as `(round 50)` or two slots, when it is not one.
    assert.match(refusal('DEVICE SPIKE\nWHEN flag clicked:\n  start tank round 50\n').lines[0].reason,
        /"round 50" is a reporter written without brackets/);
    // A reporter the line could only read by eating the rule's own keyword is
    // not an alternative: item k of the list board, even with a sprite board.
    assert.equal(refusal('LIST board\nSPRITE board:\n  WHEN flag clicked:\n    replace item k of board with 5\n'), null);
});

test('the probe creates nothing: a refused spill leaves no variable behind', () => {
    // Reading `pick random qq to zz` as a reporter creates the variables qq and
    // zz; the probe is rolled back, so the refused line leaves neither.
    const c = new SB3Creator();
    assert.throws(() => c.parse('LEDCUBE 4\nWHEN flag clicked:\n  set voxel pick random qq to zz 1 to 1\n'),
        (e) => e.code === 'DIALECT_UNPARSED_LINES' && /pick random qq to zz/.test(e.lines[0].reason));
    const names = c.project.targets.flatMap((t) => Object.values(t.variables || {}).map((v) => v[0]));
    assert.deepEqual(names.filter((n) => /^(qq|zz|pick|random)$/.test(n)), [], JSON.stringify(names));
});

test('every multi-slot rule, every slot, nine unbracketed reporters: ok or refused, never wrong', () => {
    const res = slotSpillCensus(SB3Creator, SRC, corpus);
    // counted 2026-09-30: 208 statement rules, 71 with a slot followed by another group.
    assert.ok(res.multiSlot >= 71, `only ${res.multiSlot} multi-slot rules (counted 71 on 2026-09-30)`);
    const noInstance = res.rows.filter((r) => r.outcome === 'NO INSTANCE');
    assert.deepEqual(noInstance.map((r) => `${r.rule}: ${r.re}`), [], 'rules the census could not drive');
    const wrong = res.rows.filter((r) => r.outcome !== 'ok' && r.outcome !== 'refused');
    assert.deepEqual(wrong.map((r) => `${r.opcode} slot ${r.slot} (${r.shape}): \`${r.line}\` -> ${r.outcome}`), []);
    const cells = res.rows.length;
    // counted 2026-09-30: 1122 cells (596 ok, 526 refused).
    assert.ok(cells >= 1122, `only ${cells} cells driven (counted 1122 on 2026-09-30)`);
});

test('EV3 words: a reporter spread over adjacent value slots is refused too', () => {
    // The EV3 table (ev3Dialect.js) reads a value slot as one token. Every
    // command word with two or more value slots, each slot but the last driven
    // with an unbracketed reporter whose words take the next slots' places.
    // Before: 34 of 105 cells built the word with the wrong values
    // (`draw brick rectangle round a 5 outline`: x = round, y = a).
    const probes = [['round a', 'operator_round'], ['x position', 'motion_xposition'],
        ['abs of a', 'operator_mathop'], ['a + 1', 'operator_add'], ['pick random 1 to 10', 'operator_random']];
    let cells = 0;
    const wrong = [];
    for (const w of EV3_WORDS.filter((x) => x.kind === 'command')) {
        const values = [...w.words.matchAll(/\{([A-Z0-9_]+)(?::([^}]+))?\}/g)].filter((m) => !m[2]).map((m) => m[1]);
        for (let i = 0; i + 1 < values.length; i++) {
            for (const [probe, op] of probes) {
                const extra = probe.split(' ').length - 1;
                const line = w.words.replace(/\{([A-Z0-9_]+)(?::([^}]+))?\}/g, (m, name, spec) => {
                    if (name === values[i]) return probe;
                    const at = values.indexOf(name);
                    if (at > i && at <= i + extra) return '\u0000';
                    if (spec === 'motor') return 'B';
                    if (spec === 'sensor') return '3';
                    if (spec) return spec.split('|')[0].split('=')[0];
                    return '5';
                }).replace(/ ?\u0000/g, '');
                cells++;
                const e = refusal(`DEVICE EV3\nWHEN flag clicked:\n  set a to 3\n  ${line}\n`);
                if (e) continue;
                const c = new SB3Creator();
                c.parse(`DEVICE EV3\nWHEN flag clicked:\n  set a to 3\n  ${line}\n`);
                const all = Object.assign({}, ...c.project.targets.map((t) => t.blocks));
                const st = Object.values(all).find((b) => b.opcode === `ev3comprehensive_${w.op}`);
                const holds = st && Object.values(st.inputs).some((inp) => typeof inp[1] === 'string' && all[inp[1]] && all[inp[1]].opcode === op);
                if (!holds) wrong.push(line);
            }
        }
    }
    assert.deepEqual(wrong, []);
    // counted 2026-09-30: 105 cells.
    assert.ok(cells >= 105, `only ${cells} EV3 cells (counted 105 on 2026-09-30)`);
});

test('a custom-block call: a reporter spread over its argument slots is refused', () => {
    // `DEFINE place (x) (y)` called as `place round a` read x = round, y = a.
    const defs = 'DEFINE place (x) (y):\n  say x\n';
    for (const call of ['place round a', 'place x position']) {
        const e = refusal(`${defs}WHEN flag clicked:\n  ${call}\n`);
        assert.ok(e, `${call} built a call`);
        assert.match(e.lines[0].reason, /is a reporter written without brackets/, call);
    }
    for (const call of ['place 1 2', 'place (round a) 2', 'place a b']) {
        assert.equal(refusal(`${defs}WHEN flag clicked:\n  ${call}\n`), null, call);
    }
    // Inside a definition its own parameters are names, not reporter words.
    assert.equal(refusal(`${defs}DEFINE twice (round) (a):\n  place round a\n`), null);
});
