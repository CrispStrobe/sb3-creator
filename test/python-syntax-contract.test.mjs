/**
 * The contract of `test/helpers/python-syntax.mjs`: three outcomes, three
 * different answers.
 *
 * WHY THIS FILE EXISTS. `debug-micropython` and `debug-trace-audit` used to fold
 * every failure of the `python3` subprocess into `{ valid: false }`, and their
 * callers asserted on it with the message `syntax error:`. On 2026-08-23, on a box
 * at load 18–21, that produced eight of:
 *
 *     not ok 2 - syntactically valid Python
 *       error: |-
 *         syntax error:
 *         spawnSync /bin/sh ETIMEDOUT
 *
 * The emitter was fine; the machine was busy. The same eight were absent from the
 * next run of the same commit, which is how a gate teaches people it is noise.
 *
 * The repair was to make a timeout distinguishable from a rejection — and a
 * repair that nothing asserts is a repair that comes back. These are the
 * assertions. They are cheap and they run everywhere python3 does.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { checkPythonSyntax, pyBudgetMs, PY_BUDGET_DEFAULT_MS } from './helpers/python-syntax.mjs';

const hasPython = spawnSync('python3', ['--version']).status === 0;
const skip = hasPython ? false : 'python3 is not on PATH';

test('valid Python is accepted', { skip }, () => {
    assert.deepEqual(checkPythonSyntax('x = 1\ndef f():\n    return x\n'), { valid: true });
});

test('a real syntax error is reported as one, with python\'s own message', { skip }, () => {
    const r = checkPythonSyntax('def f(:\n    pass\n');
    assert.equal(r.valid, false, 'def f(: must be rejected');
    assert.match(r.error, /SyntaxError/, "the caller's message quotes python, not a wrapper");
});

test('a TIMEOUT is not a syntax error — it throws, naming the environment', { skip }, () => {
    // Reached by shrinking the budget rather than by loading the machine: the
    // property is "what happens when the subprocess does not answer in time",
    // and 1 ms produces exactly that state deterministically. Loading the box to
    // reproduce it would be an unreproducible test of the same thing.
    const before = process.env.BW_PY_TIMEOUT_MS;
    process.env.BW_PY_TIMEOUT_MS = '1';
    try {
        assert.equal(pyBudgetMs(), 1, 'the budget must be readable at CALL time, or this is untestable');
        assert.throws(
            () => checkPythonSyntax('x = 1\n'),
            (e) => {
                assert.equal(e.name, 'PythonUnavailableError',
                    'a timeout must not come back as { valid: false }');
                assert.match(e.message, /NOT A SYNTAX ERROR/,
                    'the message must say which of the two this is, in the place a reader sees it');
                assert.match(e.message, /384|721|measured/i,
                    'and must carry the measurement that says the budget was exceeded by the machine');
                return true;
            });
    } finally {
        if (before === undefined) delete process.env.BW_PY_TIMEOUT_MS;
        else process.env.BW_PY_TIMEOUT_MS = before;
    }
});

test('the budget is a MEASURED number, not a round one', { skip: false }, () => {
    // MEASURED 2026-08-23, 25 consecutive runs of the exact command on a box at
    // load 19.5: min 384 ms, median 504 ms, p90 658 ms, max 721 ms. The budget is
    // ~45x the p90 — deliberately far out, because the useful half of that
    // measurement is that the previous 5000 ms was ALREADY ~7x p90 and still fired
    // eight times in one run. The distribution has a tail a constant cannot remove,
    // which is why the repair is the distinguishable outcome above and not this
    // number. The floor stops anyone "fixing" a flake by shrinking it back.
    assert.ok(PY_BUDGET_DEFAULT_MS >= 20_000,
        `the python budget is ${PY_BUDGET_DEFAULT_MS} ms; measured p90 is 658 ms and 5000 ms was ` +
        'not enough on a loaded box. Shrinking this is how the flake comes back.');
});
