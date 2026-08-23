/**
 * A measured floor under a gate's corpus.
 *
 * THE DEFECT THIS CLOSES
 * ----------------------
 * A gate that iterates a discovered corpus and asserts something about each
 * member has a failure mode that neither skips nor fails: if the corpus arrives
 * EMPTY, it emits zero subtests, asserts nothing, and reports a clean pass. The
 * summary line is indistinguishable from a real run, and the test NAME often
 * says so truthfully — `all 0 benches: engine accepts…` was green in this repo —
 * but nothing reads test names.
 *
 * `test/CROSS-REPO-GATE-AUDIT.md` named this as the class its skip-sweep and its
 * static cross-repo detector could not see. This is the remedy it asked for:
 *
 *   > the shape to assert is *every test that iterates a discovered list
 *   > asserts that list is non-empty*
 *
 * THE FLOOR MUST BE MEASURED, NOT GUESSED. `test/kcl-residual.test.mjs` is the
 * reference: it states its coverage in the header and guards it, and its first
 * draft guessed `> 200` against a real value of 37 and failed on a healthy run.
 * A threshold nobody measured fires at the wrong time, which is worse than none
 * because it trains people to raise it. So every call here carries the date and
 * the number that was actually counted, and sits roughly 10% under it — enough
 * headroom that ordinary corpus churn does not redden the build, tight enough
 * that a collapse cannot hide.
 *
 * A floor is NOT a coverage claim. It says only "the corpus this gate opens is
 * still there". What the gate does with it is the gate's own business.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Register an always-running test asserting a corpus is not empty.
 *
 * @param {string} what     what was counted, in the gate's own words
 * @param {() => number} count  counts it AT TEST TIME — a lazy thunk, so a corpus
 *                              built during another test is measured after it ran
 * @param {number} floor    the measured floor
 * @param {string} note     the measurement: date, observed value, why it matters
 */
export function corpusFloor (what, count, floor, note) {
    if (!Number.isInteger(floor) || floor < 1) {
        throw new Error(`corpusFloor("${what}"): a floor must be a positive integer, got ${floor}`);
    }
    test(`corpus floor: ${what}`, () => {
        const n = count();
        assert.ok(typeof n === 'number' && Number.isFinite(n),
            `corpusFloor("${what}") counted ${n}, which is not a number`);
        assert.ok(n >= floor,
            `only ${n} ${what} (floor ${floor}). ${note}\n` +
            'A gate whose corpus went empty does not fail — it passes over nothing, ' +
            'and that is what this floor exists to turn into a red build.');
    });
}
