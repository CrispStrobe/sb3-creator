// The referee: reference trace interpreter semantics, plus the comparator
// against a RECORDED real differential — the fixture below is the actual
// trace of the same program's generated C running under rp2040js
// (arm-none-eabi-gcc, 2026-08-13), captured the day the referee and the
// silicon path first agreed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import { interpretTrace, compareTraces } from '../src/utils/traceOracle.js';

const parse = (src) => { const c = new SB3Creator(); c.parse(src); return c.project; };

const BLINK_POT = `DEVICE PICO
PIN led1 = GP15 OUTPUT
PIN pot1 = GP26 ANALOG

WHEN flag clicked:
  FOREVER:
    turn on led1
    wait 0.5 seconds
    turn off led1
    wait 0.5 seconds

WHEN flag clicked:
  FOREVER:
    print read pot1
    wait 1 seconds
`;

test('referee: blink edges land on exact virtual milliseconds', () => {
    const t = interpretTrace(parse(BLINK_POT), { horizonMs: 3000, adc: { bits: 12, vref: 3.3 },
        stimulus: [{ tMs: 0, pin: 'pot1', volts: 2.5 }] });
    assert.deepEqual(t.events.map(e => `${e.tMs}:${e.level}`),
        ['0:1', '500:0', '1000:1', '1500:0', '2000:1', '2500:0', '3000:1']);
    // 12-bit, 3.3 V: round(2.5/3.3 * 4095) = 3102 — the DEVICE'S number.
    assert.deepEqual(t.serial.map(s => s.line), ['3102', '3102', '3102', '3102']);
    assert.deepEqual(t.unsupported, []);
});

test('referee: repeat counts, if/else, and variables', () => {
    const t = interpretTrace(parse(`DEVICE PICO
PIN led1 = GP15 OUTPUT

WHEN flag clicked:
  set n to 0
  REPEAT 3:
    change n by 2
    toggle led1
  IF (n > 5) THEN:
    turn on led1
  ELSE:
    turn off led1
  print n
`), { horizonMs: 1000 });
    assert.equal(t.vars.n, 6);
    // 3 toggles (1,0,1) then the IF turns it on: already 1, no new edge.
    assert.deepEqual(t.events.map(e => e.level), [1, 0, 1]);
    assert.deepEqual(t.serial.map(s => s.line), ['6']);
});

test('referee: two tasks interleave on the shared clock', () => {
    const t = interpretTrace(parse(`DEVICE PICO
PIN a = GP14 OUTPUT
PIN b = GP15 OUTPUT

WHEN flag clicked:
  FOREVER:
    toggle a
    wait 0.3 seconds

WHEN flag clicked:
  FOREVER:
    toggle b
    wait 0.5 seconds
`), { horizonMs: 1000 });
    const seq = t.events.map(e => `${e.tMs}:${e.pin}`);
    assert.deepEqual(seq,
        ['0:a', '0:b', '300:a', '500:b', '600:a', '900:a', '1000:b']);
});

test('referee: unknown opcodes refuse loudly, never skip silently', () => {
    const project = parse(`DEVICE PICO
PIN led1 = GP15 OUTPUT

WHEN flag clicked:
  turn on led1
`);
    // Graft an alien block into the chain.
    const blocks = project.targets.find(t => t.isStage !== false && t.blocks
        && Object.values(t.blocks).some(b => b.opcode === 'event_whenflagclicked')).blocks
        || project.targets[0].blocks;
    const hat = Object.values(blocks).find(b => b.opcode === 'event_whenflagclicked');
    const first = blocks[hat.next];
    blocks.alien1 = { opcode: 'martian_probe', next: first.next, inputs: {}, fields: {} };
    first.next = 'alien1';
    const t = interpretTrace(project, { horizonMs: 100 });
    assert.ok(t.unsupported.includes('martian_probe'));
});

