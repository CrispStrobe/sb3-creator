/**
 * The round-6 "r6i" benches from `scripts/gen-lab-circuits-4.mjs --set=r6i`
 * do what their EXPECTED.md says: measured on the COMMITTED circuit.json,
 * with the stimuli a learner would set (a button, a slide switch, a pot, the
 * light slider of a phototransistor or a solar cell, a light path's knob or
 * its joint geometry in the inspector, the field at a Hall sensor, the sound
 * level at a microphone, the airflow over the bench, the heat at a
 * thermocouple's tip).
 *
 * Readouts come from the engine's own surfaces: node voltages, the device
 * state (cd4046 vcoHz and locked, ptc_sensor ohms, the meter's reading, the
 * thermocouple's emfV), the part temperature and the optical report.
 * Oscillators cost real time, so every audio scenario keeps to a few tens of
 * milliseconds and the 100 kHz link to a few milliseconds; the draught alarm
 * shortens its sensor's thermal time constant to 1 s (params.thermalTau).
 *
 * Every number below was measured on the headless engine (bw-board d4113b4b,
 * bw-circuit-ui 0b594d6) when the bench was built; the tolerances are bands
 * around those measurements.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r6i.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (round 6, r6i)');
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

// R6I_OBSERVE=1 prints every measured value beside its claim (used to write
// the MEASURED notes and the EXPECTED.md tables).
const OBSERVE = Boolean(process.env.R6I_OBSERVE);
const near = (got, want, tol, what) => {
    if (OBSERVE) console.log(`OBSERVE near ${what}: ${got} (claim ${want} +-${tol})`);
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);
};
/** Pass a bounded value through, printing it when observing. */
const seen = (what, v) => { if (OBSERVE) console.log(`OBSERVE seen ${what}: ${v}`); return v; };

