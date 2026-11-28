/**
 * The power-amp IC benches from `scripts/gen-lab-circuits-4.mjs --set=ampic`
 * do what their EXPECTED.md says: measured on the COMMITTED circuit.json, with
 * the stimuli a learner would set (the light on the sensor LED, the LEVEL and
 * THRESHOLD pots, the sound level at the listening loudspeaker).
 *
 * lab-led-amp-switch steps the light on an LED used backwards and reads the
 * LM386's DC-coupled output and the lamp the NPN switches. lab-voice-motor
 * plays a quiet and a loud tone at the loudspeaker and reads the envelope, the
 * LM358 comparator and the PNP-driven motor.
 *
 * Every number was measured on the headless engine (bw-board 818e0263,
 * bw-circuit-ui 659431ce) when the benches were built; the tolerances are
 * bands around those measurements. With AMPIC_MEASURE=1 each scenario also
 * prints what it measured.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-ampic.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set ampic)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const MEASURE = !!process.env.AMPIC_MEASURE;
const report = (id, m) => { if (MEASURE) console.log(`MEASURED ${id} ${JSON.stringify(m)}`); };
const r3 = (x) => Math.round(x * 1000) / 1000;
const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got}, expected ${want} ± ${tol}`);

/** Load a committed bench and name its parts by role. */
function bench (id) {
    const json = JSON.parse(readFileSync(join(EXAMPLES, id, 'circuit.json'), 'utf8'));
    const ids = benchIds(BENCHES[id]);
    const b = Circuit.fromJSON(json).board;
    let tMs = 0;
    const nets = new Map();
    const netOf = (name, term) => {
        const k = `${name}.${term}`;
        if (!nets.has(k)) {
            const n = b.getNets().find(n => n.terminals.some(x => x.part === ids[name] && x.terminal === term));
            assert.ok(n, `${id}: no net for ${k}`);
            nets.set(k, n.id);
        }
        return nets.get(k);
    };
    return {
        ids,
        get t () { return tMs; },
        v (name, term) { return b.nodeVoltages.get(netOf(name, term)) ?? 0; },
        run (ms) {
            tMs += ms;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
        },
        set (name, value) { b.setControl(ids[name], value); },
        param (name, key, value) { b.setPartParam(ids[name], key, value); },
        state (name) { return b.getDeviceState(ids[name]); },
        led (name) { return b.ledBrightness(ids[name]); },
    };
}