test('comparator: the recorded rp2040js differential passes', () => {
    // Recorded from the real run: generated C, arm-none-eabi-gcc,
    // rp2040js adapter, board stub answering 2.5 V on GP26.
    const actual = {
        horizon: 3000,
        events: [
            { tMs: 0, pin: 'led1', level: 0 },   // bw_setup's start-OFF hygiene
            { tMs: 0, pin: 'led1', level: 1 },
            { tMs: 500, pin: 'led1', level: 0 },
            { tMs: 1000, pin: 'led1', level: 1 },
            { tMs: 1500, pin: 'led1', level: 0 },
            { tMs: 2000, pin: 'led1', level: 1 },
            { tMs: 2500, pin: 'led1', level: 0 },
        ],
        serial: [
            { tMs: 0, line: '3102' },
            { tMs: 1000, line: '3102' },
            { tMs: 2000, line: '3102' },
        ],
        pwm: [],
    };
    const ref = interpretTrace(parse(BLINK_POT), { horizonMs: 3000,
        adc: { bits: 12, vref: 3.3 },
        stimulus: [{ tMs: 0, pin: 'pot1', volts: 2.5 }] });
    const r = compareTraces(ref, actual);
    assert.ok(r.ok, r.diffs.join('; '));
});

test('comparator: a wrong level or a late edge is caught', () => {
    const ref = interpretTrace(parse(BLINK_POT), { horizonMs: 2000,
        adc: { bits: 12, vref: 3.3 } });
    const wrongLevel = {
        horizon: 2000,
        events: ref.events.filter(e => e.tMs < 2000)
            .map((e, i) => i === 1 ? { ...e, level: 1 } : e),
        serial: ref.serial.filter(s => s.tMs < 2000), pwm: [],
    };
    assert.equal(compareTraces(ref, wrongLevel).ok, false);
    const late = {
        horizon: 2000,
        events: ref.events.filter(e => e.tMs < 2000)
            .map((e, i) => i === 2 ? { ...e, tMs: e.tMs + 40 } : e),
        serial: ref.serial.filter(s => s.tMs < 2000), pwm: [],
    };
    assert.equal(compareTraces(ref, late).ok, false);
});

test('referee: wait until and repeat until', () => {
    const t = interpretTrace(parse(`DEVICE PICO
PIN btn = GP3 INPUT
PIN led1 = GP15 OUTPUT

WHEN flag clicked:
  wait until read btn = 1
  turn on led1
  REPEAT UNTIL read btn = 0:
    wait 0.1 seconds
  turn off led1
`), { horizonMs: 2000, stimulus: [
        { tMs: 0, pin: 'btn', level: 0 },
        { tMs: 300, pin: 'btn', level: 1 },
        { tMs: 800, pin: 'btn', level: 0 },
    ] });
    assert.equal(t.unsupported.length, 0, JSON.stringify([...new Set(t.unsupported)]));
    assert.equal(t.events.length, 2);
    assert.equal(t.events[0].level, 1);
    assert.ok(Math.abs(t.events[0].tMs - 300) <= 2, `on near 300, got ${t.events[0].tMs}`);
    assert.equal(t.events[1].level, 0);
    assert.ok(t.events[1].tMs >= 800 && t.events[1].tMs <= 910,
        `off within one poll of 800, got ${t.events[1].tMs}`);
});

test('referee: custom blocks run with bound parameters (gap found by the host oracle)', () => {
    // BBCSDL printed a procedure's output while the referee silently listed
    // the call as unsupported — this is the regression lock for that day.
    const t = interpretTrace(parse(`DEVICE PICO
PIN led1 = GP15 OUTPUT

DEFINE tally (n):
  REPEAT n:
    change total by 2
  print total

WHEN flag clicked:
  set total to 0
  tally 4
  IF (total > 5) THEN:
    print 777
`), { horizonMs: 2000 });
    assert.deepEqual(t.unsupported, []);
    assert.deepEqual(t.serial.map((s) => s.line), ['8', '777']);
    assert.equal(t.vars.total, 8);
});

