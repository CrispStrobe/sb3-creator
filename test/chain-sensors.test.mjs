// The HC-SR04 and DS18B20 PARTs, read on the emulated chips through the
// generated bench (an ultrasonic module; a DS18B20 with its 4.7 k pull-up).
//
// Both answer in TIME -- 58 us of echo per cm, 1-Wire slots a few us wide --
// and the drivers must get it right on a 12T STC89 and a 125 MHz Pico from
// one source. MEASURED 2026-10-05 while building them, each one a fault the
// first runs showed (see cPinRoleDrivers and bw-board's dueDeviceDeadline):
//   every board        999 / -127   board inputs refreshed only per 10 ms slice
//   ATmega, STM32      171 for 37   the echo end seen at the slice boundary
//   STC89              29 for 37    echo rose at TRIG's rising edge (model)
//   STC89              -127         presence sampled once, after its window
//   STC89              39/34 for 37 a 300 us stamp between trigger and look
//   STC89              999 once     a torn two-byte read of the tick count
// and after: exact on every board below, 5 to 300 cm, -10.5 to 85 degrees.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { chainSkip, runOn } from './helpers/mcu-chain.mjs';

const PINS = {
    stc12c5a60s2: ['P1.0', 'P1.1', 'P1.2', 'P1.3'], stc15f2k60s2: ['P1.0', 'P1.1', 'P1.2', 'P1.3'],
    stc89c52rc: ['P1.0', 'P1.1', 'P1.2', 'P1.3'],
    'arduino-uno': ['D13', 'D7', 'D8', 'D4'], 'arduino-nano': ['D13', 'D7', 'D8', 'D4'],
    atmega168p: ['D13', 'D7', 'D8', 'D4'], 'arduino-mega': ['D13', 'D7', 'D8', 'D4'],
    pico: ['GP25', 'GP2', 'GP3', 'GP4'], stm32f030: ['PA0', 'PA1', 'PA2', 'PA3'],
};

const program = (device, body) => {
    const [led, trig, echo, dq] = PINS[device];
    return `DEVICE ${device.toUpperCase()}
PIN led = ${led} OUTPUT
PART sonar = HCSR04 TRIG ${trig} ECHO ${echo}
PART probe = DS18B20 ON ${dq}

${body}`;
};

const READ_BOTH = `WHEN flag clicked:
  FOREVER:
    print distance from sonar
    print temperature from probe
    wait 0.05 seconds
`;

/** The readings printed during `ms` after setting the stimulus, as
 *  { cm: [...], c: [...] }. Whole lines only (the run can end in the middle
 *  of printing "-10"), sorted by their place in the run: the program prints
 *  a distance, then a temperature, from its first line on. */
function readings(r, ms, set) {
    set();
    const before = r.serial.split('\r\n').length - 1;
    r.run(ms);
    const all = r.serial.split('\r\n');
    all.pop();
    const out = { cm: [], c: [] };
    for (let i = before; i < all.length; i++) (i % 2 === 0 ? out.cm : out.c).push(Number(all[i]));
    return out;
}

describe('chain sensors: HC-SR04 distance and DS18B20 temperature', () => {
    for (const device of Object.keys(PINS)) {
        test(device, { skip: chainSkip(device) || false, timeout: 600000 }, async () => {
            const r = await runOn(program(device, READ_BOTH), device);
            const sonar = r.board.parts.find((p) => p.kind === 'ultrasonic');
            const probe = r.board.parts.find((p) => p.kind === 'ds18b20');
            // The first read waits out one 750 ms conversion; later ones
            // return the last finished conversion and start the next.
            r.run(1000);
            for (const [cm, celsius, want] of [[5, 23.4, 23], [37, -10.5, -10], [120, 85, 85], [300, 0.4, 0]]) {
                const got = readings(r, 1700, () => {
                    r.board.setPartParam(sonar.id, 'distance', cm);
                    r.board.setPartParam(probe.id, 'temperature', celsius);
                });
                const seen = `${JSON.stringify(got)}`;
                // Settled readings: the last three of each (a conversion in
                // flight still reports the previous temperature for ~0.75 s).
                // MEASURED 2026-10-05: exact everywhere except the 12T STC89,
                // where a 5 cm echo (290 us) is now and then read as 6: one
                // poll of its loop is ~25 us.
                const slack = device === 'stc89c52rc' ? 1 : 0;
                assert.ok(got.cm.length >= 3 && got.c.length >= 3, `${device}: ${seen} (expected ~14 of each in 1.7 s)`);
                for (const d of got.cm.slice(-3)) assert.ok(Math.abs(d - cm) <= slack, `${device}: ${cm} cm read ${d}, expected ~${cm} (${seen})`);
                for (const t of got.c.slice(-3)) assert.equal(t, want, `${device}: ${celsius} C read ${t} (${seen})`);
            }
            // Out of range: no echo inside 30 ms (600 cm is 34.8 ms) reads 999.
            const far = readings(r, 600, () => r.board.setPartParam(sonar.id, 'distance', 600));
            assert.equal(far.cm.at(-1), 999, `${device}: ${JSON.stringify(far)}`);
        });
    }
});

