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
 * (another signal level, another pot setting) are applied to the loaded JSON.
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
        led (name) { return b.ledBrightness(ids[name]); },
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

    test('lab-phototransistor-or-ir-led: only the phototransistor lights its indicator', () => {
        const x = bench('lab-phototransistor-or-ir-led');
        x.run(1);
        near(x.mA('ra'), 2.82, 0.1, 'phototransistor branch (mA)');
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): x.mA('rb') < 0.05 -> observed 0.015.
        assert.ok(x.mA('rb') < 0.05, `IR LED branch: microamps only (${x.mA('rb').toFixed(4)} mA)`);
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): x.led('la') > 0.1 -> observed 0.141.
        assert.ok(x.led('la') > 0.1, 'indicator A glows');
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): x.led('lb') < 0.005 -> observed 0.0008.
        assert.ok(x.led('lb') < 0.005, 'indicator B stays dark');
        x.at('toA', 10); x.run(1);
        near(x.mA('ra'), 0.116, 0.02, 'phototransistor at 10 cm: much less');
        x.at('toA', 2); x.set('sw', 0); x.run(1);
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): x.mA('ra') < 0.001 -> observed 0.0000.
        assert.ok(x.mA('ra') < 0.001, 'lamp off: phototransistor dark');
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

    test('lab-ir-remote-toggle: each flash gives one LM386 monoflop pulse, and the flip-flop toggles', () => {
        const x = bench('lab-ir-remote-toggle');
        const red = () => x.mA('rc1') > 5 && x.mA('rc2') < 1;
        const green = () => x.mA('rc2') > 5 && x.mA('rc1') < 1;
        x.run(1);
        assert.ok(green(), 'power-on: the flip-flop starts green');
        // The amplifier starts high and gives one power-on pulse; its end
        // toggles the flip-flop once. After 0.1 s everything has settled.
        x.run(100);
        near(x.v('u', 'vout'), 0.90, 0.05, 'monoflop at rest: output at its low limit');
        assert.ok(red(), 'power-on pulse has toggled to red');
        // A held press (50 ms): one pulse only.
        x.set('btn', 1);
        let rose = null, fell = null, pulses = 0, prev = x.v('u', 'vout');
        for (let k = 0; k < 50; k++) {
            x.run(1);
            const o = x.v('u', 'vout');
            if (prev < 4.5 && o >= 4.5) { pulses++; if (rose === null) rose = x.t; }
            if (rose !== null && fell === null && prev > 4.5 && o <= 4.5) fell = x.t;
            prev = o;
        }
        near(x.v('pt', 'emitter'), 2.55, 0.1, 'receiver lit at 30 cm');
        assert.equal(pulses, 1, 'one pulse for one held press');
        near(fell - rose, 16, 3, 'monoflop pulse length (ms)');
        assert.ok(green(), 'first press: green');
        x.set('btn', 0); x.run(50);
        assert.ok(green(), 'stays green after release');
        x.set('btn', 1); x.run(20); x.set('btn', 0); x.run(30);
        assert.ok(red(), 'second press: red');
    });

    test('lab-ir-remote-toggle: out of range at 1 m, the monoflop does not fire', () => {
        // The flash's edge reaches +IN through 220 nF against the 220 nF to
        // the output: about half the receiver's step. -IN sits at 0.43 V, so
        // the receiver must rise by more than about 0.86 V to fire it.
        // The step is the phototransistor's photocurrent into its 100 k load.
        const step = (cm) => {
            const y = bench('lab-ir-remote-toggle');
            y.at('air', cm); y.set('btn', 1); y.run(0.01);
            return y.b.opticalReport().receivers[y.ids.pt].amps * 100e3;
        };
        near(step(30), 2.69, 0.1, 'receiver step at 30 cm');
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): step(100) < 0.5 -> observed 0.25.
        assert.ok(step(100) < 0.5, '1 m: the step is too small to fire the monoflop');
    });

    test('lab-ir-beam-alarm: quiet while the beam is there, a loud tone when it is blocked', () => {
        const x = bench('lab-ir-beam-alarm');
        const swing = (ms) => {
            let lo = 99, hi = -99, prev = x.v('u', 'vout');
            const rises = [];
            for (let k = 0; k < ms / 0.1; k++) {
                x.run(0.1);
                const v = x.v('u', 'vout');
                lo = Math.min(lo, v); hi = Math.max(hi, v);
                if (prev < 4.5 && v >= 4.5) rises.push(x.t);
                prev = v;
            }
            return { lo, hi, rises };
        };
        x.run(1);
        near(x.v('u', 'inn'), 0.507, 0.02, 'beam on -IN: photocurrent x 10 k');
        x.run(10);
        const quiet = swing(5);
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): quiet.hi - quiet.lo < 0.05 -> observed 0.000.
        assert.ok(quiet.hi - quiet.lo < 0.05, `beam: no oscillation (${quiet.lo.toFixed(2)}..${quiet.hi.toFixed(2)} V)`);
        near(quiet.hi, 0.90, 0.05, 'beam: output held at its low limit');
        x.at('beam', 1); x.run(10);
        near(x.v('u', 'inn'), 0, 0.01, 'blocked: -IN at 0 V');
        const loud = swing(14);
        near(loud.lo, 0.91, 0.1, 'blocked: output swings down to its low limit');
        near(loud.hi, 8.09, 0.1, 'blocked: and up to its high limit');
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): loud.rises.length >= 2 -> observed 3.
        assert.ok(loud.rises.length >= 2, 'at least two cycles in 14 ms');
        const hz = 1000 * (loud.rises.length - 1) / (loud.rises.at(-1) - loud.rises[0]);
        near(hz, 176, 15, 'alarm tone (Hz)');
        x.at('beam', 0); x.run(12);
        const again = swing(5);
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): again.hi - again.lo < 0.05 -> observed 0.000.
        assert.ok(again.hi - again.lo < 0.05, 'beam back: quiet again');
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

    test('lab-barrier-counter: every interruption of the pulsed beam counts; at 6 the relay pulls in and the count stops', () => {
        const x = bench('lab-barrier-counter');
        const count = () => x.bits('cnt', ['qc', 'qb', 'qa']);
        x.run(40);
        assert.equal(count(), '000', 'nothing counted while the receiver settles');
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): x.v('q2', 'collector') > 4 -> observed 4.51.
        assert.ok(x.v('q2', 'collector') > 4, 'beam pulses arrive: receiver output high');
        const seen = [];
        // Blocked for 10 ms, clear for 18 ms: the receiver answers a break
        // within about 4 ms and a returning beam within about 10 ms.
        for (let n = 1; n <= 7; n++) {
            x.at('beam', 1); x.run(10);
            seen.push(count());
            x.at('beam', 0); x.run(18);
        }
        assert.deepEqual(seen, ['001', '010', '011', '100', '101', '110', '110'], 'counts to 6, then holds');
        near(x.mA('k', 'coil_a'), 24.4, 0.5, 'relay coil current');
        near(x.mA('rl'), 13.1, 0.5, 'lamp through the second pole');
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): x.v('cnt', 'clk_a') < 0.1 -> observed 0.00.
        assert.ok(x.v('cnt', 'clk_a') < 0.1, 'first pole has cut the clock');
        x.set('clr', 1); x.run(10); x.set('clr', 0); x.run(20);
        assert.equal(count(), '000', 'cleared');
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): x.mA('k', 'coil_a') < 0.1 -> observed 0.0.
        assert.ok(x.mA('k', 'coil_a') < 0.1, 'relay dropped out');
    });

    test('lab-barrier-counter: weak room light does no harm, strong room light blinds the receiver', () => {
        // Room light is the phototransistor's own light setting: a steady
        // photocurrent the diode pump cannot pass.
        const weak = bench('lab-barrier-counter', { pt: { light: 0.01 } });
        weak.run(40);
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): weak.v('q2', 'collector') > 4 -> observed 4.51.
        assert.ok(weak.v('q2', 'collector') > 4, 'weak room light: the beam is still seen');
        weak.at('beam', 1); weak.run(10);
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): weak.v('q2', 'collector') < 0.5 -> observed 0.04.
        assert.ok(weak.v('q2', 'collector') < 0.5, 'weak room light alone does not hold the receiver');
        assert.equal(weak.bits('cnt', ['qc', 'qb', 'qa']), '001', 'and the break is counted');
        const strong = bench('lab-barrier-counter', { pt: { light: 0.1 } });
        strong.run(40);
        near(strong.v('pt', 'collector'), 0.06, 0.05, 'strong room light saturates the phototransistor');
        // MEASURED 2026-11-24 (bw-board eb3ec0a7): strong.v('q2', 'collector') < 0.5 -> observed 0.04.
        assert.ok(strong.v('q2', 'collector') < 0.5, 'blinded: the flashes no longer get through');
    });

    test('lab-loud-counter: the counter counts the signal only when its peaks reach the switching level', () => {
        const run = (edits) => {
            const x = bench('lab-loud-counter', edits);
            x.run(30); // the 100 nF has found its level
            const c0 = parseInt(x.bits('cnt', ['qd', 'qc', 'qb', 'qa']), 2);
            let hi = -9, lo = 9;
            for (let k = 0; k < 320; k++) { x.run(0.25); const v = x.v('cnt', 'clk_a'); hi = Math.max(hi, v); lo = Math.min(lo, v); }
            const c1 = parseInt(x.bits('cnt', ['qd', 'qc', 'qb', 'qa']), 2);
            return { counted: (c1 - c0 + 16) % 16, hi, lo, rest: x.v('thr', 'wiper') };
        };
        const loud = run({});
        near(loud.rest, 2.25, 0.02, 'bias from the pot');
        near(loud.hi, 2.74, 0.05, 'peaks of the 0.5 V signal');
        assert.equal(loud.counted, 8, '100 Hz for 80 ms: eight counts');
        const quiet = run({ sig: { amplitude: 0.1 } });
        near(quiet.hi, 2.35, 0.05, 'quiet signal peaks');
        assert.equal(quiet.counted, 0, '0.1 V: below the switching level');
        const low = run({ thr: { position: 0.35 } });
        near(low.rest, 1.75, 0.02, 'pot lower');
        assert.equal(low.counted, 0, 'pot lower: the same signal no longer counts');
    });
});
