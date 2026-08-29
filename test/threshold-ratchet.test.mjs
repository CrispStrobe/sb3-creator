/**
 * A new bounding literal must arrive with its measurement.
 *
 * WHY THIS EXISTS. `docs/MEASURED-THRESHOLDS.md` is a census of numbers that
 * decide verdicts and of who measured them. A census is a photograph, and the
 * thing a photograph cannot do is stop the subject moving: phase 1 counted 250
 * bounding literals in this repo, phase 2 opened four days later and counted
 * 275. Twenty-five new numbers arrived in between, and not one of them arrived
 * with evidence. Measuring the backlog while the backlog grows faster than it is
 * measured is not a campaign, it is a treadmill.
 *
 * So this is the ratchet the doc's own method implies, and it is deliberately
 * the same shape as the four waiver ceilings in `brickwright-lite` that the doc
 * holds up as correct: **zero headroom**. The population that owes a measurement
 * cannot grow. It can shrink freely — every measurement recorded next to a
 * number lowers it, and the ceiling comes down with it.
 *
 * WHAT IT DOES NOT DEMAND, because an evidence rule that demands the impossible
 * gets a rubber stamp instead of evidence. `scripts/threshold-inventory.mjs`
 * sorts every bounding literal into a disposition, and only two of the six owe
 * anything:
 *
 *   definitional    `list.length > 0` — non-emptiness. The value is fixed by the
 *                   type, not by the world. There is nothing to measure, and 77
 *                   of these are correct exactly as written.
 *   load-sensitive  timeouts. This campaign has already recorded that raising one
 *                   is the remedy that destroys it; what is owed is a quiet-box
 *                   number in the doc, not a stamp in the source.
 *   no-trip         pins, size caps, concurrency. The probe has no safe tripping
 *                   value: moving a node-version pin does not test the bound.
 *   evidenced       a measurement is already recorded beside it.
 *   countable       bounds a population. Its flip point IS the count — proven
 *                   four times over now — so it is answerable in milliseconds.
 *   runtime         bounds something only a run produces. Needs the probe.
 *
 * The last two are the subject. If this gate fires on a change of yours, the fix
 * is not to raise CEILING: it is to write what you measured next to the number.
 * The inventory accepts a date, the word MEASURED, `observed`, `counted`,
 * `actual:`, or an `expected ~N` inside the assertion's own failure message —
 * that last one being evidence in the place a reader most needs it.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { inventory, allThresholds, scanSource, classify, OWES_EVIDENCE }
    from '../scripts/threshold-inventory.mjs';
import { flipPointFor } from '../scripts/threshold-probe.mjs';

const SB3 = join(import.meta.dirname, '..');

/**
 * MEASURED 2026-08-29 (scripts/threshold-inventory.mjs --classified, phase 2 of
 * docs/MEASURED-THRESHOLDS.md). Phase 2 opened at 275 bounding literals of which
 * **126 owed a measurement**; it swept 49 test files with
 * scripts/threshold-observe.mjs, stamped 101 bounds with what was observed, and
 * closed at 281 literals of which **24** still owe one.
 *
 * Those 24 are not a backlog nobody looked at — every one is accounted for in
 * docs/MEASURED-THRESHOLDS.md, in four groups:
 *
 *   12  ttl-module-acceptance   behind BW_TTL_ORACLE=1 plus Java, Digital.jar and
 *                               a cloned 8bitsim; all twelve reported NOT REACHED
 *    6  gate-integrity          it reads this tree's own source, so instrumenting
 *                               the tree changes its subject — the observed run
 *                               went red and its numbers were discarded
 *    4  assert-physics          `tolerance:` option properties, not comparisons;
 *                               there is no comparison for the sweep to wrap
 *    1  arduino-import          its corpus is gitignored and absent in CI
 *    1  build-machine-roms      `d > 127` is the signed relative-branch range of
 *                               the instruction set. Nothing measured it and
 *                               nothing can; the classifier sorts by shape and
 *                               this shape does not announce that it is an
 *                               architectural constant. Left owing on purpose,
 *                               rather than stamped with a date to silence it.
 *
 * A ceiling rather than an equality on purpose: an equality fires in the good
 * direction too, and a ratchet whose maintenance is "bump the number" becomes a
 * rubber stamp — the finding this document's own §5 records about the one
 * exact-equality pin in the sweep.
 */
