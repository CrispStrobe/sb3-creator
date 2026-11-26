/**
 * The round-6 "r6e" benches from `scripts/gen-lab-circuits-4.mjs --set=r6e`
 * do what their EXPECTED.md says: measured on the COMMITTED circuit.json,
 * with the stimuli a learner would set (buttons, switches, slide switches,
 * pots, a temperature, a light path's knob).
 *
 * Readouts come from the engine's own surfaces: node voltages, branch
 * currents, the tone tracker's edges on a loudspeaker, device state (spark
 * gap, meters) and part temperatures. Audio-rate oscillators cost real time
 * per simulated millisecond, so tones are timed over a few milliseconds and
 * slow oscillators are watched with their tone generator muted where the
 * bench has a SOUND switch. Every number below was measured on the headless
 * engine (bw-board f4aaec43) when the bench was built; the tolerances are
 * bands around those measurements.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r6e.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (round 6, r6e)');
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
    return {
        c, b, ids,
        v (name, term) { return b.nodeVoltages.get(netOf(name, term)) ?? 0; },
        /** Current through a two-lead part, mA, sign dropped. */
        mA (name, term = 'a') { return Math.abs(b.branchCurrent(ids[name], term)) * 1e3; },
        state (name) { return b.getDeviceState(ids[name]); },
        tempC (name) { return b.partTemperature(ids[name]); },
        run (ms) {
            // Long advances in 20 ms pieces: the engine caps the solver
            // attempts per advance.
            const end = tMs + ms;
            while (tMs + 20 < end) { tMs += 20; b.advanceTo(BigInt(Math.round(tMs * 1e6))); }
            tMs = end;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
        },
        set (name, value) { b.setControl(ids[name], value); },
        param (name, key, value) { b.setPartParam(ids[name], key, value); },
        get t () { return tMs; },
    };
}

/** Set params of the part named `name` before loading. */
const withParams = (name, params) => (json, ids) => { Object.assign(json.parts.find(p => p.id === ids[name]).params, params); };

const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);

/** Mean frequency (Hz) of the edges a loudspeaker's tone tracker recorded after fromMs. */
function toneHz (x, name, fromMs) {
    const e = (x.state(name)?._edges ?? []).map(Number).filter(t => t / 1e6 >= fromMs);
    if (e.length < 3) return 0;
    const n = Math.floor((e.length - 1) / 2);
    return n / ((e[2 * n] - e[0]) / 1e9);
}

/** Sample a node every stepMs for ms; returns {min, max, mean, values}. */
function sample (x, name, term, ms, stepMs) {
    const values = [];
    for (let t = 0; t < ms - 1e-9; t += stepMs) { x.run(stepMs); values.push(x.v(name, term)); }
    return { min: Math.min(...values), max: Math.max(...values), mean: values.reduce((a, b) => a + b, 0) / values.length, values };
}

/** Frequency (Hz) from upward crossings of a level in samples taken every stepMs. */
function crossingsHz (values, level, stepMs) {
    const up = [];
    for (let i = 1; i < values.length; i++) if (values[i - 1] < level && values[i] >= level) up.push(i);
    if (up.length < 2) return 0;
    return (up.length - 1) / ((up[up.length - 1] - up[0]) * stepMs / 1000);
}

