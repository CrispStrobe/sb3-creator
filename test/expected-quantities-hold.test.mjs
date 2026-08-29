/**
 * Every numeric claim in every EXPECTED.md, re-derived from the engine.
 *
 * THE DEFECT CLASS
 * ----------------
 * `test/assert-physics.test.mjs` checks the fenced ```assert blocks. Almost
 * nothing an EXPECTED.md claims is in one: the claims are prose, hand-derived
 * when the example was written, and the corpus has moved under them repeatedly.
 * The ones already caught are all the same shape — A DOCUMENT THAT AGREED WITH
 * A BROKEN BENCH, and therefore looked correct until the bench was fixed:
 *
 *   23-voltage-regulator could not regulate. Its "zener" was declared
 *   `kind: "diode"` with `vf: 5.1`, and a forward diode does not clamp in
 *   reverse, so no current took the zener branch and the document's 6.60 mA
 *   was unreachable. Declared properly the bench measures it. The document was
 *   right; the bench was wrong.
 *
 *   41-pot-as-dimmer claimed 2.3 mA where the bench delivers 0.188 — a twelve-
 *   fold gap whose own prose already said "unloaded divider approximation".
 *   The document was wrong.
 *
 *   arduino-01-blink claimed "1 Hz (period = 2 s)", which contradicts itself
 *   and its program.
 *
 * None of those is exotic. Each was a number that was true when typed.
 *
 * WHAT THIS GATE DOES
 * -------------------
 * The unit of work is the CLAIM, not the check. `test/helpers/expected-claims.mjs`
 * enumerates every unit-bearing number in every EXPECTED.md — 2358 of them —
 * and gives each an identity. Every one is then either compared against
 * something that can contradict it or DECLINED WITH A REASON. The fraction
 * compared is reported with its denominator, and a claim nobody can check is
 * visible as such rather than absent.
 *
 *   before this sweep      34 of 2356 claims compared  (1.4 %)
 *   after wave 1         1209 of 2358 claims compared (51.3 %)
 *   after wave 2         1224 of 2356 claims compared (52.0 %)
 *   on the merged tree   1230 of 2392 claims compared (51.4 %)
 *
 * The last line is the same wave measured after merging the lane that landed
 * 43-rc-timing's repeatable step and pc50's in-range Bode bench: 36 more claims
 * in the denominator, 6 more compared. Both numbers are kept because only the
 * middle pair is a like-for-like measurement of what this wave did.
 *
 * and of the 1224, exactly ONE is a claim the engine contradicts and no lane
 * has closed. It is recorded with a verdict in
 * test/fixtures/expected-claim-exceptions.json.
 *
 * WAVE 2 IS THE bw-board a301937 PIN BUMP, and the thing it found is worth
 * stating before the numbers: A CLAIM CHECKED AGAINST ITS OWN ARITHMETIC IS
 * NOT A CLAIM CHECKED AGAINST THE BENCH. pc78-belastete-quelle reported 12 of
 * 12 claims compared and nothing mismatched, because every number on the page
 * was held to the page's own derivation and 9 / 412 really is 21.8 mA. The
 * bench draws 16.719: the document never subtracts the LED forward drops its
 * own previous line says it subtracts. An arithmetic-checked claim is now put
 * to the engine as well, and the three outcomes are kept apart — the engine
 * agrees, the engine declines (a model difference), the engine contradicts.
 *
 * The 34 is not a slur on the previous gate: it read three hand-written shapes
 * out of the prose (a frequency beside a period, a Frequency: beside a two-wait
 * program, and at most ONE current bullet per example) and read them well. It
 * simply had no denominator, so nobody could see what it was not reading.
 *
 * WHAT IT CHECKS AGAINST
 * ----------------------
 *   the engine        `bench-measure.mjs` solves the authored circuit.json at
 *                     the operating point the claim names — a control value, a
 *                     supply voltage, an MCU pin drive, a time — and reads node
 *                     voltages and BoardImpl.branchCurrent() back out.
 *   circuit.json      a component value under `## Circuit` is a statement about
 *                     THIS bench and is held against the parts it declares.
 *   program.bw        a frequency, a cycle period and a duty cycle are held
 *                     against the program's own timeline, with REPEAT walked.
 *   the document      a claim that shows its own arithmetic is held to that
 *                     arithmetic exactly, which needs no bench at all.
 *
 * TWO THINGS THE ENGINE TURNED OUT TO HAVE, AND ONE IT DOES NOT
 * -------------------------------------------------------------
 * `assert-physics` retires every `current` assertion with "current readback not
 * yet wired". That was never true: `BoardImpl.branchCurrent(partId, terminal)`
 * has been the public face of solveMNA's `branchCurrents` the whole time. And
 * an MCU bench is not "a firmware state" beyond reach — `setPin(pin,
 * 'pushpull', high)` puts it at the operating point the document is describing,
 * which is what let 120 claims across the blink benches be checked at all.
 *
 * What the engine does NOT have is `rInternal`. Eight batteries in the corpus
 * declare one and no bw-board model reads it, so every source solves as ideal.
 * Four German lessons are built on that parameter — pc77-klemmenspannung is
 * literally about terminal voltage sagging under load — and their benches show
 * a flat 9.0000 V. The canary at the end of this file fails when that changes,
 * because those documents must then be re-derived.
 *
 * WRONG IS NOT THE SAME AS UNVERIFIABLE
 * -------------------------------------
 * A claim the engine contradicts is a defect in the corpus and goes in
 * `test/fixtures/expected-claim-exceptions.json` with a verdict naming which
 * side is wrong. A claim the engine has no readback for is a gap in the
 * instrument, is declined by name, and is counted in the skipped column. The
 * two never merge into one number. Nor does a MODEL DIFFERENCE become a
 * verdict: the documents divide by a declared forward drop and a nominal rail
 * while the engine solves a junction behind a pin's output impedance, and where
 * those diverge the gate says so with both numbers instead of reporting a
 * correct document as defective.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { allClaims, exampleDirs, EXAMPLES } from './helpers/expected-claims.mjs';
import { loadEngine, solveBench, declaredPool } from './helpers/bench-measure.mjs';
import { adjudicate } from './helpers/claim-adjudicate.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the EXPECTED.md quantity checks');
const SKIP = gate.skip || false;

const EXCEPTIONS = JSON.parse(readFileSync(
    join(import.meta.dirname, 'fixtures', 'expected-claim-exceptions.json'), 'utf8'));

/**
 * The census, adjudicated once. Every claim lands in exactly one of three
 * states and the totals below are what the gate reports.
 */
