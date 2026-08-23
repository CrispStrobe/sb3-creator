/**
 * A wall-clock budget that says WHICH failure it is.
 *
 * THE SHAPE THIS EXISTS FOR
 * -------------------------
 * `PLAN.md` §27 named a fourth kind of untrustworthy gate, alongside never-runs,
 * cannot-fail and checks-nothing: **cannot-be-trusted-when-busy.** A wall-clock
 * budget is a real check of a real property — something should not take this long —
 * but its failure is indistinguishable from the machine being oversubscribed, and
 * the remedy its own message suggests ("raise it") is the one that destroys it.
 *
 * Both halves have already cost this project real time:
 *
 *   - eight `syntactically valid Python` failures that were `spawnSync ETIMEDOUT`
 *     on a box at load 18–21, reported as defects in the emitter and absent from
 *     the next run of the same commit;
 *   - `gallery-e2e` and `circuit-params-are-read` exceeding `--test-timeout
 *     900000` at load 26 while passing in CI;
 *   - brickwright-lite's `lesson-numeric-contract` saying `11 benches outran the
 *     budget — raise it or check the box`, which is the message telling you to
 *     destroy the check.
 *
 * THE DISCRIMINATOR, and why it is cheap
 * --------------------------------------
 * **A test that hung burns CPU. A machine that is oversubscribed does not give the
 * process the CPU to burn.** So the ratio of CPU consumed to wall time elapsed
 * separates the two, and on Linux it costs one file read:
 *
 *   /proc/self/stat fields 16 and 17 are `cutime` and `cstime` — the user and
 *   system time of this process's REAPED CHILDREN, in clock ticks. Sample before
 *   and after a synchronous `execFileSync`/`spawnSync` and the delta is exactly the
 *   CPU that child burned, including a child killed on timeout, because the kill is
 *   followed by a reap.
 *
 * That works for the synchronous call sites this repo actually has, which is the
 * point: an async-only instrument would have meant rewriting every caller, and a
 * rewritten caller is a caller whose behaviour you then have to re-establish.
 *
 * WHAT IT CANNOT DO, said plainly
 * -------------------------------
 * - **node:test's own `--test-timeout` cannot be routed through this.** The runner
 *   raises `testTimeoutFailure` itself and there is no hook to enrich the message.
 *   `timeoutContext()` below is the partial answer: a file can emit a diagnostic
 *   line naming the load it started under, so a later `test timed out after
 *   900000ms` can at least be read against it.
 * - **Non-Linux has no `/proc`.** The ratio comes back `null` and the message says
 *   the discriminator was unavailable rather than guessing. CI is ubuntu, so the
 *   place this matters most does have it.
 * - **The cutime delta covers every child reaped in the window**, not only the one
 *   under test. At a synchronous call site there is normally no other, but a
 *   caller that reaps in parallel would get an over-estimate — which biases towards
 *   "hang", the conservative direction: it sends someone to look at the code rather
 *   than telling them to shrug and re-run.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { loadavg, cpus, platform } from 'node:os';

/** Linux clock ticks per second. 100 on every distro this runs on; see sysconf(3). */
const HZ = 100;

const isLinux = platform() === 'linux';

/**
 * CPU seconds consumed by this process's reaped children, or null off Linux.
 * Fields 16/17 of /proc/self/stat, one-indexed per proc(5), are cutime/cstime.
 */
export function reapedChildCpuSeconds () {
    if (!isLinux) return null;
    try {
        const stat = readFileSync('/proc/self/stat', 'utf8');
        // comm (field 2) may contain spaces and parentheses, so split after the
        // LAST ')' — the documented way to parse this file.
        const rest = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
        // rest[0] is field 3 (state); cutime is field 16 -> rest[13], cstime -> rest[14].
        const cutime = Number(rest[13]);
        const cstime = Number(rest[14]);
        if (!Number.isFinite(cutime) || !Number.isFinite(cstime)) return null;
        return (cutime + cstime) / HZ;
    } catch { return null; }
}

/** How many `node` processes are alive, as a blunt measure of who else is here. */
export function nodeProcessCount () {
    if (!isLinux) return null;
    let n = 0;
    try {
        for (const entry of readdirSync('/proc')) {
            if (!/^\d+$/.test(entry)) continue;
            try {
                if (readFileSync(`/proc/${entry}/comm`, 'utf8').trim() === 'node') n++;
            } catch { /* the process exited between readdir and read; normal */ }
        }
    } catch { return null; }
    return n;
}