describe('lab benches (set ampic)', { skip: SKIP }, () => {
    test('lab-led-amp-switch: light on the sensor LED lifts the LM386 output 20 × the LED voltage over LEVEL; the NPN lights the lamp', () => {
        const x = bench('lab-led-amp-switch');
        const look = () => ({ inp: r3(x.v('u', 'inp')), out: r3(x.v('u', 'vout')), lamp: r3(x.led('lamp')) });
        // The BYPASS capacitor brings the chip's midpoint up over ~0.3 s.
        x.run(400);
        const m = { dark: { ...look(), level: r3(x.v('u', 'inn')), mid: r3(x.v('u', 'bypass')) }, sweep: {} };
        for (const L of [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 1]) { x.set('sensor', L); x.run(60); m.sweep[L] = look(); }
        m.gain = r3((m.sweep[0.6].out - m.sweep[0.4].out) / (m.sweep[0.6].inp - m.sweep[0.4].inp));
        x.set('sensor', 0.5);
        x.param('level', 'position', 0.25); x.run(60); m.lowLevel = { ...look(), level: r3(x.v('u', 'inn')) };
        x.param('level', 'position', 0.65); x.run(60); m.highLevel = { ...look(), level: r3(x.v('u', 'inn')) };
        x.param('level', 'position', 0.45); x.set('sensor', 0); x.run(60); m.darkAgain = look();
        report('lab-led-amp-switch', m);

        near(m.dark.level, 0.233, 0.005, 'LEVEL 0.45: the − input (V)');
        near(m.dark.mid, 4.6, 0.05, 'BYPASS: the chip midpoint (V)');
        near(m.dark.inp, 0, 0.002, 'dark: the sensor LED (V)');
        near(m.dark.out, 0.9, 0.02, 'dark: the output rests at the bottom of its swing (V)');
        near(m.dark.lamp, 0, 0.01, 'dark: lamp off');
        near(m.sweep[0.5].inp, 0.125, 0.003, 'light 0.5: 2.5 µA into the 50 kΩ input (V)');
        near(m.gain, 20, 0.5, 'DC gain, pins 1 and 8 open');
        near(m.sweep[0.5].out, 2.46, 0.05, 'light 0.5: output (V)');
        near(m.sweep[1].out, 4.96, 0.05, 'light 1: output (V)');
        near(m.sweep[0.2].lamp, 0, 0.01, 'light 0.2: lamp off');
        // MEASURED 2026-11-28: m.sweep[0.3].lamp < 0.15 -> observed 0.052 (the NPN just starting).
        assert.ok(m.sweep[0.3].lamp < 0.15, `light 0.3: lamp barely on (${m.sweep[0.3].lamp})`);
        near(m.sweep[0.5].lamp, 0.545, 0.05, 'light 0.5: lamp half on');
        // MEASURED 2026-11-28: m.sweep[0.7].lamp > 0.85 -> observed 0.868 (NPN saturated).
        assert.ok(m.sweep[0.7].lamp > 0.85, `light 0.7: lamp fully on (${m.sweep[0.7].lamp})`);
        // MEASURED 2026-11-28: m.lowLevel.lamp > 0.85 -> observed 0.87 at LEVEL 0.25.
        assert.ok(m.lowLevel.lamp > 0.85, `LEVEL down to 0.25: light 0.5 now switches the lamp fully on (${m.lowLevel.lamp})`);
        near(m.highLevel.out, 0.9, 0.02, 'LEVEL up to 0.65: light 0.5 leaves the output at the bottom (V)');
        near(m.highLevel.lamp, 0, 0.01, 'LEVEL up to 0.65: lamp off');
        near(m.darkAgain.lamp, 0, 0.01, 'dark again: lamp off');
    });

    test('lab-voice-motor: a loud tone runs the motor through the LM386, the LM358 and the PNP; a quiet one does not; silence stops it', () => {
        const x = bench('lab-voice-motor');
        const look = () => ({ env: r3(x.v('ch', 'a')), cmp: r3(x.v('w', '2_out')), coll: r3(x.v('q', 'collector')),
            run: r3(x.led('run')), vel: r3(x.state('m').velocity), amps: r3(x.state('m').current) });
        const pp = (name, term, ms) => {
            let lo = Infinity; let hi = -Infinity;
            for (let t = 0; t < ms; t += 0.1) { x.run(0.1); const v = x.v(name, term); lo = Math.min(lo, v); hi = Math.max(hi, v); }
            return r3(hi - lo);
        };
        x.run(300);
        const m = { quiet: look(), thr: r3(x.v('thr', 'wiper')), mid: r3(x.v('w', '1_pos')) };
        x.param('mic', 'soundDb', 70); x.run(60);
        m.soft = { amp: pp('u', 'vout', 5), op: pp('w', '1_out', 5), ...look() };
        x.param('mic', 'soundDb', 85);
        let onMs = null; const t1 = x.t;
        while (x.t < t1 + 60) { x.run(5); if (onMs === null && x.v('w', '2_out') < 2) onMs = x.t - t1; }
        m.loud = { amp: pp('u', 'vout', 5), op: pp('w', '1_out', 5), ...look(), onMs };
        x.param('mic', 'soundDb', 0);
        let offMs = null; const t2 = x.t;
        while (x.t < t2 + 2000 && offMs === null) { x.run(20); if (x.v('w', '2_out') > 5) offMs = x.t - t2; }
        x.run(20);
        m.silence = { ...look(), offMs };
        report('lab-voice-motor', m);

        near(m.thr, 0.855, 0.02, 'THRESHOLD 0.5, comparator high (V)');
        near(m.mid, 4.5, 0.02, 'section 1 midpoint (V)');
        // MEASURED 2026-11-28: m.quiet.env < m.thr -> observed 0.446 V against 0.854 V (switch-on settling, decaying).
        assert.ok(m.quiet.env < m.thr, `switch-on: the envelope stays under THRESHOLD (${m.quiet.env} V)`);
        near(m.quiet.cmp, 7.5, 0.05, 'silence: comparator high (V)');
        near(m.quiet.coll, 0, 0.05, 'silence: motor off (V at the collector)');
        near(m.soft.amp, 0.018, 0.005, '70 dB: LM386 output (V pp)');
        near(m.soft.op, 0.77, 0.1, '70 dB: LM358 section 1 output (V pp)');
        // MEASURED 2026-11-28: m.soft.env < m.thr -> observed 0.419 V against 0.854 V.
        assert.ok(m.soft.env < m.thr, `70 dB: the envelope stays under THRESHOLD (${m.soft.env} V)`);
        near(m.soft.vel, 0, 0.01, '70 dB: the motor stands');
        near(m.loud.amp, 0.1, 0.02, '85 dB: LM386 output (V pp)');
        near(m.loud.op, 4.3, 0.4, '85 dB: LM358 section 1 output (V pp)');
        // MEASURED 2026-11-28: m.loud.onMs <= 10 -> observed 5 ms (the first 5 ms look).
        assert.ok(m.loud.onMs !== null && m.loud.onMs <= 10, `85 dB: the comparator falls within 10 ms (${m.loud.onMs})`);
        // MEASURED 2026-11-28: m.loud.env > m.thr -> observed 2.052 V against 0.854 V.
        assert.ok(m.loud.env > m.thr, `85 dB: the envelope passes THRESHOLD (${m.loud.env} V)`);
        near(m.loud.cmp, 0.47, 0.05, '85 dB: comparator low, sinking the base current (V)');
        // MEASURED 2026-11-28: m.loud.run > 0.3 -> observed 0.441.
        assert.ok(m.loud.run > 0.3, `85 dB: RUN lit (${m.loud.run})`);
        near(m.loud.coll, 8.82, 0.1, '85 dB: the PNP saturated, motor on (V at the collector)');
        // MEASURED 2026-11-28: m.loud.vel > 50 -> observed 84.2 rad/s, 60 ms after the tone began (spinning up).
        assert.ok(m.loud.vel > 50, `85 dB: the motor turns (${m.loud.vel} rad/s)`);
        // MEASURED 2026-11-28: offMs in 500..1500 -> observed 1000 ms (the 1 µF / 1 MΩ envelope falling).
        assert.ok(m.silence.offMs !== null && m.silence.offMs > 500 && m.silence.offMs < 1500,
            `silence: the comparator lets go after about a second (${m.silence.offMs} ms)`);
        near(m.silence.amps, 0, 0.005, 'silence: no motor current (A)');
    });
});
