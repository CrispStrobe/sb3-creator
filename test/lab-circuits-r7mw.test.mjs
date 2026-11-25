/**
 * The round-7 medium-wave benches from `scripts/gen-lab-circuits-4.mjs
 * --set=r7mw` do what their EXPECTED.md says, measured on the COMMITTED
 * circuit.json with the controls a learner would turn.
 *
 * The engine carries every RF signal as a complex envelope around the
 * circuit's resonances (bw-board src/radio.js): a junction swinging in two
 * bands puts its products into a third (a superhet's IF, a transmitter's
 * harmonics), and an untuned coil linked to another radiates the corners of
 * its switched current into the other's bands. Receivers are read through
 * the band envelopes (`bandAmplitudes`), the radio report's resonances and
 * the detector's rectified level. RF benches cost real time: every
 * scenario stays at a few simulated milliseconds.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r7mw.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set r7mw, medium-wave radio)');
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
    return {
        c, b, ids,
        v (name, term) { return b.nodeVoltages.get(netOf(name, term)) ?? 0; },
        /** RF envelope (V peak) at a terminal in the band nearest `hz` (within 3 %), now. */
        band (name, term, hz) {
            const xs = b._radio.bandAmplitudes(netOf(name, term), tMs / 1000).filter(x => Math.abs(x.hz / hz - 1) <= 0.03);
            return xs.length ? Math.max(...xs.map(x => x.volts)) : 0;
        },
        /** Largest RF envelope over all bands at a terminal, now. */
        rf (name, term) { return Math.max(0, ...b._radio.bandAmplitudes(netOf(name, term), tMs / 1000).map(x => x.volts)); },
        /** The resonances the front end follows (kHz) and their stations. */
        bands () { return b.radioReport().bands.map(x => ({ khz: x.hz / 1e3, stations: x.stations, products: x.products })); },
        run (ms, step = 0.25) {
            const end = tMs + ms;
            while (tMs < end - 1e-9) {
                tMs = Math.min(end, tMs + step);
                b.advanceTo(BigInt(Math.round(tMs * 1e6)));
                assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
                assert.equal(b._radio?.error ?? null, null, `${id}: radio front end error`);
            }
        },
        set (name, value) { b.setControl(ids[name], value); },
        get t () { return tMs; },
    };
}
const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);
const nearest = (bands, khz) => bands.reduce((a, x) => (Math.abs(x.khz - khz) < Math.abs(a.khz - khz) ? x : a));

