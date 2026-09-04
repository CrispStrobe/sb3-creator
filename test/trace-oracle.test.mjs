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
    // MEASURED 2026-08-23 (threshold-probe --margin): the event lands on EXACTLY
    // 300 ms — observed deviation 0, so the +-2 is pure slack and has never been
    // needed. Kept rather than tightened to 0 because the quantity is a polled
    // timestamp: a scheduler that granted one extra tick would be a real change
    // but not a defect, and a tolerance of 0 on a sampled clock is a flake
    // waiting for a slow runner. The number now says what it is worth.
    assert.ok(Math.abs(t.events[0].tMs - 300) <= 2, `on near 300, got ${t.events[0].tMs}`);
    assert.equal(t.events[1].level, 0);
    // MEASURED 2026-08-23: observed 800 exactly, so 910 carries 12% headroom —
    // a little over one 100 ms poll interval, which is what the message claims
    // and is therefore the right shape. Recorded so the next reader does not
    // have to re-derive it from the poll rate.
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

// ---- String and list vocabulary (05.Control / 08.Strings campaign) --------

test('referee: string operators — letter_of, length, contains', () => {
    const t = interpretTrace(parse(`DEVICE PICO
PIN led1 = GP15 OUTPUT

WHEN flag clicked:
  set msg to "Hello"
  print length of msg
  print letter 2 of msg
  IF msg contains "ell" THEN:
    print 1
  ELSE:
    print 0
`), { horizonMs: 1000 });
    assert.deepEqual(t.unsupported, []);
    assert.deepEqual(t.serial.map(s => s.line), ['5', 'e', '1']);
});

test('referee: list operations — add, item, length, replace, delete', () => {
    const t = interpretTrace(parse(`DEVICE PICO
PIN led1 = GP15 OUTPUT
LIST mylist

WHEN flag clicked:
  add 10 to mylist
  add 20 to mylist
  add 30 to mylist
  print length of mylist
  print item 2 of mylist
  replace item 2 of mylist with 25
  print item 2 of mylist
  delete 1 of mylist
  print length of mylist
  print item 1 of mylist
`), { horizonMs: 1000 });
    assert.deepEqual(t.unsupported, []);
    assert.deepEqual(t.serial.map(s => s.line), ['3', '20', '25', '2', '25']);
    assert.deepEqual(t.lists.mylist.map(String), ['25', '30']);
});

test('referee: list contains', () => {
    const t = interpretTrace(parse(`DEVICE PICO
PIN led1 = GP15 OUTPUT
LIST vals

WHEN flag clicked:
  add 42 to vals
  add 99 to vals
  IF vals contains 42 THEN:
    print 1
  IF vals contains 50 THEN:
    print 2
`), { horizonMs: 1000 });
    assert.deepEqual(t.unsupported, []);
    assert.deepEqual(t.serial.map(s => s.line), ['1']);
});

test('referee: mathop — abs, floor, sqrt', () => {
    const t = interpretTrace(parse(`DEVICE PICO
PIN led1 = GP15 OUTPUT

WHEN flag clicked:
  set n to (0 - 7)
  print abs of n
  print floor of 3.7
  print sqrt of 16
`), { horizonMs: 1000 });
    assert.deepEqual(t.unsupported, []);
    assert.deepEqual(t.serial.map(s => s.line), ['7', '3', '4']);
});

test('referee: random is deterministic (midpoint)', () => {
    const t = interpretTrace(parse(`DEVICE PICO
PIN led1 = GP15 OUTPUT

WHEN flag clicked:
  print pick random 1 to 10
`), { horizonMs: 1000 });
    assert.deepEqual(t.unsupported, []);
    // Midpoint of 1..10 = 5.5 → round = 6
    assert.deepEqual(t.serial.map(s => s.line), ['6']);
});

// ---- Part-stimulus timeline (sensor campaign) ----------------------------

test('referee: partStimulus feeds analog read through sensor voltage model', () => {
    // Ultrasonic distance → analog read: the part maps distance to voltage,
    // but the referee traces PIN reads. partStimulus changes the voltage
    // timeline dynamically.
    const t = interpretTrace(parse(`DEVICE PICO
PIN sensor = GP26 ANALOG

WHEN flag clicked:
  print read sensor
  wait 1 seconds
  print read sensor
`), { horizonMs: 3000, adc: { bits: 12, vref: 3.3 },
        stimulus: [
            { tMs: 0, pin: 'sensor', volts: 1.0 },
            { tMs: 800, pin: 'sensor', volts: 2.5 },
        ] });
    assert.deepEqual(t.unsupported, []);
    // At t=0: 1.0V → round(1.0/3.3 * 4095) = 1241
    // At t=1000: 2.5V → round(2.5/3.3 * 4095) = 3102
    assert.equal(t.serial[0].line, '1241');
    assert.equal(t.serial[1].line, '3102');
});

