/**
 * The op-amp measuring benches from scripts/lib/lab-benches-opamp.mjs
 * (`node scripts/gen-lab-circuits-4.mjs --set=opamp`) do what their
 * EXPECTED.md says — measured on the COMMITTED circuit.json, over time.
 *
 * Integrators are about time (a slope, a step per tap, LEDs in turn) and the
 * meter rectifiers about an average over many cycles, so assert-physics'
 * single instant (1 ms) cannot see them; each bench gets a scenario here.
 * Numbers MEASURED 2026-11-24 on bw-board eb3ec0a7 (LM324 benches) / bw-circuit-ui of the same
 * day; the bands are wide enough for solver noise and narrow enough that a
 * different circuit state cannot pass.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-opamp.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the op-amp measuring lab bench scenarios');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

/** Load a committed bench (optionally edited first) and name its parts by role. */
function bench (id, edit = null) {
    const json = JSON.parse(readFileSync(join(EXAMPLES, id, 'circuit.json'), 'utf8'));
    const ids = benchIds(BENCHES[id]);
    if (edit) edit(json, ids);
    const c = Circuit.fromJSON(json);
    const b = c.board;
    let tMs = 0;
    const netOf = (name, term) => {
        const n = b.getNets().find(n => n.terminals.some(x => x.part === ids[name] && x.terminal === term));
        assert.ok(n, `${id}: no net for ${name}.${term}`);
        return n.id;
    };
    const api = {
        c, b, ids,
        v (name, term) { return b.nodeVoltages.get(netOf(name, term)) ?? 0; },
        /** Current through a named two-lead part, in mA, sign dropped. */
        mA (name, term = 'a') { return Math.abs(b.branchCurrent(ids[name], term)) * 1e3; },
        /** The moving-coil meter's reading (volts, or mA in current mode). */
        meter (name = 'meter') {
            const s = b.getDeviceState(ids[name]);
            return BENCHES[id].parts[name][1].mode === 'current' ? s.reading * 1e3 : s.reading;
        },
        run (ms) {
            tMs += ms;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
        },
        set (name, value) { b.setControl(ids[name], value); },
        param (name, key, value) { b.setPartParam(ids[name], key, value); },
        /** Press a button for `downMs`, release it and wait `upMs`. */
        tap (name, downMs, upMs) { api.set(name, 1); api.run(downMs); api.set(name, 0); api.run(upMs); },
        /** Mean of fn() sampled every `dt` ms over `total` ms. */
        mean (fn, total, dt) {
            let s = 0; const n = Math.round(total / dt);
            for (let k = 0; k < n; k++) { api.run(dt); s += fn(); }
            return s / n;
        },
        get t () { return tMs; },
    };
    return api;
}

/** Set one param of the part named `name` before loading. */
const withParam = (name, key, value) => (json, ids) => { json.parts.find(p => p.id === ids[name]).params[key] = value; };

const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);

