// The MicroPython reader drops the emitter's scheduler runtime, not the
// learner's program.
//
// generateMicroPython emits one `_task_N()` per script and drives them from a
// `_run(...)` scheduler with `_pending`/`_receivers` broadcast plumbing and
// `_bw_*` constants — all of it the emitter's own infrastructure. The reader
// used to hunt for `def bw_script(`, find neither that nor the current
// `def _task_0()`, fall back to the first `while True:` and then read the whole
// scheduler back as if it were the program: `while tasks:` became a REPEAT
// UNTIL, `_pending = []` became `set _pending to []`, and eight scheduler lines
// rode along as grey blocks. Surfaced by brickwright-lite's L3 reader-coverage
// audit, where MicroPython degraded on 100% of round-trips for this reason.
//
// The fix recognises the task function so the body loop stops at its dedent,
// dropping everything after it. This locks two properties: the runtime never
// leaks into the lifted pseudocode, and a program with more than one script is
// left degraded with a NAMED reason rather than having its extra scripts
// silently swallowed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import micropythonToPseudocode from '../src/utils/micropythonToPseudocode.js';

const RUNTIME_TOKENS = ['_run', '_pending', '_receivers', '_task_', 'StopIteration', 'next(gen)'];

const lift = (prog) => {
    const c = new SB3Creator();
    c.parse(prog);
    const { py } = c.generateMicroPython();
    return { py, ...micropythonToPseudocode(py) };
};

test('the scheduler runtime never leaks into the lifted pseudocode', () => {
    const { pseudocode, warnings } = lift(
        'DEVICE MICROBIT\nWHEN flag clicked:\n  set n to 0\n  FOREVER:\n    change n by 1\n    wait 1 seconds\n'
    );
    for (const tok of RUNTIME_TOKENS) {
        assert.ok(!pseudocode.includes(tok), `runtime token '${tok}' leaked into the pseudocode`);
    }
    // None of the runtime lines survive as grey blocks either.
    const runtimeGrey = warnings.filter((w) => /grey block/.test(w) && /(_run|tasks|StopIteration|_pending|_receivers)/.test(w));
    assert.equal(runtimeGrey.length, 0, `runtime kept as grey blocks: ${runtimeGrey.join('; ')}`);
    // The learner's program is still there.
    assert.match(pseudocode, /set n to 0/, 'the learner body was dropped with the runtime');
});

test('emit -> read -> emit reconstructs the runtime exactly once (not lost, not duplicated)', () => {
    const first = lift('DEVICE MICROBIT\nWHEN flag clicked:\n  set n to 0\n  FOREVER:\n    change n by 1\n');
    const c1 = new SB3Creator();
    c1.parse(first.pseudocode);
    const again = c1.generateMicroPython().py;
    // The reader dropped the scheduler; the emitter puts exactly one back. If the
    // reader had preserved it as grey blocks, re-emission would duplicate it.
    assert.equal((again.match(/^def _run\(tasks\):/gm) || []).length, 1, 'the scheduler was lost or duplicated on re-emission');
    assert.equal((again.match(/^_run\(\[/gm) || []).length, 1, 'the scheduler kickoff was lost or duplicated');
});

test('a program with more than one script names the unlifted scripts — not swallowed', () => {
    const { pseudocode, warnings } = lift(
        'DEVICE MICROBIT\nWHEN flag clicked:\n  set a to 1\nWHEN flag clicked:\n  set b to 2\n'
    );
    // The runtime is still gone.
    for (const tok of RUNTIME_TOKENS) assert.ok(!pseudocode.includes(tok), `runtime token '${tok}' leaked`);
    // But the second script is reported as a real, named loss, not dropped in silence.
    assert.ok(
        warnings.some((w) => /more WHEN script\(s\) not lifted/.test(w)),
        `the unlifted second script was not named: ${JSON.stringify(warnings)}`
    );
});
