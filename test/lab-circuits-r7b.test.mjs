/**
 * The round-7 benches from `scripts/gen-lab-circuits-4.mjs --set=r7b` do what
 * their EXPECTED.md says, measured on the COMMITTED circuit.json with the
 * controls a learner would set: the bias pot, the generator's level, the
 * transistor's own temperature, a button, slide switches, the light on a
 * phototransistor, the speaker-microphone's sound.
 *
 * Readouts come from the engine's own surfaces: node voltages, buzzerTone(),
 * the device state and, for the radio benches, the RF envelope at a net
 * (`board._radio.bandAmplitudes`, bw-board src/radio.js). The RF and audio
 * benches cost real time per simulated millisecond, so every scenario keeps
 * to tens of milliseconds. Every number below was measured on the headless
 * engine (bw-board f4aaec43 to b094eb22) when the bench was built; the tolerances are
 * bands around those measurements.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r7b.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set r7b, amplifier stages, oscillators and receivers)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const LOG = process.env.R7B_LOG ? (...a) => console.log(...a) : () => {};

function bench (id, edit = null) {
    const json = JSON.parse(readFileSync(join(EXAMPLES, id, 'circuit.json'), 'utf8'));
    if (edit) edit(json, benchIds(BENCHES[id]));
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
        rf (name, term) { return Math.max(0, ...(b._radio?.bandAmplitudes(netOf(name, term)) ?? []).map(x => x.volts)); },
        tone (name) { return b.buzzerTone(ids[name]); },
        state (name) { return b.getDeviceState(ids[name]); },
        run (ms) {
            tMs += ms;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
            assert.equal(b._radio?.error ?? null, null, `${id}: radio front end error`);
        },
        /** [[tMs, V], …] at a terminal, sampled every dt ms for ms. */
        trace (name, term, ms, dt) {
            const out = [];
            for (let k = 0; k < Math.round(ms / dt); k++) { api.run(dt); out.push([tMs, api.v(name, term)]); }
            return out;
        },
        set (name, value) { b.setControl(ids[name], value); },
        param (name, key, value) { b.setPartParam(ids[name], key, value); },
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
/** Phase (degrees) of the `hz` component. */
const phase = (tr, hz) => {
    let re = 0, im = 0;
    for (const [t, v] of tr) { re += v * Math.cos(2 * Math.PI * hz * t / 1000); im += v * Math.sin(2 * Math.PI * hz * t / 1000); }
    return Math.atan2(im, re) * 180 / Math.PI;
};
const span = (tr) => { const v = tr.map(x => x[1]); return { min: Math.min(...v), max: Math.max(...v) }; };
const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);

