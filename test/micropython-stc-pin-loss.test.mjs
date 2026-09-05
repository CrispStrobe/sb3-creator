// An STC pin read with no pin table in the source is a NAMED loss, not a silent
// corruption.
//
// MEASURED over all 129 L3 programs: generateMicroPython emits `_stc*.readPin
// ("name")` for an STC pin read but NEVER emits the `_stc12_pins` driver table
// beside it — 0 of 129 emits carry the table, and 37 reference an otherwise
// undefined `_stc12`. The port and bit that `project.stc.pins` holds do not
// reach the emitted text, so the reader has nothing to trust and must not invent
// a pin map (lego-ac's guardrail). Instead of lifting `read <name>` silently —
// which, with no declaration to bind it, re-parses as a variable — the reader
// now names the loss as a degraded warning. Recovering idempotence needs the
// EMITTER to emit the table; that is a separate change and a separate owner.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import micropythonToPseudocode from '../src/utils/micropythonToPseudocode.js';

const PROG = 'DEVICE STC12C5A60S2\nPIN btn = P3.2 INPUT\nPIN led = P1.0 OUTPUT\nWHEN flag clicked:\n  FOREVER:\n    IF (read btn = 1) THEN:\n      turn on led\n';

test('the emit references the STC driver read but carries no pin table', () => {
    const c = new SB3Creator();
    c.parse(PROG);
    const py = c.generateMicroPython().py;
    assert.match(py, /_stc\d*\.readPin\("btn"\)/, 'precondition: the read goes through the STC driver');
    assert.ok(!/_stc12_pins\s*=/.test(py), 'precondition: the pin table is not in the emit');
});

test('an untabled STC pin read is named as a degraded loss, not dropped silently', () => {
    const c = new SB3Creator();
    c.parse(PROG);
    const { pseudocode, warnings } = micropythonToPseudocode(c.generateMicroPython().py);
    // The read still lifts (it is not thrown away)...
    assert.match(pseudocode, /\bread btn\b/, 'the pin read was lost entirely');
    // ...but the loss of its declaration is reported, naming the pin and reason.
    assert.ok(
        warnings.some((w) => /pin btn: read through the STC driver.*no pin table/.test(w)),
        `the undeclared STC pin read was not named: ${JSON.stringify(warnings)}`
    );
});
