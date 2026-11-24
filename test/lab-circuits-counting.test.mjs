/**
 * The counting / light-sensing lab benches from scripts/lib/lab-benches-counting.mjs
 * (`node scripts/gen-lab-circuits-4.mjs --set=counting`) do what their
 * EXPECTED.md says — measured on the COMMITTED circuit.json.
 *
 * Light reaches the sensors along `light_path` parts (bw-board src/optics.js):
 * an LED used backwards sees only light of shorter wavelength than its own.
 * The counters are 74HC93 ripple counters, which step on a FALLING clock edge.
 *
 * Every number was measured on the headless engine (bw-board eb3ec0a7) when
 * the bench was built; the bands around them are wide enough for solver noise
 * and narrow enough that a different circuit state cannot pass. Learner edits
 * (a louder sound, another pot setting) are applied to the loaded JSON.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-counting.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (counting)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

/** Load a committed bench, optionally with role params edited first. */
function bench (id, edits = {}) {
    const json = JSON.parse(readFileSync(join(EXAMPLES, id, 'circuit.json'), 'utf8'));
    const ids = benchIds(BENCHES[id]);
    for (const [role, kv] of Object.entries(edits)) {
        const p = json.parts.find(q => q.id === ids[role]);
        assert.ok(p, `${id}: no part ${role}`);
        Object.assign(p.params, kv);
    }
    const c = Circuit.fromJSON(json);
    const b = c.board;
    let tMs = 0;
    const nets = new Map();
    const netOf = (name, term) => {
        const k = `${name}.${term}`;
        if (!nets.has(k)) {
            const n = b.getNets().find(n => n.terminals.some(x => x.part === ids[name] && x.terminal === term));
            assert.ok(n, `${id}: no net for ${k}`);
            nets.set(k, n.id);
        }
        return nets.get(k);
    };
    const api = {
        c, b, ids,
        v (name, term) { return b.nodeVoltages.get(netOf(name, term)) ?? 0; },
        /** Current through a named two-lead part, in mA, sign dropped. */
        mA (name, term = 'a') { return Math.abs(b.branchCurrent(ids[name], term)) * 1e3; },
        run (ms) {
            tMs += ms;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
        },
        set (name, value) { b.setControl(ids[name], value); },
        /** Put a light path's knob at a geometry value (inverse of its knob range). */
        at (name, value) {
            const p = BENCHES[id].parts[name][1];
            b.setControl(ids[name], (value - p.knobMin) / (p.knobMax - p.knobMin));
        },
        /** Counter outputs as a bit string, most significant first. */
        bits (name, terms) { return terms.map(t => (api.v(name, t) > 2.5 ? '1' : '0')).join(''); },
        get t () { return tMs; },
    };
    return api;
}

const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);