// ---- Servo / motor / shift_out vocabulary ---------------------------------

test('referee: servo angle records device event and tracks state', () => {
    const t = interpretTrace(parse(`DEVICE STC12C5A60S2
CLOCK 11059200
PIN signal = P1.1 OUTPUT

WHEN flag clicked:
  set myservo angle to 90
  wait 0.5 seconds
  set myservo angle to 0
  print angle of myservo
`), { horizonMs: 2000 });
    assert.deepEqual(t.unsupported, []);
    assert.equal(t.devices.length, 2);
    assert.equal(t.devices[0].kind, 'servo');
    assert.equal(t.devices[0].name, 'myservo');
    assert.equal(t.devices[0].angle, 90);
    assert.equal(t.devices[0].tMs, 0);
    assert.equal(t.devices[1].angle, 0);
    assert.equal(t.devices[1].tMs, 500);
    // Reporter reads back device state
    assert.deepEqual(t.serial.map(s => s.line), ['0']);
});

test('referee: servo angle is clamped to 0-180', () => {
    const t = interpretTrace(parse(`DEVICE PICO
PIN sig = GP15 OUTPUT

WHEN flag clicked:
  set myservo angle to 200
  set myservo angle to -10
`), { horizonMs: 1000 });
    assert.deepEqual(t.unsupported, []);
    assert.equal(t.devices[0].angle, 180);
    assert.equal(t.devices[1].angle, 0);
});

test('referee: motor speed + direction record device events', () => {
    const t = interpretTrace(parse(`DEVICE STC12C5A60S2
CLOCK 11059200
PIN led = P1.0 OUTPUT ACTIVE LOW

WHEN flag clicked:
  turn on led
  set mymotor speed to 200
  set mymotor direction forward
  wait 1 seconds
  set mymotor direction reverse
  wait 1 seconds
  set mymotor speed to 0
  set mymotor direction coast
  turn off led
`), { horizonMs: 5000 });
    assert.deepEqual(t.unsupported, []);
    // Device events: speed, dir forward, dir reverse, speed 0, dir coast
    assert.equal(t.devices.length, 5);
    assert.equal(t.devices[0].kind, 'motor_speed');
    assert.equal(t.devices[0].speed, 200);
    assert.equal(t.devices[1].kind, 'motor_dir');
    assert.equal(t.devices[1].dir, 0); // forward
    assert.equal(t.devices[2].kind, 'motor_dir');
    assert.equal(t.devices[2].dir, 1); // reverse
    assert.equal(t.devices[3].kind, 'motor_speed');
    assert.equal(t.devices[3].speed, 0);
    assert.equal(t.devices[4].kind, 'motor_dir');
    assert.equal(t.devices[4].dir, 3); // coast
    // Pin events: on at 0, off at 2000
    assert.equal(t.events[0].level, 1);
    assert.equal(t.events[1].level, 0);
});

test('referee: motor speed clamped 0-255', () => {
    const t = interpretTrace(parse(`DEVICE PICO
PIN led = GP15 OUTPUT

WHEN flag clicked:
  set mymotor speed to 300
`), { horizonMs: 1000 });
    assert.deepEqual(t.unsupported, []);
    assert.equal(t.devices[0].speed, 255);
});

test('referee: shift_out records device event + pin edges', () => {
    const t = interpretTrace(parse(`DEVICE STC12C5A60S2
CLOCK 11059200
PART leds = 74HC595 data P1.0 clock P1.1 latch P1.2

WHEN flag clicked:
  set leds to 170
`), { horizonMs: 1000 });
    assert.deepEqual(t.unsupported, []);
    // Device event
    assert.equal(t.devices.length, 1);
    assert.equal(t.devices[0].kind, 'shift_out');
    assert.equal(t.devices[0].name, 'leds');
    assert.equal(t.devices[0].value, 170); // 0b10101010
    // Pin events: data, clock edges for each bit, then latch
    // 170 = 0b10101010 → bits MSB first: 1,0,1,0,1,0,1,0
    assert.ok(t.events.length > 0, 'should have pin events');
});

