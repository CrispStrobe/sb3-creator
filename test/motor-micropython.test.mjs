// P3 part 3 golden: the DC-motor MicroPython driver on the Pico.
//
// The gap this closes: `devices_setmotor` / `devices_setdirection` (`set <n>
// speed to <s>` / `set <n> direction <dir>`) had NO Pico MicroPython form — they
// fell through to the default and DEGRADED silently. This emits speed (duty at
// 1 kHz on GP18) and direction (GP19/GP20 H-bridge) drivers, the clamp shared
// with the C helper's _motorProtocol().
//
// Pinned: the exact emitted Python; that C and MicroPython clamp speed the SAME
// way (0..100, not hand-typed twice); and that the emitted duty_u16 is speed%
// to within ONE duty_u16 LSB (100 / 65535, DERIVED). The C writes duty as a
// percent of a 1000-count 1 kHz period (rounded); machine.PWM writes a 16-bit
// duty (floored). Those are different resolutions on different APIs — comparing
// the produced duty bit-for-bit would be a category error — so the bound proves
// the MicroPython value is the honest quantisation of speed%, not a second
// formula.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const PROGRAM = 'DEVICE PICO\nPIN led = GP25 OUTPUT\nWHEN flag clicked:\n  set 1 speed to 75\n  set 1 direction forward';
const mpyOf = (src) => { const c = new SB3Creator(); c.parse(src); return c.generateMicroPython(); };
const cArmOf = (src) => { const c = new SB3Creator(); c.parse(src); return c.generateC(); };

const GOLDEN_SPEED = `def _motor_speed(speed):
    if speed < 0: speed = 0
    if speed > 100: speed = 100
    _motor_pwm.duty_u16((speed * 65535) // 100)`;
const GOLDEN_DIR = `def _motor_dir(d):
    # 0=forward 1=reverse 2=brake 3=coast
    if d == 0:
        _motor_in1.value(1); _motor_in2.value(0)
    elif d == 1:
        _motor_in1.value(0); _motor_in2.value(1)
    elif d == 2:
        _motor_in1.value(1); _motor_in2.value(1)
    else:
        _motor_in1.value(0); _motor_in2.value(0)`;

function extractPyDef(py, header) {
    const lines = py.split('\n');
    const start = lines.findIndex((l) => l === header);
    assert.ok(start >= 0, `no "${header}" def found in emitted MicroPython`);
    let end = start + 1;
    while (end < lines.length && (lines[end] === '' || lines[end].startsWith(' '))) end++;
    while (end > start && lines[end - 1] === '') end--;
    return lines.slice(start, end).join('\n');
}

// The shared clamp bounds, read out of each route's speed body.
function clampC(code) {
    const lines = code.split('\n');
    const s = lines.findIndex((l) => l === 'static void bw_motor_speed(int motor, int speed)');
    assert.ok(s >= 0, 'no bw_motor_speed found in emitted C');
    const body = lines.slice(s, lines.indexOf('}', s) + 1).join('\n');
    const lo = body.match(/if \(speed < (-?\d+)\) speed = -?\d+;/);
    const hi = body.match(/if \(speed > (\d+)\) speed = \d+;/);
    assert.ok(lo && hi, `could not read the C motor clamp from:\n${body}`);
    return {clampLo: +lo[1], clampHi: +hi[1]};
}
function clampPy(py) {
    const body = extractPyDef(py, 'def _motor_speed(speed):');
    const lo = body.match(/if speed < (-?\d+): speed = -?\d+/);
    const hi = body.match(/if speed > (\d+): speed = \d+/);
    assert.ok(lo && hi, `could not read the MicroPython motor clamp from:\n${body}`);
    return {clampLo: +lo[1], clampHi: +hi[1]};
}

test('P3p3: the motor verbs no longer degrade on the Pico — they emit drivers', () => {
    const mp = mpyOf(PROGRAM);
    assert.ok(mp.ok && mp.py, `generateMicroPython refused: ${JSON.stringify(mp.reasons)}`);
    assert.deepEqual(mp.warnings, [], `a motor verb still degrades: ${JSON.stringify(mp.warnings)}`);
});

test('P3p3: the emitted motor drivers and bus are byte-identical to the golden', () => {
    const py = mpyOf(PROGRAM).py;
    assert.equal(extractPyDef(py, 'def _motor_speed(speed):'), GOLDEN_SPEED,
        'the MicroPython motor-speed driver drifted from the golden');
    assert.equal(extractPyDef(py, 'def _motor_dir(d):'), GOLDEN_DIR,
        'the MicroPython motor-direction driver drifted from the golden');
    for (const l of ['_motor_pwm = PWM(Pin(18), freq=1000)', '_motor_in1 = Pin(19, Pin.OUT)',
        '_motor_in2 = Pin(20, Pin.OUT)', '_motor_speed(int(75))', '_motor_dir(0)']) {
        assert.ok(py.includes(l), `missing emitted line: ${l}`);
    }
});

test('P3p3: C and MicroPython motor clamp speed the SAME way', () => {
    const EXPECTED = {clampLo: 0, clampHi: 100};
    const c = clampC(cArmOf(PROGRAM));
    const p = clampPy(mpyOf(PROGRAM).py);
    assert.deepEqual(c, EXPECTED, `the C motor clamp changed: ${JSON.stringify(c)}`);
    assert.deepEqual(p, EXPECTED, `the MicroPython motor clamp changed: ${JSON.stringify(p)}`);
    assert.deepEqual(p, c, 'the two routes no longer share one speed clamp');
});

test('P3p3: the emitted duty is speed% to within one duty_u16 LSB, over every speed', () => {
    const py = mpyOf(PROGRAM).py;
    const m = py.match(/_motor_pwm\.duty_u16\(\(speed \* (\d+)\) \/\/ (\d+)\)/);
    assert.ok(m, 'no duty_u16 write found in the emitted motor driver');
    const u16Full = +m[1], pct = +m[2];   // (speed * 65535) // 100
    const LSB = pct / u16Full;             // one LSB expressed in percent, DERIVED
    let worst = 0;
    for (let speed = 0; speed <= pct; speed++) {
        const duty = Math.trunc(speed * u16Full / pct);
        const back = duty * pct / u16Full;
        worst = Math.max(worst, Math.abs(back - speed));
        assert.ok(Math.abs(back - speed) <= LSB,
            `speed ${speed}: emitted duty ${duty} is ${back.toFixed(5)} %, |Δ| `
            + `${Math.abs(back - speed).toFixed(5)} exceeds one LSB ${LSB.toFixed(5)}`);
    }
    assert.ok(worst < LSB, `worst |Δ| ${worst.toFixed(5)} should be strictly under one LSB ${LSB.toFixed(5)}`);
});

test('P3p3: a Pico program with no motor emits no motor driver (no leak)', () => {
    const py = mpyOf('DEVICE PICO\nPIN led = GP25 OUTPUT\nWHEN flag clicked:\n  turn on led').py;
    assert.ok(!py.includes('_motor_speed') && !py.includes('_motor_dir'),
        'motor driver leaked into a program with no motor verb');
});
