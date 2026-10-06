// The ATtinys' ADC pins and the ATtiny85's PWM, run on the emulated chips.
//
// Until 2026-10-06 neither worked from a program: the AVR emitter took the
// ADC channel from an A-number, so a tiny88 `PIN pot = PC0 ANALOG` compiled
// to `adc_read(NaN)` (41 gallery programs retargeted "ok" and did not
// compile), the parser refused the tiny85's own ADC pins (PB2/PB3/PB4), and
// PWM on the tiny85 emitted the Uno's Timer 2 (`TCCR2A`, `DDRD`) for pins
// Timer 0 -- the millisecond tick -- owns. The tiny85's PWM is Timer 1's
// OC1A/OC1B (PB1/PB4); the tiny88 has none to spare.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import { chainSkip, runOn } from './helpers/mcu-chain.mjs';

const ADC_PINS = [['attiny85', 'PB2'], ['attiny85', 'PB3'], ['attiny85', 'PB4'],
    ['attiny88', 'PC0'], ['attiny88', 'PC5']];

describe('chain attiny adc: every ADC pin reads its own voltage', () => {
    for (const [device, pin] of ADC_PINS) {
        test(`${device} ${pin}`, { skip: chainSkip(device) || false, timeout: 300000 }, async () => {
            const r = await runOn(`DEVICE ${device.toUpperCase()}
PIN pot = ${pin} ANALOG

WHEN flag clicked:
  FOREVER:
    print read pot
    wait 0.02 seconds
`, device);
            // Drive this pin alone; another channel would read 0 V.
            let volts = 1.0;
            const bench = r.board.readAnalog ? r.board.readAnalog.bind(r.board) : () => 0;
            r.board.readAnalog = (name) => (String(name).toLowerCase() === pin.toLowerCase() ? volts : bench(name));
            const last = () => Number(r.serial.trim().split('\r\n').pop());
            r.run(100);
            const low = last();
            volts = 2.5;
            r.run(100);
            // 10 bits against the 5 V supply: 1.0 V -> 205, 2.5 V -> 512.
            // MEASURED 2026-10-06: exactly 205 and 512 on every pin here.
            assert.equal(low, 205, `${device} ${pin} at 1.0 V`);
            assert.equal(last(), 512, `${device} ${pin} at 2.5 V`);
        });
    }
});

describe('chain attiny85 pwm: Timer 1 drives PB1 and PB4', () => {
    for (const pin of ['PB1', 'PB4']) {
        test(pin, { skip: chainSkip('attiny85') || false, timeout: 300000 }, async () => {
            const r = await runOn(`DEVICE ATTINY85
PIN led = ${pin} PWM

WHEN flag clicked:
  set led to 25 percent
  wait 1 seconds
`, 'attiny85');
            r.run(100);
            const edges = r.events.filter((e) => e.pin === pin.toLowerCase() && e.tNs > 50e6);
            let high = 0;
            for (let i = 1; i < edges.length; i++) if (edges[i - 1].high) high += edges[i].tNs - edges[i - 1].tNs;
            const span = edges[edges.length - 1].tNs - edges[0].tNs;
            // MEASURED 2026-10-06: 98 edges in those 50 ms.
            assert.ok(edges.length > 20, `${pin} toggles under PWM (${edges.length} edges)`);
            // 8 MHz / 32 / 256 = 977 Hz: a 1024 us period (2586Q section 12.2.2,
            // f = f_TCK1 / (OCR1C + 1)). MEASURED 2026-10-06 on both pins: 1024.00 us
            // and duty 0.2539 with bw-board on the CrispStrobe/avr8js fork; avr8js
            // 0.21.0 counted up and down and showed 2040 us.
            const rises = edges.filter((e) => e.high).map((e) => e.tNs);
            const period = (rises[rises.length - 1] - rises[0]) / (rises.length - 1) / 1000;
            assert.ok(Math.abs(period - 1024) < 2, `${pin} period ${period.toFixed(1)} us, expected ~1024`);
            assert.ok(Math.abs(high / span - 0.25) < 0.02, `${pin} duty ${(high / span).toFixed(3)}, expected ~0.25`);
        });
    }
});

test('the ATtinys refuse the PWM and servo they cannot drive, with the reason', () => {
    assert.throws(() => new SB3Creator().parse('DEVICE ATTINY85\nPIN led = PB0 PWM\n\nWHEN flag clicked:\n  set led to 50 percent\n'),
        (e) => e.lines.some((l) => /PB1 or PB4/.test(l.reason)));
    assert.throws(() => new SB3Creator().parse('DEVICE ATTINY88\nPIN led = PB1 PWM\n\nWHEN flag clicked:\n  set led to 50 percent\n'),
        (e) => e.lines.some((l) => /no PWM here/.test(l.reason)));
    const servo = 'DEVICE STC12C5A60S2\nPIN servo = P1.1 OUTPUT\nPART arm = SERVO 1\n\nWHEN flag clicked:\n  set arm angle to 90\n';
    for (const device of ['attiny85', 'attiny88']) {
        const rt = SB3Creator.retargetPseudocode(servo, device);
        assert.equal(rt.ok, false, device);
        assert.ok(rt.reasons.some((x) => /servo needs a 16-bit timer/.test(x)), `${device}: ${rt.reasons.join('; ')}`);
    }
});
