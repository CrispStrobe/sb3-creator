// retargetPseudocode: one canonical example, every capable device.
//
// The dialect isolates every device-specific fact in the declaration
// lines (DEVICE, CLOCK, PIN ... [ACTIVE LOW]); bodies speak logical pin
// names. Retargeting is therefore a DECLARATION rewrite: map each pin to
// the target's conventional pin of the same role, keep the body
// byte-identical. What cannot map is refused with the reason — a gallery
// filters on exactly that, computed, never hand-maintained.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const BLINK_POT = `DEVICE ARDUINO-NANO
PIN led1 = D13 OUTPUT
PIN pot1 = A0 ANALOG

WHEN flag clicked:
  FOREVER:
    turn on led1
    wait read pot1 milliseconds
    turn off led1
    wait 100 milliseconds
`;

const body = (text) => text.slice(text.indexOf('WHEN'));

test('retarget: nano -> pico maps roles to GP pins, body untouched', () => {
    const r = SB3Creator.retargetPseudocode(BLINK_POT, 'pico');
    assert.equal(r.ok, true, r.reasons.join('; '));
    assert.match(r.pseudocode, /^DEVICE PICO$/m);
    assert.match(r.pseudocode, /^PIN led1 = GP25 OUTPUT$/m, 'the onboard LED, active high');
    assert.match(r.pseudocode, /^PIN pot1 = GP26 ANALOG$/m, 'ADC0');
    // The program is the SAME program: only declarations moved.
    // decompile emits the CANONICAL form — same program, canonical spelling.
    assert.ok(body(r.pseudocode).includes('turn on led1'));
    assert.ok(body(r.pseudocode).includes('read pot1'), 'the pot read survives');
    // And it emits the target's C.
    const c = new SB3Creator();
    c.parse(r.pseudocode);
    const out = c.generateC(undefined, {});
    assert.match(out, /BW_SIO_GPIO_OUT_SET = \(1UL << 25\);/);
    assert.match(out, /adc_read\(0\)/);
});

test('retarget: nano -> stc12 gains the active-low wiring convention', () => {
    const r = SB3Creator.retargetPseudocode(BLINK_POT, 'stc12c5a60s2');
    assert.equal(r.ok, true, r.reasons.join('; '));
    assert.match(r.pseudocode, /^PIN led1 = P1\.0 OUTPUT ACTIVE LOW$/m,
        'the 8051 sinks current — the convention travels with the device');
    assert.match(r.pseudocode, /^PIN pot1 = P1\.3 ANALOG$/m);
    const c = new SB3Creator();
    c.parse(r.pseudocode);
    assert.deepEqual(c.warnings, [], 'clean re-parse on the 8051 side');
});

test('retarget: a device without the feature refuses with the reason', () => {
    const r = SB3Creator.retargetPseudocode(BLINK_POT, 'stc89c52rc');
    assert.equal(r.ok, false);
    assert.ok(r.reasons.some((x) => /no ADC/.test(x)), JSON.stringify(r.reasons));
    assert.equal(r.pseudocode, undefined, 'no half-adapted text is produced');
});

test('retarget: whole-port writes stay on the 8051', () => {
    const src = `DEVICE STC12C5A60S2
PORT leds = P1 OUTPUT

WHEN flag clicked:
  set leds to 255
`;
    const r = SB3Creator.retargetPseudocode(src, 'pico');
    assert.equal(r.ok, false);
    assert.ok(r.reasons.some((x) => /8051 construct/.test(x)), JSON.stringify(r.reasons));
});

test('retarget: a dimmed pin lands on a PWM-capable pin of the target', () => {
    const src = `DEVICE STC12C5A60S2
PIN dim = P1.3 OUTPUT

WHEN flag clicked:
  set dim to 40 percent
