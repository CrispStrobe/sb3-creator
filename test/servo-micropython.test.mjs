// P3 part 3 golden: the servo MicroPython driver on the Pico.
//
// The gap this closes: `devices_setservo` (`set <n> angle to <a>`) had NO Pico
// MicroPython form — it fell through to the default and DEGRADED silently. This
// emits a driver from the SAME _servoProtocol() the C helper renders (P2/P3's
// per-family bus, now generateMicroPython over machine.PWM).
//
// Three things are pinned:
//  1. the EXACT emitted Python (a drift reddens);
//  2. that C and MicroPython realise the SAME clamp + pulse formula — the maths
//     is not hand-typed a second time;
//  3. that the emitted duty_u16 is the formula's µs to within ONE duty_u16 LSB
//     (frame / 65536, DERIVED from the emitted numbers). PWM adds what shiftOut
//     did not — a numeric output — and the two APIs cannot be bit-identical (the
//     C-arm writes µs directly, machine.PWM writes a 16-bit duty), so the bound
//     PROVES the difference is quantisation and nothing else, rather than hiding
//     a formula error inside an open-ended "not bit-exact" allowance.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

// A PIN declaration puts the C backend in bare-metal mode (host C emits stubs,
// not the real bw_servo_set); the MicroPython driver is the same either way.
const PROGRAM = 'DEVICE PICO\nPIN led = GP25 OUTPUT\nWHEN flag clicked:\n  set 1 angle to 90';
const mpyOf = (src) => { const c = new SB3Creator(); c.parse(src); return c.generateMicroPython(); };
const cArmOf = (src) => { const c = new SB3Creator(); c.parse(src); return c.generateC(); };

const GOLDEN_DRIVER = `def _servo_set(servo, angle):
    # 50 Hz frame; angle 0-180 deg over a 500-2500 us pulse.
    pwm = _servos.get(servo)
    if pwm is None: return
    if angle < 0: angle = 0
    if angle > 180: angle = 180
    us = 500 + angle * 2000 // 180
    pwm.duty_u16((us * 65536) // 20000)`;

function extractDef(py, header) {
    const lines = py.split('\n');
    const start = lines.findIndex((l) => l === header);
    assert.ok(start >= 0, `no "${header}" def found in emitted MicroPython`);
    let end = start + 1;
    while (end < lines.length && (lines[end] === '' || lines[end].startsWith(' '))) end++;
    while (end > start && lines[end - 1] === '') end--;
    return lines.slice(start, end).join('\n');
}

// The shared numeric protocol, read out of each route's emitted body: the angle
// clamp bounds and the (usMin, usSpan, angleMax) of `us = usMin + angle*usSpan/angleMax`.
function servoProtoC(code) {
    // C body is brace-delimited (the `{` sits at column 0), not indent-delimited.
    const lines = code.split('\n');
    const s = lines.findIndex((l) => l === 'static void bw_servo_set(int servo, int angle)');
    assert.ok(s >= 0, 'no bw_servo_set found in emitted C');
    const body = lines.slice(s, lines.indexOf('}', s) + 1).join('\n');
    const clampLo = body.match(/if \(angle < (-?\d+)\) angle = -?\d+;/);
    const clampHi = body.match(/if \(angle > (\d+)\) angle = \d+;/);
    const f = body.match(/us = (\d+)u? \+ \(?[^)]*\)?angle \* (\d+)u? \/ (\d+)u?;/);
    assert.ok(clampLo && clampHi && f, `could not read the C servo protocol from:\n${body}`);
    return {clampLo: +clampLo[1], clampHi: +clampHi[1], usMin: +f[1], usSpan: +f[2], angleMax: +f[3]};
}
function servoProtoPy(py) {
    const body = extractDef(py, 'def _servo_set(servo, angle):');
    const clampLo = body.match(/if angle < (-?\d+): angle = -?\d+/);
    const clampHi = body.match(/if angle > (\d+): angle = \d+/);
    const f = body.match(/us = (\d+) \+ angle \* (\d+) \/\/ (\d+)/);
    assert.ok(clampLo && clampHi && f, `could not read the MicroPython servo protocol from:\n${body}`);
    return {clampLo: +clampLo[1], clampHi: +clampHi[1], usMin: +f[1], usSpan: +f[2], angleMax: +f[3]};
}

