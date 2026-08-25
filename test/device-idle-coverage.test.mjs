// Every chip a user can name idles. The owner asked "do we cover all of
// our chips?" and the walk found three that silently did NOT: DEVICE
// UNO/MEGA/NANO warned about an unknown device and fell through to a
// half-configured build — no core, no tasks, no idle, silently wrong
// output. The aliases fixed it; this test keeps the whole roster honest,
// by the names people actually type AND the canonical keys.
import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const ROSTER = [
    // [device name, a valid pin, expected idle marker]
    ['STC12', 'P1.0', /PCON\s*\|=\s*0x0?1/],
    ['STC89', 'P1.0', /PCON\s*\|=\s*0x0?1/],
    ['STC15', 'P1.0', /PCON\s*\|=\s*0x0?1/],
    ['UNO', 'D13', /sleep_cpu\(\)/],
    ['NANO', 'D13', /sleep_cpu\(\)/],
    ['MEGA', 'D13', /sleep_cpu\(\)/],
    ['ARDUINO-UNO', 'D13', /sleep_cpu\(\)/],
    ['ARDUINO-NANO', 'D13', /sleep_cpu\(\)/],
    ['ARDUINO-MEGA', 'D13', /sleep_cpu\(\)/],
    ['ATMEGA168P', 'D13', /sleep_cpu\(\)/],
    ['ATMEGA328P', 'D13', /sleep_cpu\(\)/],
    ['ATTINY88', 'PD0', /sleep_cpu\(\)/],
    ['ATTINY85', 'PB0', /sleep_cpu\(\)/],
    ['PICO', 'GP25', /bw_idle\(\)/],
    ['EATER6502', 'PA0', /bw_wai\(\)/],
];

for (const [dev, pin, marker] of ROSTER) {
    test(`${dev} idles (tasks build carries its sleep)`, () => {
        const c = new SB3Creator();
        c.parse(`DEVICE ${dev}\nPIN led1 = ${pin} OUTPUT\n\nWHEN flag clicked:\n  forever:\n    turn led1 on\n    wait 0.5 seconds\n    turn led1 off\n    wait 0.5 seconds\n`);
        const out = c.generateC(c.project, { debug: true });
        assert.ok(c._core, `${dev} resolves to a C core (an unknown device half-configures silently)`);
        assert.match(out, marker, `${dev} emits its idle`);
    });
}