let LEDGER = null;
async function ledger () {
    if (LEDGER) return LEDGER;
    await loadEngine(gate.paths);
    const checked = [], skipped = [], mismatched = [];
    for (const claim of allClaims()) {
        const verdict = adjudicate(claim);
        if (verdict.ok) checked.push({ ...claim, ...verdict });
        else if (verdict.skip) skipped.push({ ...claim, reason: verdict.skip });
        else mismatched.push({ ...claim, ...verdict });
    }
    LEDGER = { checked, skipped, mismatched, total: checked.length + skipped.length + mismatched.length };
    return LEDGER;
}

const key = (c) => `${c.dir}#${c.lineNo}`;

describe('EXPECTED.md quantities hold against the engine', { skip: SKIP }, () => {
    test('the census finds a claim in most of the corpus', async () => {
        const L = await ledger();
        // Floors, not targets: if the extractor breaks, this must fail rather
        // than report a tidy 100 % of nothing.
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53):
        // L.total > 2300 -> observed 2644.
        assert.ok(L.total > 2300,
            `only ${L.total} unit-bearing claims found across ${exampleDirs().length} examples — the extractor is broken`);
        const dirs = new Set(allClaims().map(c => c.dir));
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53):
        // dirs.size > 180 -> observed 232.
        assert.ok(dirs.size > 180,
            `claims found in only ${dirs.size} examples — the extractor is reading a fraction of the corpus`);
    });

    test('every claim is either compared or declined with a stated reason', async () => {
        const L = await ledger();
        const unexplained = L.skipped.filter(s => !s.reason || s.reason.length < 20);
        assert.deepEqual(unexplained.map(key), [],
            'a claim declined without a reason is an unverified claim nobody can see');
        const compared = L.checked.length + L.mismatched.length;
        // The ratchet. 1224/2356 = 52.0 % on 2026-08-24 against bw-board
        // a301937, from 1209/2358 (51.3 %) against 88e9668 and 34 (1.4 %)
        // before the first sweep. Raise this floor when the fraction rises;
        // never lower it to make a change fit.
        //
        // Wave 2 moved it by +15 net, and the net hides two opposite movements
        // that both belong in the record: +18 claims became checkable (the two
        // engine declines resolved, a list item stopped inheriting its
        // neighbour's qualifier, four German lessons re-derived), and -3 were
        // taken BACK OFF the checked pile because they were passing against a
        // bench that reports no current at all, where a claim of 0 mA would
        // have passed with the lamp blazing.
        assert.ok(compared >= 1225,
            `only ${compared} of ${L.total} claims were compared (${(compared / L.total * 100).toFixed(1)} %) — `
            + 'this gate checked 1230 when the floor was set, so coverage has gone BACKWARDS');
    });

    test('no claim the engine contradicts is unrecorded', async () => {
        const L = await ledger();
        const open = new Set(EXCEPTIONS.open.map(e => e.id.split('#')[0] + '#' + e.id.split('#')[1]));
        const surprises = L.mismatched
            .filter(m => !open.has(key(m)))
            .map(m => `${key(m)} "${m.text}" — ${m.detail}\n      ${m.line.slice(0, 110)}`);
        assert.deepEqual(surprises, [],
            `${L.mismatched.length} claims disagree with the engine; `
            + `${EXCEPTIONS.open.length} are recorded in test/fixtures/expected-claim-exceptions.json with a verdict. These are not:`);
    });

    test('the recorded exceptions still mismatch, and there are no more of them', async () => {
        const L = await ledger();
        // A ratchet has two teeth. Without the first, a fixed defect leaves a
        // stale entry that quietly re-permits the next one; without the second,
        // the file grows and the gate becomes a list of things it tolerates.
        const live = new Set(L.mismatched.map(key));
        const stale = EXCEPTIONS.open
            .filter(e => !live.has(e.id.split('#').slice(0, 2).join('#')))
            .map(e => `${e.id} no longer mismatches — delete it from the fixture and lower "max"`);
        assert.deepEqual(stale, [], 'a recorded exception that has been fixed must be removed');
        assert.ok(EXCEPTIONS.open.length <= EXCEPTIONS.max,
            `${EXCEPTIONS.open.length} recorded exceptions against a max of ${EXCEPTIONS.max}`);
    });

    test('a document that shows its arithmetic agrees with it', async () => {
        const L = await ledger();
        const byOwnMaths = L.checked.filter(c => /own arithmetic/.test(c.how || ''));
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53):
        // byOwnMaths.length >= 175 -> observed 194.
        assert.ok(byOwnMaths.length >= 175,
            `only ${byOwnMaths.length} claims were held to their own stated derivation — the expression reader is broken`);
    });

    test('currents come from the engine, not from a hand derivation', async () => {
        const L = await ledger();
        const solvedCurrents = L.checked.filter(c => c.cls === 'curr' && /solved/.test(c.how || ''));
        // The whole point: before this sweep no current claim anywhere in the
        // corpus had ever been compared against a solve.
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53):
        // solvedCurrents.length >= 85 -> observed 160.
        assert.ok(solvedCurrents.length >= 85,
            `only ${solvedCurrents.length} current claims were checked against a solve — branchCurrent readback is not reaching them`);
    });
});