const CEILING = 24;

describe('bounding literals arrive with evidence', () => {
    const inv = inventory(SB3, 'sb3-creator');
    const all = allThresholds(inv);
    const owed = all.filter((t) => OWES_EVIDENCE.has(t.klass));

    // THE INSTRUMENT BEFORE THE SUBJECT. An empty result is what every broken
    // scanner returns, and a ratchet fed by a broken scanner reports a clean tree
    // forever. 275 were counted on 2026-08-29; a floor at 200 leaves room for
    // deliberate removals without letting a silent parse failure through.
    test('the inventory still finds the literals it is ratcheting', () => {
        assert.ok(all.length >= 200,
            `only ${all.length} bounding literals found (counted 275 on 2026-08-29) — ` +
            'scripts/threshold-inventory.mjs has stopped seeing this tree, so every ' +
            'count below is meaningless. Check for a parse error before reading further.');
        const parseErrors = inv.rows.filter((r) => r.parseError);
        assert.deepEqual(parseErrors.map((r) => r.file), [],
            'a source the inventory cannot parse is a source whose thresholds are invisible');
    });

    test('every bounding literal has a known disposition', () => {
        const known = new Set(['evidenced', 'definitional', 'countable', 'runtime',
            'load-sensitive', 'no-trip']);
        const strays = all.filter((t) => !known.has(t.klass))
            .map((t) => `${t.file}:${t.line} -> ${t.klass}`);
        assert.deepEqual(strays, [],
            'a literal with no disposition is one this gate silently ignores');
    });

    test(`no more than ${CEILING} bounding literals owe a measurement`, () => {
        const byFile = new Map();
        for (const t of owed) byFile.set(t.file, (byFile.get(t.file) || 0) + 1);
        assert.ok(owed.length <= CEILING,
            `${owed.length} bounding literals owe a measurement; the ratchet is ${CEILING}.\n\n` +
            'A number that decides a verdict and that nobody measured is a guess with a ' +
            'CI badge behind it. Record what you measured next to it — a date, the word ' +
            'MEASURED, "observed", "counted", or an "expected ~N" inside the assertion\'s ' +
            'own failure message — and this passes. Do NOT raise the ceiling to fit a new ' +
            'unevidenced number; that is the failure mode the whole campaign exists to stop ' +
            '(docs/MEASURED-THRESHOLDS.md).\n\n' +
            'Owing, by file:\n  ' +
            [...byFile.entries()].sort((a, b) => b[1] - a[1])
                .map(([f, n]) => `${n}  ${f}`).join('\n  '));
    });

    // The good direction, ratcheted too: when the backlog shrinks, the ceiling is
    // expected to come down with it, and a stale ceiling quietly re-opens the door
    // it was installed to shut.
    //
    // THE FIRST THING THIS GATE CAUGHT WAS ITSELF. The `<= 20` below is a bounding
    // literal like any other, and the first run of this file came back 127 against
    // a ceiling of 126 because of it. The correct response — the one this whole
    // document argues for — is to record what the number is measured against
    // rather than raise the ceiling to fit it.
    //
    // MEASURED 2026-08-29: phase 2 discharged 102 literals in a single sweep
    // (126 owing before, 24 after), so one lane's output is ~100. An allowance of
    // 20 is a fifth of that: comfortably more than the one or two a normal change
    // discharges, and far less than a lane's worth — so a ceiling this far above
    // its subject means somebody finished a sweep and forgot to lower it.
    test('the ratchet has not gone stale against a shrinking backlog', () => {
        // MEASURED 2026-08-29: 102 literals discharged in one sweep; 20 is a fifth
        // of a lane's output. See the block above for why this number is here.
        assert.ok(CEILING - owed.length <= 20,
            `the backlog is down to ${owed.length} but CEILING is still ${CEILING}. ` +
            `Lower it to ${owed.length} — a ratchet ${CEILING - owed.length} above its subject ` +
            'admits that many unevidenced numbers without firing.');
    });
});