`;
    const r = SB3Creator.retargetPseudocode(src, 'arduino-nano');
    assert.equal(r.ok, true, r.reasons.join('; '));
    assert.match(r.pseudocode, /^PIN dim = D3 PWM$/m,
        'D3 is the first dimmer pin, in the arduino vocabulary (PWM direction)');
});

test('retarget: more pins than the convention offers is refused, not truncated', () => {
    // One more LED than the Pico convention offers, however large the pool
    // grows (it went 7 → 22 when the full GP set joined; a literal 8 then
    // mapped fine and tested nothing).
    const n = SB3Creator.RETARGET_POOLS.pico.digital.length + 1;
    const pins = Array.from({ length: n }, (_, i) => `PIN led${i + 1} = D${i + 2} OUTPUT`).join('\n');
    const on = Array.from({ length: n }, (_, i) => `  turn on led${i + 1}`).join('\n');
    // Source is the MEGA: D2..D24 all exist there. On an UNO, D14+ are not
    // real pins and quietly fall out, leaving a mappable count.
    const src = `DEVICE ARDUINO-MEGA\n${pins}\n\nWHEN flag clicked:\n${on}\n`;
    const r = SB3Creator.retargetPseudocode(src, 'pico');
    assert.equal(r.ok, false);
    assert.ok(r.reasons.some((x) => /more digital outputs/.test(x)), JSON.stringify(r.reasons));
});

test('retarget: the program\'s own device is the identity — authored pins survive', () => {
    const src = 'DEVICE STC12C5A60S2\nPIN sda = P2.1 OUTPUT\nPIN scl = P2.2 OUTPUT\n\nWHEN flag clicked:\n  turn on sda\n';
    const r = SB3Creator.retargetPseudocode(src, 'stc12c5a60s2');
    assert.equal(r.ok, true);
    // VERBATIM, not canonicalized: pool order would rewrite sda to P1.0 and
    // the bench would pair with pins the authored program never drives
    // (49-lcd-hello dark on the STC12, 2026-08-17).
    assert.equal(r.pseudocode, src);
});

test('retarget: the sda/scl bus lands on the device\'s hardware I2C pins', () => {
    const src = 'DEVICE STC12C5A60S2\nPIN sda = P2.1 OUTPUT\nPIN scl = P2.2 OUTPUT\n\nWHEN flag clicked:\n  turn on sda\n';
    for (const [dev, sda, scl] of [
        ['arduino-nano', 'A4', 'A5'], ['arduino-uno', 'A4', 'A5'],
        ['arduino-mega', 'D20', 'D21'], ['pico', 'GP4', 'GP5'],
        ['attiny85', 'PB0', 'PB2'], ['attiny88', 'PC4', 'PC5'],
    ]) {
        const r = SB3Creator.retargetPseudocode(src, dev);
        assert.equal(r.ok, true, `${dev}: ${(r.reasons || []).join('; ')}`);
        // NOT the digital pool head — D13 carries the AVR onboard LED, a
        // permanent load on what must be an open-drain line.
        assert.match(r.pseudocode, new RegExp(`^PIN sda = ${sda} OUTPUT$`, 'm'), dev);
        assert.match(r.pseudocode, new RegExp(`^PIN scl = ${scl} OUTPUT$`, 'm'), dev);
    }
});

test('retarget: other pins never collide with the reserved I2C pair', () => {
    // Analog pins on the uno would take A4 next — the reservation must win.
    const src = 'DEVICE STC12C5A60S2\nPIN sda = P2.1 OUTPUT\nPIN scl = P2.2 OUTPUT\nPIN pot1 = P1.0 ANALOG\nPIN pot2 = P1.1 ANALOG\nPIN pot3 = P1.2 ANALOG\nPIN pot4 = P1.3 ANALOG\nPIN pot5 = P1.4 ANALOG\n\nWHEN flag clicked:\n  print read pot1\n';
    const r = SB3Creator.retargetPseudocode(src, 'arduino-uno');
    assert.equal(r.ok, false, 'six analog roles cannot fit beside the reserved pair');
    assert.ok(r.reasons.some((x) => /more analog pins/.test(x)), JSON.stringify(r.reasons));
    const src4 = src.replace('PIN pot5 = P1.4 ANALOG\n', '');
    const r4 = SB3Creator.retargetPseudocode(src4, 'arduino-uno');
    assert.equal(r4.ok, true, (r4.reasons || []).join('; '));
    const wheres = (r4.pseudocode.match(/^PIN pot\d = (\S+)/gm) || []).map((l) => l.split('= ')[1].split(' ')[0]);
    assert.ok(!wheres.includes('A4') && !wheres.includes('A5'),
        `analog pins skipped the I2C pair: ${wheres.join(',')}`);
});

test('retarget: every ok result re-parses clean and emits C on its target', () => {
    for (const dev of ['pico', 'arduino-uno', 'arduino-nano', 'stc12c5a60s2', 'stc15f2k60s2']) {
        const r = SB3Creator.retargetPseudocode(BLINK_POT, dev);
        assert.equal(r.ok, true, `${dev}: ${r.reasons.join('; ')}`);
        const c = new SB3Creator();
        c.parse(r.pseudocode);
        assert.deepEqual(c.warnings, [], `${dev} re-parses clean`);
        const out = c.generateC(undefined, {});
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53):
        // out.length > 200 -> observed 2539…6677 over 5 reaches.
        assert.ok(out.length > 200, `${dev} emits C`);
        assert.deepEqual(c._cWarnings, [], `${dev} emits clean: ${JSON.stringify(c._cWarnings)}`);
    }
});
