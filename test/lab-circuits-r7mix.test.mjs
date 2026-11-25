/**
 * The mixer-IC benches from `scripts/gen-lab-circuits-4.mjs --set=r7mix` do
 * what their EXPECTED.md says, measured on the COMMITTED circuit.json with
 * the controls a learner would turn.
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
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r7mix.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set r7mix, the double-balanced mixer IC)');
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
        rf (name, term) { return Math.max(0, ...b._radio.bandAmplitudes(netOf(name, term), tMs / 1000).map(x => x.volts)); },
        tone (name) { return b.buzzerTone(ids[name]); },
        meter (name) { return b.getDeviceState(ids[name])?.reading; },
        led (name) { return b.ledBrightness(ids[name]); },
        state (name) { return b.getDeviceState(ids[name]); },
        /** [[tMs, v], …] of a terminal's voltage, sampled every dt ms for ms. */
        trace (name, term, ms, dt) { const out = []; const n = Math.round(ms / dt); for (let i = 0; i < n; i++) { this.run(dt); out.push([tMs, this.v(name, term)]); } return out; },
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

/** Zero-crossing frequency (Hz) of a [[tMs, v], …] trace about its mean. */
const crossings = (tr) => {
    const m = tr.reduce((a, x) => a + x[1], 0) / tr.length;
    let z = 0;
    for (let i = 1; i < tr.length; i++) if ((tr[i - 1][1] - m) * (tr[i][1] - m) < 0) z++;
    return z / 2 / ((tr.at(-1)[0] - tr[0][0]) / 1000);
};
// An LED counts as lit above LIT and dark below DARK (brightness 0..1).
// MEASURED 2026-11-25 (lab-mixer-points, 0.7 s): lit lamps read 0.12 .. 0.25, dark ones below 2e-8.
const LIT = 0.05, DARK = 0.01;
/** Frequency (Hz) of a slow swing about zero, counting crossings of ±h (hysteresis: ripple is ignored). */
const swingHz = (tr, h) => {
    let side = 0, flips = 0;
    for (const [, v] of tr) {
        const now = v > h ? 1 : v < -h ? -1 : side;
        if (side && now !== side) flips++;
        side = now;
    }
    return flips / 2 / ((tr.at(-1)[0] - tr[0][0]) / 1000);
};
const span = (tr) => Math.max(...tr.map(x => x[1])) - Math.min(...tr.map(x => x[1]));

