/**
 * Parse generated Python with the real `python3`, and never confuse a busy box
 * with a broken emitter.
 *
 * THE DEFECT THIS CLOSES
 * ----------------------
 * `debug-micropython` and `debug-trace-audit` each carried their own copy of:
 *
 *     execSync(`python3 -c "import ast; ast.parse(…)"`, { timeout: 5000 });
 *     return { valid: true };
 *   } catch (e) {
 *     return { valid: false, error: e.stderr?.toString() || e.message };
 *
 * Every failure mode of the subprocess — a real SyntaxError, a missing
 * interpreter, and a TIMEOUT — came back as `{ valid: false }`, and the caller
 * asserted on it with the message `syntax error:`. On 2026-08-23, on a box at
 * load 18–21, that produced eight of these in one run:
 *
 *     not ok 2 - syntactically valid Python
 *       error: |-
 *         syntax error:
 *         spawnSync /bin/sh ETIMEDOUT
 *
 * The emitter was fine. The machine was busy. A gate that reports contention as
 * a defect in the code under test is worse than one that skips, because someone
 * will go looking for the bug — and worse again because the same eight failures
 * were absent from the next run of the same commit, which teaches people that
 * this gate is noise.
 *
 * WHERE 5000 CAME FROM: nowhere recorded. MEASURED 2026-08-23, 25 consecutive
 * runs of the exact command, on this box at load 19.5:
 *
 *     min 384 ms   median 504 ms   p90 658 ms   max 721 ms
 *
 * So 5000 ms was already ~7x the p90 and it still fired eight times, which is the
 * useful part of the measurement: the distribution has a long tail that a bigger
 * constant does not remove. The budget is therefore raised to a measured-and-
 * stated 30 s (~45x p90) AND the outcome is made distinguishable, because the
 * second is the actual repair. A number alone cannot fix this.
 *
 * ONE RETRY, then an honest failure. A retry is right here and wrong in general:
 * it is right because the property under test (does this text parse?) is
 * deterministic, so a retry cannot mask a real defect — a syntax error fails
 * identically the second time. It would be wrong for anything whose outcome can
 * legitimately differ between runs.
 */
import { execFileSync } from 'node:child_process';
import { runBounded } from './timed.mjs';
import { writeFileSync, unlinkSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** MEASURED (see header): p90 658 ms on a loaded box. ~45x that. */
export const PY_BUDGET_DEFAULT_MS = 30_000;

/**
 * Read at CALL time, not at module load.
 *
 * A budget captured at import is untestable without a cache-busting `?query`
 * specifier, and `scripts/check-staged-imports.mjs` rejects those — correctly, in
 * the sense that it is checking every import resolves to a committed file. The
 * design was the problem, not the gate: a knob nothing can turn during a run is a
 * knob no test can exercise.
 */
export const pyBudgetMs = () => Number(process.env.BW_PY_TIMEOUT_MS || PY_BUDGET_DEFAULT_MS);

/** @deprecated the value at import time; prefer pyBudgetMs(). Kept for readers. */
export const PY_BUDGET_MS = PY_BUDGET_DEFAULT_MS;

/**
 * Raised when the subprocess could not deliver a verdict. NOT a syntax error —
 * callers must let this propagate rather than folding it into `{ valid: false }`.
 */
export class PythonUnavailableError extends Error {
    constructor (message) {
        super(message);
        this.name = 'PythonUnavailableError';
    }
}

function runOnce (file, budget) {
    try {
        // Routed through runBounded so a budget failure carries the
        // contention-vs-hang evidence instead of a bare ETIMEDOUT. The outcome
        // contract of THIS module is unchanged — callers still get {valid} or a
        // PythonUnavailableError — but that error now says which of the two it was,
        // which is the whole point of test/helpers/timed.mjs.
        runBounded({
            what: `python3 parsing ${file}`,
            budgetMs: budget,
            run: (ms) => execFileSync('python3',
                ['-c', `import ast; ast.parse(open(${JSON.stringify(file)}).read())`],
                { timeout: ms, stdio: ['pipe', 'pipe', 'pipe'], encoding: 'utf8' })
        });
        return { valid: true };
    } catch (e) {
        if (e.name === 'BudgetExceededError') {
            return { unavailable: true, killed: true, missing: false, verdict: e.verdict, detail: e.message };
        }
        // A verdict: python ran and rejected the text.
        const stderr = (e.stderr && e.stderr.toString()) || '';
        if (/SyntaxError|IndentationError|TabError/.test(stderr)) {
            return { valid: false, error: stderr.trim() };
        }
        // Not a verdict: the subprocess never got to answer.
        const killed = e.killed || e.signal === 'SIGTERM' || /ETIMEDOUT/.test(String(e.message));
        const missing = e.code === 'ENOENT';
        return { unavailable: true, killed, missing, detail: (stderr || e.message || '').trim() };
    }
}

/**
 * @returns {{valid: true} | {valid: false, error: string}}
 * @throws {PythonUnavailableError} when the interpreter could not answer at all
 */
export function checkPythonSyntax (py) {
    const dir = mkdtempSync(join(tmpdir(), 'bw-pysyn-'));
    const file = join(dir, 'candidate.py');
    try {
        writeFileSync(file, py);
        const budget = pyBudgetMs();
        let r = runOnce(file, budget);
        if (r.unavailable && r.killed) {
            // Deterministic property, so a retry cannot hide a real defect —
            // a SyntaxError fails identically the second time.
            r = runOnce(file, budget * 2);
        }
        if (r.unavailable) {
            if (r.missing) {
                throw new PythonUnavailableError(
                    'python3 is not on PATH, so this gate has no oracle. That is an ' +
                    'environment failure, not a defect in the generated code.');
            }
            throw new PythonUnavailableError(
                `python3 did not return a verdict within ${budget} ms, and did not on a ` +
                `retry at ${budget * 2} ms. THIS IS NOT A SYNTAX ERROR — the generated ` +
                'Python was never judged. Measured cost of this call on an idle-to-loaded box ' +
                'is 384–721 ms (25 runs, 2026-08-23). ' +
                (r.verdict ? `The CPU discriminator says this was ${r.verdict.toUpperCase()}. ` : '') +
                `Detail: ${r.detail || '(none)'}`);
        }
        return r;
    } finally {
        try { unlinkSync(file); } catch { /* already gone */ }
        rmSync(dir, { recursive: true, force: true });
    }
}
