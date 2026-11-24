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
        // 0.256 mA, 45° 0.109 mA (the junction rectifies more than in
        // proportion), 90° 0.0001 mA (the null: the divider leaves the
        // transistor just short of conducting), 180° 0.256 mA; east
        // (1000 kHz, bearing 70°, knob 0.186) rod 270° 0.562 mA, 160° null.
        // (Re-measured 2026-11-24: 0.296 / 0.117 / 0.632 mA before bw-board
        // gave the transistor's input capacitance its large-signal value —
        // τF times the transconductance at the swing, not at the DC
        // current. Driven hard by the station, the base loads the tank with
        // less capacitance and the tank sits a little further from 700 kHz.)
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
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): x.rf('tc', 'a') < 1e-4 ->
        // observed 0.0000023579357750055673.
        assert.ok(x.rf('tc', 'a') < 1e-4, `the tank RF in the null: ${x.rf('tc', 'a')} V`);
        const m180 = at(180);
        near(m0, 0.256, 0.03, 'north, rod 0° (mA)');
        near(m45, 0.109, 0.02, 'north, rod 45° (mA)');
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): m90 < 0.005 -> observed
        // 0.00008119055032675959.
        assert.ok(m90 < 0.005, `north, rod 90°: the null, ${m90.toFixed(4)} mA`);
        near(m180, m0, 0.01, 'the back of the figure eight (mA)');
        x.set('tc', 0.186);
        x.run(40);    // the tank retunes and the 2.2 MΩ / 10 nF bias settles to the new station
        const e270 = at(270), e160 = at(160);
        near(e270, 0.562, 0.05, 'east, rod 270° (mA)');
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): e160 < 0.005 -> observed
        // 0.00012083789002055313.
        assert.ok(e160 < 0.005, `east, rod 160°: its null, ${e160.toFixed(4)} mA`);
    });

    test('lab-dawn-radio: silent in the dark, the station plays once light falls on the LDR', () => {
        // At build time: dark, the receiver transistor ~40 nA and no tone;
        // lit, 400 Hz at 0.4-0.8 mA rms.
        const x = bench('lab-dawn-radio');
        x.set('ldr', 0);
        x.run(30);
        assert.equal(x.tone('ep').on, false, 'dark: silent');
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): x.v('qs', 'base') < 0.6 ->
        // observed 0.4039932793429354.
        assert.ok(x.v('qs', 'base') < 0.6, `dark: the switch's base is low (${x.v('qs', 'base').toFixed(3)} V)`);
        x.set('ldr', 1);
        x.run(60);
        const t = x.tone('ep');
        near(t.hz, 400, 8, 'lit: the 612 kHz station (Hz)');
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): t.amps * 1e3 > 0.2 -> observed
        // 0.5264874089451862.
        assert.ok(t.amps * 1e3 > 0.2, `lit: audible, ${(t.amps * 1e3).toFixed(3)} mA rms`);
    });

    test('lab-regen-receiver: past the regeneration threshold it oscillates and whistles against the station', () => {
        // Measured as a listener would: the tank's mean RF over a window and
        // the strongest line of the earphone's sound over 10 ms (the beat
        // between the oscillation and the station rides on an irregular
        // envelope, so the instantaneous pitch tracker wanders between
        // ~800 Hz and ~1.6 kHz with the smallest change; the spectrum does
        // not). At build time: pot 0.90 tank 0.21 V mean, no tone; 0.80 tank
        // 0.61 V, line at 850 Hz (20 mV); 0.75 tank 0.87 V, line at 975 Hz.
        // Without the station the 0.80 line is a sixth as strong (it is the
        // beat). Re-measured 2026-11-24: the whistle was 1575 Hz at 0.80 and
        // rose to 2825 Hz at 0.75, an artefact — the transistor's input
        // capacitance was taken at its DC current even when its swing had
        // driven it into class C, and more current pulled the oscillation
        // further off; with its large-signal value the oscillation stays
        // about 1 kHz from the station as the regeneration rises.
        const x = bench('lab-regen-receiver');
        const window = (ms, dt) => {
            const tr = []; let rf = 0;
            for (let k = 0; k < ms / dt; k++) { x.run(dt); tr.push([x.t, x.v('ep', 'a') - x.v('ep', 'b')]); rf += x.rf('tc', 'a'); }
            const m = tr.reduce((a, p) => a + p[1], 0) / tr.length;
            for (const p of tr) p[1] -= m;
            let best = [0, 0];
            for (let f = 200; f <= 8000; f += 25) { const a = amplitude(tr, f); if (a > best[1]) best = [f, a]; }
            return { rf: rf / tr.length, hz: best[0], line: best[1] };
        };
        x.run(18);
        assert.equal(x.tone('ep').on, false, 'little regeneration: no tone');
        const quiet = window(2, 0.02).rf;
        x.set('rv', 0.8);
        x.run(10);
        const w8 = window(10, 0.02);
        assert.ok(w8.rf > 2 * quiet, `the tank's RF jumps: ${quiet.toFixed(3)} -> ${w8.rf.toFixed(3)} V (means)`);
        near(w8.hz, 850, 200, 'the whistle (Hz)');
        x.set('rv', 0.75);
        x.run(10);
        const w75 = window(10, 0.02);
        assert.ok(w75.rf > w8.rf, `more regeneration, more RF: ${w8.rf.toFixed(3)} -> ${w75.rf.toFixed(3)} V`);
        near(w75.hz, 975, 250, 'still whistling (Hz)');
    });

    test('lab-shortwave-regen: the Morse beacon is heard only while the receiver oscillates and the key is down', () => {
        // The beacon sends "E" at 20 wpm: a 60 ms key-down, then silence.
        // Read as a listener would: the strongest line of the earphone's
        // voltage and its rms over a window. At build time (2026-11-24):
        // pot 0.95 (below the threshold) 8e-6 V rms; 0.75 oscillating, key
        // down a line at 1850 Hz of 0.40 mV; key up 1.2e-6 V rms (the
        // oscillation alone is silent).
        const x = bench('lab-shortwave-regen');
        const listen = (ms) => {
            const tr = [];
            for (let k = 0; k < ms / 0.02; k++) { x.run(0.02); tr.push([x.t, x.v('ep', 'a') - x.v('ep', 'b')]); }
            const m = tr.reduce((a, p) => a + p[1], 0) / tr.length;
            for (const p of tr) p[1] -= m;
            let best = [0, 0];
            for (let f = 200; f <= 8000; f += 25) { const a = amplitude(tr, f); if (a > best[1]) best = [f, a]; }
            return { hz: best[0], line: best[1], rms: Math.sqrt(tr.reduce((a, p) => a + p[1] * p[1], 0) / tr.length) };
        };
        x.run(5);
        const below = listen(7);
        assert.ok(below.rms < 3e-5, `below the threshold the bare carrier is silent: ${below.rms.toExponential(2)} V rms`);
        x.set('rv', 0.75);
        x.run(6);
        const down = listen(22);
        near(down.hz, 1850, 300, 'key down: the difference frequency (Hz)');
        assert.ok(down.line > 1e-4, `key down, the beat: ${down.line.toExponential(2)} V`);
        x.run(30);    // t = 70 ms: the key is up and the last beat has rung out of the earphone
        const up = listen(16);
        assert.ok(up.rms < down.line / 30, `key up, silence: ${up.rms.toExponential(2)} V rms against the beat's ${down.line.toExponential(2)} V`);
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
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): x.tone('ep').amps * 1e3 < 0.05
        // -> observed 0.04916386181231458.
        assert.ok(x.tone('ep').amps * 1e3 < 0.05, `far off: ${(x.tone('ep').amps * 1e3).toFixed(3)} mA`);
    });

    test('lab-am-transmitter: the near field falls with the cube of the distance, the tone faster', () => {
        // Received RF (mean) and the 1 kHz audio at the detector over 12 ms
        // after 15 ms, at 0.5 m and 1 m. The transmitter's swing jitters
        // (its bias loop squegs a little), so the tone is read over twelve
        // cycles: over four it moved 2.5x with a 1-ulp change of the coil.
        // At build time: RF 0.344 V and 0.041 V; 1 kHz 9.4–12.7 mV across
        // 1-ulp changes, and 0.1 mV at 1 m (the diode is square-law there).
        const listen = (d) => {
            const x = bench('lab-am-transmitter', (json) => { json.parts.find(p => p.kind === 'ferrite_coil' && p.params.linkTo).params.distanceM = d; });
            x.run(15);
            const tr = []; let rf = 0;
            for (let k = 0; k < 1200; k++) { x.run(0.01); tr.push([x.t, x.v('d', 'cathode')]); rf += x.rf('tcr', 'a'); }
            const m = tr.reduce((a, p) => a + p[1], 0) / tr.length;
            for (const p of tr) p[1] -= m;
            return { rf: rf / 1200, tone: amplitude(tr, 1000) };
        };
        const near = listen(0.5), far = listen(1);
        // MEASURED 2026-11-24 (12 ms window, bit-reproducible engine): near.tone > 5e-3 -> observed
        // 0.00942 (0.0094-0.0127 across 1-ulp changes of the coil).
        assert.ok(near.tone > 5e-3, `at 0.5 m the 1 kHz audio is there: ${near.tone.toExponential(2)} V`);
        near1(near.rf / far.rf, 8, 2, 'RF ratio 0.5 m : 1 m (near field ∝ 1/d³)');
        assert.ok(near.tone > 30 * far.tone, `the audio falls faster than the RF: ${near.tone.toExponential(2)} vs ${far.tone.toExponential(2)} V`);
    });

    test('lab-superregen-fm: quench bursts grow from the station or from noise', () => {
        // Over 3 ms after 4 ms: the RF in the tank every 10 µs. At build time
        // (2026-11-24, bw-board with converged band steps: burst peaks within
        // 0.5 % of 1 ns steps): station on, bursts 0.107 -> ~2.7 V; no
        // station, from a few µV or less. The audio is not asserted: at the
        // detector (10 kΩ / 10 nF) the hiss between 300 Hz and 6 kHz is
        // 1.3e-4 V off the station and 7.6e-5 V on an unmodulated carrier
        // (2-5x quieter below 2 kHz, above that a ~1e-5 V floor of the
        // transient solve's tolerance in both), the station's 1 kHz line
        // 3.2e-4 V — a weak quieting in this circuit, whose bursts grow so
        // fast (an e-fold in ~0.1 µs) that the noise moves their start by
        // only ±0.4 µs of a cycle in which they last tens of µs.
        const listen = (station) => {
            const x = bench('lab-superregen-fm', station ? null : (json) => { json.parts.find(p => p.kind === 'antenna').params.stations = []; });
            x.run(4);
            let lo = 99, hi = 0;
            for (let k = 1; k <= 300; k++) { x.run(0.01); const a = x.rf('l', 'a'); lo = Math.min(lo, a); hi = Math.max(hi, a); }
            // When each burst reaches 0.5 V, in µs into its quench cycle
            // (25 kHz: 40 µs), over ten cycles.
            const onset = [];
            let prev = null;
            for (let k = 1; k <= 800; k++) {
                x.run(0.0005);
                const a = x.rf('l', 'a');
                if (prev && prev[1] < 0.5 && a >= 0.5) onset.push(((prev[0] + (x.t - prev[0]) * (0.5 - prev[1]) / (a - prev[1])) * 1000) % 40);
                prev = [x.t, a];
            }
            const m = onset.reduce((a, b) => a + b, 0) / onset.length;
            return { lo, hi, onset: m, jitter: Math.sqrt(onset.reduce((a, b) => a + (b - m) ** 2, 0) / onset.length) };
        };
        const on = listen(true), off = listen(false);
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): off.hi > 1.5 -> observed
        // 2.6071485736677054; on.hi > 1.5 -> observed 2.686790138376889.
        assert.ok(on.hi > 1.5 && off.hi > 1.5, `quench bursts reach volts: ${on.hi.toFixed(2)} / ${off.hi.toFixed(2)} V`);
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): on.lo > 0.03 -> observed
        // 0.10810514345242235.
        assert.ok(on.lo > 0.03, `with the station each burst starts from its signal: ${on.lo.toFixed(4)} V`);
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): off.lo < 1e-4 -> observed
        // 7.080317548996925e-8.
        assert.ok(off.lo < 1e-4, `without it, from the noise: ${off.lo.toExponential(2)} V`);
        // The heart of super-regeneration: the burst's start depends on
        // what the tank holds when the quench lets the stage oscillate. With
        // the station every burst starts from its carrier, early and at the
        // same instant of the cycle; from the noise it starts later and
        // wanders from cycle to cycle with it. At build time (2026-11-24):
        // station 2.85 µs ± 0.04 µs, noise 4.28 µs ± 0.42 µs.
        assert.ok(off.onset - on.onset > 0.7, `the station starts each burst earlier: ${on.onset.toFixed(2)} against ${off.onset.toFixed(2)} µs`);
        assert.ok(off.jitter > 4 * on.jitter, `…and steadily: ±${on.jitter.toFixed(3)} against ±${off.jitter.toFixed(3)} µs`);
    });

    test('lab-mosfet-regen: the MOSFET\'s square-law channel detects the station; past the threshold it oscillates', () => {
        // Gate on the pot (through 1 MΩ, 100 pF to the tank top), tickler in
        // the drain. At build time: pot 0.80 (gate 1.8 V, below the 2 V
        // threshold) silent, tank 0.05 V; 0.77 (gate 2.06 V) the 400 Hz
        // programme at 4.1 mV in the earphone; 0.72 oscillating, tank volts.
        const x = bench('lab-mosfet-regen');
        const line = (ms, f) => {
            const tr = [];
            for (let k = 0; k < ms / 0.02; k++) { x.run(0.02); tr.push([x.t, x.v('ep', 'a') - x.v('ep', 'b')]); }
            const m = tr.reduce((a, p) => a + p[1], 0) / tr.length;
            for (const p of tr) p[1] -= m;
            return amplitude(tr, f);
        };
        x.run(15);
        assert.equal(x.tone('ep').on, false, 'below the threshold voltage: no drain current, silent');
        x.set('rv', 0.77);
        x.run(15);
        const tone = line(6, 400);
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): tone > 1e-3 -> observed
        // 0.004291695903538382.
        assert.ok(tone > 1e-3, `the channel's square law detects the station: ${tone.toExponential(2)} V at 400 Hz`);
        const quiet = x.rf('tc', 'a');
        // Just past the threshold (0.75) the stage oscillates with the
        // station's carrier in its tank, ~6 kHz from it: the whistle,
        // stronger than the programme. At build time: 6000 Hz at 57 mV, the
        // programme 3.2 mV (no whistle without the station).
        x.set('rv', 0.75);
        x.run(6);
        const tr = [];
        for (let k = 0; k < 300; k++) { x.run(0.02); tr.push([x.t, x.v('ep', 'a') - x.v('ep', 'b')]); }
        const m = tr.reduce((a, p) => a + p[1], 0) / tr.length;
        for (const p of tr) p[1] -= m;
        let best = [0, 0];
        for (let f = 200; f <= 8000; f += 25) { const a = amplitude(tr, f); if (a > best[1]) best = [f, a]; }
        near(best[0], 6000, 500, 'the whistle (Hz)');
        assert.ok(best[1] > 5 * amplitude(tr, 400), `the whistle ${best[1].toExponential(2)} V over the programme ${amplitude(tr, 400).toExponential(2)} V`);
        x.set('rv', 0.72);
        x.run(3);
        assert.ok(x.rf('tc', 'a') > 10 * quiet, `more gate voltage, more gain: it oscillates, ${quiet.toFixed(3)} -> ${x.rf('tc', 'a').toFixed(2)} V`);
    });

    test('lab-broadcast-pickup: a bare wire on an LM386 plays a strong local station', () => {
        // At build time: 0.1 V/m, the 400 Hz tone at ~0.12 A rms in the
        // loudspeaker; the same station at 0.01 V/m barely (~8 mA, the
        // amplifier's idle hum level).
        const loud = bench('lab-broadcast-pickup');
        loud.run(60);
        const t = loud.tone('spk');
        assert.ok(t.on, 'a tone');
        near(t.hz, 400, 5, 'the station\'s programme (Hz)');
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): t.amps > 0.05 -> observed
        // 0.12343413743560126.
        assert.ok(t.amps > 0.05, `loud: ${t.amps.toFixed(3)} A rms`);
        const weak = bench('lab-broadcast-pickup', (json) => { json.parts.find(p => p.kind === 'antenna').params.stations[0].fieldVPerM = 0.01; });
        weak.run(60);
        assert.ok(weak.tone('spk').amps < t.amps / 5, `a tenth of the field: ${weak.tone('spk').amps.toFixed(4)} A rms`);
    });
});