test('referee: partStimulus for digital sensor (touch at specific time)', () => {
    const t = interpretTrace(parse(`DEVICE PICO
PIN touch = GP3 INPUT

WHEN flag clicked:
  wait until read touch = 1
  print 42
`), { horizonMs: 2000,
        stimulus: [
            { tMs: 0, pin: 'touch', level: 0 },
            { tMs: 500, pin: 'touch', level: 1 },
        ] });
    assert.deepEqual(t.unsupported, []);
    assert.equal(t.serial.length, 1);
    assert.equal(t.serial[0].line, '42');
    // MEASURED 2026-08-23: observed 500 exactly; 510 is 2% headroom. Tight, and
    // it can fire — threshold-probe flips it red at 499.
    assert.ok(t.serial[0].tMs >= 500 && t.serial[0].tMs <= 510,
        `should print near 500ms, got ${t.serial[0].tMs}`);
});

// ── findings: the KIND of a disagreement, not just its sentence ──────────

/**
 * `compareTraces` decides, for every disagreement, whether the two traces
 * differ in WHAT happened or only in WHEN — and it used to throw that away,
 * returning `diffs` as English. A consumer could then only fail on everything
 * or nothing.
 *
 * That is not hypothetical. lite's corpus differential compares the emitter
 * against this referee over the gallery, and nine of forty pairs disagree ONLY
 * in timing, for a reason that is neither side's bug: the referee's walk of the
 * blocks is free, and a real MCU spends time per loop pass (measured
 * 2026-09-04: 0 ms/s on 01-blink, ~9.95 on three PWM/motor programs, 21.50 on
 * 20-shift-register-binary — a per-iteration cost, not a per-device rate). With
 * no way to separate those from a wrong level, the gate stayed switched off and
 * covered nothing.
 */
const evAt = (tMs, level, pin = 'led') => ({tMs, pin, level});
const traceOf = (events, extra = {}) =>
    ({horizon: 5000, events, serial: [], pwm: [], ...extra});

test('a pure timing skew is kind "time"; a wrong level is kind "level"', () => {
    const ref = traceOf([evAt(0, 1), evAt(100, 0), evAt(200, 1)]);

    const late = traceOf([evAt(0, 1), evAt(160, 0), evAt(260, 1)]);
    const lateCmp = compareTraces(ref, late, {tolMs: 5});
    assert.equal(lateCmp.ok, false);
    assert.deepEqual([...new Set(lateCmp.findings.map((f) => f.kind))], ['time'],
        'the levels agree in order and value; only the clock differs');

    const wrong = traceOf([evAt(0, 1), evAt(100, 1), evAt(200, 1)]);
    const wrongCmp = compareTraces(ref, wrong, {tolMs: 5});
    assert.equal(wrongCmp.ok, false);
    assert.ok(wrongCmp.findings.some((f) => f.kind === 'level'),
        'a level that disagrees is a statement about WHAT the program did');
    assert.ok(!wrongCmp.findings.every((f) => f.kind === 'time'),
        'and must never be reported as merely late');
});

test('a consumer can gate on semantics while tolerating the known timing gap', () => {
    // The whole point: this predicate is what lets the corpus differential run.
    const semantic = (cmp) => cmp.findings.filter((f) => f.kind !== 'time');

    const ref = traceOf([evAt(0, 1), evAt(500, 0)]);
    const onlyLate = compareTraces(ref, traceOf([evAt(0, 1), evAt(560, 0)]), {tolMs: 5});
    assert.equal(onlyLate.ok, false, 'still not equal…');
    assert.deepEqual(semantic(onlyLate), [], '…but nothing about it is semantic');

    const alsoWrong = compareTraces(ref, traceOf([evAt(0, 0), evAt(560, 0)]), {tolMs: 5});
    assert.ok(semantic(alsoWrong).length > 0,
        'a semantic disagreement must survive the same filter');
});

test('findings and diffs stay in step, and every kind is a known one', () => {
    // If these drift apart, `diffs` and `findings` are describing different
    // runs and the English stops matching the data a gate acts on.
    const KINDS = new Set(['level', 'time', 'count', 'value']);
    const ref = traceOf([evAt(0, 1), evAt(100, 0)], {serial: [{tMs: 10, line: 'a'}]});
    const actual = traceOf([evAt(0, 0), evAt(180, 0), evAt(400, 1)],
        {serial: [{tMs: 90, line: 'b'}]});
    const cmp = compareTraces(ref, actual, {tolMs: 5});

    assert.ok(cmp.findings.length > 0, 'this input is meant to disagree several ways');
    assert.equal(cmp.findings.length, cmp.diffs.length,
        'one finding per diff, in the same order');
    assert.deepEqual(cmp.findings.map((f) => f.text), cmp.diffs,
        'the finding carries the same sentence the diff does');
    for (const f of cmp.findings) {
        assert.ok(KINDS.has(f.kind), `unknown finding kind "${f.kind}" for: ${f.text}`);
    }
});

test('agreement reports no findings at all', () => {
    const ref = traceOf([evAt(0, 1), evAt(100, 0)]);
    const cmp = compareTraces(ref, traceOf([evAt(0, 1), evAt(100, 0)]), {tolMs: 5});
    assert.equal(cmp.ok, true);
    assert.deepEqual(cmp.findings, [], 'no disagreement, nothing to classify');
});
