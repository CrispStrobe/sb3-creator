/**
 * micro:bit+ SENSORS/MOTION group → MicroPython lowering.
 * Oracle table M1–M11, E1–E3 (docs/microbitplus/DUAL-LOWERING-ORACLE.md).
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
    // Motion / orientation (M1–M11)
    ['M1 accel x',        'set val to read accel x',        'accelerometer.get_x()'],
    ['M2 accel y',        'set val to read accel y',        'accelerometer.get_y()'],
    ['M3 accel z',        'set val to read accel z',        'accelerometer.get_z()'],
    ['M4 accel strength', 'set val to read accel strength',  'math.sqrt(accelerometer.get_x()**2 + accelerometer.get_y()**2 + accelerometer.get_z()**2)'],
    ['M5 pitch',          'set val to read pitch',           '_pitch()'],
    ['M6 roll',           'set val to read roll',            '_roll()'],
    ['M7 compass',        'set val to read compass',         'compass.heading()'],
    ['M8 magforce x',     'set val to read magforce x',      'compass.get_x()'],
    ['M9 magforce y',     'set val to read magforce y',      'compass.get_y()'],
    ['M10 magforce z',    'set val to read magforce z',      'compass.get_z()'],
    ['M11 magforce abs',  'set val to read magforce absolute', 'math.sqrt(compass.get_x()**2 + compass.get_y()**2 + compass.get_z()**2)'],
    // Environment (E1–E3)
    ['E1 light',          'set val to read light',           'display.read_light_level()'],
    ['E2 temperature',    'set val to read temperature',     'temperature()'],
    ['E3 sound',          'set val to read sound',           'microphone.sound_level()'],
];

for (const [name, dialect, expected] of CASES) {
    test(`sensor lowering: ${name}`, () => {
        const py = mp(dialect);
        assert.ok(py.includes(expected), `expected \`${expected}\` in:\n${py}`);
    });
}

test('pitch helper is emitted when pitch is used', () => {
    const py = mp('set val to read pitch');
    assert.ok(py.includes('def _pitch():'), `expected _pitch helper in:\n${py}`);
    assert.ok(py.includes('math.atan2(-y, -z)'), `expected atan2 formula in:\n${py}`);
});

test('roll helper is emitted when roll is used', () => {
    const py = mp('set val to read roll');
    assert.ok(py.includes('def _roll():'), `expected _roll helper in:\n${py}`);
    assert.ok(py.includes('math.atan2(x, -z)'), `expected atan2 formula in:\n${py}`);
});

test('math import is added for accel strength', () => {
    assert.match(mp('set val to read accel strength'), /import math/);
});
