// `set <pin> to <n> hz` plays n Hz on every board that retargets a TONE pin.
//
// Before 2026-10-05 the 8051 tone_set was an empty stub (07-buzzer-siren was
// silent on the chip), ARM's was empty too, and the retarget refused TONE
// everywhere EXCEPT the 8051 -- while the AVR had a real Timer 2 tone the gate
// never let through. Each board now has a timer interrupt toggling the pin:
// 8051 Timer 1, ATmega Timer 2, RP2040 TIMER alarm 1, STM32F030 TIM14, and
// on the ATtinys the timer their tick leaves free (2026-10-06; they used to
// refuse): the tiny85's Timer 1, the tiny88's Timer 0. With print, the
// 8051's UART moves to its second baud source (last block below).
//
// Pitch is measured the way it is heard: toggles on the pin over 0.8 s.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import { chainSkip, runOn } from './helpers/mcu-chain.mjs';

const SIREN = `DEVICE STC12C5A60S2
CLOCK 11059200
PIN buzzer = P1.5 TONE

WHEN flag clicked:
  set buzzer to 440 hz
  wait 1 seconds
  set buzzer to 1000 hz
  wait 1 seconds
  set buzzer to 0 hz
  wait 1 seconds
`;

const DEVICES = ['stc12c5a60s2', 'stc15f2k60s2', 'stc89c52rc', 'arduino-uno', 'arduino-nano',
    'atmega168p', 'arduino-mega', 'attiny85', 'attiny88', 'pico', 'stm32f030'];

describe('chain tone: 440 Hz then 1000 Hz then silence', () => {
    for (const device of DEVICES) {
        test(device, { skip: chainSkip(device) || false, timeout: 300000 }, async () => {
            const r = await runOn(SIREN, device);
            r.run(2900);
            const pin = r.pinOf('buzzer');
            const hz = (from, to) => r.edges(pin, from, to) / 2 / ((to - from) / 1000);
            const a = hz(200, 1000);
            const b = hz(1200, 2000);
            // MEASURED 2026-10-05 (single-period readings): 437.1-440.9 and
            // 994.7-1003.5 across the nine boards; averaged here, within 1 %.
            assert.ok(Math.abs(a - 440) <= 4.4, `${device}: ${a.toFixed(1)} Hz, expected ~437-441`);
            assert.ok(Math.abs(b - 1000) <= 10, `${device}: ${b.toFixed(1)} Hz, expected ~995-1004`);
            assert.equal(r.edges(pin, 2100, 2900), 0, `${device}: 0 Hz is silence`);
            const buzz = r.board.parts.find((p) => p.kind === 'buzzer');
            assert.equal(r.board.buzzerTone(buzz.id).on, false, 'the board hears silence too');
        });
    }
});

// Timer 1 is the 8051's usual baud clock AND the tone timer. Until 2026-10-06
// a program with both was refused. Now the UART runs from the part's second
// baud source (STC12 BRT, 8052/STC15 Timer 2) whenever a tone holds Timer 1, so
// the tune and the serial line coexist: pitch as above, the text intact.
const SIREN_PRINT = SIREN.replace('  set buzzer to 1000 hz', '  print "done"\n  set buzzer to 1000 hz');

describe('chain tone + print on the 8051: both, on separate timers', () => {
    for (const device of ['stc12c5a60s2', 'stc15f2k60s2', 'stc89c52rc']) {
        test(device, { skip: chainSkip(device) || false, timeout: 300000 }, async () => {
            assert.equal(SB3Creator.retargetPseudocode(SIREN_PRINT, device).ok, true, 'retarget no longer refuses');
            const r = await runOn(SIREN_PRINT, device);
            assert.match(r.code, device.startsWith('stc12') ? /AUXR \|= 0x11;.*S1BRS/ : device.startsWith('stc15')
                ? /AUXR \|= 0x11;.*S1ST2/ : /T2CON = 0x34;/, 'the UART is on the second baud source');
            assert.doesNotMatch(r.code, /TMOD = \(TMOD & 0x0F\) \| 0x20/, 'Timer 1 is not the baud clock');
            r.run(2900);
            const pin = r.pinOf('buzzer');
            const hz = (from, to) => r.edges(pin, from, to) / 2 / ((to - from) / 1000);
            const a = hz(200, 1000);
            const b = hz(1200, 2000);
            assert.ok(Math.abs(a - 440) <= 4.4, `${device}: ${a.toFixed(1)} Hz, expected ~437-441`);
            assert.ok(Math.abs(b - 1000) <= 10, `${device}: ${b.toFixed(1)} Hz, expected ~995-1004`);
            assert.equal(r.serial, 'done\r\n');
        });
    }
});

test('every retargetable 8051 part has a second baud source, so tone + print retargets everywhere', () => {
    for (const device of ['stc12c5a60s2', 'stc15f2k60s2', 'stc89c52rc', 'arduino-uno']) {
        const r = SB3Creator.retargetPseudocode(SIREN_PRINT, device);
        assert.equal(r.ok, true, `${device}: ${(r.reasons || []).join('; ')}`);
    }
});

// A script that ends with the tone still on: in Scratch the note keeps
// sounding after the script finishes, so on the chip main() must not return.
// Until 2026-10-06 only the 8051 got the "stay finished" loop -- the AVR and
// ARM straight-line branches never reached it, and avr-libc's exit parks with
// interrupts off, so the tone ISR stopped mid-note (found running an ATtiny85
// program in Lite's B12 test).
const LEFT_ON = `DEVICE STC12C5A60S2
CLOCK 11059200
PIN buzzer = P1.5 TONE

WHEN flag clicked:
  set buzzer to 440 hz
`;

describe('chain tone: a note left on when the script ends keeps sounding', () => {
    for (const device of DEVICES) {
        test(device, { skip: chainSkip(device) || false, timeout: 300000 }, async () => {
            const r = await runOn(LEFT_ON, device);
            // The STM32F030 always runs the scheduler (its loop never ends);
            // every other board emits this straight-line main.
            if (device !== 'stm32f030') assert.match(r.code, /the script has finished: stay finished/);
            r.run(1000);
            const hz = r.edges(r.pinOf('buzzer'), 200, 1000) / 2 / 0.8;
            assert.ok(Math.abs(hz - 440) <= 4.4, `${device}: ${hz.toFixed(1)} Hz after the script ended, expected ~440`);
        });
    }
});
