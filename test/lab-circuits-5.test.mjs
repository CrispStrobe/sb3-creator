/**
 * The discrete regenerative lab-* benches from scripts/lib/lab-benches-5.mjs
 * (`node scripts/gen-lab-circuits-4.mjs --set=5`) do what their EXPECTED.md
 * says — measured on the COMMITTED circuit.json, over time.
 *
 * Every one of these is about time: an astable's period, a latch that holds
 * after the gate is released, a toggle that flips on each press, a one-shot
 * that runs out. assert-physics reads one instant (1 ms), so each bench gets
 * a scenario here. The numbers were measured on the headless engine when the
 * bench was built; the bands around them are wide enough for solver noise and
 * narrow enough that a different circuit state cannot pass.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-5.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the discrete regenerative lab bench scenarios');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

/** Load a committed bench and name its parts by role. */
function bench(id) {
    const c = Circuit.fromJSON(JSON.parse(readFileSync(join(EXAMPLES, id, 'circuit.json'), 'utf8')));
    const b = c.board;
    const ids = benchIds(BENCHES[id]);
    let tMs = 0;
    const api = {
        c, b, ids,
        /** Node voltage at a named terminal. */
        v(name, term) {
            const n = b.getNets().find(n => n.terminals.some(x => x.part === ids[name] && x.terminal === term));
            assert.ok(n, `${id}: no net for ${name}.${term}`);
            return b.nodeVoltages.get(n.id) ?? 0;
        },
        /** Current through a named two-lead part, in mA, sign dropped. */
        mA(name, term = 'a') { return Math.abs(b.branchCurrent(ids[name], term)) * 1e3; },
        run(ms) {
            tMs += ms;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
        },
        set(name, value) { b.setControl(ids[name], value); },
        /**
         * Rising crossings of `fn` through `level`, sampled every `dt` ms for
         * `total` ms — the times at which they happened.
         */
        rises(fn, level, total, dt) {
            const out = [];
            let prev = fn();
            for (let k = 0; k < Math.round(total / dt); k++) {
                api.run(dt);
                const now = fn();
                if (prev < level && now >= level) out.push(tMs);
                prev = now;
            }
            return out;
        },
        get t() { return tMs; },
    };
    return api;
}

