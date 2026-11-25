/**
 * The round-6 "r6f" benches from `scripts/gen-lab-circuits-4.mjs --set=r6f`
 * do what their EXPECTED.md says: measured on the COMMITTED circuit.json,
 * with the stimuli a learner would set (a pot, a button, a switch, the light
 * slider of a phototransistor, a light path's knob, the temperature of a PTC
 * sensor's surroundings, the humidity at a salt-film comb, the field at a
 * Hall sensor, the load on a ruler scale or on a motor's shaft).
 *
 * Readouts come from the engine's own surfaces: node voltages, the device
 * state (cd4046 vcoHz, ptc_sensor ohms, bending_ruler fieldMt, the motor's
 * omega, the relay's energized flag, the meter's reading), buzzerTone() and
 * the optical report. Oscillators at audio rates cost real time — a 4046
 * locked to a two-transistor astable costs seconds of wall time per
 * simulated millisecond — so every audio scenario keeps to a few tens of
 * milliseconds. A thermal scenario shortens the sensor's own time constant
 * (params.thermalTau) only where an oscillator would otherwise have to run
 * through seconds of warming; the thresholds do not depend on it.
 *
 * Every number below was measured on the headless engine (bw-board f4aaec43,
 * bw-circuit-ui 141b2cc) when the bench was built; the tolerances are bands
 * around those measurements.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r6f.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (round 6, r6f)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

/** Load a committed bench, its role params edited first ({role: {key: value}}). */
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
        const key = `${name}.${term}`;
        if (!nets.has(key)) {
            const n = b.getNets().find(n => n.terminals.some(x => x.part === ids[name] && x.terminal === term));
            assert.ok(n, `${id}: no net for ${key}`);
            nets.set(key, n.id);
        }
        return nets.get(key);
    };
    const api = {
        c, b, ids,
        v (name, term) { return b.nodeVoltages.get(netOf(name, term)) ?? 0; },
        /** Voltage across a two-lead part (a minus b, or anode minus cathode). */
        across (name, a = 'a', k = 'b') { return api.v(name, a) - api.v(name, k); },
        tone (name) { return b.buzzerTone(ids[name]); },
        state (name) { return b.getDeviceState(ids[name]); },
        light (name) { return b.opticalReport()?.receivers[ids[name]]?.light ?? 0; },
        /** Advance `ms`, in steps of at most 1 ms (one advance has a bounded step budget). */
        run (ms) {
            const end = tMs + ms;
            while (tMs < end - 1e-9) {
                tMs = Math.min(end, tMs + 1);
                b.advanceTo(BigInt(Math.round(tMs * 1e6)));
                assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
            }
        },
        set (name, value) { b.setControl(ids[name], value); },
        param (name, key, value) { b.setPartParam(ids[name], key, value); },
        get t () { return tMs; },
        /** Lowest and highest value of f() sampled every `step` ms for `ms` ms. */
        span (f, ms, step = 0.05) {
            let lo = Infinity; let hi = -Infinity;
            for (let s = 0; s < ms - 1e-9; s += step) { api.run(step); const y = f(); lo = Math.min(lo, y); hi = Math.max(hi, y); }
            return { lo, hi, pp: hi - lo };
        },
        /** Frequency (Hz) of f() crossing `level` upwards, sampled every `step` ms for `ms` ms. */
        hz (f, level, ms, step = 0.02) {
            let last = f() > level; let first = null; let lastRise = null; let n = 0;
            for (let s = 0; s < ms - 1e-9; s += step) {
                api.run(step);
                const up = f() > level;
                if (up && !last) { n++; if (first === null) first = tMs; lastRise = tMs; }
                last = up;
            }
            return n >= 2 ? (n - 1) / ((lastRise - first) / 1000) : 0;
        },
        /** hz() of two signals over the same window. */
        hzPair (fa, fb, level, ms, step = 0.02) {
            const st = [fa, fb].map(f => ({ f, last: f() > level, first: null, lastRise: null, n: 0 }));
            for (let s = 0; s < ms - 1e-9; s += step) {
                api.run(step);
                for (const c of st) {
                    const up = c.f() > level;
                    if (up && !c.last) { c.n++; if (c.first === null) c.first = tMs; c.lastRise = tMs; }
                    c.last = up;
                }
            }
            return st.map(c => (c.n >= 2 ? (c.n - 1) / ((c.lastRise - c.first) / 1000) : 0));
        },
        /** Fraction of samples (every `step` ms over `ms` ms) where f() is true. */
        frac (f, ms, step = 0.05) {
            let on = 0; let n = 0;
            for (let s = 0; s < ms - 1e-9; s += step) { api.run(step); n++; if (f()) on++; }
            return on / n;
        },
    };
    return api;
}

