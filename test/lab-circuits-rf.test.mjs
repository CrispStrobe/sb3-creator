/**
 * The RF benches from `scripts/gen-lab-circuits-4.mjs --set=rf` do what their
 * EXPECTED.md says, measured on the COMMITTED circuit.json with the controls
 * a learner would turn.
 *
 * The engine carries every RF signal as a complex envelope around the
 * circuit's resonances, integrated in time (bw-board src/radio.js,
 * src/rf-bands.js), so a receiver is read through `buzzerTone()`, a meter's
 * reading, and `board._radio.bandAmplitudes(net)` (the actual RF envelope at
 * a net, oscillation included). Each simulated millisecond is a full
 * transient step sequence, so every scenario stays short. Every number below
 * was measured on the headless engine when the bench was built; the
 * tolerances are bands around those measurements.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-rf.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set rf, oscillating and FM radio)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

function bench (id, edit = null) {
    const json = JSON.parse(readFileSync(join(EXAMPLES, id, 'circuit.json'), 'utf8'));
    if (edit) edit(json);
    const c = Circuit.fromJSON(json);
    const b = c.board;
    const ids = benchIds(BENCHES[id]);
    let tMs = 0;
    const netOf = (name, term) => {
        const n = b.getNets().find(n => n.terminals.some(x => x.part === ids[name] && x.terminal === term));
        assert.ok(n, `${id}: no net for ${name}.${term}`);
        return n.id;
    };
    const api = {
        c, b, ids,
        v (name, term) { return b.nodeVoltages.get(netOf(name, term)) ?? 0; },
        /** Largest RF envelope (V peak) at a terminal over the bands now. */
        rf (name, term) { return Math.max(0, ...b._radio.bandAmplitudes(netOf(name, term)).map(x => x.volts)); },
        tone (name) { return b.buzzerTone(ids[name]); },
        meter (name) { return b.getDeviceState(ids[name])?.reading; },
        run (ms) {
            tMs += ms;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
            assert.equal(b._radio?.error ?? null, null, `${id}: radio front end error`);
        },
        set (name, value) { b.setControl(ids[name], value); },
        get t () { return tMs; },
    };
    return api;
}

