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
import { r6fGate, loadR6f, bench, near, seen } from './helpers/lab-r6f-bench.mjs';

// Scenarios 1-15 of the r6f set; 16-29 are in lab-circuits-r6f-2.test.mjs
// (test/helpers/lab-r6f-bench.mjs says why the set is two files).
const gate = r6fGate(1);
const SKIP = gate.skip || false;
await loadR6f(gate);

describe('round-6 r6f benches behave as documented', { skip: SKIP }, () => {
    test('lab-led-colour-blind: a red LED sensor sees green light, a green one does not see red', () => {
        // Transimpedance amplifier, 1 MOhm: output = photocurrent x 1 MOhm.
        const x = bench('lab-led-colour-blind');
        const out = () => x.v('u', '1_out');
        x.run(2);
        // Photocurrent x 1 MΩ less the LM358's − input bias current (42.5 nA) x 1 MΩ.
        near(out(), 0.409, 0.02, 'as built: red lamp, red sensor (V)');
        x.set('swr', 0); x.run(2);
        // MEASURED 2026-11-24: out() < 0.02 -> observed 0.005 (both lamps off).
        assert.ok(seen('colour dark', out()) < 0.02, `dark: ${out()}`);
        x.set('swr', 1); x.run(2);
        x.set('sel', 1); x.run(2);
        // MEASURED 2026-11-24: out() < 0.02 -> observed 0.005 (red lamp, green sensor).
        assert.ok(seen('colour red->green sensor', out()) < 0.02, `red lamp, green sensor: ${out()}`);
        x.set('swr', 0); x.set('swg', 1); x.run(2);
        near(out(), 0.120, 0.01, 'green lamp, green sensor (V)');
        x.set('sel', 0); x.run(2);
        near(out(), 0.846, 0.03, 'green lamp, red sensor (V)');
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
});
