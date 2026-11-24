/**
 * The depletion-mode dual-gate MOSFET and humidity-comb benches from
 * `scripts/gen-lab-circuits-4.mjs --set=mosfet` do what their EXPECTED.md
 * says, measured on the COMMITTED circuit.json with the knobs, switches,
 * buttons and humidity a learner would use.
 *
 * Every number was measured on the headless engine (bw-board r5 branch
 * 2af27386, which adds `dual_gate_mosfet` and `humidity_comb`) when the
 * benches were built; the tolerances are bands around those measurements.
 * The button-volume bench runs an op-amp tone oscillator, so it keeps its simulated time to
 * about 70 ms.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-mosfet.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set mosfet)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

function bench (id) {
    const c = Circuit.fromJSON(JSON.parse(readFileSync(join(EXAMPLES, id, 'circuit.json'), 'utf8')));
    const b = c.board;
    const ids = benchIds(BENCHES[id]);
    let tMs = 0;
    const netOf = (name, term) => {
        const n = b.getNets().find(n => n.terminals.some(x => x.part === ids[name] && x.terminal === term));
        assert.ok(n, `${id}: no net for ${name}.${term}`);
        return n.id;
    };
    const api = {
        b, ids,
        v (name, term) { return b.nodeVoltages.get(netOf(name, term)) ?? 0; },
        mA (name, term) { return Math.abs(b.branchCurrent(ids[name], term)) * 1000; },
        run (ms) {
            tMs += ms;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
        },
        set (name, value) { b.setControl(ids[name], value); },
        state (name) { return b.getDeviceState(ids[name]); },
        /** Peak-to-peak of a node over `ms`, sampled every 0.1 ms. */
        pp (name, term, ms) {
            let lo = Infinity, hi = -Infinity;
            for (let k = 0; k < ms / 0.1; k++) { api.run(0.1); const x = api.v(name, term); lo = Math.min(lo, x); hi = Math.max(hi, x); }
            return hi - lo;
        },
    };
    return api;
}

const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);

