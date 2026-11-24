/**
 * The `discrete` lab-* benches from scripts/lib/lab-benches-discrete.mjs
 * (`node scripts/gen-lab-circuits-4.mjs --set=discrete`) do what their
 * EXPECTED.md says — measured on the COMMITTED circuit.json.
 *
 * assert-physics reads one instant (1 ms); these scenarios turn the knobs,
 * flip the switches and run the oscillators over time. The numbers were
 * measured on the headless engine (bw-board eb3ec0a7, bw-circuit-ui 4c57f3a)
 * when the benches were built; the bands are wide enough for solver noise
 * and narrow enough that a different circuit state cannot pass.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-discrete.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the discrete-stage lab bench scenarios');
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
        /** Times at which `fn` fell by more than `step` within one sample (a discharge). */
        drops(fn, total, dt, step = 0.3, gap = 0) {
            const out = [];
            let prev = fn();
            for (let k = 0; k < Math.round(total / dt); k++) {
                api.run(dt);
                const now = fn();
                if (now < prev - step && !(out.length && tMs - out.at(-1) < gap)) out.push(tMs);
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
// lab-relax-tone, MEASURED (bw-board eb3ec0a7) with the sampling below: 547.9 Hz and 750.0 Hz.
const MID_HZ = 548, TOP_HZ = 750;
const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(3)}, expected ${want} +-${tol}`);

describe('discrete-stage lab benches behave as documented', { skip: SKIP }, () => {
    test('lab-two-followers: two junction drops, and two current gains that let a weak source light the LED', () => {
        const x = bench('lab-two-followers');
        x.run(1);
        near(x.v('pot', 'wiper'), 7.196, 0.03, 'wiper (V)');
        near(x.v('pot', 'wiper') - x.v('q1', 'base'), 0.088, 0.02, 'drop across the 47 k source (V)');
        near(x.v('q1', 'base') - x.v('q1', 'emitter'), 0.68, 0.05, 'first base-emitter drop (V)');
        near(x.v('q1', 'emitter') - x.v('q2', 'emitter'), 0.69, 0.05, 'second base-emitter drop (V)');
        near(x.mA('rl'), 11.97, 0.4, 'LED current on the second follower (mA)');
        near(x.mA('amb') * 1000, 1.87, 0.2, 'base current with two followers (µA)');
        x.set('sel', 0);
        x.run(5);
        near(x.mA('amb') * 1000, 58.9, 3, 'base current with one follower carrying the LED (µA)');
        near(x.v('q1', 'base'), 4.34, 0.1, 'first base sags behind the 47 k (V)');
        near(x.mA('rl'), 5.91, 0.3, 'LED current on the first follower (mA)');
        x.set('sel', 1);
        x.set('pot', 0.3);
        x.run(5);
        // MEASURED (bw-board eb3ec0a7): x.mA('rl') < 0.05 -> observed 0.008 at a 2.70 V wiper.
        assert.ok(x.mA('rl') < 0.05, `wiper ${x.v('pot', 'wiper').toFixed(2)} V: LED ${x.mA('rl').toFixed(3)} mA, dark`);
        x.set('pot', 0.5);
        x.run(5);
        // MEASURED (bw-board eb3ec0a7): x.mA('rl') > 3 -> observed 4.33 at a 4.50 V wiper.
        assert.ok(x.mA('rl') > 3, `wiper ${x.v('pot', 'wiper').toFixed(2)} V: LED lit`);
    });

    test('lab-inverting-stages: the first lamp dims and the second brightens, smoothly, as the knob goes up', () => {
        const x = bench('lab-inverting-stages');
        const l1 = [], l2 = [];
        for (let k = 0; k <= 20; k++) {
            x.set('pot', k / 20);
            x.run(5);
            l1.push(x.mA('rl1'));
            l2.push(x.mA('rl2'));
        }
        near(l1[0], 4.79, 0.2, 'yellow at the bottom (mA)');
        near(l1[10], 2.32, 0.15, 'yellow at mid-travel (mA)');
        near(l2[10], 1.60, 0.15, 'green at mid-travel (mA)');
        near(l2[20], 4.76, 0.2, 'green at the top (mA)');
        // MEASURED (bw-board eb3ec0a7): l1[20] < 0.05 -> observed 0.000; l2[0] < 0.05 -> observed 0.010.
        assert.ok(l1[20] < 0.05 && l2[0] < 0.05, 'the dark ends are dark');
        for (let k = 1; k <= 20; k++) {
            assert.ok(l1[k] <= l1[k - 1] + 0.01, `yellow never brightens as the knob rises (step ${k})`);
            assert.ok(l2[k] >= l2[k - 1] - 0.01, `green never dims as the knob rises (step ${k})`);
            // A fade, not a switch: no single 5 % step moves either lamp by more than a fifth of its range.
            // MEASURED (bw-board eb3ec0a7): largest step 0.63 mA (green, 0.90 -> 0.95).
            assert.ok(Math.abs(l1[k] - l1[k - 1]) < 1 && Math.abs(l2[k] - l2[k - 1]) < 1, `smooth at step ${k}`);
        }
        // Lit over most of the travel: both lamps above 0.5 mA from 0.25 to 0.75.
        for (let k = 5; k <= 15; k++) assert.ok(l1[k] > 0.5 && l2[k] > 0.5, `both glow at ${k / 20}`);
    });

    test('lab-battery-monitor: flashes above the set voltage, stops below it, and the knob moves it', () => {
        const x = bench('lab-battery-monitor');
        const ct = () => x.v('ct', 'pos');
        const running = (what, settle = 600) => {
            x.run(settle);
            const d = x.drops(ct, 1200, 10, 0.3, 20);
            // MEASURED (bw-board eb3ec0a7): >= 3 discharges in 1.2 s wherever it runs -> observed 3..4.
            assert.ok(d.length >= 3, `${what}: ${d.length} flashes in 1.2 s`);
            return d;
        };
        const stopped = (what) => {
            x.run(1500);
            const v0 = ct();
            let moved = 0;
            for (let k = 0; k < 50; k++) { x.run(20); moved = Math.max(moved, Math.abs(ct() - v0)); }
            // MEASURED (bw-board eb3ec0a7): moved < 0.05 V -> observed below 1e-3 everywhere it stops.
            assert.ok(moved < 0.05, `${what}: capacitor parked at ${v0.toFixed(2)} V, moved ${moved.toFixed(3)} V`);
            return v0;
        };
        const d = running('9 V, knob in the middle', 300);
        near(period(d), 370, 30, 'flash period at 9 V (ms)');
        let peak = 0;
        // Close in on the next firing coarsely, then sample the discharge finely.
        while (ct() < 7.6) x.run(5);
        for (let k = 0; k < 600; k++) { x.run(0.1); peak = Math.max(peak, x.mA('rs')); }
        // MEASURED (bw-board eb3ec0a7): peak > 20 mA -> observed 55.8 mA, sampled every 0.1 ms.
        assert.ok(peak > 20, `flash current ${peak.toFixed(1)} mA`);
        x.set('bat', 6.5);
        running('6.5 V, knob in the middle');
        x.set('bat', 6.25);
        const parked = stopped('6.25 V, knob in the middle');
        near(parked - x.v('qp', 'base'), 0.67, 0.1, 'parked one junction drop above the base (V)');
        x.set('set', 0.2);
        running('6.25 V, knob at 0.2');
        x.set('bat', 4.75);
        stopped('4.75 V, knob at 0.2');
        x.set('set', 0.8);
        x.set('bat', 9);
        stopped('9 V, knob at 0.8');
    });

    test('lab-relax-tone: an audible sawtooth whose pitch the rheostat sets', () => {
        // The slowest bench here: every discharge is a stiff, sub-microsecond
        // event, so the windows are kept to a handful of cycles.
        const x = bench('lab-relax-tone');
        const ct = () => x.v('ct', 'a');
        x.run(6);
        let hi = 0, lo = 99;
        const d = x.drops(() => { const v = ct(); hi = Math.max(hi, v); lo = Math.min(lo, v); return v; }, 10, 0.05, 0.3, 0.3);
        assert.ok(d.length >= 4, `${d.length} cycles in 10 ms`);
        const mid = 1000 / period(d);
        near(hi, 6.86, 0.1, 'capacitor peak: the trigger point (V)');
        near(lo, 2.35, 0.3, 'capacitor after the discharge (V)');
        near(mid, MID_HZ, MID_HZ * 0.15, 'pitch with the rheostat in the middle (Hz)');
        const tone = x.b.buzzerTone(x.ids.spk);
        assert.ok(tone.on && Math.abs(tone.hz - mid) < mid * 0.25, `the piezo hears it: ${JSON.stringify(tone)}`);
        x.set('pitch', 1);
        x.run(2);
        const e = x.drops(ct, 6, 0.05, 0.3, 0.3);
        assert.ok(e.length >= 4, `${e.length} cycles in 6 ms`);
        const top = 1000 / period(e);
        near(top, TOP_HZ, TOP_HZ * 0.12, 'pitch with only the 22 k minimum (Hz)');
    });

    test('lab-diff-comparator: the output flips within a millivolt of the reference', () => {
        const x = bench('lab-diff-comparator');
        const diff = () => (x.v('q2', 'base') - x.v('q1', 'base')) * 1000;
        const high = () => x.v('u', '1_out') > 6;
        x.run(1);
        assert.ok(high(), 'authored: input just above the reference, output high');
        near(x.mA('rg'), 5.26, 0.3, 'green LED (mA)');
        let flipDown = null, flipUp = null;
        for (let p = 0.5; p >= 0.45; p -= 0.0025) {
            x.set('fine', p); x.run(3);
            if (!high()) { flipDown = diff(); break; }
        }
        assert.ok(flipDown !== null, 'turning down flips it to red');
        near(x.mA('rr'), 6.92, 0.3, 'red LED (mA)');
        // MEASURED (bw-board eb3ec0a7): flipped at -0.07 mV (0.4875 of travel).
        assert.ok(Math.abs(flipDown) < 0.5, `flipped to red ${flipDown.toFixed(3)} mV from the reference`);
        for (let p = 0.47; p <= 0.52; p += 0.0025) {
            x.set('fine', p); x.run(3);
            if (high()) { flipUp = diff(); break; }
        }
        assert.ok(flipUp !== null && Math.abs(flipUp) < 0.5, `flipped back to green ${flipUp?.toFixed(3)} mV from the reference`);
        // The limiting resistors: the whole knob travel spans under a volt.
        x.set('fine', 0); x.run(3);
        const bottom = x.v('q2', 'base');
        x.set('fine', 1); x.run(3);
        near(x.v('q2', 'base') - bottom, 0.84, 0.05, 'input range over the full travel (V)');
        near(x.v('q1', 'collector') - x.v('q2', 'collector'), 4.19, 0.3, 'collector difference with the input 0.4 V high (V)');
    });

    test('lab-diff-blinker: delayed feedback blinks, the Miller capacitor calms it', () => {
        const x = bench('lab-diff-blinker');
        const out = () => x.v('u', '1_out');
        x.run(300);
        const rises = (total) => {
            const e = [];
            let prev = out(), lo = Infinity, hi = -Infinity;
            for (let k = 0; k < total / 20; k++) {
                x.run(20);
                const o = out();
                lo = Math.min(lo, o); hi = Math.max(hi, o);
                if (prev < 3.5 && o >= 3.5) e.push(x.t);
                prev = o;
            }
            return { e, lo, hi };
        };
        const a = rises(1200);
        // MEASURED (bw-board eb3ec0a7): 3 rises in 1.2 s, swing 0.02..7.23 V.
        assert.ok(a.e.length >= 3, `${a.e.length} blinks in 1.2 s`);
        near(period(a.e), 276, 30, 'blink period (ms)');
        assert.ok(a.lo < 0.5 && a.hi > 6.5, `the output swings rail to rail: ${a.lo.toFixed(2)}..${a.hi.toFixed(2)} V`);
        x.set('sw', 1);
        x.run(1200);
        const b = rises(500);
        // MEASURED (bw-board eb3ec0a7): no rises, output inside 4.28..4.48 V in this window
        // (with 1 µF instead of 4.7 µF it keeps swinging; with 2.2 µF it still rings here).
        assert.equal(b.e.length, 0, 'with the Miller capacitor: no more blinks');
        assert.ok(b.hi - b.lo < 0.4, `output steady: ${b.lo.toFixed(2)}..${b.hi.toFixed(2)} V`);
        // MEASURED (bw-board eb3ec0a7): q1 base 4.422 V against the 4.497 V set point.
        near(x.v('q1', 'base'), x.v('q2', 'base'), 0.1, 'the loop holds the two bases together (V)');
        near(x.mA('rl'), 2.55, 0.3, 'LED at a steady half brightness (mA)');
    });
});