/** Amplitude of the `hz` component of a [[tMs, v], …] trace (one-bin DFT). */
const amplitude = (tr, hz) => {
    let re = 0, im = 0;
    for (const [t, v] of tr) { re += v * Math.cos(2 * Math.PI * hz * t / 1000); im += v * Math.sin(2 * Math.PI * hz * t / 1000); }
    return 2 * Math.hypot(re, im) / tr.length;
};
const near1 = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(3)}, expected ${want} +-${tol}`);
const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);

describe('lab RF benches (set rf) behave as documented', { skip: SKIP }, () => {
    test('lab-am-music: the station plays its tune, note by note', () => {
        // Notes of 120 ms: 392, 330, 330, 349, 294, 294, 262 (240 ms), rest.
        // At build time: 392 Hz at 50 ms, 330 Hz at 150 ms, 351 Hz at 400 ms.
        const x = bench('lab-am-music');
        x.run(50);
        near(x.tone('ep').hz, 392, 8, 'first note (Hz)');
        x.run(100);   // t = 150 ms: second note
        near(x.tone('ep').hz, 330, 7, 'second note (Hz)');
        x.run(250);   // t = 400 ms: fourth note
        near(x.tone('ep').hz, 349, 7, 'fourth note (Hz)');
    });

    test('lab-direction-finder: the meter rises with |cos(rod angle − bearing)|, nothing in the sharp nulls', () => {
        // At build time (mean over 5 ms): north (700 kHz, bearing 0°) rod 0°
        // 0.296 mA, 45° 0.117 mA (the junction rectifies more than in
        // proportion), 90° 0.0001 mA (the null: the divider leaves the
        // transistor just short of conducting), 180° 0.296 mA; east
        // (1000 kHz, bearing 70°, knob 0.186) rod 270° 0.632 mA, 160° null.
        const x = bench('lab-direction-finder');
        x.run(60);
        // The collector current carries the station's audio (400 / 800 Hz)
        // at the meter; its mean over 5 ms (two and four periods) is the
        // needle's reading.
        const at = (deg) => {
            x.set('l', deg / 360); x.run(15);
            let sum = 0;
            for (let k = 0; k < 100; k++) { x.run(0.05); sum += x.meter('m'); }
            return sum / 100 * 1e3;
        };
        const m0 = at(0), m45 = at(45), m90 = at(90);
        assert.ok(x.rf('tc', 'a') < 1e-4, `the tank RF in the null: ${x.rf('tc', 'a')} V`);
        const m180 = at(180);
        near(m0, 0.296, 0.03, 'north, rod 0° (mA)');
        near(m45, 0.117, 0.02, 'north, rod 45° (mA)');
        assert.ok(m90 < 0.005, `north, rod 90°: the null, ${m90.toFixed(4)} mA`);
        near(m180, m0, 0.01, 'the back of the figure eight (mA)');
        x.set('tc', 0.186);
        x.run(40);    // the tank retunes and the 2.2 MΩ / 10 nF bias settles to the new station
        const e270 = at(270), e160 = at(160);
        near(e270, 0.632, 0.05, 'east, rod 270° (mA)');
        assert.ok(e160 < 0.005, `east, rod 160°: its null, ${e160.toFixed(4)} mA`);
    });

    test('lab-dawn-radio: silent in the dark, the station plays once light falls on the LDR', () => {
        // At build time: dark, the receiver transistor ~40 nA and no tone;
        // lit, 400 Hz at 0.4-0.8 mA rms.
        const x = bench('lab-dawn-radio');
        x.set('ldr', 0);
        x.run(30);
        assert.equal(x.tone('ep').on, false, 'dark: silent');
        assert.ok(x.v('qs', 'base') < 0.6, `dark: the switch's base is low (${x.v('qs', 'base').toFixed(3)} V)`);
        x.set('ldr', 1);
        x.run(60);
        const t = x.tone('ep');
        near(t.hz, 400, 8, 'lit: the 612 kHz station (Hz)');
        assert.ok(t.amps * 1e3 > 0.2, `lit: audible, ${(t.amps * 1e3).toFixed(3)} mA rms`);
    });

    test('lab-regen-receiver: past the regeneration threshold it oscillates and whistles against the station', () => {
        // At build time: pot 0.90 no tone, tank 0.24 V; 0.80 1087 Hz, tank
        // 0.70 V; 0.75 2248 Hz (20 ms per setting, in sequence).
        const x = bench('lab-regen-receiver');
        x.run(20);
        assert.equal(x.tone('ep').on, false, 'little regeneration: no tone');
        const quiet = x.rf('tc', 'a');
        x.set('rv', 0.8);
        x.run(20);
        const t = x.tone('ep');
        assert.ok(t.on, 'past the threshold: a whistle');
        near(t.hz, 1087, 250, 'the whistle (Hz)');
        assert.ok(x.rf('tc', 'a') > 2 * quiet, `the tank's RF jumps: ${quiet.toFixed(3)} -> ${x.rf('tc', 'a').toFixed(3)} V`);
        x.set('rv', 0.75);
        x.run(20);
        assert.ok(x.tone('ep').hz > t.hz + 500, `more regeneration, a higher whistle: ${x.tone('ep').hz.toFixed(0)} Hz`);
    });

    test('lab-fm-slope: the FM tone appears on the slope of the tank and fades on its top', () => {
        // At build time: pot 0.46 1000 Hz 0.362 mA; 0.48 0.133 mA; 0.40
        // 0.018 mA (60 ms, then 40 ms per setting).
        const x = bench('lab-fm-slope');
        x.run(60);
        const t = x.tone('ep');
        near(t.hz, 1000, 20, 'on the slope: the 1 kHz programme (Hz)');
        near(t.amps * 1e3, 0.362, 0.08, 'on the slope (mA rms)');
        x.set('rv', 0.48);
        x.run(40);
        const top = x.tone('ep').amps * 1e3;
        assert.ok(top < 0.6 * t.amps * 1e3, `on the top of the curve it fades: ${top.toFixed(3)} mA`);
        x.set('rv', 0.40);
        x.run(40);
        assert.ok(x.tone('ep').amps * 1e3 < 0.05, `far off: ${(x.tone('ep').amps * 1e3).toFixed(3)} mA`);
    });

    test('lab-shortwave-regen: the Morse beacon is heard only while the receiver oscillates and the key is down', () => {
        // The beacon sends "E" at 20 wpm: a 60 ms key-down, then silence.
        const x = bench('lab-shortwave-regen');
        x.run(20);
        assert.equal(x.tone('ep').on, false, 'below the threshold the bare carrier is silent');
        x.set('rv', 0.75);
        x.run(25);    // t = 45 ms: oscillating, key down
        const on = x.tone('ep');
        assert.ok(on.on, 'past the threshold: the beacon mixes with the oscillation into a tone');
        assert.ok(on.hz > 500 && on.hz < 6000, `the difference frequency is audible: ${on.hz.toFixed(0)} Hz`);
        const onAmps = on.amps;
        x.run(55);    // t = 100 ms: the key is up
        assert.ok(x.tone('ep').amps < 0.5 * onAmps, `key up, the tone dies away: ${(x.tone('ep').amps * 1e3).toFixed(3)} vs ${(onAmps * 1e3).toFixed(3)} mA rms`);
    });

    test('lab-am-transmitter: the near field falls with the cube of the distance, the tone faster', () => {
        // Received RF and the 1 kHz audio at the detector after 15 ms, at
        // 0.5 m and 1 m. At build time: RF 0.33 V and 0.041 V; 1 kHz 16 mV
        // and 0.12 mV (the diode is square-law at the weaker signal).
        const listen = (d) => {
            const x = bench('lab-am-transmitter', (json) => { json.parts.find(p => p.kind === 'ferrite_coil' && p.params.linkTo).params.distanceM = d; });
            x.run(15);
            const tr = []; let rf = 0;
            for (let k = 0; k < 400; k++) { x.run(0.01); tr.push([x.t, x.v('d', 'cathode')]); rf += x.rf('tcr', 'a'); }
            return { rf: rf / 400, tone: amplitude(tr, 1000) };
        };
        const near = listen(0.5), far = listen(1);
        assert.ok(near.tone > 5e-3, `at 0.5 m the 1 kHz audio is there: ${near.tone.toExponential(2)} V`);
        near1(near.rf / far.rf, 8, 2, 'RF ratio 0.5 m : 1 m (near field ∝ 1/d³)');
        assert.ok(near.tone > 30 * far.tone, `the audio falls faster than the RF: ${near.tone.toExponential(2)} vs ${far.tone.toExponential(2)} V`);
    });

    test('lab-superregen-fm: quench bursts grow from the station or from noise; the station quiets the hiss and brings its programme', () => {
        // Over 3 ms after 4 ms: the RF in the tank every 10 µs, and the audio
        // at the 10 nF after the 10 kΩ (detrended; one-bin DFTs). At build
        // time: station on, bursts 0.108 -> 2.65 V, 1 kHz 9.5e-5 V against
        // 3.0e-5 / 4.0e-5 V at 1.33 / 2 kHz; no station, bursts from
        // 7e-8 V, 1.8e-4 / 3.2e-4 V of hiss.
        const listen = (station) => {
            const x = bench('lab-superregen-fm', station ? null : (json) => { json.parts.find(p => p.kind === 'antenna').params.stations = []; });
            x.run(4);
            const tr = []; let lo = 99, hi = 0;
            for (let k = 1; k <= 300; k++) {
                x.run(0.01);
                tr.push([x.t, x.v('ca', 'a')]);
                const a = x.rf('l', 'a'); lo = Math.min(lo, a); hi = Math.max(hi, a);
            }
            const n = tr.length, mt = tr.reduce((a, p) => a + p[0], 0) / n, mv = tr.reduce((a, p) => a + p[1], 0) / n;
            const sl = tr.reduce((a, p) => a + (p[0] - mt) * (p[1] - mv), 0) / tr.reduce((a, p) => a + (p[0] - mt) ** 2, 0);
            for (const p of tr) p[1] -= mv + sl * (p[0] - mt);
            return { lo, hi, tone: amplitude(tr, 1000), hiss: (amplitude(tr, 4000 / 3) + amplitude(tr, 2000)) / 2 };
        };
        const on = listen(true), off = listen(false);
        assert.ok(on.hi > 1.5 && off.hi > 1.5, `quench bursts reach volts: ${on.hi.toFixed(2)} / ${off.hi.toFixed(2)} V`);
        assert.ok(on.lo > 0.03, `with the station each burst starts from its signal: ${on.lo.toFixed(4)} V`);
        assert.ok(off.lo < 1e-4, `without it, from the noise: ${off.lo.toExponential(2)} V`);
        assert.ok(off.hiss > 3 * on.hiss, `the station quiets the hiss: ${off.hiss.toExponential(2)} vs ${on.hiss.toExponential(2)} V`);
        assert.ok(on.tone > 2 * on.hiss, `and its 1 kHz programme stands out: ${on.tone.toExponential(2)} vs ${on.hiss.toExponential(2)} V`);
    });
});
