/**
 * lab-light-remote, the one r6f scenario that costs minutes on its own: 0.6 s
 * of a PWM-driven light link and a motor at 1 ms steps, plus two 24 ms duty
 * samples. In lab-circuits-r6f-2.test.mjs it took that file past the 900 s
 * per-file timeout on CI (run 45824777285); locally it ran past 600 s on a
 * loaded box. The scenario is unchanged; the set's header is
 * test/lab-circuits-r6f.test.mjs.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { r6fGate, loadR6f, bench, near, seen } from './helpers/lab-r6f-bench.mjs';

const gate = r6fGate(3);
const SKIP = gate.skip || false;
await loadR6f(gate);

describe('round-6 r6f benches behave as documented (part 3)', { skip: SKIP }, () => {
    test('lab-light-remote: the duty cycle sets the far LED brightness and the motor speed', () => {
        const avg = (duty) => {
            const x = bench('lab-light-remote', { duty: { position: duty } });
            x.set('tx', 1); x.run(10);
            return x.frac(() => x.across('rxled', 'anode', 'cathode') > 1.5, 14, 0.02);
        };
        const lo = avg(0.1); const hi = avg(0.9);
        near(lo, 0.771, 0.05, 'duty pot at 0.1: share of time the far LED is lit');
        near(hi, 0.38, 0.05, 'duty pot at 0.9: share of time the far LED is lit');
        const m = bench('lab-light-remote', { load: { position: 1 }, duty: { position: 0.1 } });
        m.set('tx', 1); m.run(300);
        const fast = m.state('motor').omega;
        // MEASURED 2026-11-24: motor running > 100 rad/s -> observed 234.
        assert.ok(seen('motor, transmitter on (rad/s)', fast) > 100, `motor runs: ${fast}`);
        m.set('tx', 0); m.run(300);
        near(m.v('a', 'vout'), 0.9, 0.05, 'transmitter off: the receiver drive drops to its lowest level (V)');
        // MEASURED 2026-11-24: 0.3 s after switching off < 0.8 x running -> observed 157 of 234 (coasting down).
        assert.ok(seen('motor, transmitter off (rad/s)', m.state('motor').omega) < 0.8 * fast, 'transmitter off: the motor coasts down');
    });
});
