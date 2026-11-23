/**
 * The radio benches from `scripts/gen-lab-circuits-4.mjs --set=7` do what
 * their EXPECTED.md says: measured on the COMMITTED circuit.json, with the
 * tuning knob, the antenna switch and the broadcast a learner would meet.
 *
 * The engine solves the carrier as phasors (board.rfVoltage per station) and
 * the detected audio as ordinary transient behaviour, so a receiver is read
 * through `buzzerTone()` (pitch, level, coil current) and through its tank's
 * RF voltage per station. Each simulated millisecond of a radio still costs
 * real time, so every scenario stays within a few tens of milliseconds per
 * setting. The benches without an `antenna` `stations` param hear the
 * engine's default broadcast: 612 kHz with a 400 Hz tone, 810 kHz with 600
 * and 900 Hz alternating every 0.2 s, 1215 kHz with a 1 kHz tone. Every
 * number below was measured on the headless engine (bw-board 0bc7baf) when
 * the bench was built; the tolerances are bands around those measurements.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-7.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set 7, radio)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

/** Load a committed bench (optionally edited first) and name its parts by role. */
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
        /** RF amplitude (V peak) per station at a terminal, keyed by station id. */
        rf (name, term) { return Object.fromEntries(b.rfVoltage(netOf(name, term)).map(s => [s.id, s.volts])); },
        tone (name) { return b.buzzerTone(ids[name]); },
        run (ms) {
            tMs += ms;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
        },
        each (ms, step, fn) { const end = tMs + ms; while (tMs < end - 1e-9) { api.run(step); fn(tMs); } },
        set (name, value) { b.setControl(ids[name], value); },
        get t () { return tMs; },
    };
    return api;
}

const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);
/** Amplitude of the `hz` component of a [[tMs, v], …] trace (one-bin DFT). */
const amplitude = (tr, hz) => {
    let re = 0, im = 0;
    for (const [t, v] of tr) { re += v * Math.cos(2 * Math.PI * hz * t / 1000); im += v * Math.sin(2 * Math.PI * hz * t / 1000); }
    return 2 * Math.hypot(re, im) / tr.length;
};