describe('the ratchet can fire, and its arithmetic is pinned', () => {
    // MUTATION PROOF. A gate that cannot fail is not a gate. Rather than assert
    // that the classifier "works", feed it exactly the thing it exists to catch —
    // a bounding literal with no measurement beside it — and require it to be
    // counted. This is the whole gate in miniature: scan, classify, owe.
    test('an unevidenced bounding literal is counted as owing', () => {
        const dir = mkdtempSync(join(tmpdir(), 'thr-ratchet-'));
        try {
            const f = join(dir, 'mutant.test.mjs');
            writeFileSync(f,
                'import assert from "node:assert/strict";\n' +
                'test("m", () => { assert.ok(files.length >= 1234); });\n');
            const found = scanSource(f, dir).thresholds.map((t) => ({ ...t, klass: classify(t) }));
            assert.equal(found.length, 1, 'the scanner did not see the planted literal');
            assert.equal(found[0].value, 1234);
            assert.equal(found[0].evidenced, false);
            assert.equal(found[0].klass, 'countable');
            assert.ok(OWES_EVIDENCE.has(found[0].klass),
                'the planted unevidenced floor is not counted as owing, so the ratchet above ' +
                'would not have fired on it and is decoration');

            // And the negative half, which is what stops the gate being a tax: the
            // SAME literal with a measurement recorded above it is not owed.
            writeFileSync(f,
                'import assert from "node:assert/strict";\n' +
                '// MEASURED 2026-08-29: 1300 files.\n' +
                'test("m", () => { assert.ok(files.length >= 1234); });\n');
            const evidenced = scanSource(f, dir).thresholds.map((t) => ({ ...t, klass: classify(t) }));
            assert.equal(evidenced[0].evidenced, true, 'a recorded measurement was not recognised');
            assert.ok(!OWES_EVIDENCE.has(evidenced[0].klass),
                'recording the measurement did not discharge the debt, so the gate cannot be satisfied');

            // And non-emptiness stays free, which is the reason the ratchet is
            // survivable at all: 77 literals in this repo are this shape.
            writeFileSync(f,
                'import assert from "node:assert/strict";\n' +
                'test("m", () => { assert.ok(files.length > 0); });\n');
            const bare = scanSource(f, dir).thresholds.map((t) => ({ ...t, klass: classify(t) }));
            assert.equal(bare[0].klass, 'definitional');
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });

    /**
     * The cheap method's off-by-one, pinned.
     *
     * Phase 2 replaced most of the twenty-run binary searches with a count plus a
     * two-run confirmation, on the finding that for a bound over a countable
     * corpus the flip point IS the count. All of that rests on one line of
     * arithmetic in `flipPointFor`, and an off-by-one there would silently shift
     * every recorded margin by one. Two of the cases below are not invented: they
     * are what the phase-1 bisections and the phase-2 confirmations actually
     * observed, so this test would have caught a regression in the method by
     * contradicting measurements already in the record.
     */
    test('flipPointFor reproduces the margins that were bisected', () => {
        // generated-bench-layout:60 `kept.length > 900`, corpus counted at 1199:
        // the bisection observed green up to 1198, red from 1199.
        assert.equal(flipPointFor('kept.length > 900', 'floor', 1199), 1198);
        // example-corpus-contract:36 `index.length >= 259`, counted 310:
        // confirmed green at 310, red at 311.
        assert.equal(flipPointFor('index.length >= 259', 'floor', 310), 310);
        // ctarget:1051 `warnings <= 5`, counted 4: phase 1 recorded observed 4,
        // after an earlier draft of the search read it as 3.
        assert.equal(flipPointFor('(forced.match(/warning:/g) || []).length <= 5', 'ceiling', 4), 4);
        // device-coverage's floor spelled as its own negation, `if (n < 110) throw`.
        assert.equal(flipPointFor('engineKinds.length < 110', 'floor', 118), 118);
        // gallery-roundtrip:45 `length < 5`, observed set {0}: green at 1, red at 0.
        assert.equal(flipPointFor('dc.trim().length < 5', 'ceiling', 0), 1);
        assert.equal(flipPointFor('no operator here', 'floor', 10), null);
    });
});