/** Mean spacing of a list of event times. */
const period = (e) => (e.at(-1) - e[0]) / (e.length - 1);
const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(3)}, expected ${want} +-${tol}`);

describe('discrete regenerative lab benches behave as documented', { skip: SKIP }, () => {
    test('lab-astable-blinker: the LEDs take turns, and the rheostat sets one half', () => {
        const x = bench('lab-astable-blinker');
        let both = 0, red = 0, n = 0;
        const e = x.rises(() => {
            const r = x.mA('rc1'), g = x.mA('rc2');
            if (x.t > 400) { n++; if (r > 3) red++; if (r > 3 && g > 3) both++; }
            return r;
        }, 3, 3000, 10);
        // MEASURED 2026-11-23 (bw-board e339fcb): e.length >= 4 -> observed 4.
        assert.ok(e.length >= 4, `${e.length} red flashes in 3 s`);
        near(period(e), 715, 40, 'period at the authored rheostat setting (ms)');
        near(red / n, 0.5, 0.06, 'share of the time red is lit');
        // MEASURED 2026-11-23 (bw-board e339fcb): both / n < 0.05 -> observed 0.01923.
        assert.ok(both / n < 0.05, `both LEDs lit at once ${(both / n * 100).toFixed(1)} % of the time`);
        x.set('pot', 1);                                   // rheostat at zero: only the 10 k minimum
        const f = x.rises(() => x.mA('rc1'), 3, 2500, 10).slice(1);
        near(period(f), 473, 40, 'period with the rheostat turned to its minimum (ms)');
    });

    test('lab-astable-tone: silent until keyed, a tone while keyed, a metronome on the big capacitors', () => {
        const x = bench('lab-astable-tone');
        x.run(10);
        // MEASURED 2026-11-23 (bw-board e339fcb): x.v('q2', 'collector') < 0.1 -> observed 0.007156.
        assert.ok(x.v('q2', 'collector') < 0.1, 'key up: the oscillator has no supply');
        x.set('key', 1);
        x.run(5);
        const e = x.rises(() => x.v('q2', 'collector'), 4.5, 6, 0.01);
        // MEASURED 2026-11-23 (bw-board e339fcb): e.length >= 6 -> observed 9.
        assert.ok(e.length >= 6, `${e.length} cycles in 6 ms`);
        near(1000 / period(e), 1466, 80, 'tone frequency (Hz)');
        x.set('key', 0);
        x.run(5);
        assert.equal(x.rises(() => x.v('q2', 'collector'), 4.5, 3, 0.01).length, 0, 'key released: no more cycles');
        x.set('s1', 1); x.set('s2', 1); x.set('key', 1);
        const m = x.rises(() => x.v('q2', 'collector'), 4.5, 2000, 10).slice(1);
        // MEASURED 2026-11-23 (bw-board e339fcb): m.length >= 4 -> observed 6.
        assert.ok(m.length >= 4, `${m.length} metronome beats in 2 s`);
        near(period(m), 321, 20, 'metronome period on the 4.7 µF electrolytics (ms)');
    });

    test('lab-scr-pair: a gate pulse latches the load on, only breaking the current resets it', () => {
        const x = bench('lab-scr-pair');
        x.run(10);
        // MEASURED 2026-11-23 (bw-board e339fcb): x.mA('rl') < 0.01 -> observed 9.02e-12.
        assert.ok(x.mA('rl') < 0.01, 'idle: off');
        x.set('gate', 1); x.run(1); x.set('gate', 0); x.run(100);
        near(x.mA('rl'), 6.47, 0.3, 'after a 1 ms gate pulse the LED carries (mA)');
        near(x.v('qp', 'emitter'), 0.76, 0.1, 'anode voltage while latched');
        x.run(1000);
        near(x.mA('rl'), 6.47, 0.3, 'one second later, still latched (mA)');
        x.set('main', 0); x.run(50);
        x.set('main', 1); x.run(100);
        // MEASURED 2026-11-23 (bw-board e339fcb): x.mA('rl') < 0.01 -> observed 9.02e-12.
        assert.ok(x.mA('rl') < 0.01, `main switch off and on again: ${x.mA('rl').toFixed(3)} mA`);
        x.set('gate', 1); x.run(20); x.set('gate', 0); x.run(100);
        near(x.mA('rl'), 6.47, 0.3, 'fires again on the next gate pulse (mA)');
    });

    test('lab-toggle-flip-flop: each press flips the LEDs, a too-quick second press is ignored', () => {
        const x = bench('lab-toggle-flip-flop');
        const state = () => (x.mA('rc1') > 3 && x.mA('rc2') < 0.5 ? 'red'
            : x.mA('rc2') > 3 && x.mA('rc1') < 0.5 ? 'green' : 'neither');
        const press = (btn) => { x.set(btn, 1); x.run(50); x.set(btn, 0); };
        x.run(3000);
        assert.equal(state(), 'green', 'power-on');
        near(x.mA('rc2'), 6.84, 0.2, 'green LED current (mA)');
        press('b1'); x.run(2500); assert.equal(state(), 'red', 'first press');
        near(x.mA('rc1'), 7.13, 0.2, 'red LED current (mA)');
        press('b1'); x.run(2500); assert.equal(state(), 'green', 'second press');
        press('b2'); x.run(2500); assert.equal(state(), 'red', 'the second button does the same');
        press('b1'); x.run(100); assert.equal(state(), 'green', 'switched off');
        press('b1'); x.run(200); assert.equal(state(), 'green', 'pressed again 0.1 s later: the capacitor is not recharged, nothing happens');
        x.run(2000);
        press('b1'); x.run(200); assert.equal(state(), 'red', 'two seconds later it works again');
        x.set('b1', 1); x.run(3000);
        assert.equal(state(), 'green', 'held for 3 s: flips once and stays');
        x.set('b1', 0); x.run(500);
        assert.equal(state(), 'green', 'released: unchanged');
    });

    test('lab-pnp-npn-relax: a sawtooth with a flash, faster with less resistance, silent on a weak battery', () => {
        const x = bench('lab-pnp-npn-relax');
        let lo = Infinity, hi = 0, peak = 0;
        const drops = [];
        let prev = x.v('ct', 'pos');
        for (let k = 0; k < 1500; k++) {
            x.run(2);
            const v = x.v('ct', 'pos');
            if (v < prev - 0.3 && !(drops.length && x.t - drops.at(-1) < 20)) drops.push(x.t);
            prev = v;
            peak = Math.max(peak, x.mA('rs'));
            if (x.t > 1000) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
        }
        // MEASURED 2026-11-23 (bw-board e339fcb): drops.length >= 3 -> observed 4.
        assert.ok(drops.length >= 3, `${drops.length} discharges in 3 s`);
        near(period(drops), 668, 40, 'period at the authored rheostat setting (ms)');
        near(hi, 6.86, 0.15, 'capacitor voltage when the pair fires');
        near(lo, 2.72, 0.2, 'capacitor voltage when it lets go');
        // MEASURED 2026-11-23 (bw-board e339fcb): peak > 40 -> observed 60.
        assert.ok(peak > 40, `the discharge flashes the LED: peak ${peak.toFixed(1)} mA`);
        x.set('pot', 1);
        x.run(500);
        const fast = [];
        prev = x.v('ct', 'pos');
        for (let k = 0; k < 500; k++) {
            x.run(2);
            const v = x.v('ct', 'pos');
            if (v < prev - 0.3 && !(fast.length && x.t - fast.at(-1) < 20)) fast.push(x.t);
            prev = v;
        }
        near(period(fast), 112, 15, 'period with only the 22 k minimum (ms)');
        x.set('pot', 0.5);
        x.set('bat', 4.5);
        x.run(2000);
        const v0 = x.v('ct', 'pos');
        let still = 0;
        for (let k = 0; k < 150; k++) { x.run(20); still = Math.max(still, Math.abs(x.v('ct', 'pos') - v0)); }
        // MEASURED 2026-11-23 (bw-board e339fcb): still < 0.05 -> observed 1.33e-15.
        assert.ok(still < 0.05, `on 4.5 V the capacitor stops at ${v0.toFixed(2)} V and moves only ${still.toFixed(3)} V: no more flashes`);
    });

    test('lab-siren-blinker: the pitch follows the lamps', () => {
        const x = bench('lab-siren-blinker');
        const hz = () => 1000 / period(x.rises(() => x.v('u', 'output'), 4.5, 25, 0.05));
        x.run(50);
        // MEASURED 2026-11-23 (bw-board e339fcb): x.mA('rc2') > 10 -> observed 13.98;
        //   x.mA('rc1') < 0.5 -> observed 2.93e-4.
        assert.ok(x.mA('rc2') > 10 && x.mA('rc1') < 0.5, 'green phase first');
        near(hz(), 419, 15, 'pitch while green is lit (Hz)');
        x.run(100);
        // MEASURED 2026-11-23 (bw-board e339fcb): x.mA('rc1') > 10 -> observed 14.87;
        //   x.mA('rc2') < 0.5 -> observed 7.30e-4.
        assert.ok(x.mA('rc1') > 10 && x.mA('rc2') < 0.5, `then red: red ${x.mA('rc1').toFixed(2)} mA, green ${x.mA('rc2').toFixed(2)} mA`);
        near(x.v('u', 'control'), 6.0, 0.05, 'control voltage with the diode blocking');
        near(hz(), 309, 12, 'pitch while red is lit (Hz)');
        x.run(150);
        // MEASURED 2026-11-23 (bw-board e339fcb): x.mA('rc2') > 10 -> observed 13.97.
        assert.ok(x.mA('rc2') > 10, 'green again');
        near(x.v('u', 'control'), 3.99, 0.1, 'control voltage pulled down through the diode');
        near(hz(), 419, 15, 'and the high pitch is back (Hz)');
    });

    test('lab-discrete-monostable: green for about four seconds after release, then red', () => {
        const x = bench('lab-discrete-monostable');
        x.run(10);
        // MEASURED 2026-11-23 (bw-board e339fcb): x.mA('rc2') > 4 -> observed 5.109;
        //   x.mA('rc1') < 0.5 -> observed 0.1023.
        assert.ok(x.mA('rc2') > 4 && x.mA('rc1') < 0.5, 'power-on: the empty capacitor starts a green period');
        x.run(8000);
        near(x.mA('rc1'), 5.31, 0.2, 'resting: red (mA)');
        // MEASURED 2026-11-23 (bw-board e339fcb): x.mA('rc2') < 0.05 -> observed 1.64e-5.
        assert.ok(x.mA('rc2') < 0.05, 'resting: green dark');
        for (const hold of [200, 3000]) {
            x.set('go', 1); x.run(hold);
            // MEASURED 2026-11-23 (bw-board e339fcb): x.mA('rc2') > 4 -> observed 5.109..5.109 over 2 checks.
            assert.ok(x.mA('rc2') > 4, `held ${hold} ms: green`);
            x.set('go', 0);
            const t0 = x.t;
            let flip = null;
            while (x.t - t0 < 8000 && flip === null) { x.run(20); if (x.mA('rc1') > x.mA('rc2')) flip = x.t - t0; }
            assert.ok(flip !== null, `held ${hold} ms: red never came back`);
            near(flip, 4300, 250, `held ${hold} ms: green time counted from the release (ms)`);
            x.run(100);
            // MEASURED 2026-11-23 (bw-board e339fcb): x.mA('rc1') > 5 -> observed 5.331..5.331 over 2 checks;
            //   x.mA('rc2') < 0.05 -> observed 1.22e-5..1.22e-5 over 2 checks.
            assert.ok(x.mA('rc1') > 5 && x.mA('rc2') < 0.05, 'and it switches cleanly');
        }
    });
});
