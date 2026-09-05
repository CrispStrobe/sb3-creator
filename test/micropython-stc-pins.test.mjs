// An STC program driven on a non-STC board (micro:bit/Pico) resolves its pins
// through the `_stc12` driver, and that driver is now emitted so the program is
// executable AND round-trips.
//
// Before: generateMicroPython emitted `_stc12.readPin(...)` / `_stc12.setPin
// (...)` calls but never the driver that defines `_stc12` — so the program
// referenced an undefined name (a NameError on the board) and, for the reader,
// carried no pin table, so `read <name>` re-parsed as a variable. Measured over
// the L3 corpus: 38 of 129 programs referenced an undefined `_stc*`.
//
// Now: the driver and its `_stc12_pins` table (port/bit/polarity) are emitted
// beside the calls, and STC pin WRITES route through the driver too instead of
// being dropped as `pass # pin`. The reader synthesises `PIN <name> = P<port>.
// <bit> DIR` from the table, so reads and writes bind to declared pins and the
// program round-trips byte-for-byte.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import micropythonToPseudocode from '../src/utils/micropythonToPseudocode.js';

const PROG = [
    'DEVICE STC12C5A60S2',
    'PIN btn = P3.2 INPUT',
    'PIN led = P1.0 OUTPUT ACTIVE LOW',
    'WHEN flag clicked:',
    '  FOREVER:',
    '    IF (read btn = 1) THEN:',
    '      turn on led',
    '    ELSE:',
    '      turn off led',
    ''
].join('\n');

const emit = () => { const c = new SB3Creator(); c.parse(PROG); return c.generateMicroPython().py; };

test('the emit defines its STC driver and pin table — no undefined _stc* reference', () => {
    const py = emit();
    assert.match(py, /_stc12\.(readPin|setPin)\(/, 'precondition: the program drives pins through the STC driver');
    // Every `_stc*` name used is defined in the same output.
    const used = new Set([...py.matchAll(/\b(_stc\w*)\b/g)].map((m) => m[1]));
    for (const n of used) {
        assert.match(py, new RegExp(`(?:^|\\n)\\s*${n}\\s*=|def\\s+${n}\\b|class\\s+${n}\\b`),
            `${n} is used but never defined — the emit would NameError`);
    }
});

test('the reader synthesises PIN declarations from the emitted table', () => {
    const { pseudocode } = micropythonToPseudocode(emit());
    assert.match(pseudocode, /PIN btn = P3\.2 INPUT/, 'the input pin was not declared from the table');
    assert.match(pseudocode, /PIN led = P1\.0 OUTPUT ACTIVE LOW/, 'the output pin (and its polarity) was not declared from the table');
});

test('an STC read/write program round-trips through MicroPython byte-for-byte', () => {
    const py = emit();
    const { pseudocode, warnings } = micropythonToPseudocode(py);
    // The pins are declared, so nothing warns about an unrecoverable read.
    assert.ok(!warnings.some((w) => /no pin table/.test(w)), `an STC pin read was still unresolved: ${JSON.stringify(warnings)}`);
    const c = new SB3Creator();
    c.parse(pseudocode);
    assert.equal(c.generateMicroPython().py, py, 'emit -> read -> emit was not identical');
});
