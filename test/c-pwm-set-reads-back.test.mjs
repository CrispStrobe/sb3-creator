// `set <pin> to <n> percent` on a hardware-PWM pin compiles to
// `pwm_set(channel, percent)` on every core, and the C reader had no sentence
// for it: the round trip came back as `no pseudocode for the call "pwm_set(…)"
// — emitted as 0`, i.e. the lamp's brightness line was silently deleted. The
// channel is numbered the way each core numbers the pin (8051 port*8+bit, AVR
// D number, Pico GPIO, STM32 port*16+bit), so each family is checked.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import cToPseudocode from '../src/utils/cToPseudocode.js';

const PROGRAM = `DEVICE STC12C5A60S2
CLOCK 11059200
PIN ldr = P1.3 ANALOG
PIN lamp = P1.1 PWM

WHEN flag clicked:
  FOREVER:
    set level to read ldr / 11
    set lamp to level percent
    wait 0.05 seconds
`;

for (const device of ['stc12c5a60s2', 'arduino-uno', 'arduino-mega', 'pico', 'stm32f030']) {
  test(`${device}: pwm_set reads back as the percent sentence`, () => {
    const r = SB3Creator.retargetPseudocode(PROGRAM, device);
    assert.equal(r.ok, true, (r.reasons || []).join('; '));
    const c = new SB3Creator();
    c.parse(r.pseudocode);
    const code = c.generateC();
    assert.match(code, /pwm_set\(\d+, level\);/, 'the emitter writes the hardware-PWM call');
    const back = cToPseudocode(code);
    assert.match(back.pseudocode, /^\s*set lamp to level percent$/m);
    assert.deepEqual(back.warnings.filter((w) => /pwm_set/.test(w)), []);
  });
}

test('a channel no declared PWM pin owns is still refused, not guessed', () => {
  const c = new SB3Creator();
  c.parse(PROGRAM);
  const code = c.generateC().replace(/pwm_set\(9, level\);/, 'pwm_set(12, level);');
  const back = cToPseudocode(code);
  assert.ok(back.warnings.some((w) => /pwm_set/.test(w)), 'P1.4 (channel 12) is not declared PWM');
});
