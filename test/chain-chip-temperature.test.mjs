// `chip temperature` reads the chip's own on-die sensor, in whole degrees C:
// ATmega328P/168P (ADC MUX 1000 at 1.1 V), ATtiny85 (ADC4 at 1.1 V) and
// ATtiny88 (ADC8 at 1.1 V, since 2026-10-06), both printing over their
// software UART, RP2040 (ADC input 4), STM32F030
// (channel 16 with TSEN). The C converts with each datasheet's typical curve;
// bw-board's emulators read the same curve at the bench temperature
// (board.setTemperature), so the program reads the bench back exactly. The
// chips without a sensor -- the 8051 parts and the Mega2560 -- refuse it by
// name.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import { chainSkip, runOn } from './helpers/mcu-chain.mjs';

const SRC = `DEVICE ARDUINO-UNO
PIN led = D13 OUTPUT

WHEN flag clicked:
  print chip temperature
  wait 1 seconds
  print chip temperature
  wait 1 seconds
  print chip temperature
`;

describe('chain chip temperature: the bench, read back by the chip', () => {
    for (const device of ['arduino-uno', 'arduino-nano', 'atmega168p', 'attiny85', 'attiny88', 'pico', 'stm32f030']) {
        test(device, { skip: chainSkip(device) || false, timeout: 300000 }, async () => {
            const r0 = device === 'arduino-uno' ? { ok: true, pseudocode: SRC } : SB3Creator.retargetPseudocode(SRC, device);
            assert.equal(r0.ok, true, (r0.reasons || []).join('; '));
            const r = await runOn(r0.pseudocode, device);
            assert.match(r.code, /static long bw_chip_temp\(void\)/);
            r.board.setTemperature(25);
            r.run(500);
            r.board.setTemperature(60);
            r.run(1000);
            r.board.setTemperature(-10);
            r.run(1000);
            assert.deepEqual(r.serial.trim().split('\r\n'), ['25', '60', '-10'], `${device}: ${JSON.stringify(r.serial)}`);
        });
    }
});

test('a chip without a sensor refuses chip temperature by name', () => {
    for (const device of ['stc12c5a60s2', 'stc89c52rc', 'arduino-mega']) {
        const r = SB3Creator.retargetPseudocode(SRC, device);
        assert.equal(r.ok, false, device);
        assert.ok(r.reasons.some((w) => /chip temperature needs an on-die sensor/.test(w)), `${device}: ${r.reasons.join('; ')}`);
    }
});

test('the referee reads the bench temperature it is given', async () => {
    const { interpretTrace } = await import('../src/utils/traceOracle.js');
    const c = new SB3Creator();
    c.parse(SRC);
    assert.deepEqual(interpretTrace(c.project, { horizonMs: 3000 }).serial.map((s) => s.line), ['25', '25', '25']);
    assert.deepEqual(interpretTrace(c.project, { horizonMs: 3000, chipTemperatureC: 41.6 }).serial.map((s) => s.line), ['42', '42', '42']);
});

test('chip temperature round-trips through the C reader and the decompiler', async () => {
    const { default: cToPseudocode } = await import('../src/utils/cToPseudocode.js');
    const c = new SB3Creator();
    c.parse(SRC);
    const g = c.generateC();
    const back = cToPseudocode(typeof g === 'string' ? g : g.code);
    const text = typeof back === 'string' ? back : back.pseudocode || back.text;
    assert.match(text, /print chip temperature/);
});