describe('lab benches (set r7b) behave as documented', { skip: SKIP }, () => {
    test('lab-ce-audio-bias: clean in the middle of the bias range, one half clipped at either end, both when overdriven', () => {
        const run = (pos, amp) => {
            const x = bench('lab-ce-audio-bias');
            x.set('rv', pos); x.param('fg', 'amplitude', amp);
            x.run(150);
            const tr = x.trace('q', 'collector', 10, 0.05);
            const h1 = amplitude(tr, 500), h2 = amplitude(tr, 1000), h3 = amplitude(tr, 1500);
            const s = span(tr);
            LOG('ce', pos, amp, { mean: (s.min + s.max) / 2, ...s, h1, h2, h3 });
            return { h1, h2, h3, ...s };
        };
        // At build time: pot 0.80 mean 6.04 V, H1 0.178 V, H2/H1 0.0049;
        // 0.50 mean 8.66 V, H2/H1 0.418; 0.95 mean 2.10 V, H2/H1 0.426;
        // 0.85 with 2.5 V in: 2.24-7.30 V, H3/H1 0.171.
        const mid = run(0.8, 0.1), low = run(0.5, 0.1), high = run(0.95, 0.1), over = run(0.85, 2.5);
        near((mid.min + mid.max) / 2, 6.04, 0.15, 'pot 0.80: collector (V)');
        near(mid.h1, 0.178, 0.02, 'pot 0.80: 500 Hz at the collector (V)');
        // MEASURED 2026-11-24: mid.h2 / mid.h1 < 0.02 -> observed 0.0049.
        assert.ok(mid.h2 / mid.h1 < 0.02, `pot 0.80 is clean: H2/H1 ${(mid.h2 / mid.h1).toFixed(4)}`);
        near((low.min + low.max) / 2, 8.66, 0.15, 'pot 0.50: collector near cut-off (V)');
        // MEASURED 2026-11-24: low.h2 / low.h1 > 0.2 -> observed 0.418.
        assert.ok(low.h2 / low.h1 > 0.2, `pot 0.50 clips one half: H2/H1 ${(low.h2 / low.h1).toFixed(3)}`);
        near((high.min + high.max) / 2, 2.10, 0.15, 'pot 0.95: collector near saturation (V)');
        // MEASURED 2026-11-24: high.h2 / high.h1 > 0.2 -> observed 0.426.
        assert.ok(high.h2 / high.h1 > 0.2, `pot 0.95 clips the other half: H2/H1 ${(high.h2 / high.h1).toFixed(3)}`);
        // MEASURED 2026-11-24: over.h3 / over.h1 > 0.08 -> observed 0.171.
        assert.ok(over.h3 / over.h1 > 0.08, `overdrive clips both halves: H3/H1 ${(over.h3 / over.h1).toFixed(3)}`);
        // MEASURED 2026-11-24: mid.h3 / mid.h1 < 0.02 -> observed 0.0032.
        assert.ok(mid.h3 / mid.h1 < 0.02, `no odd harmonic when clean: H3/H1 ${(mid.h3 / mid.h1).toFixed(4)}`);
    });

    test('lab-bias-drift: heating moves a fixed-bias stage far; emitter or collector feedback holds it', () => {
        const run = (sf, se, pos) => {
            const x = bench('lab-bias-drift');
            x.set('sf', sf); x.set('se', se); x.set('rv', pos);
            x.run(500);
            const v25 = x.v('q', 'collector');
            x.param('q', 'surroundC', 70);
            x.run(3000);
            const v70 = x.v('q', 'collector');
            LOG('drift', sf, se, pos, v25, v70, x.b.partTemperature?.(x.ids.q));
            return { v25, v70 };
        };
        // At build time: fixed 6.606 -> 2.283 V; emitter resistor 5.838 ->
        // 5.655 V; collector feedback 6.085 -> 5.459 V.
        const fixed = run(0, 0, 0.51), emit = run(0, 1, 0.9), fb = run(1, 0, 0.7);
        near(fixed.v25, 6.61, 0.15, 'fixed bias, 25 °C (V)');
        near(fixed.v70, 2.28, 0.3, 'fixed bias, 70 °C (V)');
        near(emit.v25, 5.84, 0.1, 'emitter resistor, 25 °C (V)');
        near(emit.v70, 5.66, 0.1, 'emitter resistor, 70 °C (V)');
        near(fb.v25, 6.08, 0.1, 'collector feedback, 25 °C (V)');
        near(fb.v70, 5.46, 0.1, 'collector feedback, 70 °C (V)');
        // MEASURED 2026-11-24: (fixed.v25 - fixed.v70) / (emit.v25 - emit.v70) > 10 -> observed 23.6.
        assert.ok((fixed.v25 - fixed.v70) / (emit.v25 - emit.v70) > 10, 'the emitter resistor cuts the drift more than tenfold');
    });

    test('lab-cb-button: the emitter is the input, the collector follows in phase', () => {
        const x = bench('lab-cb-button');
        x.run(400);
        const ve = x.v('q', 'emitter'), vc = x.v('q', 'collector');
        const tg = [], tc = [];
        for (let k = 0; k < 250; k++) { x.run(0.02); tg.push([x.t, x.v('fg', 'out')]); tc.push([x.t, x.v('q', 'collector')]); }
        const gain = amplitude(tc, 1000) / amplitude(tg, 1000);
        let dphi = phase(tc, 1000) - phase(tg, 1000);
        dphi = ((dphi + 540) % 360) - 180;
        x.set('btn', 1); x.run(100);
        const veP = x.v('q', 'emitter'), vcP = x.v('q', 'collector');
        LOG('cb', { ve, vc, gain, dphi, veP, vcP });
        // At build time: 2.042 / 7.155 V; gain 8.92, phase -2.1°; pressed 1.956 / 6.531 V.
        near(ve, 2.04, 0.05, 'emitter at rest (V)');
        near(vc, 7.15, 0.1, 'collector at rest (V)');
        near(gain, 8.9, 1, 'collector / generator at 1 kHz');
        near(dphi, 0, 15, 'phase collector - generator (degrees): in phase');
        near(veP, 1.96, 0.05, 'emitter, button held (V)');
        near(vcP, 6.53, 0.1, 'collector, button held (V)');
    });

    test('lab-meissner-squegg: a slow emitter bypass squegs (bursts the radio hears as a tone), a fast one runs steadily, a reversed winding never starts', () => {
        const run = (big, reversed, settle) => {
            const x = bench('lab-meissner-squegg');
            if (big) x.set('sbig', 0);
            if (reversed) { x.set('sa', 1); x.set('sb', 1); }
            x.run(settle);
            const rf = [], det = [];
            for (let k = 0; k < 150; k++) { x.run(0.02); rf.push(x.rf('tct', 'b')); det.push([x.t, x.v('d', 'cathode')]); }
            const r = { rfMin: Math.min(...rf), rfMax: Math.max(...rf), ...span(det), tone: x.tone('ep') };
            LOG('squegg', big, reversed, JSON.stringify(r));
            return r;
        };
        // Re-designed 2026-11-26 (bw-board f48ea7ce): squegging needs the
        // self-bias network slow next to the oscillation's build-up (2Q/w
        // ~33 us); in a transistor stage that is the emitter's. 1 nF across
        // 1 kOhm relaxes in 1 us: steady. 1 uF (1 ms): it stops, recovers,
        // starts again. The earlier "low bias squegs" was the band's swing
        // collapsing at the collector clamp, an engine artefact.
        const steady = run(false, false, 22), sq = run(true, false, 6), rev = run(false, true, 5);
        // MEASURED 2026-11-26: sq.rfMin < 0.01 -> observed 0.0000025.
        assert.ok(sq.rfMin < 0.01, `squegging: the oscillation dies between bursts (${sq.rfMin} V)`);
        // MEASURED 2026-11-26: sq.rfMax > 5 -> observed 10.96.
        assert.ok(sq.rfMax > 5, `squegging: bursts reach volts (${sq.rfMax} V)`);
        // MEASURED 2026-11-26: sq.max - sq.min > 0.5 -> observed 3.50.
        assert.ok(sq.max - sq.min > 0.5, `squegging: the receiver's detector swings (${(sq.max - sq.min).toFixed(3)} V)`);
        assert.equal(sq.tone.on, true, 'squegging: the earphone hears a tone');
        near(sq.tone.hz, 820, 250, 'squegging: tone (Hz)');
        near(steady.rfMin, 8.89, 0.1, 'steady: tank swing (V)');
        // MEASURED 2026-11-26: steady.rfMax - steady.rfMin < 0.01 -> observed 0.00001.
        assert.ok(steady.rfMax - steady.rfMin < 0.01, 'steady: the swing does not move');
        // MEASURED 2026-11-26: steady.max - steady.min < 0.05 -> observed 0.00003.
        assert.ok(steady.max - steady.min < 0.05, `steady: the detector output is flat (${(steady.max - steady.min).toFixed(4)} V)`);
        // MEASURED 2026-11-24: rev.rfMax < 1e-3 -> observed 0.0000044.
        assert.ok(rev.rfMax < 1e-3, `reversed winding: no oscillation (${rev.rfMax} V)`);
        assert.equal(rev.tone.on, false, 'reversed winding: silence');
    });

    test('lab-trf-mosfet: the MOSFET stage amplifies the tank\'s RF into the detector; loose coupling is quieter and more selective', () => {
        // A fresh bench per setting (the tuning capacitor and the switch set
        // in the file): the per-station RF at the tank from the front end.
        const tankAt = (sw, pos) => {
            const x = bench('lab-trf-mosfet', (j, ids) => {
                j.parts.find(p => p.id === ids.tc).params.position = pos;
                j.parts.find(p => p.id === ids.sw).params.position = sw;
            });
            x.run(0.5);
            const net = x.b.getNets().find(n => n.terminals.some(t => t.part === x.ids.tc && t.terminal === 'a')).id;
            const per = x.b._radio.netAmplitudes(net);
            const g = (id) => per.find(s => s.id === id).volts;
            return { local: g('local'), next: g('next') };
        };
        const tight = tankAt(0, 0.3), loose = tankAt(1, 0.4);
        LOG('trf tank', JSON.stringify({ tight, loose }));
        const x = bench('lab-trf-mosfet');
        x.run(60);
        const gate = x.rf('m', 'gate'), drain = x.rf('m', 'drain');
        const out = x.trace('u', 'vout', 10, 0.05);
        const a400 = amplitude(out, 400), tone = x.tone('spk');
        LOG('trf play', { gate, drain, a400, tone: JSON.stringify(tone) });
        // At build time: tank (per station, V) tight 0.1725 local / 0.0245
        // neighbour, loose 0.0191 / 0.00208; playing (tight, tuned 0.30):
        // gate 0.0155 V, drain 0.231 V of RF, 400 Hz 4.03 V at the amplifier.
        near(tight.local, 0.1725, 0.02, 'tight, tuned: the local station at the tank (V)');
        near(loose.local, 0.0191, 0.003, 'loose, tuned: the local station at the tank (V)');
        // MEASURED 2026-11-24: loose.local / tight.local < 0.2 -> observed 0.111.
        assert.ok(loose.local / tight.local < 0.2, 'loose coupling is much quieter');
        // MEASURED 2026-11-24: loose.local / loose.next > tight.local / tight.next * 1.15 -> observed 9.17 vs 7.05.
        assert.ok(loose.local / loose.next > tight.local / tight.next * 1.15, 'loose coupling separates the neighbour better');
        near(gate, 0.0155, 0.003, 'the MOSFET gate\'s RF (V)');
        // MEASURED 2026-11-24: drain / gate > 8 -> observed 14.8.
        assert.ok(drain / gate > 8, `the MOSFET stage amplifies the RF (${(drain / gate).toFixed(1)} times)`);
        // MEASURED 2026-11-24: a400 > 2 -> observed 4.03.
        assert.ok(a400 > 2, `the station plays loud (${a400.toFixed(2)} V at 400 Hz)`);
        near(tone.hz, 400, 5, 'the speaker plays the local station (Hz)');
    });

    test('lab-radio-preamp: the transistor stage makes the weak station much louder', () => {
        const run = (sw) => {
            const x = bench('lab-radio-preamp');
            x.set('sw', sw);
            x.run(40);
            const out = x.trace('u', 'vout', 10, 0.05);
            const r = { a400: amplitude(out, 400), qc: x.v('q', 'collector'), tone: x.tone('spk') };
            LOG('preamp', sw, JSON.stringify(r));
            return r;
        };
        // At build time: direct 0.0191 V at 400 Hz, through the transistor 1.599 V; collector 6.33 V.
        const direct = run(0), pre = run(1);
        near(pre.qc, 6.33, 0.2, 'the transistor stage\'s collector (V)');
        near(pre.a400, 1.60, 0.3, 'through the transistor: 400 Hz at the amplifier output (V)');
        // MEASURED 2026-11-24: direct.a400 < 0.05 -> observed 0.0191.
        assert.ok(direct.a400 < 0.05, `straight from the detector: barely there (${direct.a400.toFixed(4)} V)`);
        // MEASURED 2026-11-24: pre.a400 / direct.a400 > 30 -> observed 83.7.
        assert.ok(pre.a400 / direct.a400 > 30, 'the transistor stage makes it much louder');
        near(pre.tone.hz, 400, 5, 'the station\'s tone (Hz)');
    });

    test('lab-dawn-mosfet: dark, the MOSFET detector carries no current and the speaker is silent; light, the station plays', () => {
        const run = (light) => {
            const x = bench('lab-dawn-mosfet');
            x.set('pt', light);
            x.run(60);
            const out = x.trace('u', 'vout', 10, 0.05);
            const r = { a400: amplitude(out, 400), drain: x.v('m', 'drain'), source: x.v('m', 'source'), gate: x.v('m', 'gate'), tone: x.tone('spk') };
            LOG('dawn', light, JSON.stringify(r));
            return r;
        };
        // At build time: dark 0.45 mV at 400 Hz, drain 9.000 V; light 0.852 V, drain 7.73 V, source 0.0026 V.
        const dark = run(0), lit = run(1);
        near(dark.drain, 9.0, 0.05, 'dark: drain (V)');
        // MEASURED 2026-11-24: dark.a400 < 0.01 -> observed 0.00045.
        assert.ok(dark.a400 < 0.01, `dark: silent (${dark.a400.toFixed(5)} V)`);
        near(lit.drain, 7.73, 0.15, 'light: drain (V)');
        // MEASURED 2026-11-24: lit.source < 0.05 -> observed 0.0026.
        assert.ok(lit.source < 0.05, `light: the phototransistor grounds the source (${lit.source.toFixed(4)} V)`);
        near(lit.a400, 0.85, 0.15, 'light: 400 Hz at the amplifier output (V)');
        near(lit.tone.hz, 400, 5, 'light: the speaker plays the station (Hz)');
    });

    test('lab-whistle-fm: sound at the speaker-microphone makes the astable\'s pitch wail', () => {
        const periods = (db) => {
            const x = bench('lab-whistle-fm', (j, ids) => { j.parts.find(p => p.id === ids.mic).params.soundDb = db; });
            x.run(30);
            const tr = x.trace('q2', 'collector', 40, 0.01);
            const vs = tr.map(a => a[1]);
            const mid = (Math.max(...vs) + Math.min(...vs)) / 2;
            const ups = [];
            for (let i = 1; i < tr.length; i++) if (vs[i - 1] < mid && vs[i] >= mid) ups.push(tr[i][0]);
            const per = ups.slice(1).map((t, i) => t - ups[i]);
            const r = { n: per.length, min: Math.min(...per), max: Math.max(...per), node: x.v('rv', 'b') };
            LOG('whistle', db, JSON.stringify(r));
            return r;
        };
        // At build time: silent 2.34-2.35 ms, node 4.22 V; 110 dB 1.92-2.61 ms, node 3.26 V.
        const quiet = periods(0), loud = periods(110);
        near((quiet.min + quiet.max) / 2, 2.345, 0.08, 'silent: period (ms)');
        // MEASURED 2026-11-24: quiet.max - quiet.min < 0.05 -> observed 0.010.
        assert.ok(quiet.max - quiet.min < 0.05, `silent: steady pitch (${(quiet.max - quiet.min).toFixed(3)} ms spread)`);
        // MEASURED 2026-11-24: loud.max - loud.min > 0.3 -> observed 0.69.
        assert.ok(loud.max - loud.min > 0.3, `sound: the pitch wails (${(loud.max - loud.min).toFixed(3)} ms spread)`);
    });

    test('lab-wobble-astable: the amplifier-IC astable sweeps the pitch in a sawtooth', () => {
        const x = bench('lab-wobble-astable');
        x.run(10);
        const vc = [], hz = [];
        for (let k = 0; k < 40; k++) { x.run(2.5); vc.push(x.v('cv', 'pos')); const t = x.tone('pz'); hz.push(t.on ? t.hz : 0); }
        let up = 0, down = 0;
        for (let k = 1; k < vc.length; k++) { if (vc[k] - vc[k - 1] > 0.5) up++; else if (vc[k] < vc[k - 1]) down++; }
        const r = { vMin: Math.min(...vc), vMax: Math.max(...vc), up, down, hzMin: Math.min(...hz.filter(h => h > 0)), hzMax: Math.max(...hz) };
        LOG('wobble', JSON.stringify(r));
        LOG('wobble vc', vc.map(v => v.toFixed(2)).join(' '));
        LOG('wobble hz', hz.map(v => v.toFixed(0)).join(' '));
        // At build time: control node 4.88-7.60 V, 2 steps up and 35 down in
        // 40 samples (period ~45 ms), pitch 210-265 Hz (306 Hz at the start).
        near(r.vMax, 7.60, 0.15, 'the node right after a pulse (V)');
        near(r.vMin, 4.88, 0.25, 'the node just before the next pulse (V)');
        // MEASURED 2026-11-24: r.up <= 4 && r.down >= 30 -> observed up 2, down 35.
        assert.ok(r.up <= 4 && r.down >= 30, `a sawtooth: fast rises, slow falls (${r.up} up, ${r.down} down)`);
        // MEASURED 2026-11-24: r.hzMax - r.hzMin > 30 -> observed 96.8.
        assert.ok(r.hzMax - r.hzMin > 30, `the pitch is swept (${r.hzMin.toFixed(0)}-${r.hzMax.toFixed(0)} Hz)`);
    });

    test('lab-rf-remote: the LED lights only while the transmitter\'s button is held', () => {
        const x = bench('lab-rf-remote');
        const ledMa = () => (x.v('u', 'vout') - x.v('led', 'anode')) / 470 * 1e3;
        x.run(10);
        const off = { out: x.v('u', 'vout'), led: ledMa() };
        x.set('key', 1);
        x.run(5);
        const on = { out: x.v('u', 'vout'), det: x.v('d', 'cathode'), led: ledMa(), tx: x.rf('tct', 'b'), rx: x.rf('tcr', 'a'), gate: x.rf('m', 'gate'), drain: x.rf('m', 'drain') };
        x.set('key', 0);
        x.run(8);
        const after = { out: x.v('u', 'vout'), led: ledMa() };
        LOG('remote', JSON.stringify({ off, on, after }));
        // At build time (bw-board b094eb22): idle out 4.527 V, LED 0.009 mA;
        // key held 5 ms: out 7.16 V, detector 0.133 V, LED 4.51 mA, gate
        // 0.059 V and drain 0.682 V of RF; released 8 ms: out 4.572 V, LED
        // 0.016 mA. Re-measured 2026-11-26 (bw-board f48ea7ce): the
        // transmitter's swing is lower after #760's band changes (its band
        // no longer collapses and regrows at the clamp; 3.5 V of RF at its
        // tank), so key held: out 6.21 V, detector 0.085 V, LED 2.63 mA, gate
        // 0.016 V and drain 0.244 V; idle and released as before.
        near(off.out, 4.53, 0.05, 'idle: the LM386 output at half the supply (V)');
        // MEASURED 2026-11-24: off.led < 0.2 -> observed 0.0094.
        assert.ok(off.led < 0.2, `idle: LED dark (${off.led.toFixed(3)} mA)`);
        near(on.out, 6.21, 0.6, 'key held: the LM386 output (V)');
        // MEASURED 2026-11-26: on.led > 1.5 -> observed 2.63 (4.51 before bw-board #760).
        assert.ok(on.led > 1.5, `key held: LED lit (${on.led.toFixed(2)} mA)`);
        // MEASURED 2026-11-26: on.drain / on.gate > 6 -> observed 14.9 (11.5 before bw-board #760).
        assert.ok(on.drain / on.gate > 6, `the MOSFET stage amplifies the carrier (${(on.drain / on.gate).toFixed(1)} times)`);
        // MEASURED 2026-11-24: after.led < 0.2 -> observed 0.0165.
        assert.ok(after.led < 0.2, `released: LED dark again (${after.led.toFixed(3)} mA)`);
    });

    test('lab-am-voice-dual-gate: sound on gate 2 modulates the carrier the receiver hears', () => {
        const run = (db) => {
            const x = bench('lab-am-voice-dual-gate', (j, ids) => { j.parts.find(p => p.id === ids.mic).params.soundDb = db; });
            x.run(6);
            const det = [];
            for (let k = 0; k < 80; k++) { x.run(0.05); det.push([x.t, x.v('d', 'cathode')]); }
            const r = { gate1: x.rf('m', 'gate1'), drain: x.rf('m', 'drain'), rx: x.rf('tcr', 'a'), a500: amplitude(det, 500), g2: x.v('m', 'gate2') };
            LOG('dualgate', db, JSON.stringify(r));
            return r;
        };
        // At build time (pot 0.10): silent gate1 0.120 V, drain 1.58 V of RF,
        // receiver tank 0.221 V, 500 Hz at the detector 0.0013 V; at 100 dB
        // 1.64 V / 0.237 V and 0.0195 V of 500 Hz.
        const quiet = run(0), loud = run(100);
        near(quiet.gate1, 0.12, 0.02, 'the carrier on gate 1 (V)');
        near(quiet.drain, 1.58, 0.3, 'the carrier at the drain (V)');
        // MEASURED 2026-11-24: quiet.a500 < 0.005 -> observed 0.0013.
        assert.ok(quiet.a500 < 0.005, `silent: no 500 Hz in the receiver (${quiet.a500.toFixed(5)} V)`);
        // MEASURED 2026-11-24: loud.a500 > 0.008 -> observed 0.0195.
        assert.ok(loud.a500 > 0.008, `sound: the receiver's detector carries the 500 Hz tone (${loud.a500.toFixed(4)} V)`);
        // MEASURED 2026-11-24: loud.a500 / quiet.a500 > 5 -> observed 14.6.
        assert.ok(loud.a500 / quiet.a500 > 5, 'the sound modulates the carrier');
    });
});