/**
 * The cuts, expressed as a fraction of WHAT IS ACHIEVABLE RIGHT NOW — not of wall
 * time. This distinction is the whole instrument, and the first draft got it wrong.
 *
 * The obvious design compares CPU against wall directly: a hang burns ~1.0, a
 * starved process ~0.0. MEASURED 2026-08-23 on this box — 4 cpus, load 36, 39
 * runnable — a child doing nothing but spin achieves:
 *
 *     spin for 1 s   ->  wall 1.06 s, cpu 0.18 s, ratio 0.170
 *     spin for 2 s   ->  wall 2.05 s, cpu 0.25 s, ratio 0.122
 *
 * A real hang cannot reach 0.5 here either. An absolute cut would therefore call
 * every genuine hang "contention" **precisely on the machines where the question is
 * being asked** — the instrument would fail in exactly the conditions it was built
 * for, and it would fail silently, in the reassuring direction.
 *
 * So the reference is measured at failure time by `achievableCpuRatio()`: spawn a
 * deliberate spinner for a moment and see what it gets. The child's ratio is then
 * read as a fraction of that. On an idle box achievable is ~1.0 and the cuts mean
 * what they look like they mean; at load 36 achievable is ~0.13 and they still
 * separate a spinner from a sleeper.
 */
export const CONTENTION_SHARE = 0.15;
export const HANG_SHARE = 0.50;

/** Kept for readers of older messages; the cuts are shares now, not raw ratios. */
export const CONTENTION_RATIO = CONTENTION_SHARE;
export const HANG_RATIO = HANG_SHARE;

/**
 * What fraction of wall time a CPU-hungry child can actually get on this machine,
 * right now. Measured, because it is a property of the moment, not of the host.
 *
 * Costs one short spinning child and is only ever called on the failure path, so it
 * buys its accuracy at a price nobody pays on a green run.
 */
/**
 * The CPU a child costs merely by existing, before it does any work.
 *
 * MEASURED 2026-08-23, `node -e ''` ten times on this box: min 0.040 s, median
 * 0.060 s, max 0.070 s. That is a FIXED cost, and over a short budget it dominates:
 * a child that only sleeps for 1.5 s still shows 0.04 s of CPU, which against an
 * achievable ratio of 0.16 is 16% — right on the contention cut. The first version
 * of this helper mis-classified its own sleeping stub for exactly that reason.
 *
 * Subtracting it is the principled fix: what is wanted is the CPU the WORK used,
 * not the CPU the runtime charged for starting. Only measured on the failure path.
 */
export function childStartupCpuSeconds () {
    if (!isLinux) return null;
    const before = reapedChildCpuSeconds();
    if (before === null) return null;
    try {
        execFileSync(process.execPath, ['-e', ''], { stdio: 'pipe', timeout: 30_000 });
    } catch { return null; }
    const after = reapedChildCpuSeconds();
    return after === null ? null : Math.max(0, after - before);
}

export function achievableCpuRatio (sampleMs = 400) {
    if (!isLinux) return null;
    const before = reapedChildCpuSeconds();
    if (before === null) return null;
    const t0 = process.hrtime.bigint();
    try {
        execFileSync(process.execPath, ['-e', 'for (let x = 0; ; ) { x = (x + 1) % 1e9; }'],
            { timeout: sampleMs, stdio: 'pipe' });
    } catch { /* the timeout is the point */ }
    const wall = Number(process.hrtime.bigint() - t0) / 1e9;
    const after = reapedChildCpuSeconds();
    if (after === null || !(wall > 0)) return null;
    return Math.max(0, after - before) / wall;
}

/** Raised when a budget is exceeded. Carries the evidence, not just the number. */
export class BudgetExceededError extends Error {
    constructor (message, detail) {
        super(message);
        this.name = 'BudgetExceededError';
        Object.assign(this, detail);
    }
}

/** True when an execFileSync/spawnSync failure is the BUDGET rather than the work. */
export function isBudgetFailure (e) {
    if (!e) return false;
    return Boolean(e.killed) || e.signal === 'SIGTERM' || e.signal === 'SIGKILL' ||
        /ETIMEDOUT/.test(String(e.code || '')) || /ETIMEDOUT/.test(String(e.message || ''));
}

/**
 * Classify, and refuse to classify when the evidence does not support it.
 *
 * `achievable` is the reference from `achievableCpuRatio()`. Pass it explicitly so
 * this stays a pure function and the tests can drive both branches without a box in
 * a particular state.
 */
export function classify ({ wallSeconds, cpuSeconds, achievable, startupCpu = 0 }) {
    if (cpuSeconds === null || !(wallSeconds > 0)) return { verdict: 'unknown', ratio: null, share: null };
    // Charge the runtime's fixed startup to the runtime, not to the work.
    const workCpu = Math.max(0, cpuSeconds - (startupCpu || 0));
    const ratio = workCpu / wallSeconds;
    // Without a reference there is nothing to compare against. Guessing 1.0 here is
    // what would make a hang on a loaded box read as contention.
    if (achievable === null || achievable === undefined || !(achievable > 0.001)) {
        return { verdict: 'unknown', ratio, share: null };
    }
    const share = Math.min(1, ratio / achievable);
    if (share <= CONTENTION_SHARE) return { verdict: 'contention', ratio, share, achievable, workCpu };
    if (share >= HANG_SHARE) return { verdict: 'hang', ratio, share, achievable, workCpu };
    return { verdict: 'inconclusive', ratio, share, achievable, workCpu };
}

