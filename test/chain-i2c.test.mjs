// I2C PARTs on the chips: a DS3231 clock and an AT24C02 memory sharing one
// bus, plus the bus probe -- the emitted open-drain I2C master, compiled and
// run against the inferred bench (both parts, one 4.7 k pull-up per line).
//
// MEASURED 2026-10-05 while building it: right at once on the STC12 and the
// Uno; on the Pico and STM32F030 every address "answered" and every read
// was 0, because their inputs were set up with the chip's own pull-down,
// which held SDA low against the bus pull-up. Open-drain lines now get no
// internal pull.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import { chainSkip, runOn } from './helpers/mcu-chain.mjs';

const SRC = `DEVICE STC12C5A60S2
PIN led = P1.0 OUTPUT ACTIVE LOW
PART clock = DS3231 SDA P1.6 SCL P1.7
PART memory = AT24C02 SDA P1.6 SCL P1.7

WHEN flag clicked:
  set time of clock to 7 : 59 : 58
  store 42 at 10 in memory
  store 300 at 11 in memory
  print byte 10 of memory
  print byte 11 of memory
  print byte 12 of memory
  set a to 1
  REPEAT 126:
    IF i2c device a on clock THEN:
      print a
    change a by 1
  REPEAT 4:
    print join (current hour) (join ":" (join (current minute) (join ":" (current second))))
    wait 1 seconds
`;

const DEVICES = ['stc12c5a60s2', 'stc15f2k60s2', 'stc89c52rc', 'arduino-uno', 'arduino-nano',
    'atmega168p', 'arduino-mega', 'pico', 'stm32f030'];

describe('chain i2c: clock, memory and a bus scan on one bus', () => {
    for (const device of DEVICES) {
        test(device, { skip: chainSkip(device) || false, timeout: 300000 }, async () => {
            const src = device === 'stc12c5a60s2' ? SRC : SB3Creator.retargetPseudocode(SRC, device).pseudocode;
            const r = await runOn(src, device);
            r.run(4600);
            assert.deepEqual(r.serial.trim().split('\r\n'), [
                '42',                 // stored and read back
                '44',                 // a byte: 300 is stored as 300 & 255
                '255',                // never written: an erased EEPROM reads 0xFF
                '80', '104',          // the scan: 0x50 (AT24C02) and 0x68 (DS3231)
                '7:59:58', '7:59:59', '8:0:0', '8:0:1',   // the clock, across the hour
            ], `${device}: ${JSON.stringify(r.serial)}`);
        });
    }
});

test('I2C parts share their pins; the retarget gives them the board\'s SDA/SCL', () => {
    const r = SB3Creator.retargetPseudocode(SRC, 'arduino-uno');
    assert.equal(r.ok, true, (r.reasons || []).join('; '));
    assert.match(r.pseudocode, /PART clock = DS3231 SDA A4 SCL A5/);
    assert.match(r.pseudocode, /PART memory = AT24C02 SDA A4 SCL A5/);
    const p = SB3Creator.retargetPseudocode(SRC, 'pico');
    assert.match(p.pseudocode, /PART clock = DS3231 SDA GP4 SCL GP5/);
});

test('two I2C parts may share a pin only in the same role', () => {
    const c = new SB3Creator();
    assert.throws(() => c.parse(SRC.replace('PART memory = AT24C02 SDA P1.6 SCL P1.7', 'PART memory = AT24C02 SDA P1.7 SCL P1.6')),
        (e) => e.code === 'DIALECT_UNPARSED_LINES' && /already claimed/.test(e.lines[0].reason));
});

// Two buses. Two AT24C02 memories both answer at 0x50, so on one bus they
// would collide; each on its own SDA/SCL pair, each master talks to its own.
// The retarget gives the first pair the board's hardware SDA/SCL and the
// second pair two digital pins (until 2026-10-06 it merged them onto one).
const TWO_BUSES = `DEVICE STC12C5A60S2
PIN led = P1.0 OUTPUT ACTIVE LOW
PART left = AT24C02 SDA P1.6 SCL P1.7
PART right = AT24C02 SDA P3.4 SCL P3.5

WHEN flag clicked:
  store 11 at 0 in left
  store 22 at 0 in right
  print byte 0 of left
  print byte 0 of right
  IF i2c device 80 on left THEN:
    print 1
  IF i2c device 80 on right THEN:
    print 2
`;

describe('chain i2c: two buses, one memory on each, both at 0x50', () => {
    for (const device of DEVICES) {
        test(device, { skip: chainSkip(device) || false, timeout: 300000 }, async () => {
            const src = device === 'stc12c5a60s2' ? TWO_BUSES : SB3Creator.retargetPseudocode(TWO_BUSES, device).pseudocode;
            const r = await runOn(src, device);
            assert.match(r.code, /bw_i2c2_found/, 'a second master for the second pair');
            r.run(400);
            assert.deepEqual(r.serial.trim().split('\r\n'), ['11', '22', '1', '2'], `${device}: ${JSON.stringify(r.serial)}`);
        });
    }
});

test('the retarget keeps a second I2C bus on pins of its own', () => {
    for (const device of ['arduino-uno', 'pico', 'stm32f030', 'stc89c52rc']) {
        const r = SB3Creator.retargetPseudocode(TWO_BUSES, device);
        assert.equal(r.ok, true, (r.reasons || []).join('; '));
        const pair = (name) => r.pseudocode.match(new RegExp(`PART ${name} = AT24C02 SDA (\\S+) SCL (\\S+)`)).slice(1).join('/');
        assert.notEqual(pair('left'), pair('right'), `${device}: ${r.pseudocode}`);
    }
});
