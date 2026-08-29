/**
 * The discriminator has two branches, and both are exercised here.
 *
 * A discriminator that has only ever seen one of its two cases is half-tested, and
 * the half it has not seen is the half that will be wrong when it matters. So there
 * are two stubs, and they are the simplest possible analogues of the two situations
 * `test/helpers/timed.mjs` exists to tell apart:
 *
 *   CONTENTION  `sleep` — a child that is ready to run and wants no CPU. This is
 *               what an oversubscribed machine looks like from inside the process:
 *               wall time passes, the work does not get scheduled.
 *   HANG        a spin loop — a child that has the CPU and spends all of it. This
 *               is what a real defect looks like.
 *
 * Neither stub simulates the *cause*; both reproduce the *observable* the helper
 * reads, which is the only thing it can act on. That is deliberate: loading the box
 * to 30 to produce genuine contention would be an unreproducible test of the same
 * property, and would punish everyone else on the machine.
 *
 * MEASURED 2026-08-23 on a box at load 24–27 — deliberately the bad case, because a
 * discriminator calibrated only on an idle machine is calibrated for the situation
 * in which it is not needed:
 *
 *     sleep 30   ratio 0.00     spin loop   ratio 0.97
 *
 * Two orders of magnitude apart, which is why the cuts (0.15 / 0.50) are not
 * delicate and why the band between them is small enough to be worth refusing to
 * answer inside.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { platform } from 'node:os';
import {
    runBounded, BudgetExceededError, classify, isBudgetFailure,
    reapedChildCpuSeconds, achievableCpuRatio, CONTENTION_SHARE, HANG_SHARE
} from './helpers/timed.mjs';

/** assert.throws() returns undefined, so capture the error to assert ON it. */
const caught = (fn) => {
    try { fn(); } catch (e) { return e; }
    throw new assert.AssertionError({ message: 'expected a throw, got none' });
};

const onLinux = platform() === 'linux';
const skipOffLinux = onLinux ? false : 'the CPU discriminator reads /proc, which is Linux-only';

/** A child that wants no CPU: the observable an oversubscribed machine produces. */
const sleeper = (ms) => execFileSync(process.execPath,
    ['-e', 'setTimeout(() => {}, 60_000)'], { timeout: ms, stdio: 'pipe' });

/** A child that wants all the CPU it can get: the observable a hang produces. */
const spinner = (ms) => execFileSync(process.execPath,
    ['-e', 'for (let x = 0; ; ) { x = (x + 1) % 1e9; }'], { timeout: ms, stdio: 'pipe' });

test('the instrument reads /proc at all', { skip: skipOffLinux }, () => {
    const before = reapedChildCpuSeconds();
    assert.equal(typeof before, 'number',
        '/proc/self/stat did not yield a child-CPU number; every verdict below would be "unknown"');
    // Burn a measurable amount in a child and require the counter to move. Without
    // this the two branches could both be reading a constant and agreeing with
    // themselves — the shape that produced three false readings in wave 1.
    try { spinner(1500); } catch { /* the timeout is the point */ }
    const after = reapedChildCpuSeconds();
    assert.ok(after > before,
        `reaped-child CPU did not advance across a spinning child (${before} -> ${after}); ` +
        'the discriminator is reading something that does not change and cannot be trusted');
});

/**
 * WHAT IS GUARANTEED, AND WHAT IS ONLY LIKELY.
 *
 * The safety property holds always: **a sleeper is never called a hang, and a
 * spinner is never called contention.** Those are the two mis-classifications that
 * cost something — one sends people hunting a defect that is not there, the other
 * tells them to shrug at one that is.
 *
 * Landing on the exact verdict rather than `inconclusive` needs a box quiet enough
 * for the evidence to support it. MEASURED over six consecutive runs at load 28–36:
 * five spinners scored share 0.79–1.00 and one scored 0.26, because a 4 s window on
 * four cpus serving thirty-odd runnable processes is genuinely noisy. In that run
 * the helper returned `inconclusive` and said so — which is the instrument being
 * right, not wrong. Asserting `hang` unconditionally would make this file flaky in
 * exactly the conditions it was written for, and a flaky gate is the thing this
 * campaign keeps removing.
 *
 * So: the safety property is asserted always; the sharp verdict is asserted only
 * when the box is quiet enough to earn it.
 */
