// A block with no equivalent on the target board is a NAMED loss, not a silent
// one.
//
// The MicroPython emitter parks a block it cannot translate for the board as
// `pass  # <block>`. Most STC pin reads/writes are no longer parked — they now
// resolve through the emitted `_stc12` driver (see micropython-stc-pins) — but
// genuinely un-portable blocks (a whole-port write, a shift-register `setpart`,
// a device peripheral the board lacks) still are. The reader keeps those as a
// `#` pseudocode comment naming the block and the reason, and warns, so the
// loss is visible rather than dropped. parse() ignores the comment, so nothing
// reconstructs the pass — the loss is named, not recovered.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import micropythonToPseudocode from '../src/utils/micropythonToPseudocode.js';

// A generated program body carrying a parked, untranslatable block.
const HAND = [
    '# generated for micro:bit (MicroPython)',
    'from microbit import *',
    '',
    'def _task_0():',
    '    while True:',
    '        pass  # devices_oledclear',
    '        yield 0',
    '',
    '_run([_task_0()])',
    ''
].join('\n');

test('an untranslatable block is named as a degraded loss, not dropped silently', () => {
    const { pseudocode, warnings } = micropythonToPseudocode(HAND);
    assert.match(pseudocode, /# devices_oledclear: no equivalent on this board; the block was not translated/,
        'the dropped block is not named in the pseudocode');
    assert.ok(warnings.some((w) => /devices_oledclear: no equivalent on this board/.test(w)),
        'the loss is not reported as a warning');
});

test('the named loss is inert — re-parsing does not reconstruct the pass', () => {
    // Import here to keep the reader test above dependency-free.
    return import('../src/utils/sb3Creator.js').then(({ default: SB3Creator }) => {
        const { pseudocode } = micropythonToPseudocode(HAND);
        const c = new SB3Creator();
        assert.doesNotThrow(() => c.parse(pseudocode), 'the comment broke re-parsing');
        assert.ok(!/pass {2}# devices_oledclear/.test(c.generateMicroPython().py),
            'the comment wrongly reconstructed the pass');
    });
});
