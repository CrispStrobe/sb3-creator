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

// Full duplex (2026-10-06): one script prints without pause while a person
// types into another, and a third keeps time. Both directions run on the
// tick timer's free compare channel, so the typed line arrives whole while
// the transmitter is busy, and the millisecond tick neither stalls nor merges
// (the previous software UART held interrupts off for each 1.04 ms frame:
// typed bytes were lost meanwhile, and a tick due twice inside one frame
// counted once).
const DUPLEX = `DEVICE STC12C5A60S2
CLOCK 11059200
PIN led = P1.0 OUTPUT ACTIVE LOW

WHEN flag clicked:
  ask "Name?" and wait
  print join "Hi " answer

WHEN flag clicked:
  wait 0.05 seconds
  REPEAT 150:
    print "...................."

WHEN flag clicked:
  wait 2 seconds
  print "T"
`;

describe('chain attiny serial: full duplex, and the tick keeps time', () => {
    for (const device of ['attiny85', 'attiny88']) {
        test(device, { skip: chainSkip(device) || false, timeout: 300000 }, async () => {
            const rt = SB3Creator.retargetPseudocode(DUPLEX, device);
            assert.equal(rt.ok, true, (rt.reasons || []).join('; '));
            const r = await runOn(rt.pseudocode, device);
            r.run(300);                          // the dots are streaming by now
            const before = r.serial.length;
            r.send('Ada\r');
            r.run(100);
            assert.ok(r.serial.length > before + 50, 'the transmitter was busy the whole time');
            assert.match(r.serial, /\r\nHi Ada\r\n/, 'the line typed during printing arrived whole');
            let tAt = -1;
            for (let ms = 400; ms < 2600 && tAt < 0; ms += 5) {
                r.run(5);
                if (/\r\nT\r\n/.test(r.serial)) tAt = ms + 5;
            }
            // MEASURED 2026-10-06: "T" arrives at 2030 ms on both chips (the wait,
            // then the dots line queued ahead of it: 22 bytes are 23 ms of TX).
            // The previous UART held interrupts off for each 1.04 ms frame, so a
            // tick due twice inside one counted once: under continuous printing
            // its millisecond count read 1926 after 2000 ms (both chips, built
            // from fcea15f3 and run directly), which would put "T" past 2070 ms.
            assert.ok(tAt >= 2000 && tAt <= 2050, `${device}: "T" at ${tAt} ms, expected ~2030`);
        });
    }
});
