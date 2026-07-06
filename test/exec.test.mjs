// Execution matrix (PLAN §22): every example's generated JavaScript must actually
// RUN without throwing. Forever-loop games are bounded by a vm timeout (that's a
// clean "still running", not an error). Complements codegen.test.mjs (which checks
// syntactic validity via py_compile / new Function) and roundtrip.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import SB3Creator from '../src/utils/sb3Creator.js';
import examples from '../src/utils/examples.js';

// Run generated JS in a sandbox with a hard timeout. A timeout means the code ran
// a game loop (fine); any other throw is a real runtime error and fails the test.
function runBounded (code, answers = []) {
    let i = 0;
    const logs = [];
    const sandbox = {
        console: { log: (...a) => logs.push(a.join(' ')), error: () => {}, warn: () => {}, info: () => {} },
        prompt: () => answers[i++] ?? ''
    };
    try {
        vm.runInNewContext(code, sandbox, { timeout: 800 });
        return { logs, timedOut: false };
    } catch (e) {
        if (e.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' || /timed out/i.test(e.message)) return { logs, timedOut: true };
        throw e; // real runtime error
    }
}

for (const [name, code] of Object.entries(examples)) {
    test(`exec: ${name} generated JS runs without error`, () => {
        const c = new SB3Creator();
        c.parse(code);
        const js = c.generateJavaScript();
        assert.doesNotThrow(() => runBounded(js, ['12', '32', '5', '5', '5', '5']),
            'generated JS must run (or hit the loop timeout) without a runtime error');
    });
}

test('exec: the quiz runs to the right score and stops cleanly', () => {
    const c = new SB3Creator();
    c.parse(examples.educational);
    const { logs, timedOut } = runBounded(c.generateJavaScript(), ['12', '32']);
    assert.equal(timedOut, false, 'the quiz terminates (no game loop)');
    assert.equal(logs.filter((l) => l === 'Correct!').length, 2);
    assert.equal(logs[logs.length - 1], '2', 'final score is 2');
});