describe('lab medium-wave benches (set r7mw) behave as documented', { skip: SKIP }, () => {
    test('lab-sliding-winding: aiding, opposing and a slid winding move the tank; each brings its station', () => {
        const at = (sw, slide, tc) => {
            const x = bench('lab-sliding-winding');
            x.set('s1', sw); x.set('s2', sw); x.set('l', slide); x.set('tc', tc);
            x.run(1.5, 0.5);
            return x;
        };
        // MEASURED 2026-11-25: aiding, middle, 0.50 -> tank 488 kHz, detector 1.3 mV.
        const aid = at(0, 0, 0.5);
        const fAid = nearest(aid.bands(), 500).khz;
        near(fAid, 488, 15, 'aiding, winding in the middle (kHz)');
        assert.ok(aid.v('d', 'cathode') < 0.01, `no station there: ${aid.v('d', 'cathode')} V`); // MEASURED 2026-11-25: 0.0013 V -> observed 0.0013.
        // MEASURED 2026-11-25: opposing -> 810 kHz, the 810 kHz carrier 0.166 V at the diode, 36 mV rectified.
        const opp = at(1, 0, 0.5);
        const fOpp = nearest(opp.bands(), 800);
        near(fOpp.khz, 810, 20, 'opposing (kHz)');
        // L1 + L2 ± 2M with L2 = 0.09·L1, M = 0.9·0.3·L1: sqrt(1.63/0.55) = 1.72 (the antenna's load pulls it to 1.66).
        near(fOpp.khz / fAid, 1.69, 0.07, 'opposing / aiding resonance ratio');
        assert.ok(opp.v('d', 'cathode') > 10 * aid.v('d', 'cathode'), `the 810 kHz station rectified: ${opp.v('d', 'cathode')} V`); // MEASURED 2026-11-25: 0.0361 against 0.0013 -> observed 28x.
        // MEASURED 2026-11-25: aiding, slid to the end, 0.45 -> 612 kHz, 0.15 V rectified.
        const slid = at(0, 1, 0.45);
        near(nearest(slid.bands(), 612).khz, 612, 10, 'slid to the end, dial 0.45 (kHz)');
        assert.ok(slid.v('d', 'cathode') > 0.08, `the 612 kHz station rectified: ${slid.v('d', 'cathode')} V`); // MEASURED 2026-11-25: 0.1515 -> observed 0.15.
    });
    test('lab-spark-transmitter: a press clicks the receiver between stations; on a station its carrier is there anyway', () => {
        // Between stations (0.15, about 1.1 MHz).
        const x = bench('lab-spark-transmitter');
        x.set('tc', 0.15);
        x.run(5, 0.5);
        const quiet = x.rf('lr', 'b');
        assert.ok(quiet < 1e-3, `between stations, before the press: ${quiet} V`); // MEASURED 2026-11-25: 5.5e-6 V -> observed 5e-6.
        x.set('key', 1);
        let ring = 0, det = 0;
        for (let i = 0; i < 6; i++) { x.run(0.5, 0.5); ring = Math.max(ring, x.rf('lr', 'b')); det = Math.max(det, x.v('d', 'cathode')); }
        assert.ok(ring > 1000 * quiet, `the press rings the tank: ${ring} V`); // MEASURED 2026-11-25: 8.0 V against 5.5e-6 -> observed 1.4e6 x.
        assert.ok(det > 1, `the detector jumps: ${det} V`); // MEASURED 2026-11-25: 7.6 V -> observed 7.6.
        // On the 612 kHz station (0.50) its carrier is on the tank without any press.
        const y = bench('lab-spark-transmitter');
        y.run(5, 0.5);
        assert.ok(y.band('lr', 'b', 612e3) > 0.1, `the 612 kHz carrier: ${y.band('lr', 'b', 612e3)} V`); // MEASURED 2026-11-25: 0.44 V -> observed 0.44.
    });
    test('lab-chopped-spark: the astable\'s pitch arrives as detector pulses at two settings of the dial', () => {
        const pulses = (tc) => {
            const x = bench('lab-chopped-spark');
            x.set('tc', tc);
            x.run(1, 0.5);
            const times = [];
            let prev = 0, peak = 0;
            for (let i = 0; i < 60; i++) {
                x.run(0.05, 0.05);
                const v = x.v('d', 'cathode');
                if (v > 0.02 && prev <= 0.02) times.push(x.t);
                peak = Math.max(peak, v);
                prev = v;
            }
            return { times, peak };
        };
        for (const tc of [0.15, 0.4]) {
            const { times, peak } = pulses(tc);
            // MEASURED 2026-11-25: pulses every 0.65 ms (6-7 samples of 0.1 ms), peaks 0.03-0.4 V at both settings.
            assert.ok(times.length >= 3, `dial ${tc}: detector pulses ${JSON.stringify(times)}`); // MEASURED 2026-11-25: 4-5 pulses in 3 ms -> observed 4.
            const gaps = times.slice(1).map((t, i) => t - times[i]);
            const mean = gaps.reduce((a, g) => a + g, 0) / gaps.length;
            near(mean, 0.65, 0.15, `dial ${tc}: interval between pulses (ms)`);
            assert.ok(peak > 0.02, `dial ${tc}: pulse height ${peak} V`); // MEASURED 2026-11-25: 0.23-0.39 V -> observed 0.3.
        }
    });
    test('lab-superhet: the station reaches the IF only while the oscillator sits an IF above it; loose coupling sharpens the aerial', () => {
        const x = bench('lab-superhet');
        x.run(1.5, 0.5);
        // MEASURED 2026-11-25: IF tank 0.40 V at 457 kHz, IF transistor's collector 1.8 V.
        const ifOn = x.band('l3', 'a', 457e3);
        assert.ok(ifOn > 0.1, `aligned (oscillator 1068 kHz, station 612 kHz): IF ${ifOn} V`); // MEASURED 2026-11-25: 0.403 V -> observed 0.40.
        // The aerial tank's selectivity as the mixer sees it: 810 kHz against 612 kHz at its input.
        x.b.refreshRadio();
        const atIn = () => Object.fromEntries(x.b.rfVoltage(x.c.board.getNets().find(n => n.terminals.some(t => t.part === x.ids.u && t.terminal === 'in_a')).id).map(s => [s.id, s.volts]));
        const tight = atIn();
        // The oscillator 25 kHz off: the product misses the IF tank.
        x.set('tc2', 0.15);
        x.run(1, 0.5);
        const ifOff = x.band('l3', 'a', 457e3);
        assert.ok(ifOff < ifOn / 100, `oscillator off by ~25 kHz: IF ${ifOff} V`); // MEASURED 2026-11-25: 9.3e-8 V against 0.40 -> observed 4e6x.
        // Loose coupling (10 pF) and the aerial retuned to 0.534: the neighbour drops further than the station.
        x.set('tc2', 0.127); x.set('sant', 1); x.set('tc1', 0.534);
        x.run(0.5, 0.5);
        x.b.refreshRadio();
        const loose = atIn();
        assert.ok(loose.rf810 / loose.rf612 < tight.rf810 / tight.rf612,
            `810/612 at the mixer: tight ${tight.rf810 / tight.rf612}, loose ${loose.rf810 / loose.rf612}`);
        assert.ok(loose.rf612 < tight.rf612, `loose coupling passes less of the station: ${loose.rf612} < ${tight.rf612} V`);
    });

    test('lab-superhet: with the low IF the strong 1200 kHz station comes in as the image; with the 455 kHz IF it does not', () => {
        const only1200 = (json) => { const a = json.parts.find(p => p.kind === 'antenna'); a.params.stations = a.params.stations.filter(s => s.id === 'rf1200'); };
        const imageIf = (low) => {
            const x = bench('lab-superhet', only1200);
            if (low) { x.set('sif', 1); x.set('tc2', 0.303); }
            x.run(1.5, 0.5);
            // The quasi-static stations are re-solved every 5 ms; once the RF
            // stage's bias has settled, do it now.
            x.b.refreshRadio();
            x.run(1, 0.5);
            return x.band('l3', 'a', low ? 296e3 : 457e3);
        };
        const lo = imageIf(true), hi = imageIf(false);
        assert.ok(lo > 1e-2, `low IF (296 kHz, oscillator 907 kHz): the 1200 kHz image in the IF, ${lo} V`); // MEASURED 2026-11-25: 0.175 V -> observed 0.175.
        assert.ok(hi < lo / 100, `455 kHz IF: its image is 1523 kHz, the 1200 kHz station stays out: ${hi} V`); // MEASURED 2026-11-25: 1.1e-4 V against 0.175 -> observed 1600x.
    });
});