describe('a measured number names the engine that measured it', { skip: SKIP }, () => {
    test('every EXPECTED.md that quotes a solve carries the pinned revisions', async () => {
        await loadEngine(gate.paths);
        const { MARK, isDerived } = await import('./helpers/expected-provenance.mjs');
        const missing = [];
        for (const dir of exampleDirs()) {
            const path = join(EXAMPLES, dir, 'EXPECTED.md');
            if (!existsSync(path)) continue;
            const text = readFileSync(path, 'utf8');
            if (!isDerived(text)) continue;
            if (!text.includes(MARK)) { missing.push(`${dir}: quotes a solve and names no engine revision`); continue; }
            for (const name of ['bw-board', 'bw-circuit-ui']) {
                const rev = JSON.parse(readFileSync(join(import.meta.dirname, 'fixtures', 'siblings.json'), 'utf8'))
                    .siblings[name].rev.slice(0, 7);
                if (!text.includes(`${name}@${rev}`))
                    missing.push(`${dir}: provenance names a ${name} revision other than the pinned ${rev}`);
            }
        }
        // A measured number without a revision cannot be reproduced or
        // falsified: when pc32-pnp-high-side's V_EB drifts, nobody can tell
        // whether the document was wrong or the engine moved. Twenty-seven
        // pages were in that state before this sweep.
        assert.deepEqual(missing, [],
            'run `node scripts/stamp-expected-provenance.mjs` (and re-derive the numbers if the pin moved)');
    });
});