describe('op-amp measuring lab benches behave as documented', { skip: SKIP }, () => {
    test('lab-tilt-comparator: a sliver of the knob, a fraction of a millivolt, swaps the LEDs', () => {
        const x = bench('lab-tilt-comparator');
        const diff = () => (x.v('u', '1_pos') - x.v('u', '1_neg')) * 1e3;
        // Open loop the dominant pole is near 10 Hz (16 ms): settle 100 ms per
        // setting.
        const at = (p) => { x.param('tilt', 'position', p); x.run(100); return { mv: diff(), out: x.v('u', '1_out'), g: x.mA('rg'), r: x.mA('rr') }; };
        const left = at(0.4);
        near(left.mv, -4.48, 0.05, 'authored: input below the reference (mV)');
        assert.ok(left.r > 6 && left.g < 0.01, 'tilted left: red lit, green dark');
        const right = at(0.6);
        near(right.mv, 4.48, 0.05, 'tilted right: input above the reference (mV)');
        assert.ok(right.g > 5 && right.r < 0.5, 'tilted right: green lit, red (nearly) dark');
        near(at(0).mv, -22.37, 0.1, 'knob fully left (mV)');
        near(at(1).mv, 22.37, 0.1, 'knob fully right (mV)');
        // The changeover: between +4.5 µV and +45 µV the output moves 3.7 V,
        // the chip's open-loop gain (10^5 on its card).
        const a = at(0.5001); const b = at(0.501);
        near((b.out - a.out) / ((b.mv - a.mv) / 1e3), 92000, 15000, 'open-loop gain in the changeover');
        assert.ok(b.g > 1 && b.r > 1, '45 µV above balance (a thousandth of the knob): both LEDs glow');
        const c = at(0.51);
        near(c.mv, 0.448, 0.01, 'a hundredth of the knob from the middle (mV)');
        assert.ok(c.g > 5 && c.r < 0.5, 'half a millivolt is already a full switch');
    });

    test('lab-tap-integrator: every tap one step, however long; the diode catches a backwards swing', () => {
        const x = bench('lab-tap-integrator');
        x.run(100);
        near(x.meter(), 0, 0.01, 'start: the meter rests at zero (V)');
        near(x.v('u', '1_pos'), 1.623, 0.01, 'reference from the buffer section (V)');
        const steps = [];
        for (let k = 0; k < 3; k++) { const m = x.meter(); x.tap('up', 20, 100); steps.push(x.meter() - m); }
        for (const s of steps) near(s, 0.77, 0.04, 'one "up" tap (V)');
        let m = x.meter(); x.tap('up', 200, 100);
        near(x.meter() - m, steps[2], 0.04, 'a ten times longer press is still one step (V)');
        m = x.meter(); x.tap('dn', 20, 100);
        near(x.meter() - m, -0.80, 0.04, 'one "down" tap (V)');
        x.tap('zero', 10, 20);
        near(x.meter(), 0, 0.01, 'zero empties the integrator (V)');
        x.tap('dn', 20, 100);
        // Without the diode the needle would be driven to minus the reference
        // (about -1.6 V); the diode holds it at a tenth of full scale.
        near(x.meter(), -0.58, 0.05, 'down below zero: the diode limits the reverse reading (V)');
        near(x.v('u', '1_pos'), 1.623, 0.01, 'the buffered reference does not move');
    });

    test('lab-ramp-timer: green, yellow, red at equal intervals; hold stops it, zero restarts it', () => {
        const x = bench('lab-ramp-timer');
        const first = {};
        x.run(10); const v0 = x.v('u', '1_out');
        for (let k = 0; k < 144; k++) {
            x.run(10);
            for (const n of ['r1', 'r2', 'r3']) if (first[n] === undefined && x.mA(n) > 1) first[n] = x.t;
        }
        near((x.v('u', '1_out') - v0) / 1.44, 4.48, 0.15, 'ramp speed at the fastest setting (V/s)');
        // Comparators switch at 3, 5 and 7 V: (V - 1) / 4.48 s after start.
        near(first.r1, 450, 30, 'green on (ms)');
        near(first.r2, 900, 30, 'yellow on (ms)');
        near(first.r3, 1350, 30, 'red on (ms)');
        x.set('run', 0); const held = x.v('u', '1_out'); x.run(200);
        near(x.v('u', '1_out'), held, 0.01, 'hold: the ramp stands still (V)');
        assert.ok(x.mA('r3') > 1, 'hold: red stays lit');
        x.tap('zero', 10, 10);
        near(x.v('u', '1_out'), 1.0, 0.02, 'zero: back at the 1 V start (V)');
        assert.ok(x.mA('r1') < 0.05, 'zero: all LEDs dark');
        x.set('time', 0.5); x.set('run', 1); const s = x.v('u', '1_out'); x.run(300);
        near((x.v('u', '1_out') - s) / 0.3, 1.34, 0.08, 'ramp speed with the time knob at half (V/s)');
    });

    test('lab-sound-meter: the needle follows the sound pressure, ten decibels about a factor of three', () => {
        // The 1 kHz tone at 90, 80 and 96 dB SPL and silence again. Meter:
        // average over 10 ms after 10 ms at each level.
        const x = bench('lab-sound-meter');
        x.run(1);
        near(x.v('u', '4_out'), 4.5, 0.01, 'M, the buffered half supply (V)');
        const level = (db) => { x.param('mic', 'soundDb', db); x.run(10); return x.mean(() => x.meter(), 10, 0.1); };
        const l90 = level(90);
        near(l90, 0.348, 0.03, '90 dB (mA)');
        const l80 = level(80);
        near(l80, 0.124, 0.015, '80 dB (mA)');
        const l96 = level(96);
        near(l96, 0.707, 0.05, '96 dB (mA)');
        // 10 dB = x3.16 in pressure; the 80 dB window still carries a little of
        // the 90 dB reading, so the measured ratio is a bit lower (2.8).
        near(l90 / l80, 2.8, 0.3, '90 dB / 80 dB');
        near(l96 / l90, 2.03, 0.15, '96 dB / 90 dB (6 dB = x2)');
        x.param('mic', 'soundDb', 0); x.run(30);
        assert.ok(x.meter() < 0.01, `silence: the needle falls back (${x.meter().toFixed(4)} mA)`);
    });

    test('lab-radio-level: tuned to the local station the ladder climbs; between stations it goes dark', () => {
        // Radio benches cost a full transient step sequence per simulated
        // millisecond, so this stays at 60 ms. Tuning 0.50 is the default
        // broadcast's strong 612 kHz station (400 Hz tone); 0.38 lies between
        // stations.
        const x = bench('lab-radio-level');
        x.run(12);
        let n = 0; let L = 0; const on = [0, 0, 0];
        for (let k = 0; k < 18; k++) {
            x.run(1); n++; L += x.v('ch', 'a');
            ['r1', 'r2', 'r3'].forEach((c, i) => { if (x.mA(c) > 1) on[i]++; });
        }
        near(L / n, 3.06, 0.3, 'tuned: level L, the meter reading (V)');
        assert.equal(on[0], n, 'tuned: green lit throughout');
        assert.equal(on[1], n, 'tuned: yellow lit throughout');
        assert.ok(on[2] >= n / 2, `tuned: red lit most of the time (${on[2]} of ${n})`);
        x.param('tc', 'position', 0.38);
        x.run(30);
        assert.ok(x.v('ch', 'a') < 1.2, `between stations: the level has fallen (${x.v('ch', 'a').toFixed(3)} V)`);
        for (const c of ['r1', 'r2', 'r3']) assert.ok(x.mA(c) < 0.05, `between stations: ${c} LED dark`);
    });

    test('lab-buffered-voltmeter: the bare meter loads the divider, the follower does not; x10 stage', () => {
        const x = bench('lab-buffered-voltmeter');
        x.run(1);
        near(x.meter(), 2.34, 0.03, 'meter straight on the 220k/220k divider (V)');
        x.set('via', 1); x.run(1);
        near(x.v('da', 'b'), 4.45, 0.03, 'through the follower the divider stays near 4.5 V (V)');
        near(x.meter(), 4.22, 0.03, 'follower reading: the input diode costs about 0.2 V (V)');
        near(x.meter('meter10'), 0.005, 0.005, 'x10 stage with nothing at its input (V)');
        x.set('probe', 1); x.run(1);
        near(x.v('u', '2_pos'), 0.486, 0.005, 'probe on 0.5 V (V)');
        near(x.meter('meter10'), 4.905, 0.03, 'x10 stage reading (V)');
    });

    test('lab-opamp-ammeter: calibrate on the LED voltage, then read the current', () => {
        const x = bench('lab-opamp-ammeter');
        x.run(1);
        near(x.mA('rl'), 93.75, 0.5, 'load current (mA)');
        near(x.v('shunt', 'a'), 0.09375, 0.0005, 'drop on the 1 Ω sensing resistor (V)');
        // Calibrate: the LED-derived voltage (87 mV, standing for 87 mA) must
        // read 87 / 20 = 4.34 on the meter. Find the knob position.
        x.set('sel', 1);
        const calAt = (p) => { x.param('cal', 'position', p); x.run(1); return x.meter(); };
        near(x.v('cb', 'a'), 0.0867, 0.002, 'calibration voltage (V)');
        let lo = 0; let hi = 1; // reading falls as the position rises
        for (let k = 0; k < 14; k++) { const mid = (lo + hi) / 2; if (calAt(mid) > 4.336) lo = mid; else hi = mid; }
        near(lo, 0.55, 0.03, 'calibrated knob position');
        x.set('sel', 0); x.run(1);
        near(x.meter() * 20, 93.75, 1, 'calibrated meter reads the load current (mA, at 20 mA/V)');
        const y = bench('lab-opamp-ammeter', withParam('load', 'volts', -4.5));
        y.run(1);
        assert.ok(y.meter() < 0.02, `load reversed: the meter is not driven backwards (${y.meter().toFixed(4)} V)`);
    });

    test('lab-linear-ohmmeter: the reading is proportional to the resistor under test', () => {
        const x = bench('lab-linear-ohmmeter');
        x.run(1);
        near(x.meter(), 3.30, 0.02, 'mystery resistor on the 1 kΩ/V range (V)');
        x.set('range', 1); x.run(1);
        near(x.meter(), 0.330, 0.005, 'same resistor on the 10 kΩ/V range (V)');
        x.set('range', 0); x.set('pick', 1);
        // Rheostat: Rx = (1 - position) x 47 kΩ.
        for (const [p, kOhm] of [[1, 0], [0.95, 2.35], [0.9, 4.7]]) {
            x.param('rx', 'position', p); x.run(1);
            near(x.meter(), kOhm, 0.02, `rheostat ${kOhm} kΩ on the 1 kΩ/V range (V)`);
        }
        x.param('rx', 'position', 0.5); x.run(1);
        assert.ok(x.meter() > 7, `over range: the needle pins past full scale (${x.meter().toFixed(3)} V)`);
        x.set('range', 1); x.run(1);
        near(x.meter(), 2.35, 0.02, '23.5 kΩ on the 10 kΩ/V range (V)');
        x.param('rx', 'position', 0); x.run(1);
        near(x.meter(), 4.70, 0.02, '47 kΩ on the 10 kΩ/V range (V)');
    });

    test('lab-bridge-meter: the meter reads the size, the LEDs the sign; AC reads 2/pi of the peak', () => {
        const x = bench('lab-bridge-meter');
        for (const [p, vin] of [[1, 1.023], [0.75, 0.511], [0.25, -0.511], [0, -1.023]]) {
            x.set('knob', p); x.run(1);
            near(x.v('u', '1_pos'), vin, 0.005, `knob at ${p}: input (V)`);
            near(x.meter(), Math.abs(vin), 0.005, `knob at ${p}: meter (mA)`);
            const [on, off] = vin > 0 ? ['plus', 'minus'] : ['minus', 'plus'];
            near(x.mA(on, 'anode'), Math.abs(vin), 0.005, `knob at ${p}: ${on} LED carries the meter current (mA)`);
            assert.ok(x.mA(off, 'anode') < 0.001, `knob at ${p}: ${off} LED dark`);
        }
        x.set('knob', 0.5); x.run(1);
        near(x.meter(), 0, 0.002, 'zero in: meter at rest (mA)');
        x.set('src', 1);
        let plus = 0; let minus = 0; let n = 0;
        const avg = x.mean(() => {
            n++; if (x.mA('plus', 'anode') > 0.3) plus++; if (x.mA('minus', 'anode') > 0.3) minus++;
            return x.meter();
        }, 40, 0.2);
        near(avg, 0.636, 0.02, '1 V peak sine: average meter current (mA)');
        near(plus / n, 0.4, 0.06, 'share of the time the red (plus) LED carries');
        near(minus / n, 0.4, 0.06, 'share of the time the green (minus) LED carries');
    });
});