describe('lab radio benches (set 7) behave as documented', { skip: SKIP }, () => {
    test('lab-crystal-set: the knob picks one of three stations, and each plays its programme', () => {
        // The tank's RF per station at the three dial marks: the tuned one
        // dominates. Cheap: a control change re-solves the carrier at once.
        const x = bench('lab-crystal-set');
        x.run(2);
        const dial = { rf612: 0.50, rf810: 0.265, rf1215: 0.10 };
        // At build time (bw-board 0bc7baf): tank 0.476 V (612 kHz) at 0.50,
        // 0.246 V (810 kHz) at 0.26, 0.187 V (1215 kHz) at 0.10; at each mark
        // the next strongest station is at most 0.04 V.
        for (const [station, pos] of Object.entries(dial)) {
            x.set('tc', pos); x.run(0.3);
            const rf = x.rf('tc', 'a');
            for (const [other, v] of Object.entries(rf)) {
                if (other === station) continue;
                assert.ok(rf[station] > 4 * v, `tuned to ${station}: ${rf[station].toFixed(4)} V against ${other} ${v.toFixed(4)} V`);
            }
        }
        // The programmes, through the crystal earphone.
        const y = bench('lab-crystal-set');
        y.run(30);
        let t = y.tone('ep');
        near(t.hz, 400, 8, '612 kHz: its 400 Hz tone (Hz)');
        near(t.level, 0.136, 0.03, '612 kHz: earphone level');
        y.set('tc', 0.265); y.run(50);
        near(y.tone('ep').hz, 600, 12, '810 kHz in its first 0.2 s: 600 Hz');
        y.run(150);     // t = 230 ms: the second half of the 0.4 s programme
        near(y.tone('ep').hz, 900, 18, '810 kHz after 0.2 s: 900 Hz');
        y.set('tc', 0.10); y.run(40);
        t = y.tone('ep');
        near(t.hz, 1000, 20, '1215 kHz: its 1 kHz tone (Hz)');
        // MEASURED 2026-11-23 (scripts/threshold-observe.mjs): t.level < 0.06 -> observed
        // 0.03314186693233013.
        assert.ok(t.level < 0.06, `the far station is the quietest: level ${t.level}`);
    });

    test('lab-one-transistor-radio: the base junction detects, the collector amplifies', () => {
        const x = bench('lab-one-transistor-radio');
        x.run(40);
        let t = x.tone('ep');
        near(t.hz, 400, 8, '612 kHz in the magnetic earphone (Hz)');
        near(t.amps * 1e3, 0.745, 0.08, 'earphone current (mA rms)');
        x.set('tc', 0.265); x.run(40);
        near(x.tone('ep').hz, 600, 12, '810 kHz: 600 Hz');
        // Off every station. The base bias (1 MΩ, 100 nF) takes about 0.1 s
        // to settle after the jump, so listen 80 ms later.
        x.set('tc', 0.8); x.run(80);
        t = x.tone('ep');
        // MEASURED 2026-11-23 (scripts/threshold-observe.mjs): t.amps * 1e3 < 0.2 -> observed
        // 0.08410537154336675.
        assert.ok(t.amps * 1e3 < 0.2, `between stations it goes quiet: ${(t.amps * 1e3).toFixed(4)} mA rms`);
    });

    test('lab-reflex-radio: one transistor amplifies the carrier, then the detected audio again', () => {
        const x = bench('lab-reflex-radio');
        x.run(40);
        const t = x.tone('ep');
        near(t.hz, 400, 8, '612 kHz in the earphone (Hz)');
        near(t.amps * 1e3, 1.33, 0.15, 'earphone current (mA rms)');
        // First pass: the carrier across the choke against the carrier at the base.
        const gain = x.rf('q', 'collector').rf612 / x.rf('q', 'base').rf612;
        // MEASURED 2026-11-23 (scripts/threshold-observe.mjs): gain > 100 -> observed
        // 484.57197656202385.
        assert.ok(gain > 100, `RF gain on the first pass: ${gain.toFixed(1)}`);
        // Second pass: audio at the earphone end of the choke against the
        // detected audio fed back to the base circuit.
        let lo1 = 99, hi1 = -99, lo2 = 99, hi2 = -99;
        x.each(5, 0.02, () => {
            const a = x.v('ch', 'b'), o = x.v('d', 'cathode');
            lo1 = Math.min(lo1, a); hi1 = Math.max(hi1, a); lo2 = Math.min(lo2, o); hi2 = Math.max(hi2, o);
        });
        assert.ok(hi1 - lo1 > 3 * (hi2 - lo2), `audio gain on the second pass: ${(hi2 - lo2).toFixed(3)} V in, ${(hi1 - lo1).toFixed(3)} V out`);
        x.set('tc', 0.265); x.run(40);
        near(x.tone('ep').hz, 600, 12, '810 kHz: 600 Hz');
    });

    test('lab-radio-loudspeaker: the detector into an LM386 fills a loudspeaker', () => {
        const x = bench('lab-radio-loudspeaker');
        x.run(30);
        let t = x.tone('spk');
        near(t.hz, 400, 8, '612 kHz from the loudspeaker (Hz)');
        near(t.amps, 0.251, 0.03, 'speaker coil current (A rms)');
        near(t.level, 1, 0.05, 'nearly full loudness');
        const local = t.amps;
        // The far station. The detector's DC level drops with the weaker
        // carrier and the coupling capacitors take a while to follow, so the
        // loudness is still settling after 60 ms; it only falls further.
        x.set('tc', 0.1); x.run(60);
        t = x.tone('spk');
        near(t.hz, 1000, 20, '1215 kHz: 1 kHz (Hz)');
        assert.ok(t.amps < 0.5 * local, `the far station is quieter: ${t.amps.toFixed(4)} A rms against ${local.toFixed(4)} A`);
    });

    test('lab-radio-whistle: two carriers 9 kHz apart whistle; the tap buys selectivity', () => {
        // Audio at the detector output over 10 ms, split into the local
        // station's 400 Hz tone, the 9 kHz beat with the silent neighbour
        // and the far station's 1 kHz tone.
        const listen = (x) => {
            const tr = [];
            x.each(10, 0.005, (t) => tr.push([t, x.v('d', 'cathode')]));
            return { tone: amplitude(tr, 400), whistle: amplitude(tr, 9000), far: amplitude(tr, 1000) };
        };
        const tap = bench('lab-radio-whistle');
        tap.run(15);
        const a = listen(tap);
        // At build time (bw-board 0bc7baf), antenna on the tap, knob 0.51: tone
        // 0.225 V, whistle 0.024 V, far 0.0018 V.
        near(a.tone, 0.225, 0.03, 'antenna on the tap: the 400 Hz tone (V)');
        near(a.whistle, 0.024, 0.005, 'antenna on the tap: the 9 kHz whistle (V)');
        // The same bench with the neighbour off the air: no whistle.
        const quiet = bench('lab-radio-whistle', (json) => {
            const ant = json.parts.find(p => p.kind === 'antenna');
            ant.params.stations = ant.params.stations.filter(s => s.id !== 'next');
        });
        quiet.run(15);
        const q = listen(quiet);
        assert.ok(q.whistle < 0.1 * a.whistle, `neighbour off the air: whistle ${q.whistle.toFixed(5)} V`);
        // Antenna on the top of the coil: retuned to the local station (the
        // antenna's own capacitance now sits across the whole tank).
        const top = bench('lab-radio-whistle');
        top.set('sw', 1); top.set('tc', 0.10);
        top.run(15);
        const b = listen(top);
        const rfTap = tap.rf('tc', 'a'), rfTop = top.rf('tc', 'a');
        assert.ok(rfTop.far / rfTop.local > 2 * (rfTap.far / rfTap.local),
            `the far station gets through more on the top: ${(rfTop.far / rfTop.local).toFixed(3)} vs ${(rfTap.far / rfTap.local).toFixed(3)}`);
        assert.ok(b.far / b.tone > 5 * (a.far / a.tone),
            `and its 1 kHz tone is heard: ${(b.far / b.tone).toFixed(4)} of the local tone on the top, ${(a.far / a.tone).toFixed(4)} on the tap`);
    });
});
