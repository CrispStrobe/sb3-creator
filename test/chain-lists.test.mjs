// Lists and `pick random` on the chips, not only on the 8086.
//
// Until 2026-10-05 the device C route lowered lists on the i8086 alone; every
// other core wrote a comment where each list statement had been, and `pick
// random` was the i8086's too. They now share one-based, bounded helpers (32
// items of 32 bits, XRAM on the 8051) and an xorshift32 generator.
//
// Running them on the emulated chips found one more fault: the STM32F030
// image has no .data loader (the compile service's link script is
// static-init-free by design), so an initialized RNG seed read as 0 there and
// every `pick random 1 to 6` was 4. The seed is now set on first use, and
// any nonzero initial value is assigned again in bw_setup on the F030.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import { chainSkip, runOn } from './helpers/mcu-chain.mjs';

const SRC = `DEVICE STC12C5A60S2
CLOCK 11059200
PIN led = P1.0 OUTPUT

WHEN flag clicked:
  delete all of nums
  add 3 to nums
  add 1 to nums
  add 2 to nums
  insert 7 at 1 of nums
  delete 3 of nums
  replace item 1 of nums with 100000
  print length of nums
  set i to 1
  REPEAT length of nums:
    print item i of nums
    change i by 1
  set lo to 99
  set hi to 0
  REPEAT 200:
    set r to pick random 1 to 6
    IF r < lo THEN:
      set lo to r
    IF r > hi THEN:
      set hi to r
  print lo
  print hi
  turn on led`;

const DEVICES = ['stc12c5a60s2', 'stc15f2k60s2', 'stc89c52rc', 'arduino-uno', 'arduino-nano',
    'atmega168p', 'arduino-mega', 'pico', 'stm32f030'];

describe('chain lists: add, insert, delete, replace, item, length and pick random', () => {
    for (const device of DEVICES) {
        test(device, { skip: chainSkip(device) || false, timeout: 300000 }, async () => {
            const r = await runOn(SRC, device);
            r.run(1500);
            const lines = r.serial.split('\r\n');
            // [3,1,2] -> insert 7 at 1 -> [7,3,1,2] -> delete 3 -> [7,3,2]
            // -> replace 1 -> [100000,3,2]; 100000 needs the 32-bit item.
            assert.deepEqual(lines.slice(0, 4), ['3', '100000', '3', '2'], `${device}: ${JSON.stringify(r.serial)}`);
            // MEASURED 2026-10-05: 200 draws reach both ends, 1 and 6, on all
            // nine boards (and were all 4 on the F030 before the seed fix).
            assert.deepEqual(lines.slice(4, 6), ['1', '6'], `${device}: random range ${lines.slice(4, 6)}`);
        });
    }
});

test('the ATtinys refuse print by name: neither has a UART', () => {
    for (const device of ['attiny85', 'attiny88']) {
        const r = SB3Creator.retargetPseudocode(SRC, device);
        assert.equal(r.ok, false, device);
        assert.ok(r.reasons.some((w) => /UART/.test(w)), `${device}: ${r.reasons.join('; ')}`);
    }
});