describe('the instrument says what it cannot read', { skip: SKIP }, () => {
    test('rInternal is stamped, and the benches built on it are checkable', async () => {
        await loadEngine(gate.paths);
        const withR = exampleDirs().filter(d => {
            const p = join(EXAMPLES, d, 'circuit.json');
            if (!existsSync(p)) return false;
            try {
                return (JSON.parse(readFileSync(p, 'utf8')).parts || [])
                    .some(x => typeof x.params?.rInternal === 'number');
            } catch { return false; }
        });
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53):
        // withR.length >= 6 -> observed 7.
        assert.ok(withR.length >= 6,
            `only ${withR.length} benches declare rInternal — this gate has lost its subject`);
        // THIS TEST USED TO BE A CANARY THAT FAILED WHEN THE ENGINE GREW THE
        // MODEL. It has fired and been acted on: bw-board b5c02b1 made `vsource`
        // honour rInternal in DC and in the swept AC solve, the pin moved to
        // a301937, and the six benches built on that parameter were re-derived
        // against it. So the assertion is inverted — a source with a declared
        // internal resistance must now SAG under load, and the four German
        // source-resistance lessons state solved numbers rather than hand ones.
        //
        // Keeping it as a canary would have been worse than deleting it: it
        // would go green again the day a regression stopped stamping rInternal,
        // and read as good news.
        const flat = [];
        for (const dir of withR) {
            const s = solveBench(dir);
            if (s.error) continue;
            const pool = declaredPool(dir);
            const emf = pool && pool.supply.size ? Math.max(...pool.supply) : null;
            if (!emf) continue;
            const top = Math.max(...s.voltage.values());
            // A bench can legitimately be unloaded; require the sag only where
            // the source is actually delivering current.
            const drawing = [...s.current.values()].some(i => Math.abs(i) > 1e-5);
            if (drawing && Math.abs(top - emf) / emf <= 1e-5)
                flat.push(`${dir}: ${top.toFixed(4)} V against a declared ${emf} V EMF while drawing current`);
        }
        assert.deepEqual(flat, [],
            'a loaded source with a declared rInternal is sitting exactly at its open-circuit EMF again — '
            + 'bw-board has stopped stamping the model these benches were re-derived against, and the six '
            + 'pages that now quote solved terminal voltages (47-battery-led, 52-battery-voltage-divider, '
            + 'pc77-klemmenspannung, pc78-belastete-quelle, pc79-indirekte-strommessung, '
            + 'pc80-quellen-vergleich) are stating numbers the engine can no longer produce');
    });

    test('the four source-resistance lessons are checked, not merely self-consistent', async () => {
        const L = await ledger();
        // pc78-belastete-quelle is why this test exists. It reported 12 of 12
        // claims compared and nothing mismatched while its central number was
        // wrong by 30 %: every claim on the page was held to the page's OWN
        // arithmetic, and 9 / 412 really is 21.8. A document can agree with
        // itself perfectly and describe a different circuit. The adjudicator now
        // puts an arithmetic-checked claim to the engine as well, and this
        // asserts that these four pages actually go through that second door.
        const both = L.checked.filter(c =>
            ['pc77-klemmenspannung', 'pc78-belastete-quelle', 'pc79-indirekte-strommessung',
                'pc80-quellen-vergleich'].includes(c.dir) && /the engine agrees/.test(c.how || ''));
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53):
        // both.length >= 21 -> observed 21.
        assert.ok(both.length >= 21,
            `only ${both.length} claims across the four source-resistance lessons are confirmed by BOTH `
            + 'their own arithmetic and a solve — the cross-check has stopped reaching them');
    });
});