describe('chain sensors: a blink beside them keeps its time', () => {
    // A 1-Wire reset or slot runs with interrupts off. A window longer than
    // one tick would drop a millisecond on every read; this blink would then
    // run slow.
    for (const device of ['stc89c52rc', 'stc12c5a60s2', 'arduino-uno', 'pico', 'stm32f030']) {
        test(device, { skip: chainSkip(device) || false, timeout: 600000 }, async () => {
            const r = await runOn(program(device, `WHEN flag clicked:
  FOREVER:
    toggle led
    wait 0.5 seconds

WHEN flag clicked:
  FOREVER:
    set d to distance from sonar
    set t to temperature from probe
`), device);
            r.run(6100);
            const pin = r.pinOf('led');
            const w = r.events.filter((e) => e.pin === pin && /pushpull|quasi/.test(e.mode));
            const t = [];
            for (let i = 1; i < w.length; i++) if (w[i].high !== w[i - 1].high) t.push(w[i].tNs);
            // From 1.5 s: the first temperature read waits out one 750 ms
            // conversion and holds the blink once, by design. After that a
            // lost tick would lengthen EVERY interval, so the median is the
            // reading; a sonar read now and then delays one toggle by a few
            // ms (MEASURED 2026-10-05 on the STC89: 500.2 with one 510.4).
            const d = [];
            for (let i = 1; i < t.length; i++) if (t[i - 1] > 1.5e9) d.push((t[i] - t[i - 1]) / 1e6);
            d.sort((a, b) => a - b);
            const median = d[d.length >> 1];
            assert.ok(d.length >= 6, `${device}: ${d.length} intervals (expected ~9 between 1.5 s and 6.1 s)`);
            assert.ok(Math.abs(median - 500) <= 1, `${device}: median ${median.toFixed(1)} ms, expected ~500.0-500.3 (${d.map((x) => x.toFixed(1)).join(' ')})`);
        });
    }
});

describe('chain sensors: the ATtinys, by an LED threshold (no UART)', () => {
    for (const device of ['attiny85', 'attiny88']) {
        test(device, { skip: chainSkip(device) || false, timeout: 600000 }, async () => {
            const r = await runOn(`DEVICE ${device.toUpperCase()}
PIN near = PB0 OUTPUT
PIN warm = PB4 OUTPUT
PART sonar = HCSR04 TRIG PB1 ECHO PB2
PART probe = DS18B20 ON PB3

WHEN flag clicked:
  FOREVER:
    IF (distance from sonar) < 20 THEN:
      turn on near
    ELSE:
      turn off near
    IF (temperature from probe) > 30 THEN:
      turn on warm
    ELSE:
      turn off warm
    wait 0.05 seconds
`, device);
            const sonar = r.board.parts.find((p) => p.kind === 'ultrasonic');
            const probe = r.board.parts.find((p) => p.kind === 'ds18b20');
            const level = (name) => {
                const w = r.events.filter((e) => e.pin === r.pinOf(name));
                return w.length ? w.at(-1).high : false;
            };
            for (const [cm, celsius] of [[10, 35], [50, 25], [19, 31], [21, 29]]) {
                r.board.setPartParam(sonar.id, 'distance', cm);
                r.board.setPartParam(probe.id, 'temperature', celsius);
                r.run(2000);
                // 20 and 30 are the program's own IF thresholds, not tolerances;
                // MEASURED 2026-10-05: all four stimulus points on both ATtinys.
                assert.equal(level('near'), cm < 20, `${device}: ${cm} cm`);
                assert.equal(level('warm'), celsius > 30, `${device}: ${celsius} C (expected ~30 C: the program's threshold)`);
            }
        });
    }
});
