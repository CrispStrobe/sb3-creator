/**
 * The round-11 radio benches from `scripts/gen-lab-circuits-4.mjs --set=r11`
 * do what their EXPECTED.md says, measured on the COMMITTED circuit.json with
 * the controls a learner would turn.
 *
 * The engine carries every RF signal as a complex envelope around the
 * circuit's resonances (bw-board src/radio.js, src/rf-bands.js): a mixer
 * puts the product of two bands into a third (the IF), an FM IF chip reads
 * the IF's frequency from its envelope's phase, a station may carry a sky
 * wave that the night lets through. Receivers are read through the band
 * envelopes (`bandAmplitudes`) and the audio at the detector. RF benches
 * cost real time: every scenario stays at a few simulated milliseconds.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r11.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set r11, radio)');
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
        /** [[tMs, v], …] of a terminal's voltage, sampled every dt ms for ms. */
        trace (name, term, ms, dt) { const out = []; const n = Math.round(ms / dt); for (let i = 0; i < n; i++) { this.run(dt, dt); out.push([tMs, this.v(name, term)]); } return out; },
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

/** Amplitude of the `hz` component of a [[tMs, v], …] trace (one-bin DFT about its mean). */
const amplitude = (tr, hz) => {
    const m = tr.reduce((a, x) => a + x[1], 0) / tr.length;
    let re = 0, im = 0;
    for (const [t, v] of tr) { re += (v - m) * Math.cos(2 * Math.PI * hz * t / 1000); im += (v - m) * Math.sin(2 * Math.PI * hz * t / 1000); }
    return 2 * Math.hypot(re, im) / tr.length;
};
/** Zero-crossing frequency (Hz) of a [[tMs, v], …] trace about its mean. */
const crossings = (tr) => {
    const m = tr.reduce((a, x) => a + x[1], 0) / tr.length;
    let z = 0;
    for (let i = 1; i < tr.length; i++) if ((tr[i - 1][1] - m) * (tr[i][1] - m) < 0) z++;
    return z / 2 / ((tr.at(-1)[0] - tr[0][0]) / 1000);
};

describe('lab radio benches (set r11) behave as documented', { skip: SKIP }, () => {
    test('lab-vhf-superhet: the 98 MHz station\'s tone at the FM IF chip; off the station, no tone', () => {
        const listen = (tune) => {
            const x = bench('lab-vhf-superhet');
            if (tune !== undefined) x.set('tune', tune);
            x.run(1.5);
            const tr = x.trace('ifc', 'out', 2, 0.01);
            return { a1k: amplitude(tr, 1000), a2k: amplitude(tr, 2000), a600: amplitude(tr, 600), ifv: x.band('f', 'out', 10.7e6) };
        };
        const on = listen(), off = listen(0.6);
        // MEASURED 2026-11-25: tuned, 1 kHz 0.220 V, 2 kHz 2.8e-3 V, the IF at the filter's output 7.2e-3 V; tuning 0.60, 1 kHz 6.8e-7 V.
        assert.ok(on.a1k > 0.1, `tuned to 98 MHz: the 1 kHz programme ${on.a1k} V`); // MEASURED 2026-11-25: on.a1k > 0.1 -> observed 0.220.
        assert.ok(on.a2k < on.a1k / 5, `undistorted: 2 kHz ${on.a2k} V`); // MEASURED 2026-11-25: 2.8e-3 against 0.220 -> observed 1.3 %.
        assert.ok(on.ifv > 1e-3, `the IF out of the ceramic filter: ${on.ifv} V`); // MEASURED 2026-11-25: on.ifv > 1e-3 -> observed 7.2e-3.
        assert.ok(off.a1k < on.a1k / 100, `tuned away: ${off.a1k} V at 1 kHz`); // MEASURED 2026-11-25: 6.8e-7 against 0.220 -> observed 3e5x.
    });

    test('lab-skywave: the distant 702 kHz station by day and after dark', () => {
        const at = (dial) => {
            const x = bench('lab-skywave');
            x.set('ant', dial);
            x.run(2, 0.5);
            const ifv = x.band('l3', 'a', 457e3);
            const tr = x.trace('d', 'cathode', 2, 0.02);
            return { ifv, a700: amplitude(tr, 700) };
        };
        const noon = at(0.5), night = at(22 / 24);
        // MEASURED 2026-11-25: IF 2.5e-3 V at noon, 0.41 V at 22:00; the 700 Hz tone at the detector 3.8e-3 / 1.8e-2 V
        // (at night the IF stage clips, which flattens the AM: the tone grows less than the carrier).
        assert.ok(night.ifv > 50 * noon.ifv, `IF at 22:00 ${night.ifv} V against noon ${noon.ifv} V`); // MEASURED 2026-11-25: 0.41 against 2.5e-3 -> observed 164x.
        assert.ok(night.a700 > 3 * noon.a700, `its 700 Hz tone at the detector: night ${night.a700} V, noon ${noon.a700} V`); // MEASURED 2026-11-25: 1.8e-2 against 3.8e-3 -> observed 4.8x.
    });
});
