/**
 * micro:bit+ PINS group → MicroPython lowering.
 * Oracle table P1–P7 (docs/microbitplus/DUAL-LOWERING-ORACLE.md).
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
    // Pins / GPIO (P1–P7)
    ['P3 digital write 1',  'set pin P0 to 1',            'pin0.write_digital(1)'],
    ['P3 digital write 0',  'set pin P0 to 0',            'pin0.write_digital(0)'],
    ['P4 analog read',      'set val to analog value of pin P1', 'pin1.read_analog()'],
    ['P5 analog write',     'set pin P2 analog 50 %',     'pin2.write_analog(int(50 / 100 * 1023))'],
    ['P6 pull up',          'set pin P0 pull up',          'pin0.set_pull(pin0.PULL_UP)'],
    ['P6 pull down',        'set pin P1 pull down',        'pin1.set_pull(pin1.PULL_DOWN)'],
    ['P6 pull none',        'set pin P2 pull none',        'pin2.set_pull(pin2.NO_PULL)'],
    ['digital read',        'set val to pin P0 digital',   'pin0.read_digital()'],
    ['button_a',            'set val to read button_a',    'button_a.is_pressed()'],
    ['button_b',            'set val to read button_b',    'button_b.is_pressed()'],
];

for (const [name, dialect, expected] of CASES) {
    test(`pin lowering: ${name}`, () => {
        const py = mp(dialect);
        assert.ok(py.includes(expected), `expected \`${expected}\` in:\n${py}`);
    });
}