const QUIET_ENOUGH = 0.5;   // a CPU-bound child can get half a core or better

test('CONTENTION branch: a child that wants no CPU is NEVER called a hang', { skip: skipOffLinux }, () => {
    const e = caught(() => runBounded({ what: 'stub: a sleeping child', budgetMs: 4000, run: sleeper }));
    assert.equal(e.name, 'BudgetExceededError', `got ${e.name}: ${e.message}`);
    assert.ok(e instanceof BudgetExceededError);
    assert.notEqual(e.verdict, 'hang',
        `a sleeping child was called a HANG (share ${e.share}, achievable ${e.achievable}). ` +
        'That sends someone hunting a defect that does not exist.');
    assert.ok(e.share <= CONTENTION_SHARE,
        `share ${e.share} is above the contention cut (ratio ${e.ratio}, achievable ${e.achievable})`);
    assert.equal(e.verdict, 'contention',
        `share was ${e.share}, at or below the cut, yet the verdict was "${e.verdict}"`);
    assert.match(e.message, /THIS IS CONTENTION, NOT A HANG/);
    assert.match(e.message, /Re-run on a quieter box/);
    assert.doesNotMatch(e.message, /raise the budget\b(?!.*would hide)/,
        'the contention branch must never suggest raising the budget as the remedy');
});

test('HANG branch: a child that burns CPU is NEVER called contention', { skip: skipOffLinux }, () => {
    const e = caught(() => runBounded({ what: 'stub: a spinning child', budgetMs: 4000, run: spinner }));
    assert.equal(e.name, 'BudgetExceededError', `got ${e.name}: ${e.message}`);
    assert.notEqual(e.verdict, 'contention',
        `a spinning child was called CONTENTION (share ${e.share}, achievable ${e.achievable}). ` +
        'That tells someone to shrug at a real defect, which is the worse of the two errors.');
    assert.ok(['cpu-bound', 'inconclusive'].includes(e.verdict), `unexpected verdict ${e.verdict}`);

    if (e.achievable !== null && e.achievable >= QUIET_ENOUGH) {
        assert.equal(e.verdict, 'cpu-bound',
            `the box was quiet (achievable ${e.achievable.toFixed(2)}) so the evidence supports a ` +
            `sharp verdict, but this came back "${e.verdict}" at share ${e.share}`);
        assert.ok(e.share >= HANG_SHARE, `share ${e.share} is below the cpu-bound cut on a quiet box`);
        assert.match(e.message, /THIS WAS COMPUTING, NOT STARVED/);
        assert.match(e.message, /raising the budget is not the fix/i);
        return;
    }
    // Contended box: the verdict may honestly be `inconclusive`, and then the
    // message must SAY it cannot tell rather than guessing.
    console.log(`    box too busy for a sharp verdict (achievable ${e.achievable?.toFixed(3)}), ` +
        `verdict ${e.verdict} at share ${e.share.toFixed(2)}`);
    if (e.verdict === 'inconclusive') assert.match(e.message, /THE DISCRIMINATOR CANNOT TELL/);
    else assert.match(e.message, /THIS WAS COMPUTING, NOT STARVED/);
});

test('the two branches are far apart in SHARE, not merely in raw ratio', { skip: skipOffLinux }, () => {
    // This is the test that caught the first design. Compared against WALL time the
    // two stubs were 0.03 and 0.13 apart on a box at load 36 — a spinner cannot
    // reach 0.5 when four cpus are serving 39 runnable processes, so absolute cuts
    // would have called every real hang "contention" exactly where it matters.
    // Compared against what a CPU-bound child ACHIEVES right now, they separate.
    const sleep = caught(() => runBounded({ what: 'calibration: sleeper', budgetMs: 4000, run: sleeper }));
    const spin = caught(() => runBounded({ what: 'calibration: spinner', budgetMs: 4000, run: spinner }));
    console.log(`    achievable=${achievableCpuRatio().toFixed(3)} ` +
        `sleeper: ratio ${sleep.ratio.toFixed(3)} share ${sleep.share.toFixed(2)} | ` +
        `spinner: ratio ${spin.ratio.toFixed(3)} share ${spin.share.toFixed(2)}`);
    // The separation that must hold on ANY box: the spinner is above the contention
    // cut and the sleeper is at or below it. A wider claim than that is a claim
    // about the machine, not about the instrument.
    assert.ok(sleep.share <= CONTENTION_SHARE && spin.share > CONTENTION_SHARE,
        `the two observables did not separate at the contention cut: sleep ` +
        `${sleep.share.toFixed(2)}, spin ${spin.share.toFixed(2)}, achievable ` +
        `${spin.achievable?.toFixed(3)}. The cut ${CONTENTION_SHARE} is no longer justified.`);
    if (spin.achievable !== null && spin.achievable >= QUIET_ENOUGH) {
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53):
        // spin.share - sleep.share > 0.5 -> observed 0.9891787488662402.
        assert.ok(spin.share - sleep.share > 0.5,
            `on a quiet box (achievable ${spin.achievable.toFixed(2)}) the two observables are ` +
            `only ${(spin.share - sleep.share).toFixed(2)} apart in share; the cuts ` +
            `${CONTENTION_SHARE}/${HANG_SHARE} need re-deriving.`);
    }
});

