// `ask ... and wait` / `answer` on the chips, typed in over the serial line.
//
// Until 2026-10-05 the device C route had no ask at all ("no C equivalent"):
// a program could talk to the serial monitor but never listen. The question
// now goes out like a print, the next line typed in is the answer (as text
// for print/join/`answer = "yes"`, as Scratch's number cast for arithmetic),
// and with the scheduler running the wait for it is a yield -- the other
// scripts keep going. The 8051 needs the emulator's receive FIFO (emu8051-stc
// lane uart-rx-fifo) or a typed line arrives as its last byte only.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import { chainSkip, runOn } from './helpers/mcu-chain.mjs';

const PINS = {
    stc12c5a60s2: 'P1.0', stc15f2k60s2: 'P1.0', stc89c52rc: 'P1.0',
    'arduino-uno': 'D13', 'arduino-nano': 'D13', atmega168p: 'D13', 'arduino-mega': 'D13',
    pico: 'GP25', stm32f030: 'PA0',
};

const program = (device) => `DEVICE ${device.toUpperCase()}
PIN led = ${PINS[device]} OUTPUT

WHEN flag clicked:
  ask "What is your name?" and wait
  print join "Hello " answer
  ask "How old are you?" and wait
  print join "Next year you are " (answer + 1)
  ask "Shall I light the lamp?" and wait
  IF answer = "yes" THEN:
    print "lamp on"
  ELSE:
    print "lamp stays off"

WHEN flag clicked:
  FOREVER:
    wait 0.1 seconds
    change ticks by 1
`;

describe('chain ask: a conversation over the serial line', () => {
    for (const device of Object.keys(PINS)) {
        test(device, { skip: chainSkip(device) || false, timeout: 300000 }, async () => {
            const r = await runOn(program(device), device);
            r.run(200);
            assert.match(r.serial, /What is your name\?\r\n$/, `${device}: ${JSON.stringify(r.serial)}`);
            r.send('Ada\r\n');
            r.run(200);
            r.send('41\r');
            r.run(200);
            r.send('YES\r');
            r.run(200);
            assert.deepEqual(r.serial.trim().split('\r\n'), [
                'What is your name?', 'Hello Ada',
                'How old are you?', 'Next year you are 42',
                'Shall I light the lamp?', 'lamp on',
            ], `${device}: ${JSON.stringify(r.serial)}`);
        });
    }
});

test('a non-number answer is 0 in arithmetic, as Scratch casts it', () => {
    const c = new SB3Creator();
    c.parse(program('stc12c5a60s2'));
    const code = c.generateC();
    assert.match(code, /if \(!any \|\| i != bw_ans_len\) return 0;/);
});

test('the ATtinys refuse ask by name: no UART', () => {
    for (const device of ['attiny85', 'attiny88']) {
        const r = SB3Creator.retargetPseudocode(program('stc12c5a60s2'), device);
        assert.equal(r.ok, false);
        assert.ok(r.reasons.some((w) => /UART/.test(w)), r.reasons.join('; '));
    }
});
