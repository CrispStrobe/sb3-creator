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
    try { spinner(1200); } catch { /* the timeout is the point */ }
    const after = reapedChildCpuSeconds();
    assert.ok(after > before,
        `reaped-child CPU did not advance across a spinning child (${before} -> ${after}); ` +
        'the discriminator is reading something that does not change and cannot be trusted');
});

test('CONTENTION branch: a child that wants no CPU is not called a hang', { skip: skipOffLinux }, () => {
    const e = caught(() => runBounded({ what: 'stub: a sleeping child', budgetMs: 1500, run: sleeper }));
    assert.equal(e.name, 'BudgetExceededError', `got ${e.name}: ${e.message}`);
    assert.ok(e instanceof BudgetExceededError);
    assert.equal(e.verdict, 'contention',
        `a sleeping child was classified "${e.verdict}" with ratio ${e.ratio} — the branch that ` +
        'tells someone to re-run rather than to go hunting is the one that just failed');
    assert.ok(e.share <= CONTENTION_SHARE,
        `share ${e.share} is above the contention cut (ratio ${e.ratio}, achievable ${e.achievable})`);
    assert.match(e.message, /THIS IS CONTENTION, NOT A HANG/);
    assert.match(e.message, /Re-run on a quieter box/);
    assert.doesNotMatch(e.message, /raise the budget\b(?!.*would hide)/,
        'the contention branch must never suggest raising the budget as the remedy');
});

test('HANG branch: a child that burns CPU is not called contention', { skip: skipOffLinux }, () => {
    const e = caught(() => runBounded({ what: 'stub: a spinning child', budgetMs: 1500, run: spinner }));
    assert.equal(e.name, 'BudgetExceededError', `got ${e.name}: ${e.message}`);
    assert.equal(e.verdict, 'hang',
        `a spinning child was classified "${e.verdict}" with ratio ${e.ratio} — this is the ` +
        'branch that stops a real defect being shrugged off as a busy box');
    assert.ok(e.share >= HANG_SHARE,
        `share ${e.share} is below the hang cut (ratio ${e.ratio}, achievable ${e.achievable})`);
    assert.match(e.message, /THIS IS A HANG, NOT CONTENTION/);
    assert.match(e.message, /do not raise the budget/);
});

test('the two branches are far apart in SHARE, not merely in raw ratio', { skip: skipOffLinux }, () => {
    // This is the test that caught the first design. Compared against WALL time the
    // two stubs were 0.03 and 0.13 apart on a box at load 36 — a spinner cannot
    // reach 0.5 when four cpus are serving 39 runnable processes, so absolute cuts
    // would have called every real hang "contention" exactly where it matters.
    // Compared against what a CPU-bound child ACHIEVES right now, they separate.
    const sleep = caught(() => runBounded({ what: 'calibration: sleeper', budgetMs: 1500, run: sleeper }));
    const spin = caught(() => runBounded({ what: 'calibration: spinner', budgetMs: 1500, run: spinner }));
    console.log(`    achievable=${achievableCpuRatio().toFixed(3)} ` +
        `sleeper: ratio ${sleep.ratio.toFixed(3)} share ${sleep.share.toFixed(2)} | ` +
        `spinner: ratio ${spin.ratio.toFixed(3)} share ${spin.share.toFixed(2)}`);
    assert.ok(spin.share - sleep.share > 0.5,
        `the two observables are only ${(spin.share - sleep.share).toFixed(2)} apart in share ` +
        `(sleep ${sleep.share.toFixed(2)}, spin ${spin.share.toFixed(2)}; achievable ` +
        `${spin.achievable?.toFixed(3)}). The cuts ${CONTENTION_SHARE}/${HANG_SHARE} are no ` +
        'longer justified by the measurement and need re-deriving.');
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
    assert.equal(classify({ wallSeconds: 10, cpuSeconds: 1.3, achievable: 0.13 }).verdict, 'hang');
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
        'hang', 'subtracting startup must not mask a child that genuinely burned CPU');
});