test('referee: shift_out value is masked to 8 bits', () => {
    const t = interpretTrace(parse(`DEVICE STC12C5A60S2
CLOCK 11059200
PART leds = 74HC595 data P1.0 clock P1.1 latch P1.2

WHEN flag clicked:
  set leds to 256
`), { horizonMs: 1000 });
    assert.deepEqual(t.unsupported, []);
    assert.equal(t.devices[0].value, 0); // 256 & 0xFF = 0
});

test('referee: settone records tone events (buzzer-siren pattern)', () => {
    const t = interpretTrace(parse(`DEVICE STC12C5A60S2
CLOCK 11059200
PIN buzzer = P1.5 TONE

WHEN flag clicked:
  set buzzer to 440 hz
  wait 0.5 seconds
  set buzzer to 880 hz
  wait 0.5 seconds
  set buzzer to 0 hz
`), { horizonMs: 2000 });
    assert.deepEqual(t.unsupported, []);
    assert.equal(t.tones.length, 3);
    assert.equal(t.tones[0].pin, 'buzzer');
    assert.equal(t.tones[0].hz, 440);
    assert.equal(t.tones[0].tMs, 0);
    assert.equal(t.tones[1].hz, 880);
    assert.equal(t.tones[1].tMs, 500);
    assert.equal(t.tones[2].hz, 0);
    assert.equal(t.tones[2].tMs, 1000);
});

test('referee: DC buzzer (setpin on output) produces pin events, no tone', () => {
    // An active buzzer on an OUTPUT pin uses turn on/off, not settone.
    // The referee traces pin events; the buzzer-DC semantics are engine-side.
    const t = interpretTrace(parse(`DEVICE STC12C5A60S2
CLOCK 11059200
PIN buzzer = P1.5 OUTPUT

WHEN flag clicked:
  turn on buzzer
  wait 1 seconds
  turn off buzzer
`), { horizonMs: 2000 });
    assert.deepEqual(t.unsupported, []);
    assert.equal(t.tones.length, 0, 'OUTPUT pin uses setpin, not settone');
    assert.equal(t.events.length, 2);
    assert.equal(t.events[0].level, 1);
    assert.equal(t.events[1].level, 0);
});

test('comparator: tone events compared correctly', () => {
    const ref = {
        horizon: 2000,
        events: [], serial: [], pwm: [], devices: [],
        tones: [
            { tMs: 0, pin: 'buzzer', hz: 440 },
            { tMs: 500, pin: 'buzzer', hz: 880 },
        ],
    };
    const ok = compareTraces(ref, { ...ref });
    assert.ok(ok.ok, ok.diffs.join('; '));
    // Wrong frequency
    const wrong = compareTraces(ref, {
        ...ref,
        tones: [
            { tMs: 0, pin: 'buzzer', hz: 440 },
            { tMs: 500, pin: 'buzzer', hz: 400 },
        ],
    });
    assert.equal(wrong.ok, false);
    assert.ok(wrong.diffs.some(d => /Hz/.test(d)));
});

test('comparator: device events compared correctly', () => {
    const ref = {
        horizon: 2000,
        events: [], serial: [], pwm: [],
        devices: [
            { tMs: 0, kind: 'servo', name: 'myservo', angle: 90 },
            { tMs: 500, kind: 'servo', name: 'myservo', angle: 0 },
        ],
    };
    // Matching actual
    const ok = compareTraces(ref, { ...ref });
    assert.ok(ok.ok, ok.diffs.join('; '));
    // Wrong angle
    const wrong = compareTraces(ref, {
        ...ref,
        devices: [
            { tMs: 0, kind: 'servo', name: 'myservo', angle: 90 },
            { tMs: 500, kind: 'servo', name: 'myservo', angle: 45 },
        ],
    });
    assert.equal(wrong.ok, false);
    assert.ok(wrong.diffs.some(d => /angle/.test(d)));
});