describe('lab MOSFET benches behave as documented', { skip: SKIP }, () => {
    test('lab-mosfet-current-source: conducting at zero gate voltage, a near-constant current whatever the battery', () => {
        const x = bench('lab-mosfet-current-source');
        x.run(1);
        near(x.mA('top', 'anode'), 3.79, 0.2, '9 V: LED current (mA)');
        near(x.mA('bot', 'anode'), x.mA('top', 'anode'), 1e-6, 'same current in the drain and the source lead');
        const at = (v) => { x.set('bat', v); x.run(0.5); return x.mA('top', 'anode'); };
        const i45 = at(4.5), i12 = at(12);
        near(i45, 3.40, 0.2, '4.5 V (mA)');
        near(i12, 3.88, 0.2, '12 V (mA)');
        assert.ok(i12 / i45 < 1.2, `the voltage nearly triples, the current rises by under 20 %: ${i45} -> ${i12}`);
        assert.ok(at(3) < 0.05, 'below the two LED drops: dark');
    });

    test('lab-mosfet-vcr: the gate swept from negative to positive takes the LED from dark to full', () => {
        const x = bench('lab-mosfet-vcr');
        x.run(1);
        const vgs = () => x.v('vm', 'a') - x.v('vm', 'b');
        near(vgs(), -0.29, 0.04, 'as loaded: V_G1S');
        near(x.mA('sig', 'anode'), 4.4, 0.4, 'as loaded: LED current (mA)');
        let last = -1;
        const seen = [];
        for (const pos of [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1]) {
            x.set('pot', pos); x.run(0.5);
            const i = x.mA('sig', 'anode');
            assert.ok(i >= last - 1e-6, `brighter as the gate rises: ${i} at ${pos}`);
            last = i; seen.push([vgs(), i]);
        }
        assert.ok(seen[0][0] < -1.5 && seen[0][1] < 0.001, `bottom: gate ${seen[0][0]} V below the source, dark`);
        assert.ok(seen[2][0] < -0.8 && seen[2][1] > 0.2, `already conducting with the gate negative: ${seen[2]}`);
        assert.ok(seen.at(-1)[0] > 1.5 && seen.at(-1)[1] > 9.5, `top: gate positive, full: ${seen.at(-1)}`);
        x.set('pot', 0); x.run(0.5);
        x.set('zero', 1); x.run(0.5);
        near(vgs(), 0, 0.01, 'button: V_G1S = 0');
        near(x.mA('sig', 'anode'), 7.4, 0.5, 'depletion mode: conducting at zero gate voltage (mA)');
    });

    test('lab-dual-gate: either gate pinches the channel, the other then has no effect; gate 2 bites sooner', () => {
        const x = bench('lab-dual-gate');
        x.run(1);
        near(x.mA('sig', 'anode'), 9.4, 0.6, 'both gates high (mA)');
        const with_ = (p1, p2) => { x.set('p1', p1); x.set('p2', p2); x.run(0.5); return x.mA('sig', 'anode'); };
        assert.ok(with_(0, 1) < 0.001, 'gate 1 down: dark');
        assert.ok(with_(1, 0) < 0.001, 'gate 2 down: dark');
        assert.ok(with_(0, 0.5) < 0.001 && with_(0, 1) < 0.001, 'gate 1 pinched: gate 2 has no effect');
        const g1mid = with_(0.5, 1), g2mid = with_(1, 0.5);
        near(g1mid, 7.6, 0.6, 'gate 1 at mid travel (mA)');
        near(g2mid, 5.8, 0.6, 'gate 2 at mid travel (mA)');
        assert.ok(g2mid < g1mid, 'gate 2 controls more strongly');
        with_(1, 1);
        x.set('b1', 1); x.run(0.5);
        assert.ok(x.mA('sig', 'anode') < 0.001, 'button 1 grounds gate 1: dark');
        x.set('b1', 0); x.set('b2', 1); x.run(0.5);
        assert.ok(x.mA('sig', 'anode') < 0.001, 'button 2 grounds gate 2: dark');
        assert.equal(x.state('q').pinchedBy, 'gate2');
    });

    test('lab-mosfet-nand: the LED goes out only with both buttons pressed', () => {
        const x = bench('lab-mosfet-nand');
        x.run(1);
        const truth = {};
        for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
            x.set('a', a); x.set('b', b); x.run(0.5);
            truth[`${a}${b}`] = x.mA('out', 'anode');
        }
        for (const k of ['00', '10', '01']) near(truth[k], 5.36, 0.3, `inputs ${k}: LED lit (mA)`);
        assert.ok(truth['11'] < 0.01, `both pressed: dark (${truth['11']} mA)`);
    });

    test('lab-humidity-comb: dark in room air, lit above about 60 % RH and by breath', () => {
        const x = bench('lab-humidity-comb');
        x.run(1);
        assert.ok(x.mA('sig', 'anode') < 0.001, 'room air: dark');
        near(x.state('comb').humidityPct, 50, 1e-9, 'the bench starts at 50 % RH');
        const at = (rh) => { x.set('comb', rh); x.run(1); return x.mA('sig', 'anode'); };
        assert.ok(at(0.55) < 0.01, '55 %: still dark');
        const sixty = at(0.6);
        assert.ok(sixty > 0.01 && sixty < 1, `60 %: just starting (${sixty} mA)`);
        assert.ok(at(0.7) > 9, '70 %: fully on');
        near(at(0.9), 10.3, 0.8, 'breath: LED current (mA)');
        assert.ok(x.v('q', 'gate1') > 8, 'breath: the gate near the rail');
        assert.ok(at(0.4) < 0.001, 'dry again: dark');
        // The response knob lifts the source: 65 % no longer switches it on.
        assert.ok(at(0.65) > 3, '65 % with the knob at zero: on');
        x.set('set', 0); x.run(0.5);
        assert.ok(at(0.65) < 0.01, '65 % with 1 kΩ under the source: still dark');
        assert.ok(at(0.75) > 1.5, '75 %: on again, dimmer');
    });

    test('lab-hygrometer: the meter reads the comb as a current, scaled by the gain knob', () => {
        const x = bench('lab-hygrometer');
        x.run(1);
        const meter = () => x.v('meter', 'a') - x.v('meter', 'b');
        near(meter(), 0.27, 0.03, 'room air, gain at half (V)');
        const at = (rh) => { x.set('comb', rh); x.run(0.5); return meter(); };
        near(at(0.55), 0.70, 0.07, '55 %');
        near(at(0.6), 1.84, 0.15, '60 %');
        // Conductance x10 per 12 % RH: the reading follows R_f / R_comb.
        near(at(0.62) / at(0.5), 10, 0.5, 'one decade per 12 % RH');
        x.set('gain', 0); x.run(0.5);
        near(at(0.6), 3.37, 0.2, 'full gain, 60 %');
        x.set('gain', 1); x.run(0.5);
        near(at(0.6), 0.31, 0.04, 'lowest gain, 60 %');
        near(at(0.7), 2.09, 0.15, 'lowest gain, 70 %');
    });

    test('lab-button-volume: buttons step the integrator, the channel sets the volume, the capacitor holds it', () => {
        const x = bench('lab-button-volume');
        x.run(3);
        near(x.v('q', 'gate1'), 4.5, 0.1, 'switch-on: integrator at half supply');
        assert.ok(x.pp('q', 'drain', 3) < 0.3, 'switch-on: the conducting channel swallows the tone');
        // Hold "louder" until the gate is below pinch-off.
        x.set('loud', 1); x.run(45); x.set('loud', 0);
        assert.ok(x.v('q', 'gate1') < 0.3, `held louder: gate ${x.v('q', 'gate1')}`);
        const loud = x.pp('q', 'drain', 3);
        assert.ok(loud > 6, `full volume: ${loud} V peak to peak`);
        // Tap "softer": the gate moves up a step and then stays there.
        const g0 = x.v('q', 'gate1');
        x.set('soft', 1); x.run(12); x.set('soft', 0);
        const g1 = x.v('q', 'gate1');
        assert.ok(g1 > g0 + 0.2, `a tap moves the gate: ${g0} -> ${g1}`);
        x.run(6);
        near(x.v('q', 'gate1'), g1, 0.05, 'between taps the capacitor holds the gate');
    });
});