describe('round-6 r6i benches behave as documented', { skip: SKIP }, () => {
    test('lab-thermocouple-millivolts: the bare thermocouple moves a millivolt meter', () => {
        const read = (hotC) => {
            const x = bench('lab-thermocouple-millivolts', { tc: { hotC } });
            x.run(1);
            return { mV: x.state('meter').reading * 1000, emf: x.state('tc').emfV * 1000 };
        };
        const room = read(25);
        // MEASURED 2026-11-25: Math.abs(room.mV) < 0.01 -> observed 0 (both ends at the bench temperature).
        assert.ok(Math.abs(seen('room (mV)', room.mV)) < 0.01, `room: ${room.mV} mV`);
        const match = read(600); const lighter = read(900);
        near(match.mV, 31.51, 0.1, 'match flame, 600 C (mV on the meter)');
        near(lighter.mV, 49.36, 0.1, 'lighter flame, 900 C (mV on the meter)');
        // The meter is a 500 ohm load on a 5 ohm source: it reads 99 % of the EMF.
        near(match.mV / match.emf, 0.990, 0.002, 'reading / EMF');
    });

    test('lab-lux-meter-pnp: the PNP stage and the op-amp follower both turn light into a reading', () => {
        const read = (light) => {
            const x = bench('lab-lux-meter-pnp', { pt1: { light }, pt2: { light } });
            x.run(2);
            return { pnp: x.state('m1').reading, fol: x.state('m2').reading };
        };
        const dark = read(0);
        // MEASURED 2026-11-25: dark.pnp < 0.01 -> observed 0; dark.fol < 0.02 -> observed 0.005.
        assert.ok(seen('dark: PNP (V)', dark.pnp) < 0.01 && seen('dark: follower (V)', dark.fol) < 0.02, `dark: ${dark.pnp} / ${dark.fol}`);
        const r = [0.02, 0.05, 0.1, 0.2].map(read);
        // MEASURED 2026-11-25: r[0].pnp < 0.05 -> observed 0 (below the PNP's 0.65 V threshold).
        assert.ok(seen('light 0.02: PNP (V)', r[0].pnp) < 0.05, `0.02: PNP ${r[0].pnp}`);
        near(r[0].fol, 0.470, 0.02, 'light 0.02: follower (V)');
        near(r[2].pnp, 1.745, 0.05, 'light 0.1: PNP (V)');
        near(r[2].fol, 2.350, 0.03, 'light 0.1: follower (V)');
        near(r[3].pnp, 4.195, 0.08, 'light 0.2: PNP (V)');
        near(r[3].fol, 4.700, 0.05, 'light 0.2: follower (V)');
        // Both rise by about the same step per 0.1 of light; the follower is in proportion, the PNP is offset.
        near((r[3].pnp - r[2].pnp) / (r[3].fol - r[2].fol), 1.04, 0.05, 'PNP slope / follower slope');
        near(r[2].fol / r[1].fol, 2.0, 0.03, 'follower: twice the light, twice the reading');
    });

    test('lab-colour-amp-comparator: a red surface lights the red LED, a green one the green LED', () => {
        const at = (surface) => {
            const x = bench('lab-colour-amp-comparator', { look: { surface } });
            x.run(3);
            return { inp: x.v('a', 'inp'), inn: x.v('a', 'inn'), out: x.v('a', 'vout'),
                red: x.across('red', 'anode', 'cathode'), green: x.across('green', 'anode', 'cathode') };
        };
        const red = at('red'); const green = at('green'); const white = at('white'); const black = at('black');
        near(red.inn, 0.723, 0.02, 'threshold from the pot (V)');
        near(red.inp, 1.357, 0.03, 'red surface: phototransistor signal at the LM386 (V)');
        near(green.inp, 0.119, 0.01, 'green surface: signal (V)');
        near(red.out, 8.10, 0.1, 'red surface: LM386 output high (V)');
        near(green.out, 0.90, 0.1, 'green surface: LM386 output low (V)');
        // MEASURED 2026-11-25: red LED > 1.6 V -> observed 1.711; green LED < 1.2 V -> observed 0.902.
        assert.ok(seen('red: red LED (V)', red.red) > 1.6 && seen('red: green LED (V)', red.green) < 1.2, 'red surface: red LED only');
        // MEASURED 2026-11-25: green LED > 1.9 V -> observed 2.006; red LED < 1.2 V -> observed 0.901.
        assert.ok(seen('green: green LED (V)', green.green) > 1.9 && seen('green: red LED (V)', green.red) < 1.2, 'green surface: green LED only');
        near(white.out, 8.10, 0.1, 'white surface reads as red (V)');
        near(black.out, 0.90, 0.1, 'black surface reads as green (V)');
        const x = bench('lab-colour-amp-comparator');
        x.set('look', 0.4); x.run(3);
        near(x.v('a', 'vout'), 0.90, 0.1, 'red surface 2.2 cm away: too little light, green LED (V)');
    });

    test('lab-solar-tone-switch: the cell alone cannot open the transistor; with bias, light starts the tone', () => {
        const at = (bias, light) => {
            const x = bench('lab-solar-tone-switch', { bias: { position: bias }, cell: { light } });
            x.run(3);
            return x;
        };
        const noBias = at(0, 1);
        near(noBias.across('cell', 'pos', 'neg'), 0.500, 0.01, 'no bias, full light: the cell gives 0.5 V');
        near(noBias.v('q1', 'collector'), 4.84, 0.1, 'no bias, full light: switch transistor off (V)');
        // MEASURED 2026-11-25: oscillator node < 0.1 V -> observed 0.02 (the second transistor holds it).
        assert.ok(seen('no bias: oscillator node (V)', noBias.v('q2', 'collector')) < 0.1, 'no bias: silent');
        const dark = at(1, 0);
        near(dark.v('q1', 'collector'), 4.84, 0.1, 'bias, dark: switch transistor off (V)');
        const lit = at(1, 0.5);
        near(lit.v('q1', 'base'), 0.680, 0.02, 'bias, light 0.5: cell + bias reach the base (V)');
        // MEASURED 2026-11-25: q1 collector < 0.2 V -> observed 0.08.
        assert.ok(seen('bias, light: q1 collector (V)', lit.v('q1', 'collector')) < 0.2, 'bias, light: switch transistor on');
        lit.run(5);
        near(lit.hz(() => lit.v('a', 'vout'), 4.5, 15), 493, 30, 'bias, light: the tone (Hz)');
    });

    test('lab-hall-door-tone: a magnet at the Hall switch lights the LED and starts the tone', () => {
        const x = bench('lab-hall-door-tone');
        x.run(5);
        // MEASURED 2026-11-25: swing < 0.1 V -> observed 0.019 (oscillator held by the transistor).
        assert.ok(seen('no magnet: swing (V)', x.span(() => x.v('a', 'vout'), 5).pp) < 0.1, 'no magnet: silent');
        // MEASURED 2026-11-25: LED < 1 V -> observed 0.018.
        assert.ok(seen('no magnet: LED (V)', x.across('led', 'anode', 'cathode')) < 1, 'no magnet: LED off');
        x.param('hall', 'field', 0.8); x.run(5);
        near(x.across('led', 'anode', 'cathode'), 2.015, 0.05, 'magnet: LED on (V)');
        near(x.hz(() => x.v('a', 'vout'), 4.5, 15), 495, 30, 'magnet: tone (Hz)');
        x.param('hall', 'field', 0); x.run(5);
        // MEASURED 2026-11-25: swing < 0.1 V -> observed 0.02.
        assert.ok(seen('magnet gone: swing (V)', x.span(() => x.v('a', 'vout'), 5).pp) < 0.1, 'magnet gone: silent again');
    });

    test('lab-hall-changeover-pitch: south pole switches to the yellow LED, north back to green; the pitch follows the field', () => {
        const x = bench('lab-hall-changeover-pitch');
        x.run(2);
        const yellow = () => x.across('rl1') / 2.2;   // mA
        const green = () => x.across('rl2') / 1.0;    // mA
        const step = (f) => { x.param('hall', 'field', f); x.run(1); return yellow() > 1.5; };
        const up = [-0.6, -0.4, -0.2, 0, 0.2, 0.3, 0.4, 0.6].map(step);
        assert.deepEqual(up, [false, false, false, false, false, true, true, true], 'raising the field');
        near(yellow(), 2.63, 0.08, 'yellow LED on (mA)');
        // MEASURED 2026-11-25: green < 0.05 mA -> observed 0.
        assert.ok(seen('yellow state: green (mA)', green()) < 0.05, 'green off');
        const down = [0.4, 0.2, 0, -0.2, -0.3, -0.4, -0.6].map(step);
        assert.deepEqual(down, [true, true, true, true, true, false, false], 'lowering the field');
        near(green(), 4.23, 0.1, 'green LED on (mA)');
        near(yellow(), 0.13, 0.05, 'green state: yellow LED dim divider current (mA)');
        // Pitch: VCO_IN is the Hall voltage, f = V/(2 R1 C1 VDD) + (VDD/2)/(2 R2 C1 VDD).
        const pitch = (f) => { x.param('hall', 'field', f); x.run(8); return { hz: x.state('u').vcoHz, vin: x.v('u', 'vco_in') }; };
        const lo = pitch(-1); const mid = pitch(0); const hi = pitch(1);
        near(mid.vin, 4.49, 0.03, 'no field: Hall output (V)');
        near(lo.hz, 160, 10, 'north pole, field -1: pitch (Hz)');
        near(mid.hz, 584, 10, 'no field: pitch (Hz)');
        near(hi.hz, 1010, 15, 'south pole, field 1: pitch (Hz)');
    });

    test('lab-noise-level-meter: louder sound, higher needle', () => {
        const x = bench('lab-noise-level-meter', { mic: { soundDb: 0 } });
        x.run(60);
        // MEASURED 2026-11-25: quiet meter < 0.6 V -> observed 0.48 (the hold capacitor still draining the start-up).
        assert.ok(seen('quiet, 60 ms (V)', x.state('meter').reading) < 0.6, `quiet: ${x.state('meter').reading}`);
        x.run(40);
        // MEASURED 2026-11-25: quiet meter < 0.1 V -> observed 0.
        assert.ok(seen('quiet, 100 ms (V)', x.state('meter').reading) < 0.1, `quiet: ${x.state('meter').reading}`);
        const level = (db) => { x.param('mic', 'soundDb', db); x.run(40); return x.state('meter').reading; };
        const m70 = level(70); const m80 = level(80);
        near(m70, 0.16, 0.06, '70 dB (V)');
        near(m80, 2.43, 0.15, '80 dB (V)');
        near(x.span(() => x.v('o', '1_out'), 10).pp, 0.213, 0.03, '80 dB: op-amp stage output, peak to peak (V)');
        near(x.span(() => x.v('a', 'vout'), 10).pp, 4.30, 0.2, '80 dB: LM386 output, peak to peak (V)');
    });

    test('lab-draught-alarm: the self-heated PTC cools in a draught and the blinker starts', () => {
        const x = bench('lab-draught-alarm');
        const blinking = () => x.v('a', 'vout') > 6;
        x.run(4000);
        near(x.b.partTemperature(x.ids.ptc), 50.6, 0.6, 'still air: the PTC heats itself to (C)');
        near(x.v('a', 'inp'), 1.070, 0.01, 'still air: bridge signal (V)');
        assert.equal(blinking(), false, 'still air: no alarm');
        // MEASURED 2026-11-25: both LEDs < 1 V -> observed 0.88.
        assert.ok(seen('still: LED 1 (V)', x.across('l1', 'anode', 'cathode')) < 1, 'still air: LEDs dark');
        x.b.world.set('airflowMs', 2);
        x.run(2000);
        near(x.b.partTemperature(x.ids.ptc), 36.6, 0.6, 'at 2 m/s: the PTC (C)');
        assert.equal(blinking(), true, 'at 2 m/s: alarm');
        let toggles = 0; let prev = x.v('q1', 'collector') > 4;
        for (let i = 0; i < 30; i++) { x.run(50); const c = x.v('q1', 'collector') > 4; if (c !== prev) toggles++; prev = c; }
        // MEASURED 2026-11-25: toggles in 1.5 s >= 3 -> observed 5; <= 8 -> observed 5.
        assert.ok(seen('blinker toggles in 1.5 s', toggles) >= 3 && toggles <= 8, `blinker: ${toggles} toggles`);
        x.b.world.set('airflowMs', 0);
        x.run(2500);
        assert.equal(blinking(), false, 'still again: the alarm stops');
    });

    test('lab-fibre-loss-receivers: bending and joint losses lower the pitch and the meter together', () => {
        const x = bench('lab-fibre-loss-receivers');
        const read = () => { x.run(12); return { s: x.v('pt', 'emitter'), hz: x.state('u').vcoHz, m: x.state('meter').reading }; };
        const straight = read();
        near(straight.s, 2.03, 0.05, 'gentle bend, R = 5 cm: phototransistor signal (V)');
        near(straight.m, 4.06, 0.1, 'gentle bend: meter, op-amp gain 2 (V)');
        near(straight.hz, 294, 6, 'gentle bend: pitch (Hz)');
        x.set('guide', 0.05); const tight = read();
        near(tight.s, 1.445, 0.05, 'bent to R = 0.63 cm: signal (V)');
        near(tight.hz, 224, 6, 'bent to R = 0.63 cm: pitch (Hz)');
        x.set('guide', 0); const tightest = read();
        near(tightest.m, 2.12, 0.08, 'bent to R = 0.4 cm: meter (V)');
        x.set('guide', 1);
        const joint = (k, v) => { x.param('guide', k, v); const r = read(); x.param('guide', k, 0); return r; };
        const gap = joint('jointGapMm', 0.5); const off = joint('jointOffsetMm', 0.3); const ang = joint('jointAngleDeg', 10);
        near(gap.m, 1.63, 0.08, 'joint gap 0.5 mm: meter (V)');
        near(off.m, 2.54, 0.08, 'joint offset 0.3 mm: meter (V)');
        near(ang.m, 3.36, 0.08, 'joint angle 10 degrees: meter (V)');
        near(gap.hz, 150, 6, 'joint gap 0.5 mm: pitch (Hz)');
        // Each receiver is a straight line in the signal.
        for (const r of [straight, tight, gap, off, ang]) near(r.m / r.s, 2.0, 0.02, `meter / signal at ${r.s.toFixed(2)} V`);
    });

    test('lab-fibre-morse-music: the key sends the astable tone, the switch sends music, the far end plays both', () => {
        const x = bench('lab-fibre-morse-music');
        x.run(10);
        const steady = x.span(() => x.v('pt', 'emitter'), 2);
        // MEASURED 2026-11-25: steady.pp < 0.01 V -> observed 0.0016 (key up: steady light, no tone).
        assert.ok(seen('key up: receiver swing (V)', steady.pp) < 0.01, `key up: ${steady.pp}`);
        x.set('key', 1); x.run(4);
        near(x.hz(() => x.v('q2', 'collector'), 4.5, 8), 675, 20, 'key down: astable (Hz)');
        const morse = x.span(() => x.v('a', 'vout'), 4);
        near(x.hz(() => x.v('a', 'vout'), (morse.hi + morse.lo) / 2, 8), 675, 20, 'key down: tone at the speaker (Hz)');
        // MEASURED 2026-11-25: morse.pp > 5 V -> observed 7.18 (the on-off light gives a full square wave).
        assert.ok(seen('key down: speaker drive swing (V)', morse.pp) > 5, `key down: ${morse.pp}`);
        x.set('key', 0); x.set('src', 1); x.run(10);
        const music = x.span(() => x.v('a', 'vout'), 5);
        near(x.hz(() => x.v('a', 'vout'), (music.hi + music.lo) / 2, 10), 440, 10, 'music: tone at the speaker (Hz)');
        near(music.pp, 1.70, 0.15, 'music: speaker drive swing (V)');
        x.set('guide', 0.5); x.run(5);
        near(x.span(() => x.v('a', 'vout'), 5).pp, 0.20, 0.05, 'music, 10 mm air gap at the end: swing (V)');
    });
});