describe('lab counting benches behave as documented', { skip: SKIP }, () => {
    test('lab-led-sensor-colours: the IR LED sensor sees red and IR, the red LED sensor only red', () => {
        const x = bench('lab-led-sensor-colours');
        const reading = (sel, red, ir) => {
            x.set('sel', sel); x.set('swr', red); x.set('swi', ir); x.run(1);
            return x.v('vm', 'a');
        };
        near(reading(0, 1, 0), 0.4515, 0.01, 'red sensor, red lamp');
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): reading(0, 0, 1) < 0.01 -> observed 0.0050
        // (the op-amp's output floor: no photocurrent at all).
        assert.ok(reading(0, 0, 1) < 0.01, 'red sensor, IR lamp: blind');
        near(reading(0, 1, 1), 0.4515, 0.01, 'red sensor, both lamps: IR adds nothing');
        near(reading(1, 1, 0), 2.475, 0.03, 'IR sensor, red lamp');
        near(reading(1, 0, 1), 0.565, 0.02, 'IR sensor, IR lamp');
        near(reading(1, 1, 1), 3.040, 0.03, 'IR sensor, both lamps add');
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): reading(1, 0, 0) < 0.01 -> observed 0.0050.
        assert.ok(reading(1, 0, 0) < 0.01, 'IR sensor, dark');
    });

    test('lab-ir-light-meter: the zero pot removes the 1 V offset; then the meter shows the light alone', () => {
        const x = bench('lab-ir-light-meter');
        x.run(1);
        near(x.v('u', '1_out'), 1.848, 0.02, 'first amplifier at 5 cm');
        near(x.v('meter', 'a'), 1.155, 0.02, 'meter, zero pot as authored');
        x.set('sw', 0); x.run(1);
        near(x.v('u', '1_out'), 0.978, 0.01, 'first amplifier in the dark: the offset');
        near(x.v('meter', 'a'), 0.305, 0.02, 'meter in the dark before zeroing');
        // Turn the zero pot up until the meter just reads 0.
        let zeroAt = null;
        for (let p = 0.70; p <= 0.8001; p += 0.002) {
            x.set('zero', p); x.run(1);
            if (x.v('meter', 'a') < 0.006) { zeroAt = p; break; }
        }
        assert.ok(zeroAt !== null, 'the pot reaches zero');
        near(zeroAt, 0.738, 0.01, 'pot position where the dark reading is zero');
        x.set('sw', 1);
        const at = (d) => { x.at('beam', d); x.run(1); return x.v('meter', 'a'); };
        const m5 = at(5), m10 = at(10), m20 = at(20);
        near(m5, 0.847, 0.03, 'zeroed meter at 5 cm');
        near(m10, 0.215, 0.02, 'zeroed meter at 10 cm');
        near(m20, 0.057, 0.01, 'zeroed meter at 20 cm');
        // Close to an inverse square once the offset is gone.
        near(m10 / m20, 3.8, 0.3, '10 cm vs 20 cm');
        near(m5 / m10, 3.94, 0.3, '5 cm vs 10 cm');
    });

    test('lab-ir-remote-toggle: each flash gives one monoflop pulse, and the lamp toggles', () => {
        // A held press of 100 ms, then a short one: about 0.3 s of RC timing.
        const x = bench('lab-ir-remote-toggle');
        x.run(60); // the monoflop's own power-on pulse (33 ms) is over
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): x.v('u', '1_out') > 3 -> observed 3.50.
        assert.ok(x.v('u', '1_out') > 3, 'monoflop at rest: output high');
        assert.equal(x.v('cnt', 'qa') < 1 && x.mA('rl') < 0.1, true, 'lamp off at first');
        // A long press (100 ms): one pulse only.
        x.set('btn', 1);
        let fell = null, rose = null, pulses = 0, prev = x.v('u', '1_out');
        for (let k = 0; k < 50; k++) {
            x.run(2);
            const o = x.v('u', '1_out');
            if (prev > 2.5 && o <= 2.5) { pulses++; if (fell === null) fell = x.t; }
            if (fell !== null && rose === null && o > 2.5) rose = x.t;
            prev = o;
        }
        near(x.v('qa', 'collector'), 0.09, 0.05, 'receiver pulled low while the IR shines');
        assert.equal(pulses, 1, 'one pulse for one held press');
        near(rose - fell, 40, 6, 'monoflop pulse length (ms)');
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): x.v('cnt', 'qa') > 4.5 -> observed 4.95.
        assert.ok(x.v('cnt', 'qa') > 4.5, 'toggle stage on');
        near(x.mA('rl'), 13.1, 0.5, 'relay closed: lamp current');
        x.set('btn', 0); x.run(60);
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): x.mA('rl') > 12 -> observed 13.12.
        assert.ok(x.mA('rl') > 12, 'stays on after release');
        // A short flash switches it off again.
        x.set('btn', 1); x.run(20); x.set('btn', 0); x.run(60);
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): x.v('cnt', 'qa') < 0.5 -> observed 0.00.
        assert.ok(x.v('cnt', 'qa') < 0.5, 'toggle stage off');
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): x.mA('rl') < 0.1 -> observed 0.00.
        assert.ok(x.mA('rl') < 0.1, 'relay open: lamp off');
    });

    test('lab-ir-remote-toggle: out of range at 1 m, the receiver does not react', () => {
        const near50 = bench('lab-ir-remote-toggle');
        near50.at('air', 50); near50.set('btn', 1); near50.run(2);
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): near50.v('qa', 'collector') < 0.5 -> observed 0.14.
        assert.ok(near50.v('qa', 'collector') < 0.5, `50 cm still switches: ${near50.v('qa', 'collector')}`);
        const far = bench('lab-ir-remote-toggle');
        far.at('air', 100); far.set('btn', 1); far.run(2);
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): far.v('qa', 'collector') > 4.9 -> observed 5.00.
        assert.ok(far.v('qa', 'collector') > 4.9, `1 m: too little light: ${far.v('qa', 'collector')}`);
    });

    test('lab-octave-divider: seven stages, each at half the frequency of the one before', () => {
        const x = bench('lab-octave-divider');
        const sig = [['osc', 'output'], ['c1', 'qa'], ['c1', 'qb'], ['c1', 'qc'], ['c1', 'qd'],
            ['c2', 'qa'], ['c2', 'qb'], ['c2', 'qc']];
        const rises = sig.map(() => []), falls = sig.map(() => []), prev = sig.map(() => 0);
        const dt = 0.02;
        for (let k = 0; k < Math.round(31 / dt); k++) {
            x.run(dt);
            sig.forEach(([p, t], i) => {
                const v = x.v(p, t);
                if (prev[i] < 2.5 && v >= 2.5) rises[i].push(x.t);
                if (prev[i] >= 2.5 && v < 2.5) falls[i].push(x.t);
                prev[i] = v;
            });
        }
        // The oscillator, from its steady periods (the first one is longer).
        const r0 = rises[0].slice(1);
        const f = 1000 * (r0.length - 1) / (r0.at(-1) - r0[0]);
        near(f, 4442, 40, 'oscillator (Hz)');
        // Stages 1..6 rise at least twice in 31 ms: their period is the mean
        // spacing of their rises. Stage 7 first rises after 64 clocks and
        // first falls after 128: that gap is half its period.
        for (let k = 1; k <= 7; k++) {
            const r = rises[k];
            const periodMs = r.length >= 2 ? (r.at(-1) - r[0]) / (r.length - 1) : 2 * (falls[k][0] - r[0]);
            const fk = 1000 / periodMs;
            near(fk / (f / 2 ** k), 1, 0.01, `stage ${k}: ${fk.toFixed(1)} Hz vs f/${2 ** k}`);
        }
        const ear = x.b.buzzerTone(x.ids.ear);
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): ear.on -> observed true.
        assert.ok(ear.on, 'the earphone sounds');
    });

    test('lab-barrier-counter: every interruption counts; at 6 the relay pulls in and the count stops', () => {
        const x = bench('lab-barrier-counter');
        const count = () => x.bits('cnt', ['qc', 'qb', 'qa']);
        x.run(1);
        near(x.v('pt', 'emitter'), 4.85, 0.05, 'beam clear: follower high');
        assert.equal(count(), '000');
        const seen = [];
        for (let n = 1; n <= 8; n++) {
            x.at('beam', 1); x.run(20);
            near(x.v('pt', 'emitter'), 0, 0.05, `interruption ${n}: follower low`);
            x.at('beam', 0); x.run(20);
            seen.push(count());
        }
        assert.deepEqual(seen, ['001', '010', '011', '100', '101', '110', '110', '110'], 'counts to 6, then holds');
        near(x.mA('k', 'coil_a'), 24.4, 0.5, 'relay coil current');
        near(x.mA('rl'), 13.1, 0.5, 'lamp through the second pole');
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): x.v('cnt', 'clk_a') < 0.1 -> observed 0.00.
        assert.ok(x.v('cnt', 'clk_a') < 0.1, 'first pole has cut the clock');
        x.set('clr', 1); x.run(10); x.set('clr', 0); x.run(20);
        assert.equal(count(), '000', 'cleared');
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): x.mA('k', 'coil_a') < 0.1 -> observed 0.0.
        assert.ok(x.mA('k', 'coil_a') < 0.1, 'relay dropped out');
        // A half-blocked beam is not an interruption; four fifths is.
        x.at('beam', 0.5); x.run(10); x.at('beam', 0); x.run(10);
        assert.equal(count(), '000', 'half blocked: not counted');
        x.at('beam', 0.8); x.run(10); x.at('beam', 0); x.run(10);
        assert.equal(count(), '001', 'four fifths blocked: counted');
    });

    test('lab-loud-counter: a loud tone clocks the counter, a quiet one or a low setting does not', () => {
        const run = (edits) => {
            const x = bench('lab-loud-counter', edits);
            let edges = 0, prev = x.v('u', '1_out'), hi = -1;
            for (let k = 0; k < 160; k++) {
                x.run(0.25);
                const o = x.v('u', '1_out');
                if (prev > 2.5 && o <= 2.5) edges++;
                hi = Math.max(hi, o);
                prev = o;
            }
            return { edges, hi, count: parseInt(x.bits('cnt', ['qd', 'qc', 'qb', 'qa']), 2), rest: x.v('sens', 'wiper') };
        };
        const loud = run({});
        near(loud.rest, 2.0, 0.02, 'output rests at the pot voltage');
        near(loud.hi, 2.89, 0.08, 'peak of the amplified 90 dB tone');
        // 200 Hz for 40 ms: eight clock edges, and the counter has them all.
        near(loud.edges, 8, 1, 'clock edges in 40 ms');
        assert.equal(loud.count, loud.edges % 16, 'the counter counted every edge');
        const quiet = run({ mic: { soundDb: 80 } });
        assert.equal(quiet.edges, 0, '80 dB: below the threshold');
        near(quiet.hi - quiet.rest, 0.28, 0.05, '80 dB: swing above rest');
        assert.equal(quiet.count, 0);
        const low = run({ sens: { position: 0.5 } });
        near(low.rest, 1.25, 0.02, 'pot at half: rest 1.25 V');
        assert.equal(low.edges, 0, '90 dB with the pot at half: not counted');
    });
});