test('P3p3: the servo verb no longer degrades on the Pico — it emits a driver', () => {
    const mp = mpyOf(PROGRAM);
    assert.ok(mp.ok && mp.py, `generateMicroPython refused: ${JSON.stringify(mp.reasons)}`);
    assert.deepEqual(mp.warnings, [], `the servo verb still degrades: ${JSON.stringify(mp.warnings)}`);
});

test('P3p3: the emitted _servo_set driver and its bus are byte-identical to the golden', () => {
    const py = mpyOf(PROGRAM).py;
    assert.equal(extractDef(py, 'def _servo_set(servo, angle):'), GOLDEN_DRIVER,
        'the MicroPython servo driver drifted from the golden');
    assert.ok(py.includes('_servos = {1: PWM(Pin(16), freq=50), 2: PWM(Pin(17), freq=50)}'),
        'the servo PWM bus (GP16/GP17 at 50 Hz) is missing or drifted');
    assert.ok(py.includes('_servo_set(int(1), int(90))'), 'the servo verb call is missing');
    assert.ok(py.includes(', PWM'), 'PWM is not imported');
});

test('P3p3: C and MicroPython servo realise the SAME clamp + pulse formula', () => {
    const EXPECTED = {clampLo: 0, clampHi: 180, usMin: 500, usSpan: 2000, angleMax: 180};
    const c = servoProtoC(cArmOf(PROGRAM));
    const p = servoProtoPy(mpyOf(PROGRAM).py);
    assert.deepEqual(c, EXPECTED, `the C servo protocol changed: ${JSON.stringify(c)}`);
    assert.deepEqual(p, EXPECTED, `the MicroPython servo protocol changed: ${JSON.stringify(p)}`);
    assert.deepEqual(p, c, 'the two routes no longer share one clamp + pulse formula');
});

test('P3p3: the emitted duty is the formula µs to within one duty_u16 LSB, over every angle', () => {
    const py = mpyOf(PROGRAM).py;
    const {usMin, usSpan, angleMax} = servoProtoPy(py);
    // Read the duty write straight from the emitted line so the bound tracks it.
    const m = py.match(/pwm\.duty_u16\(\(us \* (\d+)\) \/\/ (\d+)\)/);
    assert.ok(m, 'no duty_u16 write found in the emitted servo driver');
    const u16 = +m[1], frameUs = +m[2];
    const LSB = frameUs / u16;   // DERIVED from the emitted numbers, not picked
    let worst = 0;
    for (let angle = 0; angle <= angleMax; angle++) {
        const us = usMin + Math.trunc(angle * usSpan / angleMax);   // matches C/Python integer //
        const duty = Math.trunc(us * u16 / frameUs);
        const backUs = duty * frameUs / u16;
        worst = Math.max(worst, Math.abs(backUs - us));
        assert.ok(Math.abs(backUs - us) <= LSB,
            `angle ${angle}: emitted duty ${duty} is ${backUs.toFixed(4)} µs, formula is ${us} µs — `
            + `|Δ| ${Math.abs(backUs - us).toFixed(4)} exceeds one LSB ${LSB.toFixed(4)}`);
    }
    assert.ok(worst < LSB, `worst |Δ| ${worst.toFixed(4)} should be strictly under one LSB ${LSB.toFixed(4)}`);
});

test('P3p3: a Pico program with no servo emits no servo driver (no leak)', () => {
    const py = mpyOf('DEVICE PICO\nPIN led = GP25 OUTPUT\nWHEN flag clicked:\n  turn on led').py;
    assert.ok(!py.includes('_servo_set'), 'servo driver leaked into a program with no servo verb');
    assert.ok(!/, PWM/.test(py.split('\n')[1] || ''), 'PWM imported into a program that needs no PWM');
});