// R6HT_OBSERVE=1 prints every measured value beside its claim (used to write
// the MEASURED notes and the EXPECTED.md tables).
const OBSERVE = Boolean(process.env.R6HT_OBSERVE);
const near = (got, want, tol, what) => {
    if (OBSERVE) console.log(`OBSERVE near ${what}: ${got} (claim ${want} +-${tol})`);
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);
};
/** Pass a bounded value through, printing it when observing. */
const seen = (what, v) => { if (OBSERVE) console.log(`OBSERVE seen ${what}: ${v}`); return v; };

describe('round-6 r6f benches behave as documented', { skip: SKIP }, () => {
    test('lab-led-colour-blind: a red LED sensor sees green light, a green one does not see red', () => {
        // Transimpedance amplifier, 1 MOhm: output = photocurrent x 1 MOhm.
        const x = bench('lab-led-colour-blind');
        const out = () => x.v('u', '1_out');
        x.run(2);
        near(out(), 0.452, 0.02, 'as built: red lamp, red sensor (V)');
        x.set('swr', 0); x.run(2);
        // MEASURED 2026-11-24: out() < 0.02 -> observed 0.005 (both lamps off).
        assert.ok(seen('colour dark', out()) < 0.02, `dark: ${out()}`);
        x.set('swr', 1); x.run(2);
        x.set('sel', 1); x.run(2);
        // MEASURED 2026-11-24: out() < 0.02 -> observed 0.005 (red lamp, green sensor).
        assert.ok(seen('colour red->green sensor', out()) < 0.02, `red lamp, green sensor: ${out()}`);
        x.set('swr', 0); x.set('swg', 1); x.run(2);
        near(out(), 0.162, 0.01, 'green lamp, green sensor (V)');
        x.set('sel', 0); x.run(2);
        near(out(), 0.888, 0.03, 'green lamp, red sensor (V)');
    });

    test('lab-led-power-curve: radiated power grows in proportion to the LED current', () => {
        // Photodiode into a 22 kOhm transimpedance amplifier: V = I_photo x 22 kOhm.
        const read = (sel, position) => {
            const x = bench('lab-led-power-curve', { sel: { position: sel }, cur: { position } });
            x.run(2);
            return { mA: x.state('am').reading * 1e3, v: x.v('u', '1_out') };
        };
        const red = [0, 0.5, 0.8, 1].map(p => read(0, p));
        near(red[0].mA, 1.505, 0.03, 'red, pot at the far end (mA)');
        near(red[3].mA, 31.5, 0.5, 'red, pot fully in (mA)');
        for (const r of red) near(r.v / r.mA, 0.197, 0.004, `red: volts per mA at ${r.mA.toFixed(2)} mA`);
        const green = [0.5, 1].map(p => read(1, p));
        for (const g of green) near(g.v / g.mA, 0.0556, 0.002, `green: volts per mA at ${g.mA.toFixed(2)} mA`);
    });

    test('lab-light-thyristor: a flash of light latches the LED on; only the main switch resets it', () => {
        const x = bench('lab-light-thyristor');
        const mA = () => x.across('rl');
        x.run(10);
        // MEASURED 2026-11-24: mA() < 0.01 -> observed -1.8e-15 (dark room, off).
        assert.ok(seen('thyristor dark mA', mA()) < 0.01, `dark: ${mA()}`);
        x.set('pt', 0.05); x.run(10);
        // MEASURED 2026-11-24: mA() < 0.01 -> observed 5.5e-5 (dim light 0.05 does not fire it).
        assert.ok(seen('thyristor dim mA', mA()) < 0.01, `dim light: ${mA()}`);
        x.set('pt', 0.3); x.run(2); x.set('pt', 0); x.run(50);
        near(mA(), 6.52, 0.2, 'after a flash the LED stays on (mA)');
        x.set('main', 0); x.run(20); x.set('main', 1); x.run(50);
        // MEASURED 2026-11-24: mA() < 0.01 -> observed -1.8e-15 (main switch off and on).
        assert.ok(seen('thyristor reset mA', mA()) < 0.01, `reset: ${mA()}`);
    });

    test('lab-fibre-proximity: the relay pulls in as the fibre ends meet and drops out further apart', () => {
        const x = bench('lab-fibre-proximity');
        const sweep = (knobs) => knobs.map(k => { x.set('gap', k); x.run(30); return x.state('k').energized; });
        // knob 0..1 = joint gap 0..5 mm
        assert.deepEqual(sweep([0.04, 0.2, 0.3, 0.4, 1]), [true, true, true, false, false], 'opening the gap');
        assert.deepEqual(sweep([0.4, 0.3, 0.2, 0.04]), [false, false, true, true], 'closing it again');
        near(x.v('pt', 'emitter'), 8.97, 0.05, 'ends touching: phototransistor emitter (V)');
    });

    test('lab-ruler-scale: grams on the ruler, volts on the meter, not in proportion', () => {
        const out = {};
        for (const g of [0, 20, 50, 100]) {
            const x = bench('lab-ruler-scale', { ruler: { loadG: g } });
            x.run(2);
            out[g] = { v: x.v('u', '1_out'), mT: x.state('ruler').fieldMt, mm: x.state('ruler').distanceMm };
        }
        near(out[0].mT, 1.28, 0.01, 'no load: field at the sensor (mT)');
        near(out[100].mm, 12.74, 0.02, '100 g: magnet distance (mm)');
        near(out[0].v, 0.018, 0.02, 'no load: meter (V)');
        near(out[20].v, 0.252, 0.03, '20 g: meter (V)');
        near(out[50].v, 0.873, 0.04, '50 g: meter (V)');
        near(out[100].v, 4.25, 0.1, '100 g: meter (V)');
        // MEASURED 2026-11-24: (out[100].v - out[50].v) / (out[50].v - out[0].v) > 3 -> observed 3.95.
        assert.ok(seen('ruler ratio', (out[100].v - out[50].v) / (out[50].v - out[0].v)) > 3, 'the second 50 g move the needle much further than the first');
    });

    test('lab-ptc-bridge: balanced at room temperature; warmer reads right and lights red', () => {
        const at = (T) => {
            const x = bench('lab-ptc-bridge', { ptc: { surroundC: T } });
            x.run(300);
            return { meter: x.state('meter').reading, out: x.v('a', 'vout'), ohms: x.state('ptc').ohms,
                red: x.across('red', 'anode', 'cathode'), green: x.across('green', 'anode', 'cathode') };
        };
        const cold = at(15); const room = at(25); const warm = at(35);
        near(room.ohms, 2000, 2, '25 C: sensor (Ohm)');
        near(warm.ohms, 2160, 2, '35 C: sensor (Ohm)');
        near(room.meter * 1e3, 0, 2, '25 C: meter (mV)');
        near(cold.meter * 1e3, -22, 3, '15 C: meter (mV)');
        near(warm.meter * 1e3, 23, 3, '35 C: meter (mV)');
        near(cold.out, 0.9, 0.05, '15 C: comparator low');
        near(warm.out, 8.1, 0.05, '35 C: comparator high');
        // MEASURED 2026-11-24: cold.green > 1.8 && cold.red < 1 -> observed green 2.01, red 0.90.
        assert.ok(seen('bridge cold green', cold.green) > 1.8 && seen('bridge cold red', cold.red) < 1, '15 C: green on, red off');
        // MEASURED 2026-11-24: warm.red > 1.6 && warm.green < 1 -> observed red 1.71, green 0.90.
        assert.ok(seen('bridge warm red', warm.red) > 1.6 && seen('bridge warm green', warm.green) < 1, '35 C: red on, green off');
    });

    test('lab-ptc-thermometer: 15 to 25 C spread over the whole meter', () => {
        const at = (T) => { const x = bench('lab-ptc-thermometer', { ptc: { surroundC: T } }); x.run(3000); return x.v('u', '1_out'); };
        const v15 = at(15); const v20 = at(20); const v25 = at(25);
        near(v15, 0.092, 0.1, '15 C (V)');
        near(v20, 2.30, 0.1, '20 C (V)');
        near(v25, 4.53, 0.1, '25 C (V)');
        near((v25 - v15) / 10, 0.443, 0.02, 'volts per kelvin');
    });

    test('lab-brake-light-check: a dark brake lamp latches the red fault light; reset clears it', () => {
        const x = bench('lab-brake-light-check');
        const fault = () => x.v('g', '2y') > 4.5;
        const red = () => x.across('red', 'anode', 'cathode');
        const green = () => x.across('green', 'anode', 'cathode');
        const press = (b) => { x.set(b, 1); x.run(50); x.set(b, 0); x.run(50); };
        x.run(5); press('reset');
        assert.equal(fault(), false, 'after reset: no fault');
        press('pedal');
        assert.equal(fault(), false, 'pedal with a good lamp: still no fault');
        // MEASURED 2026-11-24: green() > 1.8 && red() < 1 -> observed green 2.02, red 0.69.
        assert.ok(seen('brake ok green', green()) > 1.8 && seen('brake ok red', red()) < 1, 'green light on');
        x.set('bulb', 1); x.run(5);
        press('pedal');
        assert.equal(fault(), true, 'pedal with a blown lamp: fault latched');
        // MEASURED 2026-11-24: red() > 1.6 && green() < 1 -> observed red 1.72, green 0.99.
        assert.ok(seen('brake fault red', red()) > 1.6 && seen('brake fault green', green()) < 1, 'red light on, after the pedal is released');
        press('reset');
        assert.equal(fault(), false, 'reset clears it');
    });
    test('lab-pll-vco: the pot sets the 4046 VCO pitch, 114 Hz plus 118 Hz per volt', () => {
        // f = V(vco_in) / (2 R1 C1 VDD) + (VDD/2) / R2 / (2 C1 VDD), R1 47k, R2 220k, C1 10 nF.
        for (const [pos, hz] of [[0.2, 326.4], [0.8, 964.4]]) {
            const x = bench('lab-pll-vco', { pot: { position: pos } });
            x.run(12);
            near(x.v('u', 'vco_in'), 9 * pos, 0.01, `pot at ${pos}: control voltage (V)`);
            near(x.state('u').vcoHz, hz, 3, `pot at ${pos}: VCO (Hz)`);
            assert.equal(x.tone('spk').on, true, `pot at ${pos}: the speaker sounds`);
        }
    });

    test('lab-pll-light-tone: more light on the phototransistor, higher pitch', () => {
        // V(vco_in) = light x 5 mA x 3.3 kOhm; f = 118.2 Hz/V x V + 53 Hz.
        const x = bench('lab-pll-light-tone');
        x.run(10);
        near(x.v('u', 'vco_in'), 3.30, 0.03, 'as built, light 0.2: control voltage (V)');
        near(x.state('u').vcoHz, 443.6, 4, 'light 0.2: VCO (Hz)');
        x.set('pt', 0.3); x.run(10);
        near(x.state('u').vcoHz, 639.1, 5, 'light 0.3: VCO (Hz)');
        near(x.tone('spk').hz, 639.1, 8, 'light 0.3: speaker pitch (Hz)');
        x.set('pt', 0.1); x.run(10);
        near(x.state('u').vcoHz, 248.3, 4, 'light 0.1: VCO (Hz)');
    });

    test('lab-pll-sound-machine: a square wave makes the VCO warble, a triangle makes it glide', () => {
        const sweep = (sel) => {
            const x = bench('lab-pll-sound-machine', { sel: { position: sel } });
            x.run(5);
            const still = x.state('u').vcoHz;
            x.set('mod', 1);
            const hz = [];
            for (let i = 0; i < 40; i++) { x.run(1); hz.push(Math.round(x.state('u').vcoHz)); }
            return { still, hz: hz.slice(10) };
        };
        const sq = sweep(0);
        near(Math.min(...sq.hz), 500, 15, 'square: low tone (Hz)');
        near(Math.max(...sq.hz), 793, 15, 'square: high tone (Hz)');
        const two = sq.hz.filter(h => Math.abs(h - 500) < 15 || Math.abs(h - 793) < 15).length / sq.hz.length;
        // MEASURED 2026-11-24: share of readings within 15 Hz of either tone > 0.7 -> observed 0.8 (the rest straddle a jump).
        assert.ok(seen('square: share at the two tones', two) > 0.7, 'square: the pitch jumps between two tones');
        const tri = sweep(1);
        const distinct = new Set(tri.hz.map(h => Math.round(h / 10))).size;
        // MEASURED 2026-11-24: distinct 10-Hz bins over 30 ms > 10 -> observed 17.
        assert.ok(seen('triangle: distinct pitches', distinct) > 10, 'triangle: the pitch glides through many values');
        near(Math.max(...tri.hz) - Math.min(...tri.hz), 235, 40, 'triangle: glide span (Hz)');
    });

    test('lab-lamp-hum: the mains lamp hums at 100 Hz, the torch is silent', () => {
        const mains = bench('lab-lamp-hum');
        mains.run(30);
        const hz = mains.hz(() => mains.v('a', 'vout'), 4.5, 40, 0.1);
        near(hz, 100, 3, 'mains lamp: hum frequency (Hz)');
        const m = mains.span(() => mains.v('a', 'vout'), 10, 0.1);
        // MEASURED 2026-11-24: m.pp > 5 -> observed 7.04 (amplifier output swing, V).
        assert.ok(seen('mains: output swing (V)', m.pp) > 5, `mains: output swing ${m.pp}`);
        const torch = bench('lab-lamp-hum', { src: { position: 1 } });
        torch.run(30);
        const q = torch.span(() => torch.v('a', 'vout'), 10, 0.1);
        // MEASURED 2026-11-24: q.pp < 0.05 -> observed 1.6e-6 (torch: steady light, no hum).
        assert.ok(seen('torch: output swing (V)', q.pp) < 0.05, `torch: output swing ${q.pp}`);
    });

    test('lab-barcode-pen: white paper is silent, a black bar lights the LED and sounds the tone', () => {
        const x = bench('lab-barcode-pen');
        x.run(5);
        const w = x.span(() => x.v('a', 'vout'), 5);
        // MEASURED 2026-11-24: w.pp < 0.1 -> observed 0.019 (white: oscillator clamped).
        assert.ok(seen('white: oscillator swing (V)', w.pp) < 0.1, `white: swing ${w.pp}`);
        // MEASURED 2026-11-24: bar LED < 1.5 V -> observed 1.19 (white: LED dark).
        assert.ok(seen('white: bar LED (V)', x.across('bar', 'anode', 'cathode')) < 1.5, 'white: bar LED off');
        x.set('pen', 1); x.run(5);
        near(x.across('bar', 'anode', 'cathode'), 1.92, 0.05, 'black bar: bar LED (V)');
        const hz = x.hz(() => x.v('a', 'vout'), 4.5, 15);
        near(hz, 413, 25, 'black bar: tone (Hz)');
        x.set('pen', 0); x.run(5);
        const back = x.span(() => x.v('a', 'vout'), 5);
        // MEASURED 2026-11-24: back.pp < 0.1 -> observed 0.009 (white again: silent).
        assert.ok(seen('white again: oscillator swing (V)', back.pp) < 0.1, `white again: swing ${back.pp}`);
    });

    test('lab-tail-light-fibre: silent while the lamp glows, a tone when the bulb is blown', () => {
        const x = bench('lab-tail-light-fibre');
        x.run(2);
        // MEASURED 2026-11-24: lights off swing < 0.05 -> observed 6e-7 (everything unpowered).
        assert.ok(seen('lights off: swing (V)', x.span(() => x.v('a', 'vout'), 3).pp) < 0.05, 'lights off: silent');
        x.set('lights', 1); x.run(5);
        // MEASURED 2026-11-24: bulb OK swing < 0.1 -> observed 0.019 (oscillator clamped).
        assert.ok(seen('bulb OK: swing (V)', x.span(() => x.v('a', 'vout'), 5).pp) < 0.1, 'bulb OK: silent');
        x.set('bulb', 1); x.run(5);
        near(x.hz(() => x.v('a', 'vout'), 4.5, 15), 413, 25, 'bulb blown: warning tone (Hz)');
    });

    test('lab-lens-beam-link: at 3 m the lens delivers several times the signal', () => {
        const swing = (edits) => {
            const x = bench('lab-lens-beam-link', edits);
            x.run(5);
            return { pt: x.span(() => x.v('pt', 'emitter'), 3).pp, out: x.span(() => x.v('q2', 'collector'), 3).pp };
        };
        const lens = swing();
        const bare = swing({ beam: { lensFocalCm: 0 } });
        near(lens.pt, 0.137, 0.02, 'with the lens: phototransistor swing (V)');
        near(bare.pt, 0.0124, 0.003, 'without: phototransistor swing (V)');
        // MEASURED 2026-11-24: lens.out / bare.out > 2 -> observed 3.27 (receiver output swing ratio).
        assert.ok(seen('receiver swing ratio', lens.out / bare.out) > 2, `receiver: ${lens.out} vs ${bare.out}`);
    });

    test('lab-pll-light-gate: the beam holds the VCO off; breaking it sounds a 500 Hz alarm', () => {
        const x = bench('lab-pll-light-gate');
        x.run(20);
        // MEASURED 2026-11-24: INH > 5.5 V -> observed 6.48 (pulses keep the hold capacitor charged).
        assert.ok(seen('beam: INH (V)', x.v('u', 'inh')) > 5.5, 'beam: inhibit held high');
        const e0 = x.state('u').edges;
        x.run(5);
        assert.equal(x.state('u').edges, e0, 'beam: the VCO does not run');
        x.set('beam', 1);
        x.run(15);
        // MEASURED 2026-11-24: INH < 4 V -> observed 3.39 at 15 ms (hold capacitor run down).
        assert.ok(seen('blocked: INH (V)', x.v('u', 'inh')) < 4, 'blocked: inhibit released');
        near(x.state('u').vcoHz, 500.5, 3, 'blocked: alarm pitch (Hz)');
        x.set('beam', 0); x.run(20);
        const e1 = x.state('u').edges; x.run(5);
        assert.equal(x.state('u').edges, e1, 'beam restored: silent again');
    });

    test('lab-ptc-tone-bridge: the earphone falls silent at balance', () => {
        const pp = (T) => {
            const x = bench('lab-ptc-tone-bridge', { ptc: { surroundC: T } });
            x.run(10);
            return x.span(() => x.across('ear'), 3).pp;
        };
        // MEASURED 2026-11-24: pp(25) < 0.002 -> observed 0.0004 (balanced: silent).
        assert.ok(seen('25 C: earphone p-p (V)', pp(25)) < 0.002, '25 C: balanced');
        near(pp(35), 0.135, 0.015, '35 C: earphone p-p (V)');
        near(pp(15), 0.143, 0.015, '15 C: earphone p-p (V)');
        near(pp(50), 0.318, 0.03, '50 C: earphone p-p (V)');
    });

    test('lab-pll-lock: the VCO locks onto the transistor astable; out of range the red LED lights', () => {
        // Astable frequency from its collector, VCO frequency from the 4046.
        const x = bench('lab-pll-lock');
        // The loop rings for about 30 ms before it settles (VCO 777, 763,
        // 732, 734, 741 Hz in successive 6 ms windows against a 739 Hz astable).
        x.run(30);
        // Over the same 6 ms, from rising edges of the astable's collector and
        // of VCO_OUT (the 4046's last single period jitters with every PC2 correction).
        const [ref, vco] = x.hzPair(() => x.v('q2', 'collector'), () => x.v('u', 'vco_out'), 4.5, 6, 0.01);
        near(ref, 739, 20, 'as built: astable (Hz)');
        near(vco, ref, 0.01 * ref, 'locked: the VCO runs at the astable frequency on average (Hz)');
        near(x.v('a', 'vout'), 8.1, 0.1, 'locked: lock detector high, green LED');
        // MEASURED 2026-11-24: green LED > 1.8 V -> observed 2.01.
        assert.ok(seen('locked: green LED (V)', x.across('green', 'anode', 'cathode')) > 1.8, 'locked: green on');
        // Tuned below the VCO's range (532 Hz minimum) the loop cannot follow:
        // comparator II keeps pulling down against the 1 MOhm start bias and
        // the VCO wanders above its minimum, far from the astable.
        const out = bench('lab-pll-lock', { tune: { position: 0 } });
        out.run(20);
        const [low, vcoLow] = out.hzPair(() => out.v('q2', 'collector'), () => out.v('u', 'vco_out'), 4.5, 6, 0.01);
        // MEASURED 2026-11-24: astable with the tune pot at 0 < 532 Hz -> observed 396.8.
        assert.ok(seen('tune 0: astable (Hz)', low) < 532, `tune 0: astable ${low} Hz, below the VCO range`);
        // MEASURED 2026-11-24: VCO - astable > 50 Hz -> observed 194.9.
        assert.ok(seen('tune 0: VCO minus astable (Hz)', vcoLow - low) > 50, `tune 0: VCO ${vcoLow} Hz does not follow`);
        near(out.v('a', 'vout'), 0.9, 0.1, 'out of range: lock detector low, red LED');
        const man = bench('lab-pll-lock', { sw: { position: 1 } });
        man.run(6);
        near(man.state('u').vcoHz, 682, 8, 'manual: the VCO follows only the pot (Hz)');
    });

    test('lab-pll-fsk: the key shifts the tone, the loop turns it back into 0 and 1', () => {
        const x = bench('lab-pll-fsk');
        const one = () => x.v('a', 'vout') > 4.5;
        x.run(12);
        near(x.state('u').vcoHz, 700, 25, 'key up: locked to the low tone (Hz)');
        assert.equal(one(), false, 'key up: "0" LED');
        x.set('key', 1); x.run(12);
        near(x.state('u').vcoHz, 917, 25, 'key down: locked to the high tone (Hz)');
        assert.equal(one(), true, 'key down: "1" LED');
        // MEASURED 2026-11-24: "1" LED > 1.6 V -> observed 1.91.
        assert.ok(seen('key down: "1" LED (V)', x.across('one', 'anode', 'cathode')) > 1.6, '"1" LED on');
        x.set('key', 0); x.run(12);
        assert.equal(one(), false, 'key released: "0" again');
    });

    test('lab-pll-beats: the sum of the astable and the VCO swells and fades', () => {
        const x = bench('lab-pll-beats');
        x.run(5);
        const ast = x.hz(() => x.v('q2', 'collector'), 4.5, 6, 0.01);
        const vco = x.state('u').vcoHz;
        near(ast, 699, 15, 'astable (Hz)');
        near(vco, 782, 8, 'VCO, tune pot at half (Hz)');
        // Peak-to-peak of the amplifier output in 1.2 ms windows over 30 ms.
        const pp = [];
        for (let i = 0; i < 25; i++) pp.push(x.span(() => x.v('a', 'vout'), 1.2, 0.05).pp);
        const big = Math.max(...pp); const small = Math.min(...pp);
        // MEASURED 2026-11-24: big / small > 1.5 -> observed 2.02 (3.56 V vs 1.76 V peak to peak).
        assert.ok(seen('beat: loud/quiet window ratio', big / small) > 1.5, `beat: ${big} vs ${small}`);
    });

    test('lab-pll-hygrometer: moister air, higher pitch; the bridge meter swings through zero', () => {
        const x = bench('lab-pll-hygrometer');
        x.set('comb', 0.6); x.run(12);
        near(x.state('comb').ohms / 1e6, 1.468, 0.01, '60 % RH: comb (MOhm)');
        near(x.state('u').vcoHz, 340.6, 4, '60 % RH: tone (Hz)');
        x.set('comb', 0.66); x.run(8);
        near(x.state('u').vcoHz, 1077, 15, '66 % RH: tone (Hz)');
        const meter = (rh) => { const y = bench('lab-pll-hygrometer', { sel: { position: 1 } }); y.set('comb', rh); y.run(2); return y.state('meter').reading; };
        near(meter(0.5), -0.964, 0.05, 'bridge, 50 % RH (V)');
        near(meter(0.62), 0, 0.02, 'bridge, 62 % RH (V)');
        near(meter(0.74), 1.688, 0.05, 'bridge, 74 % RH (V)');
    });

    test('lab-ptc-alarm: the tone switches on at a higher temperature than it switches off', () => {
        // The sensor's time constant is shortened to 5 ms here so the sweep
        // (1 K every 20 ms) does not have to run the tone for seconds.
        const sweep = (mode) => {
            const x = bench('lab-ptc-alarm', { ptc: { thermalTau: 0.005 }, mode: { position: mode } });
            x.run(20);
            const startHigh = x.v('a', 'vout') > 4.5;
            let on = null; let off = null;
            for (let T = 26; T <= 50 && on === null; T++) { x.param('ptc', 'surroundC', T); x.run(20); if (x.v('a', 'vout') > 4.5) on = T; }
            const rail = x.v('mode', 'com');
            const sing = x.span(() => x.v('q2', 'collector'), 6).pp;
            for (let T = on - 1; T >= 10 && off === null; T--) { x.param('ptc', 'surroundC', T); x.run(20); if (x.v('a', 'vout') < 4.5) off = T; }
            return { startHigh, on, off, rail, sing, railCold: x.v('mode', 'com') };
        };
        const rise = sweep(0);
        assert.equal(rise.startHigh, false, '25 C: below the threshold');
        near(rise.on, 35, 1, 'switches on at (C)');
        near(rise.off, 32, 1, 'switches off at (C)');
        // MEASURED 2026-11-24: on - off >= 2 -> observed 3.
        assert.ok(seen('hysteresis (K)', rise.on - rise.off) >= 2, 'two separate thresholds');
        // MEASURED 2026-11-24: rising alarm: astable swing > 4 V -> observed 6.34.
        assert.ok(seen('rising: tone swing (V)', rise.sing) > 4, 'rising mode: the tone sounds when hot');
        const fall = sweep(1);
        // MEASURED 2026-11-24: falling mode, hot: astable rail < 1 V -> observed 0.17.
        assert.ok(seen('falling mode, hot: rail (V)', fall.rail) < 1, 'falling mode: silent when hot');
        // MEASURED 2026-11-24: falling mode, cooled: rail > 7 V -> observed 8.89.
        assert.ok(seen('falling mode, cooled: rail (V)', fall.railCold) > 7, 'falling mode: the tone sounds when it has cooled');
    });

    test('lab-ptc-fibre-alarm: above the limit the LED lights and the far end sounds', () => {
        const at = (T) => {
            const x = bench('lab-ptc-fibre-alarm', { ptc: { surroundC: T } });
            x.run(10);
            return { led: x.across('led', 'anode', 'cathode'), rail: x.v('qp', 'collector'), sing: x.span(() => x.v('q2', 'collector'), 5).pp };
        };
        const cool = at(25); const hot = at(45);
        // MEASURED 2026-11-24: 25 C: LED < 1.2 V, rail < 0.5 V, swing < 0.1 V -> observed 0.90, 8e-11, 3e-11.
        assert.ok(seen('25 C: LED (V)', cool.led) < 1.2 && seen('25 C: rail (V)', cool.rail) < 0.5 && seen('25 C: swing (V)', cool.sing) < 0.1, '25 C: dark and silent');
        near(hot.led, 1.815, 0.05, '45 C: transmitter LED (V)');
        near(hot.rail, 8.926, 0.05, '45 C: receiver tone supply (V)');
        // MEASURED 2026-11-24: 45 C: swing > 6 V -> observed 8.89.
        assert.ok(seen('45 C: tone swing (V)', hot.sing) > 6, '45 C: the far end sounds');
    });

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

    test('lab-abs-alarm: a held wheel turns green to red and sounds the tone', () => {
        const x = bench('lab-abs-alarm');
        const red = () => x.across('red', 'anode', 'cathode') > 1.5;
        x.run(300);
        near(x.state('wheel').omega, 450, 5, 'free wheel (rad/s)');
        assert.equal(red(), false, 'turning: green');
        // MEASURED 2026-11-24: turning: oscillator swing < 0.1 V -> observed 0.
        assert.ok(seen('turning: tone swing (V)', x.span(() => x.v('a', 'vout'), 4).pp) < 0.1, 'turning: silent');
        x.param('wheel', 'loadTorque', 0.05); x.run(60);
        assert.equal(x.state('wheel').omega, 0, 'held: the wheel stands still');
        assert.equal(red(), true, 'held: red');
        near(x.hz(() => x.v('a', 'vout'), 4.5, 12), 413, 25, 'held: warning tone (Hz)');
        x.param('wheel', 'loadTorque', 0); x.run(200);
        assert.equal(red(), false, 'released: green again');
    });

    test('lab-motor-throttle: the magnet is the throttle; the run switch ramps the motor softly', () => {
        const speed = (field) => { const x = bench('lab-motor-throttle', { hall: { field } }); x.run(800); return x.state('motor').omega; };
        const s0 = speed(0); const s3 = speed(0.3); const s6 = speed(0.6);
        // MEASURED 2026-11-24: no magnet: < 5 rad/s -> observed 0.
        assert.ok(seen('no magnet (rad/s)', s0) < 5, 'no magnet: the motor stands');
        near(s3, 85.2, 8, 'field 0.3 (rad/s)');
        near(s6, 240.6, 10, 'field 0.6 (rad/s)');
        const x = bench('lab-motor-throttle', { mode: { position: 1 } });
        x.set('run', 1);
        const ramp = [];
        for (let i = 0; i < 6; i++) { x.run(250); ramp.push(x.state('motor').omega); }
        near(ramp[0], 24.1, 6, 'soft start, 0.25 s (rad/s)');
        near(ramp[2], 225.7, 10, 'soft start, 0.75 s (rad/s)');
        near(ramp[5], 312.3, 8, 'soft start, 1.5 s (rad/s)');
        x.set('run', 0); x.run(500);
        near(x.state('motor').omega, 274.3, 15, 'soft stop, 0.5 s (rad/s)');
        x.run(1000);
        near(x.state('motor').omega, 55.2, 15, 'soft stop, 1.5 s (rad/s)');
    });

    test('lab-hall-tacho: the pulse rate becomes a voltage; the loop holds it at the set value', () => {
        // Regulated, no load: the tachometer voltage is held at the set
        // voltage and the speed stays put.
        const x = bench('lab-hall-tacho');
        x.run(400);
        const w = [];
        for (let i = 0; i < 6; i++) { x.run(100); w.push(x.state('motor').omega); }
        for (const v of w) near(v, 179, 10, 'regulated, no load (rad/s)');
        near(x.v('ch', 'pos'), x.v('set', 'wiper'), 0.05, 'tachometer voltage held at the set voltage (V)');
        // With a load the on/off loop hunts around the set speed; its average stays near it.
        const y = bench('lab-hall-tacho', { motor: { loadTorque: 0.004 } });
        y.run(400);
        let sum = 0; let n = 0;
        for (let i = 0; i < 16; i++) { y.run(50); sum += y.state('motor').omega; n++; }
        near(sum / n, 173, 30, 'regulated, load 0.004 N m: average speed (rad/s)');
    });

    test('lab-motor-stall-cutout: a held shaft trips the cut-out; only the main switch resets it', () => {
        const x = bench('lab-motor-stall-cutout');
        const tripped = () => x.v('qp', 'emitter') < 2;
        x.run(400);
        near(x.state('motor').omega, 342.7, 10, 'running with a light load (rad/s)');
        assert.equal(tripped(), false, 'running: not tripped');
        x.param('motor', 'loadTorque', 0.05); x.run(400);
        assert.equal(tripped(), true, 'held: tripped');
        // MEASURED 2026-11-24: drive after the trip < 1.5 V -> observed 0.88.
        assert.ok(seen('tripped: drive (V)', x.v('a', 'vout')) < 1.5, 'the drive is cut');
        // MEASURED 2026-11-24: TRIP LED > 1.6 V -> observed 1.71.
        assert.ok(seen('tripped: LED (V)', x.across('trip', 'anode', 'cathode')) > 1.6, 'TRIP LED on');
        x.param('motor', 'loadTorque', 0.002); x.run(300);
        assert.equal(tripped(), true, 'released: stays tripped');
        // MEASURED 2026-11-24: released but tripped < 5 rad/s -> observed 0.
        assert.ok(seen('tripped, released (rad/s)', x.state('motor').omega) < 5, 'the motor stays off');
        x.set('main', 0); x.run(50); x.set('main', 1); x.run(400);
        assert.equal(tripped(), false, 'main switch off and on: running again');
        near(x.state('motor').omega, 342.7, 10, 'running again (rad/s)');
    });

    test('lab-magnet-code-lock: three quick north passes open it; a south pass or slow passes do not', () => {
        const x = bench('lab-magnet-code-lock');
        const open = () => x.v('g', '2y') > 4.5;
        const pass = (field) => { x.param('hall', 'field', field); x.run(10); x.param('hall', 'field', 0); x.run(60); };
        const lock = () => { x.set('lock', 1); x.run(5); x.set('lock', 0); x.run(5); };
        x.run(20); lock();
        assert.equal(open(), false, 'start: locked');
        pass(0.8); pass(0.8);
        assert.equal(open(), false, 'two north passes: still locked');
        const two = x.v('cs', 'pos');
        pass(0.8);
        assert.equal(open(), true, 'third quick north pass: open');
        near(x.across('unl', 'anode', 'cathode'), 2.02, 0.1, 'open: green LED (V)');
        near(x.hz(() => x.v('a', 'vout'), 4.5, 12), 413, 25, 'open: tone (Hz)');
        lock(); x.run(3000);
        assert.equal(open(), false, 'LOCK pressed: locked again');
        pass(0.8); pass(0.8); pass(-0.8);
        // MEASURED 2026-11-24: after a south pass the count < 0.5 V -> observed 0.017.
        assert.ok(seen('south pass: count (V)', x.v('cs', 'pos')) < 0.5, 'a south pass empties the count');
        pass(0.8);
        assert.equal(open(), false, 'north, north, south, north: locked');
        x.run(3000);
        pass(0.8); x.run(1500); pass(0.8); x.run(1500); pass(0.8);
        assert.equal(open(), false, 'three slow passes: the count leaks away, locked');
        near(two, 2.25, 0.15, 'count after two quick passes (V)');
    });

});
