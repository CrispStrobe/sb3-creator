// print and ask on the ATtinys, which have no UART: a software UART on
// ATTinyCore's comparator pins (tiny85 PB0/PB1, tiny88 PD6/PD7), TX cycle-
// timed, RX a pin-change interrupt feeding a queue. bw-board decodes TX and
// drives RX on the same pins. Until 2026-10-06 both chips refused print/ask.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import { chainSkip, runOn } from './helpers/mcu-chain.mjs';

const SRC = `DEVICE STC12C5A60S2
CLOCK 11059200
PIN led = P1.0 OUTPUT ACTIVE LOW

WHEN flag clicked:
  turn off led
  ask "Your name?" and wait
  print join "Hello " answer
  ask "A number?" and wait
  print answer * 2
  turn on led
`;

describe('chain attiny serial: a question, a typed answer, a reply', () => {
    for (const device of ['attiny85', 'attiny88']) {
        test(device, { skip: chainSkip(device) || false, timeout: 300000 }, async () => {
            const rt = SB3Creator.retargetPseudocode(SRC, device);
            assert.equal(rt.ok, true, (rt.reasons || []).join('; '));
            const pins = SB3Creator.SOFT_SERIAL_PINS[device];
            assert.doesNotMatch(rt.pseudocode, new RegExp(`= (${pins.tx}|${pins.rx})\\b`), 'no pin lands on the UART');
            const r = await runOn(rt.pseudocode, device);
            r.run(100);
            assert.equal(r.serial, 'Your name?\r\n');
            r.send('Ada\r');
            r.run(100);
            r.send('21\r');
            r.run(100);
            assert.equal(r.serial, 'Your name?\r\nHello Ada\r\nA number?\r\n42\r\n');
        });
    }
});

test('a program that declares a pin on the software UART is warned at emit', () => {
    const c = new SB3Creator();
    c.parse('DEVICE ATTINY85\nPIN led = PB0 OUTPUT\n\nWHEN flag clicked:\n  print "hi"\n  turn on led\n');
    const g = c.generateC();
    void g;
    const warnings = c._cWarnings || [];
    assert.ok(warnings.some((w) => /software UART's TX/.test(w)), JSON.stringify(warnings));
});
