/**
 * The depletion-mode dual-gate MOSFET and humidity-comb benches from
 * `scripts/gen-lab-circuits-4.mjs --set=mosfet` do what their EXPECTED.md
 * says, measured on the COMMITTED circuit.json with the knobs, switches,
 * buttons and humidity a learner would use.
 *
 * Every number was measured on the headless engine (bw-board r5 branch
 * 2af27386, which adds `dual_gate_mosfet` and `humidity_comb`) when the
 * benches were built; the tolerances are bands around those measurements.
 * The button-volume bench runs a 555 tone, so it keeps its simulated time to
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
    test('lab-mosfet-vcr: the gate voltage sets the channel resistance; zero gate voltage conducts', () => {
        const x = bench('lab-mosfet-vcr');
        x.run(1);
        const meter = () => x.v('vm', 'a') - x.v('vm', 'b');
        const channel = () => 4700 * meter() / (9 - x.v('q', 'source') - meter());
        // As loaded (knob 0.5): gate 0.83 V below the source, ~3.9 V across a ~5 kΩ channel.
        near(meter(), 3.90, 0.15, 'mid travel');
        near(channel() / 1000, 5.3, 0.6, 'channel kΩ at mid travel');
        // A sweep: pinched at the bottom, then monotonically less resistance.
        let last = Infinity;
        for (const pos of [0, 0.2, 0.4, 0.5, 0.6, 0.8, 1]) {
            x.set('pot', pos); x.run(0.5);
            assert.ok(meter() <= last + 1e-6, `falls monotonically: ${meter()} at ${pos}`);
            last = meter();
        }
        x.set('pot', 0); x.run(0.5);
        near(meter(), 7.35, 0.1, 'pinched: the whole rest of the supply');
        assert.equal(x.state('q').pinchedBy, 'gate1');
        x.set('pot', 1); x.run(0.5);
        near(channel(), 100, 15, 'zero gate voltage: about 100 Ω');
        // The button: gate on the source, from the pinched position.
        x.set('pot', 0); x.run(0.5);
        x.set('zero', 1); x.run(0.5);
        near(x.state('q').vg1s, 0, 0.01, 'V_G1S with the button');
        near(meter(), 0.15, 0.03, 'depletion mode: conducting at zero gate voltage');
    });

    test('lab-dual-gate: either gate pinches the channel; the LED is lit only with both gates high', () => {
        const x = bench('lab-dual-gate');
        x.run(1);
        const truth = {};
        for (const [p1, p2] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
            x.set('s1', p1); x.set('s2', p2); x.run(1);
            truth[`${p1}${p2}`] = x.mA('sig', 'anode');
        }
        near(truth['00'], 10.3, 0.8, 'both gates high: green LED current (mA)');
        for (const k of ['10', '01', '11']) assert.ok(truth[k] < 0.01, `gates ${k}: dark (${truth[k]} mA)`);
        x.set('s1', 1); x.set('s2', 0); x.run(1);
        assert.equal(x.state('q').pinchedBy, 'gate1');
        x.set('s1', 0); x.set('s2', 1); x.run(1);
        assert.equal(x.state('q').pinchedBy, 'gate2');
        // The source stays lifted on its reference LED either way.
        near(x.v('q', 'source'), 1.65, 0.1, 'source on the reference LED, channel off');
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
