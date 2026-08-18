/**
 * micro:bit+ RADIO + EVENTS group → MicroPython lowering.
 * Oracle table R1–R5, B2 (docs/microbitplus/DUAL-LOWERING-ORACLE.md).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

function mp(body) {
    const c = new SB3Creator();
    c.parse(`DEVICE MICROBIT:\n  WHEN started:\n    ${body}\n`);
    const r = c.generateMicroPython();
    assert.ok(r.ok, `MicroPython gen failed: ${JSON.stringify(r.reasons || r.warnings)}`);
    return r.py;
}

const CASES = [
    ['R1 radio on',        'radio on group 5 power 3',     'radio.config(group=int(5), power=int(3))'],
    ['R1 radio.on()',      'radio on group 5 power 3',     'radio.on()'],
    ['R2 send number',     'radio send number 42',         'radio.send(str(42))'],
    ['R3 send text',       'radio send text "hi"',         "radio.send('hi')"],
    ['R5 last radio num',  'set val to read last radio number', '_radio_last_num'],
    ['B2 button_a',        'set val to read button_a',     'button_a.is_pressed()'],
];

for (const [name, dialect, expected] of CASES) {
    test(`radio/events lowering: ${name}`, () => {
        const py = mp(dialect);
        assert.ok(py.includes(expected), `expected \`${expected}\` in:\n${py}`);
    });
}

test('radio import is added for radio on', () => {
    assert.match(mp('radio on group 1 power 7'), /import radio/);
});

test('radio import is added for send', () => {
    assert.match(mp('radio send number 99'), /import radio/);
});