test('a failure that is NOT the budget propagates unchanged', () => {
    // The helper must not turn every child failure into a timeout verdict. A
    // non-zero exit is the work failing and belongs to the caller.
    const boom = () => execFileSync(process.execPath, ['-e', 'process.exit(3)'],
        { timeout: 30_000, stdio: 'pipe' });
    const e = caught(() => runBounded({ what: 'stub: a child that exits 3', budgetMs: 30_000, run: boom }));
    assert.notEqual(e.name, 'BudgetExceededError',
        'a non-zero exit was reported as a budget failure; the caller would look at the clock ' +
        'instead of at the error');
    assert.equal(e.status, 3);
    assert.equal(isBudgetFailure(e), false);
});

test('classify() refuses to answer without evidence', () => {
    assert.equal(classify({ wallSeconds: 10, cpuSeconds: null, achievable: 1 }).verdict, 'unknown');
    assert.equal(classify({ wallSeconds: 0, cpuSeconds: 0, achievable: 1 }).verdict, 'unknown');
    // No reference means no verdict. Defaulting `achievable` to 1.0 here is exactly
    // the assumption that made the first design call a loaded-box hang "contention".
    assert.equal(classify({ wallSeconds: 10, cpuSeconds: 9, achievable: null }).verdict, 'unknown');
    assert.equal(classify({ wallSeconds: 10, cpuSeconds: 9, achievable: 0 }).verdict, 'unknown');
    // The band between the cuts is the honest "I cannot tell".
    const mid = (CONTENTION_SHARE + HANG_SHARE) / 2;
    assert.equal(classify({ wallSeconds: 10, cpuSeconds: 10 * mid, achievable: 1 }).verdict, 'inconclusive');
    // And the cuts themselves, read as shares of what is achievable. On a box where
    // a CPU-bound child only gets 0.13 of wall, a hang uses ~10 s * 0.13 = 1.3 s.
    assert.equal(classify({ wallSeconds: 10, cpuSeconds: 1.3, achievable: 0.13 }).verdict, 'cpu-bound');
    assert.equal(classify({ wallSeconds: 10, cpuSeconds: 0.05, achievable: 0.13 }).verdict, 'contention');
    // Startup is charged to the runtime, and this is the pair that made it necessary.
    // Over a 1 s window at achievable 0.13, a child that did NOTHING but start still
    // shows 0.06 s of CPU — 46% of achievable, which lands in the inconclusive band
    // and is one small nudge away from being called a hang. Subtracting the measured
    // startup puts it where it belongs. The first version of this helper mis-read its
    // own sleeping stub for exactly this reason (share 0.13 against a 0.15 cut).
    assert.equal(classify({ wallSeconds: 1, cpuSeconds: 0.06, achievable: 0.13 }).verdict,
        'inconclusive', 'unsubtracted startup pollutes a short window');
    assert.equal(classify({ wallSeconds: 1, cpuSeconds: 0.06, achievable: 0.13, startupCpu: 0.06 }).verdict,
        'contention', 'with startup charged to the runtime, a child that only started is contention');
    // And it must not swing the other way: real work still reads as a hang.
    assert.equal(classify({ wallSeconds: 1, cpuSeconds: 0.19, achievable: 0.13, startupCpu: 0.06 }).verdict,
        'cpu-bound', 'subtracting startup must not mask a child that genuinely burned CPU');
});