/** The message a human has to act on, in both directions. */
export function explainTimeout (d) {
    const { what, budgetMs, wallSeconds, cpuSeconds, loadStart, loadEnd, nodes,
        verdict, ratio, share, achievable } = d;
    const w = wallSeconds.toFixed(1);
    const c = cpuSeconds === null ? 'unknown (no /proc)' : `${cpuSeconds.toFixed(2)} s`;
    const evidence =
        `used ${c} of CPU in ${w} s wall` +
        (d.startupCpu
            ? ` (runtime startup measured separately at ${d.startupCpu.toFixed(2)} s and charged to`
              + ' the runtime, not to the work)'
            : '') +
        ` — work ratio ${ratio === null ? 'n/a' : ratio.toFixed(3)}, ` +
        `while a deliberately CPU-bound child measured right now achieves ` +
        `${achievable === null || achievable === undefined ? 'n/a' : achievable.toFixed(3)} — ` +
        `so this took ${share === null || share === undefined ? 'n/a' : (share * 100).toFixed(0) + '%'} ` +
        'of the CPU it could have had';
    const where = `load ${loadStart.toFixed(1)} -> ${loadEnd.toFixed(1)} on ${cpus().length} cpus` +
        (nodes === null ? '' : `, ${nodes} node processes alive`);

    if (verdict === 'contention') {
        return `${what}: timed out after ${w} s (budget ${budgetMs} ms). ${evidence}. ` +
            'THIS IS CONTENTION, NOT A HANG: the work was ready to run and the machine did not ' +
            `schedule it (${where}). Re-run on a quieter box before changing anything. ` +
            'Raising the budget would hide the next real hang.';
    }
    if (verdict === 'hang') {
        return `${what}: timed out after ${w} s (budget ${budgetMs} ms). ${evidence}. ` +
            'THIS IS A HANG, NOT CONTENTION: the process got the CPU that was going and spent ' +
            `it (${where}). Investigate the code; do not raise the budget.`;
    }
    if (verdict === 'inconclusive') {
        return `${what}: timed out after ${w} s (budget ${budgetMs} ms). ${evidence}, which ` +
            `falls between the contention cut (${CONTENTION_SHARE}) and the hang cut ` +
            `(${HANG_SHARE}). THE DISCRIMINATOR CANNOT TELL (${where}). The numbers are above; ` +
            'compare against a run on an idle box rather than trusting this line.';
    }
    return `${what}: timed out after ${w} s (budget ${budgetMs} ms). ${evidence}. ` +
        `Contention and a hang CANNOT BE TOLD APART here (${where}) — the CPU reference was ` +
        'unavailable, which on Linux means /proc could not be read.';
}

/**
 * Run a synchronous, budgeted operation and turn a budget failure into a verdict.
 *
 * @param {object} o
 * @param {string} o.what        what is bounded, in the caller's own words
 * @param {number} o.budgetMs    the budget, which the caller must also pass to `run`
 * @param {(ms:number)=>any} o.run  performs the work; must throw on timeout
 * @returns whatever `run` returned
 * @throws {BudgetExceededError} on a budget failure; any other error propagates
 */
export function runBounded ({ what, budgetMs, run }) {
    if (!Number.isFinite(budgetMs) || budgetMs <= 0) {
        throw new Error(`runBounded(${what}): budgetMs must be a positive number, got ${budgetMs}`);
    }
    const loadStart = loadavg()[0];
    const cpu0 = reapedChildCpuSeconds();
    const t0 = process.hrtime.bigint();
    try {
        return run(budgetMs);
    } catch (e) {
        if (!isBudgetFailure(e)) throw e;          // a real failure of the work
        const wallSeconds = Number(process.hrtime.bigint() - t0) / 1e9;
        const cpu1 = reapedChildCpuSeconds();
        const cpuSeconds = (cpu0 === null || cpu1 === null) ? null : Math.max(0, cpu1 - cpu0);
        // Measure the reference on the FAILURE path only, so a green run never pays
        // for it and the number describes this moment rather than this host.
        const achievable = achievableCpuRatio();
        const startupCpu = childStartupCpuSeconds();
        const { verdict, ratio, share, workCpu } = classify({
            wallSeconds, cpuSeconds, achievable, startupCpu: startupCpu ?? 0
        });
        const detail = {
            what, budgetMs, wallSeconds, cpuSeconds, workCpu, startupCpu, ratio, share,
            achievable, verdict, loadStart, loadEnd: loadavg()[0], nodes: nodeProcessCount(), cause: e
        };
        throw new BudgetExceededError(explainTimeout(detail), detail);
    }
}

/**
 * A diagnostic line for the budget this helper CANNOT wrap: node:test's own
 * `--test-timeout`. The runner raises that failure itself with no hook to enrich
 * it, so the best available answer is for a slow file to state the conditions it
 * began under, on stdout, where a later `test timed out after 900000ms` can be read
 * against it. Call it at the top of a file that has timed out before.
 */
export function timeoutContext (fileLabel) {
    const line = `# budget-context ${fileLabel}: load ${loadavg()[0].toFixed(1)} on ` +
        `${cpus().length} cpus, ${nodeProcessCount() ?? '?'} node processes alive at start. ` +
        'If this file later reports `test timed out`, compare that load against a quiet run ' +
        'before raising --test-timeout.';
    console.log(line);
    return line;
}
