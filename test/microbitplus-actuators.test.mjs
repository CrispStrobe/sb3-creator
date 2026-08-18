/**
 * micro:bit+ ACTUATORS group → MicroPython lowering.
 * Oracle table A1–A4 (docs/microbitplus/DUAL-LOWERING-ORACLE.md).
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
    ['A1 play tone indefinite', 'set buzzer to 440 hz',        'music.pitch(int(440), pin=pin0)'],
    ['A1 play tone with dur',   'play tone 880 hz for 200 ms', 'music.pitch(int(880), int(200), pin=pin0)'],
    ['A2 play note C4',         'play note C4',                'music.pitch(262, 500, pin=pin0)'],
    ['A2 play note A4',         'play note A4',                'music.pitch(440, 500, pin=pin0)'],
    ['A3 stop buzzer',          'stop buzzer',                 'music.stop()'],
    ['A4 servo 90°',            'set servo to 90',             'pin1.write_analog(int(90 / 180 * 1023))'],
    ['A4 servo on P2',          'set pin P2 servo 45',         'pin2.write_analog(int(45 / 180 * 1023))'],
];

for (const [name, dialect, expected] of CASES) {
    test(`actuator lowering: ${name}`, () => {
        const py = mp(dialect);
        assert.ok(py.includes(expected), `expected \`${expected}\` in:\n${py}`);
    });
}

test('music import is added for playtone', () => {
    assert.match(mp('set buzzer to 440 hz'), /import music/);
});
