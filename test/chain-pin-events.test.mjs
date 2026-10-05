// `WHEN <pin> pressed:` -- the pin-change event hat -- on every board.
//
// The hat was lowered for the 8051 alone: its poll read the SFR spelled out
// (`P${port}_${bit}`), so on every other core it compiled to
// `Pundefined_undefined` and no press ever ran the script (found 2026-10-05).
// It now reads through cPinRead, the core's own input path with polarity.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { chainSkip, runOn } from './helpers/mcu-chain.mjs';

const PINS = {
    stc12c5a60s2: ['P3.2', 'P1.0'], stc15f2k60s2: ['P3.2', 'P1.0'], stc89c52rc: ['P3.2', 'P1.0'],
    'arduino-uno': ['D2', 'D13'], 'arduino-nano': ['D2', 'D13'], atmega168p: ['D2', 'D13'],
    'arduino-mega': ['D2', 'D13'], attiny88: ['PD2', 'PB5'], attiny85: ['PB2', 'PB0'],
    pico: ['GP15', 'GP25'], stm32f030: ['PA1', 'PA0'],
};

describe('chain pin events: WHEN button pressed runs once per press', () => {
    for (const [device, [btn, led]] of Object.entries(PINS)) {
        test(device, { skip: chainSkip(device) || false, timeout: 300000 }, async () => {
            const r = await runOn(`DEVICE ${device.toUpperCase()}
PIN button = ${btn} INPUT ACTIVE LOW
PIN led = ${led} OUTPUT

WHEN button pressed:
  toggle led
`, device);
            const sw = r.board.parts.find((p) => p.kind === 'button');
            assert.ok(sw, `${device}: the bench has a button`);
            r.run(50);
            const ledPin = r.pinOf('led');
            const toggles = () => r.edges(ledPin, 0, Infinity);
            const before = toggles();
            for (let i = 0; i < 3; i++) {
                r.board.setControl(sw.id, 1);
                r.run(60);            // held: the body runs once, not every tick
                r.board.setControl(sw.id, 0);
                r.run(60);
            }
            assert.equal(toggles() - before, 3, `${device}: three presses, ${toggles() - before} toggles`);
        });
    }
});
