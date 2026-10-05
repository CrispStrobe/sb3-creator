// One program, every board, the same time. The portable gallery's whole claim
// is that a program written once runs right on each board it retargets to,
// and "right" starts with time: a wait of 0.5 s must be 0.5 s on the chip.
//
// Each case compiles with the board's own toolchain and the compile service's
// flags and runs on its bw-board emulator against the inferred bench (see
// helpers/mcu-chain.mjs). MEASURED 2026-10-05 before the fixes it holds:
//   stm32f030  1302 ms per 500 ms  (retarget wrote the Pico's 125 MHz clock)
//   attiny88   1000 ms             (16 MHz assumed; the chip runs at 8 MHz)
//   attiny85   no image at all     (TIMSK0 does not exist on the tiny85)
//   stc89c52rc   59 ms             (emu8051 counted 12T timers every clock)
//   stc89c52rc  516 ms             (Timer 0 re-arm lost ~28 counts per ms)
// and after: 500.0-500.3 ms on all eleven.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chainSkip, runOn } from './helpers/mcu-chain.mjs';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const DEVICES = ['stc12c5a60s2', 'stc15f2k60s2', 'stc89c52rc', 'arduino-uno', 'arduino-nano',
    'atmega168p', 'arduino-mega', 'attiny88', 'attiny85', 'pico', 'stm32f030'];

/** Mean half-period (ms) of a pin's written level, from its toggles. */
function halfPeriod(r, name) {
    const pin = r.pinOf(name);
    const w = r.events.filter((e) => e.pin === pin && (e.mode === 'pushpull' || e.mode === 'quasi'));
    const t = [];
    for (let i = 1; i < w.length; i++) if (w[i].high !== w[i - 1].high) t.push(w[i].tNs);
    assert.ok(t.length >= 3, `${name} on ${pin} toggled ${t.length} times (expected ~6-10 in a 3 s run)`);
    return (t[t.length - 1] - t[0]) / (t.length - 1) / 1e6;
}

const TWO_TASKS = `DEVICE STC12C5A60S2
CLOCK 11059200
PIN led1 = P1.0 OUTPUT ACTIVE LOW
PIN led2 = P1.1 OUTPUT ACTIVE LOW

WHEN flag clicked:
  FOREVER:
    toggle led1
    wait 0.5 seconds

WHEN flag clicked:
  FOREVER:
    toggle led2
    wait 0.3 seconds
`;

describe('chain timing: one blink, every board', () => {
    const blink = readFileSync(join(EXAMPLES, '01-blink', 'program.bw'), 'utf8');
    for (const device of DEVICES) {
        test(`${device}: 01-blink half-period is 500 ms`, { skip: chainSkip(device) || false, timeout: 300000 },
            async () => {
                const r = await runOn(blink, device);
                r.run(3000);
                const ms = halfPeriod(r, 'led1');
                // MEASURED 2026-10-05: 500.0 (AVR, Pico, STM32), 500.1-500.3 (8051).
                assert.ok(Math.abs(ms - 500) <= 2, `${device}: ${ms.toFixed(1)} ms, expected ~500.0-500.3`);
            });
    }
});

describe('chain timing: two scheduled scripts, every board', () => {
    for (const device of DEVICES) {
        test(`${device}: 500 ms and 300 ms tasks keep their own time`, { skip: chainSkip(device) || false, timeout: 300000 },
            async () => {
                const r = await runOn(TWO_TASKS, device);
                r.run(3100);
                const a = halfPeriod(r, 'led1');
                const b = halfPeriod(r, 'led2');
                // MEASURED 2026-10-05: 500.2-500.3 / 300.1 on the 8051 family.
                assert.ok(Math.abs(a - 500) <= 2, `${device}: led1 ${a.toFixed(1)} ms, expected ~500.0-500.3`);
                assert.ok(Math.abs(b - 300) <= 2, `${device}: led2 ${b.toFixed(1)} ms, expected ~300.0-300.1`);
            });
    }
});