describe('lab round-6 r6e benches behave as documented', { skip: SKIP }, () => {
    test('lab-opamp-crossing: two lamps take turns while the TRAIN switch is on', () => {
        const x = bench('lab-opamp-crossing');
        x.run(1);
        near(x.v('u', '1_out'), 7.23, 0.05, 'power-on: output high');
        // MEASURED 2026-11-24: x.mA('r1') > 4 -> observed 5.43.
        assert.ok(x.mA('r1') > 4, 'left lamp lit');
        // MEASURED 2026-11-24: x.mA('r2') < 0.3 -> observed 0.19 (only 1.8 V across it).
        assert.ok(x.mA('r2') < 0.3, 'right lamp dark');
        const flips = [];
        let high = true;
        while (x.t < 1400 && flips.length < 3) {
            x.run(10);
            const h = x.v('u', '1_out') > 3.75;
            if (h !== high) { flips.push(x.t); high = h; }
            if (flips.length === 1 && !h && x.t === flips[0]) {
                // MEASURED 2026-11-24: x.mA('r2') > 4 -> observed 6.82.
                assert.ok(x.mA('r2') > 4, 'output low: right lamp lit');
                // MEASURED 2026-11-24: x.mA('r1') < 0.05 -> observed 3.6e-10.
                assert.ok(x.mA('r1') < 0.05, 'output low: left lamp dark');
            }
        }
        assert.equal(flips.length, 3, `three changes in 1.4 s (${flips})`);
        near(flips[2] - flips[0], 670, 40, 'one full flash cycle (ms)');
        x.set('train', 0);
        x.run(300);
        // MEASURED 2026-11-24: x.mA('r1') + x.mA('r2') < 0.05 -> observed 0.033.
        assert.ok(x.mA('r1') + x.mA('r2') < 0.05, 'TRAIN off: both lamps dark');
    });

    test('lab-opamp-touch-latch: a finger on SET latches the red LED, on RESET the green one', () => {
        const x = bench('lab-opamp-touch-latch');
        x.run(5);
        near(x.v('u', '1_out'), 0.36, 0.05, 'power-on: output low');
        near(x.v('u', '1_neg'), 3.0, 0.02, 'threshold (V)');
        // MEASURED 2026-11-24: x.mA('r2') > 4 -> observed 6.83.
        assert.ok(x.mA('r2') > 4, 'green lit');
        x.set('set', 1); x.run(5); x.set('set', 0); x.run(20);
        near(x.v('u', '1_out'), 7.24, 0.05, 'after SET: output high, held');
        // Half of 7.24 V, plus the LM324's + input bias current (47.5 nA) through 10 MΩ ‖ 10 MΩ.
        near(x.v('u', '1_pos'), 3.86, 0.05, 'the output holds + above the threshold (V)');
        // MEASURED 2026-11-24: x.mA('r1') > 4 -> observed 5.44.
        assert.ok(x.mA('r1') > 4, 'red lit');
        x.set('reset', 1); x.run(5); x.set('reset', 0); x.run(20);
        near(x.v('u', '1_out'), 0.36, 0.05, 'after RESET: output low, held');
        // MEASURED 2026-11-24: x.mA('r1') < 0.05 -> observed 3.6e-10.
        assert.ok(x.mA('r1') < 0.05, 'red dark');
    });

    test('lab-opamp-click-whistle: the RATE pot turns clicks into a whistle', () => {
        const x = bench('lab-opamp-click-whistle');
        const slow = sample(x, 'u', '1_out', 250, 0.5);
        near(crossingsHz(slow.values, 3.75, 0.5), 12.6, 1.5, 'RATE up: clicks per second');
        x.set('rate', 0);
        x.run(6);
        const from = x.t;
        x.run(5);
        near(toneHz(x, 'spk', from), 626, 30, 'RATE down: whistle (Hz)');
    });

    test('lab-resistor-heating: the same 4 V overheats 47 Ω but not 100 Ω', () => {
        const x = bench('lab-resistor-heating');
        x.run(1);
        near(x.state('vm').reading, 3.38, 0.03, 'VOLTS at half: voltage (V)');
        near(x.state('am').reading * 1e3, 71.8, 1, '47 Ω: current (mA)');
        near(x.v('s47', 'base'), 0.678, 0.005, 'thermometer junction at 25 °C (V)');
        x.set('volts', 0.59);
        x.run(3500);
        const v = x.state('vm').reading, i = x.state('am').reading;
        near(v, 4.0, 0.05, '47 Ω at 4 V: voltage (V)');
        near(v * i, 0.34, 0.01, '47 Ω at 4 V: power (W)');
        near(x.tempC('r47'), 90.5, 3, '47 Ω at 4 V: resistor temperature (°C)');
        // MEASURED 2026-11-24: x.mA('rh47') > 4 -> observed 5.43.
        assert.ok(x.mA('rh47') > 4, 'HOT lamp of the 47 Ω lit');
        x.set('sel', 1);
        x.run(3500);
        const v2 = x.state('vm').reading, i2 = x.state('am').reading;
        near(v2, 4.0, 0.05, '100 Ω at 4 V: voltage (V)');
        near(v2 * i2, 0.16, 0.01, '100 Ω at 4 V: power (W)');
        near(x.tempC('r100'), 55.9, 3, '100 Ω at 4 V: resistor temperature (°C)');
        // MEASURED 2026-11-24: x.mA('rh100') + x.mA('rh47') < 0.05 -> observed 2e-11.
        assert.ok(x.mA('rh100') + x.mA('rh47') < 0.05, 'no HOT lamp: 100 Ω stays inside its quarter watt, 47 Ω has cooled');
    });

    test('lab-ammeter-overload: 1 V per amp on the meter, a tone above 1 A', () => {
        const x = bench('lab-ammeter-overload');
        x.run(2);
        // 0.1 A x 0.1 Ω x 10.1, less the − input's bias current (42.5 nA) x 91 kΩ = 3.9 mV.
        near(x.state('meter').reading, 0.097, 0.003, 'LAMP: 0.1 A reads 0.1 V');
        // MEASURED 2026-11-24: x.v('ct', 'a') < 0.7 -> observed 0.575.
        assert.ok(x.v('ct', 'a') < 0.7, 'no alarm: the diode holds the tone capacitor down');
        x.set('sheat', 1); x.run(2);
        near(x.state('meter').reading, 0.701, 0.01, 'LAMP + HEATER: 0.7 A');
        x.set('sshort', 1); x.run(2);
        near(x.state('meter').reading, 1.78, 0.02, 'everything on: 1.78 A, needle pegged');
        near(x.v('u', '2_out'), 7.5, 0.05, 'overload comparator high');
        const from = x.t + 2;
        x.run(8);
        near(toneHz(x, 'spk', from), 663, 30, 'overload tone (Hz)');
    });

    test('lab-opamp-adder-subtractor: the meters show A + B and A − B', () => {
        const x = bench('lab-opamp-adder-subtractor');
        x.run(1);
        near(x.v('u', '3_out'), 1.8, 0.01, 'A (V)');
        near(x.v('u', '4_out'), 0.9, 0.01, 'B (V)');
        near(x.v('u', '1_out'), 2.7, 0.01, 'A + B (V)');
        near(x.v('u', '2_out'), 0.9, 0.01, 'A − B (V)');
        x.set('kb', 0.9); x.run(2);
        near(x.v('u', '1_out'), 4.5, 0.01, 'B up to 2.7 V: A + B (V)');
        near(x.v('u', '2_out'), 0.01, 0.01, 'A − B would be −0.9 V: the single-supply output stops at the bottom');
    });

    test('lab-amp-configurations: common emitter inverts and amplifies, common collector follows, common base amplifies in phase', () => {
        const x = bench('lab-amp-configurations');
        x.run(60);
        const vin = [], ce = [], cc = [], cb = [];
        for (let i = 0; i < 100; i++) {
            x.run(0.02);
            vin.push(x.v('fg', 'out')); ce.push(x.v('qe', 'collector')); cc.push(x.v('qc', 'emitter')); cb.push(x.v('qb', 'collector'));
        }
        const pp = (a) => Math.max(...a) - Math.min(...a);
        const corr = (a, b) => {
            const ma = a.reduce((s, v) => s + v, 0) / a.length, mb = b.reduce((s, v) => s + v, 0) / b.length;
            let s = 0, sa = 0, sb = 0;
            for (let i = 0; i < a.length; i++) { s += (a[i] - ma) * (b[i] - mb); sa += (a[i] - ma) ** 2; sb += (b[i] - mb) ** 2; }
            return s / Math.sqrt(sa * sb);
        };
        const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
        near(mean(ce), 4.97, 0.2, 'common emitter: collector bias (V)');
        near(mean(cc), 3.62, 0.1, 'common collector: emitter bias (V)');
        near(mean(cb), 5.14, 0.2, 'common base: collector bias (V)');
        const gin = pp(vin);
        near(gin * 1e3, 16.4, 2, 'generator at the inputs (mV peak-to-peak)');
        near(pp(ce) / gin, 146, 20, 'common emitter: gain');
        near(pp(cc) / gin, 1.03, 0.04, 'common collector: gain');
        near(pp(cb) / gin, 18.5, 3, 'common base: gain');
        // MEASURED 2026-11-24: corr(vin, ce) < -0.9 -> observed -0.952.
        assert.ok(corr(vin, ce) < -0.9, 'common emitter turns the signal upside down');
        // MEASURED 2026-11-24: corr(vin, cc) > 0.9 -> observed 0.992.
        assert.ok(corr(vin, cc) > 0.9, 'common collector: in phase');
        // MEASURED 2026-11-24: corr(vin, cb) > 0.9 -> observed 0.990.
        assert.ok(corr(vin, cb) > 0.9, 'common base: in phase');
    });

    test('lab-hartley-oscillator: the tapped coil and 100 nF ring at about 3.9 kHz', () => {
        const x = bench('lab-hartley-oscillator');
        x.run(10);
        const s = sample(x, 'q', 'collector', 2, 0.005);
        const L = 0.01 + 0.001 + 2 * 0.9 * Math.sqrt(0.01 * 0.001);
        const f0 = 1 / (2 * Math.PI * Math.sqrt(L * 100e-9));
        near(crossingsHz(s.values, 9, 0.005), f0, 150, 'oscillation frequency against 1/(2π√LC) (Hz)');
        // MEASURED 2026-11-24: s.max > 15 -> observed 17.93.
        assert.ok(s.max > 15, `the collector swings to about twice the supply (${s.max} V)`);
    });

    test('lab-transistor-phase-shift: one transistor and three RC sections oscillate', () => {
        const x = bench('lab-transistor-phase-shift');
        x.run(20);
        const s = sample(x, 'q', 'collector', 6, 0.01);
        near(crossingsHz(s.values, 4.2, 0.01), 669, 30, 'frequency (Hz)');
        // MEASURED 2026-11-24: s.max - s.min > 5 -> observed 7.82.
        assert.ok(s.max - s.min > 5, 'a full swing, sustained');
    });

    test('lab-ac-voltmeter: average reads peak/π, PEAK reads the peak, the 100 mV range reads ten times finer', () => {
        const x = bench('lab-ac-voltmeter');
        x.run(25);
        const meter = (ms) => sample(x, 'meter', 'a', ms, 0.05).mean - x.v('meter', 'b');
        const osc = sample(x, 'u', '1_out', 2, 0.01);
        const peak = (osc.max - osc.min) / 2;
        near(peak, 1.83, 0.05, 'oscillator peak (V)');
        const avg = meter(3);
        near(avg / (peak / Math.PI), 0.969, 0.02, 'AVERAGE: close to peak/π (fraction)');
        x.set('mode', 1); x.run(15);
        const pk = meter(2);
        near(pk / peak, 0.996, 0.02, 'PEAK: the peak (fraction)');
        x.set('mode', 0); x.set('level', 0.05); x.set('range', 1); x.run(60);
        near(meter(3), 0.313, 0.02, '100 mV range, LEVEL at 5 % (92 mV peak), average (V)');
    });

    test('lab-opamp-flash-adc: the two LEDs count 00, 01, 10, 11 as the input rises', () => {
        const x = bench('lab-opamp-flash-adc');
        const code = () => `${x.mA('rhi') > 2 ? 1 : 0}${x.v('lo', 'anode') > 1.5 ? 1 : 0}`;
        for (const [pos, volts, want] of [[0.15, 0.86, '00'], [0.35, 2.0, '01'], [0.6, 3.43, '10'], [0.9, 5.09, '11']]) {
            x.set('knob', pos); x.run(2);
            near(x.v('knob', 'wiper'), volts, 0.05, `INPUT at ${pos} (V)`);
            assert.equal(code(), want, `${volts} V reads ${want}`);
        }
    });

    test('lab-log-roots: halving the logarithm takes the square root, a third the cube root', () => {
        const x = bench('lab-log-roots');
        // The LM324's input bias currents (about 45 nA out of each input) add to
        // the 1 µA reference and sit 0.24 mV on the buffer's divider input,
        // which the antilog transistor turns into close to 1 % more output.
        const BIAS_GAIN = 1.008;
        const read = () => {
            const vref = x.v('rv1', 'b');
            return { xin: (x.v('knob', 'wiper') - vref) / 42e3 * 1e6, iref: (9 - vref) / 4.3e6 * 1e6, out: (x.v('u', '3_out') - vref) / 100e3 * 1e6 };
        };
        for (const pos of [1, 0.64, 0.16]) {
            x.set('knob', pos); x.run(5);
            const r = read();
            near(r.out, BIAS_GAIN * Math.sqrt(r.xin * r.iref), 0.05, `square root of ${r.xin.toFixed(1)} (µA)`);
        }
        x.set('root', 1);
        for (const pos of [1, 0.64]) {
            x.set('knob', pos); x.run(5);
            const r = read();
            near(r.out, BIAS_GAIN * Math.cbrt(r.xin * r.iref * r.iref), 0.05, `cube root of ${r.xin.toFixed(1)} (µA)`);
        }
        x.set('knob', 1); x.run(5);
        near(read().out, 4.6, 0.1, 'cube root of 100 µA·(1 µA)² read on the meter (µA)');
    });

    test('lab-opamp-binary-counter: the clock counts 00, 01, 10, 11, 00 on two LEDs; RESET clears', () => {
        const x = bench('lab-opamp-binary-counter');
        const bits = () => `${x.mA('rla2') > 2 ? 1 : 0}${x.mA('rla') > 2 ? 1 : 0}`;
        x.run(20);
        x.set('reset', 1); x.run(20);
        assert.equal(bits(), '00', 'RESET: 00');
        x.set('reset', 0);
        // Each falling clock edge advances the count; read it 30 ms after.
        const seen = [];
        let high = x.v('u', '1_out') > 3.75;
        while (seen.length < 5 && x.t < 1200) {
            x.run(5);
            const h = x.v('u', '1_out') > 3.75;
            if (high && !h) { x.run(30); seen.push(bits()); }
            high = x.v('u', '1_out') > 3.75;
        }
        assert.deepEqual(seen, ['01', '10', '11', '00', '01']);
    });

    test('lab-tone-control: BASS lifts and cuts 100 Hz, TREBLE 5 kHz; the other note is untouched', () => {
        const run = (which, bass, treble) => {
            const off = which === 'bass' ? 'gh' : 'gl';
            const x = bench('lab-tone-control', (json, ids) => {
                json.parts.find(p => p.id === ids[off]).params.amplitude = 0;
                json.parts.find(p => p.id === ids.bass).params.position = bass;
                json.parts.find(p => p.id === ids.treble).params.position = treble;
            });
            const hf = which === 'treble';
            x.run(hf ? 6 : 20);
            const step = hf ? 0.01 : 0.1, ms = hf ? 1 : 10;
            const i = sample(x, 'u', '1_out', ms, step), o = sample(x, 'u', '2_out', ms, step);
            return (o.max - o.min) / (i.max - i.min);
        };
        near(run('bass', 0.5, 0.5), 1.0, 0.02, 'flat: 100 Hz gain');
        near(run('bass', 1, 0.5), 4.9, 0.3, 'BASS up: 100 Hz gain');
        near(run('bass', 0, 0.5), 0.20, 0.03, 'BASS down: 100 Hz gain');
        near(run('treble', 0.5, 0.5), 1.0, 0.03, 'flat: 5 kHz gain');
        near(run('treble', 0.5, 1), 9.7, 0.6, 'TREBLE up: 5 kHz gain');
        near(run('treble', 0.5, 0), 0.28, 0.04, 'TREBLE down: 5 kHz gain');
        near(run('treble', 1, 0.5), 1.0, 0.05, 'BASS up leaves 5 kHz alone');
    });

    test('lab-siren-canary: the slow ramp glides the pitch up and down (siren) or only up, again and again (canary)', () => {
        // The ramp, watched with SOUND off: how long the capacitor climbs
        // (output high) and falls (output low).
        const ramp = (mode) => {
            const x = bench('lab-siren-canary', withParams('mode', { position: mode }));
            x.set('sound', 0);
            const edges = [];
            let high = true;
            while (x.t < 1500 && edges.length < 5) {
                x.run(mode ? 1 : 5);
                const h = x.v('u', '1_out') > 3.75;
                if (h !== high) { edges.push([x.t, h]); high = h; }
            }
            const up = [], down = [];
            for (let i = 1; i < edges.length; i++) (edges[i][1] ? down : up).push(edges[i][0] - edges[i - 1][0]);
            return { x, up: up[0], down: down[0] };
        };
        const siren = ramp(0);
        near(siren.up, 380, 25, 'siren: rising glide (ms)');
        near(siren.down, 285, 25, 'siren: falling glide (ms)');
        const canary = ramp(1);
        near(canary.up, 378, 25, 'canary: rising glide (ms)');
        near(canary.down, 3, 3, 'canary: drops back at once (ms)');
        // The pitch at the bottom and the top of the siren's ramp: SOUND on
        // for 10 ms just after the capacitor turns (bottom) and just before
        // it turns again (top). The tone is read BEFORE SOUND opens again:
        // opening it is not an oscillation edge. Until bw-board 97ba173a (event
        // solves hold the devices' own charge, in pin 9de91e31) that switch
        // action jumped the coupling capacitor's charge, the loudspeaker
        // recorded an edge at the instant of opening, and it was counted as a
        // fourth half-period: 551 / 726 Hz. The multivibrator's own periods,
        // unchanged across that engine change, are 1.95 ms at the bottom
        // (MEASURED 2026-11-26: 1.889, 1.966, 1.956, 1.947 ms) and give
        // 513 / 684 Hz.
        const x = bench('lab-siren-canary');
        x.set('sound', 0);
        const pitchNow = () => { x.set('sound', 1); x.run(3); const from = x.t; x.run(7); const hz = toneHz(x, 'spk', from); x.set('sound', 0); return hz; };
        while (x.v('u', '1_out') > 3.75) x.run(5);
        while (x.v('u', '1_out') < 3.75) x.run(5);
        const low = pitchNow();
        near(x.v('u', '2_out'), 3.03, 0.1, 'bottom of the ramp: base return (V)');
        while (x.v('ct', 'pos') < 5.25) x.run(5);
        const high = pitchNow();
        near(x.v('u', '2_out'), 7.14, 0.1, 'top of the ramp: base return (V)');
        near(low, 513, 30, 'bottom of the ramp: pitch (Hz)');
        near(high, 684, 30, 'top of the ramp: pitch (Hz)');
        near(high / low, 1.33, 0.05, 'the glide spans about a fourth');
    });

    test('lab-transistor-thermometer: 50 mV per kelvin on the meter, the relay heats below SET', () => {
        const x = bench('lab-transistor-thermometer');
        x.run(20);
        near(x.v('u', '1_out'), 1.234, 0.03, '25 °C reads 1.23 V (25 on the 0–100 scale)');
        assert.equal(x.state('k').energized, true, 'colder than SET (49 °C): heater on');
        x.param('sensor', 'surroundC', 70);
        x.run(4000);
        near(x.tempC('sensor'), 69.3, 1, 'junction temperature after 4 s (°C)');
        near(x.v('u', '1_out'), 3.446, 0.05, 'near 70 °C reads 3.45 V');
        assert.equal(x.state('k').energized, false, 'warmer than SET: heater off');
    });

    test('lab-two-tone-horn: the slow astable switches the multivibrator between two pitches', () => {
        const x = bench('lab-two-tone-horn');
        x.run(3);
        near(x.v('u', '2_out'), 7.14, 0.05, 'first half: base return (V)');
        let from = x.t; x.run(7);
        const a = toneHz(x, 'spk', from);
        near(a, 770, 30, 'first pitch (Hz)');
        x.set('sound', 0);
        while (x.v('u', '1_out') > 3.75 && x.t < 1500) x.run(10);
        near(x.t, 630, 40, 'the slow astable changes over (ms)');
        near(x.v('u', '2_out'), 4.22, 0.05, 'second half: base return (V)');
        x.set('sound', 1); x.run(3);
        from = x.t; x.run(7);
        const b = toneHz(x, 'spk', from);
        near(b, 627, 30, 'second pitch (Hz)');
        near(a / b, 1.23, 0.05, 'the step between them');
    });

    test('lab-led-tester: a high tone for an open circuit, a low one for a short, silence when the LED is fine', () => {
        const x = bench('lab-led-tester');
        x.run(3);
        near(x.v('rp1', 'b'), 0.91, 0.03, 'LED fine: probe (halved) (V)');
        near(x.v('u', '3_out'), 0.01, 0.02, 'LED fine: the multivibrator gets no base current');
        x.set('brk', 0); x.run(4);
        let from = x.t; x.run(6);
        near(toneHz(x, 'spk', from), 717, 30, 'BREAK: high tone (Hz)');
        x.set('brk', 1); x.set('short', 1); x.run(4);
        from = x.t; x.run(6);
        near(toneHz(x, 'spk', from), 602, 30, 'SHORT: low tone (Hz)');
        x.set('short', 0); x.run(8);
        const n = (x.state('spk')?._edges ?? []).length;
        x.run(4);
        assert.equal((x.state('spk')?._edges ?? []).length, n, 'LED fine again: silent');
    });

    test('lab-moisture-beeper: dry is dark and silent, wet lights the LED and beeps', () => {
        const x = bench('lab-moisture-beeper');
        x.run(2);
        // MEASURED 2026-11-24: x.mA('rl') < 0.1 -> observed 0.031.
        assert.ok(x.mA('rl') < 0.1, 'dry: LED dark');
        near(x.v('q2', 'collector'), 0.1, 0.05, 'dry: the multivibrator base return held low (V)');
        x.set('wet', 1); x.run(3);
        const from = x.t; x.run(6);
        // MEASURED 2026-11-24: x.mA('rl') > 5 -> observed 7.11.
        assert.ok(x.mA('rl') > 5, 'wet: LED lit');
        near(toneHz(x, 'spk', from), 785, 30, 'wet: tone (Hz)');
    });

    test('lab-voice-canceller: left minus right removes what is in both channels', () => {
        const voiceOnly = (json, ids) => { for (const g of ['gg', 'gf']) json.parts.find(p => p.id === ids[g]).params.amplitude = 0; };
        const x = bench('lab-voice-canceller', voiceOnly);
        x.run(5);
        const l = sample(x, 'u', '1_out', 10, 0.05), d = sample(x, 'u', '3_out', 10, 0.05);
        near(l.max - l.min, 1.0, 0.02, 'voice alone: left channel (V p-p)');
        // MEASURED 2026-11-24: d.max - d.min < 0.01 -> observed 0.000002.
        assert.ok(d.max - d.min < 0.01, 'voice alone: the difference is silent');
        const y = bench('lab-voice-canceller', (json, ids) => { json.parts.find(p => p.id === ids.gv).params.amplitude = 0; });
        y.run(5);
        const d2 = sample(y, 'u', '3_out', 20, 0.05);
        near(d2.max - d2.min, 1.96, 0.1, 'instruments alone: they pass the difference (V p-p)');
    });

    test('lab-bounce-counter: a bouncing button counts several times, the debounced one once', () => {
        const x = bench('lab-bounce-counter');
        const count = () => ['qb', 'qc', 'qd'].reduce((a, q, i) => a + (x.v('cnt', q) > 2.5 ? 1 << i : 0), 0);
        x.run(5);
        x.set('reset', 1); x.run(1); x.set('reset', 0); x.run(1);
        assert.equal(count(), 0, 'RESET: 0');
        x.set('bouncy', 1); x.run(20);
        assert.equal(count(), 4, 'one press of the bouncing button: four counts');
        x.set('bouncy', 0); x.run(20);
        assert.equal(count(), 7, 'its release: three more');
        x.set('src', 1); x.run(5);
        x.set('reset', 1); x.run(1); x.set('reset', 0); x.run(5);
        assert.equal(count(), 0, 'CLEAN selected, RESET: 0');
        for (let k = 1; k <= 3; k++) {
            x.set('clean', 1); x.run(20); x.set('clean', 0); x.run(200);
            assert.equal(count(), k, `debounced press ${k}: exactly one count each`);
        }
    });

    test('lab-comb-jet-spark: the comb pulls the jet out of the beam; combing sparks across the gap', () => {
        const x = bench('lab-comb-jet-spark');
        x.run(1);
        // MEASURED 2026-11-24: x.mA('rbl') < 0.05 -> observed 4.8e-5.
        assert.ok(x.mA('rbl') < 0.05, 'comb far away: the jet shadows the beam, BEAM dark');
        x.set('jet', 1); x.run(2);
        // MEASURED 2026-11-24: x.mA('rbl') > 4 -> observed 6.98.
        assert.ok(x.mA('rbl') > 4, 'comb at 1 cm: the jet bends away, BEAM lit');
        const neg = bench('lab-comb-jet-spark', withParams('jet', { combKv: -10 }));
        neg.set('jet', 1); neg.run(2);
        near(neg.mA('rbl'), x.mA('rbl'), 0.01, 'a negative comb pulls the jet just as hard (mA)');
        x.set('comb', 0);
        let flash = 0, at = [];
        let n = 0;
        while (x.t < 1000) {
            x.run(5);
            const s = x.state('gap').sparks;
            if (s > n) { at.push(x.t); n = s; }
            flash = Math.max(flash, x.mA('rfl'));
        }
        assert.equal(n, 2, `two sparks in a second of combing (${at})`);
        near(at[1] - at[0], 430, 15, 'time between sparks, C·4.35 kV / 100 nA (ms)');
        // MEASURED 2026-11-24: flash > 2 -> observed 6.36.
        assert.ok(flash > 2, 'each spark flashes the yellow LED');
        x.set('comb', 1); x.run(600);
        assert.equal(x.state('gap').sparks, 2, 'resting: no more sparks');
    });
});