describe('lab mixer-IC benches (set r7mix) behave as documented', { skip: SKIP }, () => {
    test('lab-mixer-points: the blinking jumps from one LED to the other with the STEER button', () => {
        const x = bench('lab-mixer-points');
        // Sample 0.7 s in 10 ms steps: the LM386 square wave (a few hertz)
        // and the two lamps.
        const sample = (ms) => {
            const out = [];
            for (let i = 0; i < ms / 10; i++) { x.run(10); out.push({ osc: x.v('u', 'vout'), a: x.led('la'), b: x.led('lb') }); }
            return out;
        };
        const free = sample(700);
        x.set('steer', 1);
        sample(100);
        const held = sample(700);
        const lit = (s) => s.a > LIT && s.b < DARK ? 'a' : s.b > LIT && s.a < DARK ? 'b' : '-';
        const tally = (ss, hi) => ss.filter(s => (s.osc > 3) === hi).map(lit);
        // Released: oscillator high -> green (b), low -> red (a). Pressed: swapped.
        for (const [ss, hiLamp, loLamp, what] of [[free, 'b', 'a', 'released'], [held, 'a', 'b', 'pressed']]) {
            const hi = tally(ss, true), lo = tally(ss, false);
            assert.ok(hi.length > 10 && lo.length > 10, `${what}: the oscillator swings both ways (${hi.length} high, ${lo.length} low samples; MEASURED 2026-11-25: ~35 each)`);
            assert.ok(hi.filter(l => l === hiLamp).length >= 0.8 * hi.length, `${what}: oscillator high lights ${hiLamp} (${hi.join('')})`);
            assert.ok(lo.filter(l => l === loLamp).length >= 0.8 * lo.length, `${what}: oscillator low lights ${loLamp} (${lo.join('')})`);
        }
    });

    test('lab-sync-detector: the station switching the mixer with its own carrier plays its programme', () => {
        const run = (sync) => {
            const x = bench('lab-sync-detector');
            x.set('sync', sync);
            x.run(4);
            const tr = x.trace('spk', 'a', 3, 0.02);
            return { tone: amplitude(tr, 1000), off: amplitude(tr, 1500), tank: x.rf('l', 'b') };
        };
        const on = run(1), off = run(0);
        // MEASURED 2026-11-25: SYNC on -> 1 kHz at the speaker 0.69 V, tank 0.234 V;
        // SYNC off (no LO) -> 0.054 V (the amplifier's switch-on settling, no programme).
        assert.ok(on.tank > 0.1, `the station is in the tank: ${on.tank} V (MEASURED 2026-11-25: 0.234 V)`);
        assert.ok(on.tone > 0.3, `SYNC on: the 1 kHz programme at the speaker (${on.tone} V; MEASURED 2026-11-25: 0.69 V)`);
        assert.ok(on.tone > 5 * on.off, `…as a tone, not broadband (1 kHz ${on.tone} V, 1.5 kHz ${on.off} V; expected ~0.69 V against a few mV)`);
        assert.ok(off.tone < on.tone / 5, `SYNC off: no LO, nothing detected (${off.tone} V; MEASURED 2026-11-25: 0.054 V)`);
    });

    test('lab-mixer-beat-rx: the mixer\'s own oscillator whistles against a station, its pitch following the tuning', () => {
        const run = (pos) => {
            const x = bench('lab-mixer-beat-rx');
            x.set('tc', pos);
            x.run(2);
            const tr = x.trace('ep', 'a', 3, 0.01);
            return { swing: span(tr), hz: crossings(tr) };
        };
        // MEASURED 2026-11-25: 0.53 -> 1003 Hz at 0.175 V peak-to-peak; 0.535 -> 3010 Hz at 0.19 V;
        // 0.45 (between stations, ~660 kHz) -> 0.039 V of switch-on settling, no tone.
        const near = run(0.53), further = run(0.535), between = run(0.45);
        assert.ok(near.swing > 0.1, `near the 612 kHz station: a whistle (${near.swing} V; MEASURED 2026-11-25: 0.175 V)`);
        near1(near.hz, 1000, 250, 'its pitch (Hz)');
        assert.ok(further.hz > 2 * near.hz, `tuned further: a higher whistle (${further.hz} Hz; MEASURED 2026-11-25: 3010 Hz against 1003 Hz)`);
        assert.ok(between.swing < near.swing / 3, `between stations: no whistle (${between.swing} V; MEASURED 2026-11-25: 0.039 V)`);
    });

    test('lab-mixer-metal-detector: a coin at the search coil moves the beat against the mixer receiver', () => {
        const run = (pos, coin) => {
            const x = bench('lab-mixer-metal-detector');
            x.set('tc2', pos);
            if (coin) x.b.setPartParam(x.ids.ls, 'metalCm', 0);
            x.run(3);
            const tr = x.trace('ep', 'a', 4, 0.01);
            return { swing: span(tr), hz: crossings(tr) };
        };
        // MEASURED 2026-11-25: tuning 0.5 -> 501 Hz (77 mV p-p); with the coin -> 3008 Hz (57 mV);
        // tuning 0.3 -> zero beat (the two oscillators 9 Hz apart: 15 mV of slow wobble).
        const free = run(0.5, false), coin = run(0.5, true), zero = run(0.3, false);
        assert.ok(free.swing > 0.03, `no metal: a tone at the earphone (${free.swing} V; MEASURED 2026-11-25: 0.077 V)`);
        near1(free.hz, 500, 150, 'no metal: the beat (Hz)');
        assert.ok(coin.hz > 2000, `a coin on the search coil: the search oscillator rises, the beat with it (${coin.hz} Hz; MEASURED 2026-11-25: 3008 Hz)`);
        assert.ok(zero.hz < 250, `tuned to zero beat: no audible tone (${zero.hz} Hz; MEASURED 2026-11-25: 125 Hz)`);
    });

    test('lab-mixer-strobe: mixing the oscillator with the mains, the meter swings at the difference frequency', () => {
        const x = bench('lab-mixer-strobe');
        x.set('rate', 0);
        x.run(150);
        const diff = [], osc = [], meter = [];
        for (let i = 0; i < 70; i++) {
            x.run(5);
            diff.push([x.t, x.v('m', 'out_a') - x.v('m', 'out_b')]);
            osc.push([x.t, x.v('u', 'vout')]);
            meter.push(x.meter('vm'));
        }
        const fOsc = crossings(osc), beat = swingHz(diff, 0.3);
        const lo = Math.min(...diff.map(d => d[1])), hi = Math.max(...diff.map(d => d[1]));
        // MEASURED 2026-11-25: oscillator 44 Hz, mains 50.3 Hz,
        // smoothed difference swinging -0.73 .. +0.73 V about six times a second.
        near1(fOsc, 44, 4, 'the LM386 oscillator at RATE 0 (Hz)');
        assert.ok(lo < -0.5 && hi > 0.5, `the outputs swing both ways (${lo.toFixed(2)} .. ${hi.toFixed(2)} V; MEASURED 2026-11-25: -0.73 .. 0.73 V)`);
        near1(beat, Math.abs(50 - fOsc), 3, 'the swing follows |f_osc - 50 Hz| (Hz)');
        // The meter between the outputs (out_b to out_a) shows the same swing.
        assert.ok(Math.min(...meter) < -0.5 && Math.max(...meter) > 0.5, `the meter swings both ways (${Math.min(...meter).toFixed(2)} .. ${Math.max(...meter).toFixed(2)} V; MEASURED 2026-11-25: ±0.7 V)`);
    });

    test('lab-mixer-diff-amp: a MOSFET splits the station into antiphase for the mixer, gate 2 sets the gain', () => {
        const rfAt = (x, name, term) => {
            const n = x.b.getNets().find(k => k.terminals.some(q => q.part === x.ids[name] && q.terminal === term)).id;
            return Math.max(0, ...(x.b.rfVoltage(n) ?? []).map(s => s.volts), x.rf(name, term));
        };
        const run = (gain, out) => {
            const x = bench('lab-mixer-diff-amp');
            x.set('gain', gain);
            x.set('osel', out);
            // Past the front end's first refresh at the settled bias (every 5 ms).
            x.run(6);
            const det = x.trace('d', 'cathode', 1, 0.02);
            return { drain: rfAt(x, 'fet', 'drain'), source: rfAt(x, 'fet', 'source'), a: rfAt(x, 'm', 'out_a'), b: rfAt(x, 'm', 'out_b'),
                tone: amplitude(det, 1000) };
        };
        // MEASURED 2026-11-25: GAIN 0.5 (gate 2 at 3 V): drain and source 15.4 mV each, outputs A/B 0.179/0.183 V,
        // 1 kHz at the detector 6.3 mV; GAIN 1 (gate 2 at 0 V): 8.1 mV, outputs 0.096 V; output B selected: 7.6 mV of tone.
        const full = run(0.5, 0), shut = run(1, 0), other = run(0.5, 1);
        near(full.drain / full.source, 1, 0.05, 'drain and source carry the station equally (antiphase)');
        assert.ok(full.a > 5 * (full.drain + full.source), `the mixer amplifies their difference (${full.a} V from ${full.drain} + ${full.source} V; MEASURED 2026-11-25: 0.179 V from 2 × 15.4 mV)`);
        near(full.b / full.a, 1, 0.1, 'output B carries the same RF');
        assert.ok(full.tone > 3e-3 && other.tone > 3e-3, `either output detected gives the programme (${full.tone}, ${other.tone} V; MEASURED 2026-11-25: 6.3 and 7.6 mV)`);
        assert.ok(shut.a < 0.6 * full.a, `gate 2 towards 0 V: the gain falls (${shut.a} V against ${full.a} V; MEASURED 2026-11-25: 0.096 against 0.179 V)`);
    });

    test('lab-mixer-direct-conversion: the transmitter heard as a whistle that follows its tuning and its supply', () => {
        const run = (controls) => {
            const x = bench('lab-mixer-direct-conversion');
            for (const [k, v] of Object.entries(controls)) x.set(k, v);
            x.run(2);
            const tr = x.trace('spk', 'a', 3, 0.01);
            return { swing: span(tr), hz: crossings(tr) };
        };
        // MEASURED 2026-11-25: as authored (9 V, both at 0.3) 3846 Hz, 3.64 V p-p at the speaker;
        // transmitter tuned to 0.302 -> 1171 Hz; transmitter on 6 V -> 5518 Hz.
        const base = run({}), tuned = run({ tct: 0.302 }), sagged = run({ vsel: 1 });
        assert.ok(base.swing > 1, `a loud whistle (${base.swing} V p-p; MEASURED 2026-11-25: 3.64 V)`);
        near1(base.hz, 3850, 600, 'as authored: the difference of the two oscillators (Hz)');
        assert.ok(tuned.hz < base.hz / 2, `the transmitter tuned towards the receiver: a lower whistle (${tuned.hz} Hz; MEASURED 2026-11-25: 1171 Hz)`);
        assert.ok(sagged.hz > base.hz + 1000, `the transmitter on 6 V instead of 9 V: its frequency moves, the whistle with it (${sagged.hz} Hz; MEASURED 2026-11-25: 5518 Hz)`);
    });
});
