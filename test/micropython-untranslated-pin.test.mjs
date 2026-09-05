// A pin write with no equivalent on the target board is a NAMED loss, not a
// silent one.
//
// The MicroPython emitter writes `pass  # pin <name>` when an 8051 pin block
// targets a board (micro:bit/Pico) that cannot express it. The reader used to
// drop the `pass`, and with it the comment, so 77 of the 129 L3 corpus programs
// came back quietly missing a pin write with nothing to say so. The reader now
// keeps it as a `#` pseudocode comment naming the pin and the reason, and warns
// — a degraded row that says what was lost. It deliberately does NOT round-trip
// (parse() ignores the comment, so the emitter does not reconstruct the pass);
// the point is to make the loss visible, not to recover it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import micropythonToPseudocode from '../src/utils/micropythonToPseudocode.js';

// A P1.0 pin on the micro:bit has no equivalent, so the emitter parks the write
// as `pass  # pin led`.
const PROG = 'DEVICE MICROBIT\nPIN led = P1.0 OUTPUT\nWHEN flag clicked:\n  FOREVER:\n    turn on led\n    wait 1 seconds\n';

test('an untranslatable pin write becomes a named comment and a degraded warning', () => {
    const c = new SB3Creator();
    c.parse(PROG);
    const py = c.generateMicroPython().py;
    assert.match(py, /pass {2}# pin led/, 'precondition: the emitter parks the pin write');

    const { pseudocode, warnings } = micropythonToPseudocode(py);
    // Named in the text, for the human reading the imported program.
    assert.match(pseudocode, /# pin led: no equivalent on this board; the 8051 pin block was not translated/,
        'the dropped pin write is not named in the pseudocode');
    // And named in the warnings, so it counts as a degraded row.
    assert.ok(warnings.some((w) => /pin led: no equivalent on this board/.test(w)),
        'the loss is not reported as a warning');
});

test('the named loss does not reconstruct the pass on re-emission (named, not recovered)', () => {
    const c = new SB3Creator();
    c.parse(PROG);
    const py = c.generateMicroPython().py;
    const { pseudocode } = micropythonToPseudocode(py);
    // The comment must be inert: re-parsing must not error, and must not put the
    // `pass # pin` back (that would be pretending the block was recovered).
    const c1 = new SB3Creator();
    assert.doesNotThrow(() => c1.parse(pseudocode), 'the pin comment broke re-parsing');
    assert.ok(!/pass {2}# pin/.test(c1.generateMicroPython().py), 'the comment wrongly reconstructed the pass');
});
