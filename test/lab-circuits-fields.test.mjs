/**
 * The room-field and junction-noise benches from
 * `scripts/gen-lab-circuits-4.mjs --set=fields` do what their EXPECTED.md
 * says: measured on the COMMITTED circuit.json, with the knobs, buttons and
 * switches a learner would use.
 *
 * The engine (bw-board src/fields.js) couples a `field_probe` to the room's
 * mains wiring, a charged ruler or a finger; a knob change is a hand moving
 * over 0.2 s. A transistor with `bvEbo` breaks down and carries seeded,
 * reproducible avalanche noise; a speaker or earphone driven by it reports
 * `noise: true`. Mains and noise make every millisecond a full transient
 * step sequence, so each scenario keeps its simulated time short. Every
 * number was measured on the headless engine when the bench was built; the
 * tolerances are bands around those measurements.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-fields.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (fields and noise)');
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
        b, ids,
        v (name, term) { return b.nodeVoltages.get(netOf(name, term)) ?? 0; },
        /** LED current in mA. */
        led (name) { return (b.ledCurrents.get(ids[name]) ?? 0) * 1e3; },
        tone (name) { return b.buzzerTone(ids[name]); },
        run (ms) {
            tMs += ms;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
        },
        /** [[tMs, value], …] sampled every `step` ms for `ms`. */
        trace (ms, step, fn) { const tr = []; const end = tMs + ms; while (tMs < end - 1e-9) { api.run(step); tr.push([tMs, fn()]); } return tr; },
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
/** Mean of a value sampled every 0.5 ms for `ms` (an LED's brightness over 50 Hz flicker). */
const mean = (x, ms, fn) => { const tr = x.trace(ms, 0.5, fn); return tr.reduce((a, [, v]) => a + v, 0) / tr.length; };

describe('lab field and noise benches behave as documented', { skip: SKIP }, () => {
    test('lab-noise-hiss: a junction in breakdown hisses in the earphone', () => {
        const x = bench('lab-noise-hiss');
        x.run(40);
        near(x.v('qn', 'emitter'), 7.53, 0.05, 'noise junction at its breakdown voltage (V)');
        const j = x.b.fieldReport().junctions[0];
        near(j.amps * 1e6, 31.4, 1.5, 'breakdown current (µA)');
        const t = x.tone('ep');
        assert.ok(t.on && t.noise, `the earphone hears noise, not a tone: ${JSON.stringify(t)}`);
    });

    test('lab-steam-train: the astable switches the hiss on and off', () => {
        const x = bench('lab-steam-train');
        // The astable starts with the noise feed low (about 0.17 s), then
        // high for about 0.16 s, then low again: one chuff.
        x.run(120);
        assert.ok(x.v('qb', 'collector') < 0.5, `first half-period: feed low, ${x.v('qb', 'collector')} V`);
        assert.equal(x.b.fieldReport().junctions[0].amps < 1e-8, true, 'no breakdown current');
        x.run(110);   // t = 230 ms
        assert.ok(x.v('qb', 'collector') > 8, `then the feed is high: ${x.v('qb', 'collector')} V`);
        const burst = x.tone('ep');
        assert.ok(burst.on && burst.noise, `and the earphone hisses: ${JSON.stringify(burst)}`);
        x.run(240);   // t = 470 ms
        assert.ok(x.v('qb', 'collector') < 0.5, `low again: ${x.v('qb', 'collector')} V`);
        assert.ok(x.b.fieldReport().junctions[0].amps < 1e-8, 'no breakdown current between chuffs');
        const gap = x.tone('ep');
        // MEASURED 2026-11-23: burst level 0.37 (noise), gap silent.
        assert.ok(!gap.on || gap.level < 0.2 * burst.level, `quiet between chuffs: ${JSON.stringify(gap)}`);
    });

    test('lab-noise-drum: a press gives a burst of hiss that fades', () => {
        const x = bench('lab-noise-drum');
        x.run(40);
        // MEASURED 2026-11-23: level 0.03 leaks through the unpowered stage.
        assert.ok(x.tone('ep').level < 0.06, `before the first hit: ${JSON.stringify(x.tone('ep'))}`);
        x.set('hit', 1); x.run(10); x.set('hit', 0);
        x.run(30);
        const first = x.tone('ep');
        assert.ok(first.on && first.noise && first.level > 0.1, `hit: a burst of noise, ${JSON.stringify(first)}`);
        x.run(250);
        const later = x.tone('ep');
        assert.ok(later.level < 0.3 * first.level, `faded: level ${later.level} against ${first.level}`);
    });

    test('lab-hum-finder: the closer the wire, the louder the 50 Hz; the resistor halves it', () => {
        const x = bench('lab-hum-finder');
        x.run(150);
        // At build time: 0.83 V of 50 Hz at the output with the knob at 0.5,
        // 0.41 V through the gain resistor.
        const full = amplitude(x.trace(40, 0.2, () => x.v('u', 'vout')), 50);
        near(full, 0.83, 0.08, 'hum at the output, gain 200 (V)');
        const t = x.tone('spk');
        near(t.hz, 50, 1, 'the loudspeaker hums at the mains frequency (Hz)');
        x.set('sw', 1);
        x.run(60);
        const low = amplitude(x.trace(40, 0.2, () => x.v('u', 'vout')), 50);
        near(low / full, 0.49, 0.06, 'through the gain resistor: about half');
        x.set('pr', 0);
        x.run(250);
        const far = amplitude(x.trace(40, 0.2, () => x.v('u', 'vout')), 50);
        assert.ok(far < 0.02 * full, `wire far from the cable: ${far.toFixed(5)} V`);
    });

    test('lab-body-hum: touching the plate puts 50 Hz into the earphone', () => {
        const x = bench('lab-body-hum');
        x.run(200);
        assert.equal(x.tone('ep').on, false, 'not touching: silence');
        x.set('pr', 1);
        x.run(250);
        const t = x.tone('ep');
        near(t.hz, 50, 1, 'touching: a 50 Hz hum (Hz)');
        // MEASURED 2026-11-23: level 0.795.
        assert.ok(t.level > 0.4, `and loud: level ${t.level}`);
        const vin = amplitude(x.trace(20, 0.2, () => x.v('pr', 'a')), 50);
        assert.ok(vin > 0.001 && vin < 0.01, `only millivolts at the input: ${vin}`);
    });

    test('lab-static-detector: the LED glows only while the ruler moves toward the wire', () => {
        const x = bench('lab-static-detector');
        x.run(20);
        assert.ok(x.led('led') < 0.001, 'no ruler: dark');
        x.set('pr', 1);
        x.run(100);   // mid-movement
        // MEASURED 2026-11-23: 0.29 mA halfway through the 0.2 s movement.
        near(x.led('led'), 0.29, 0.06, 'ruler approaching (mA)');
        x.run(250);
        assert.ok(x.led('led') < 0.01, `ruler held still: ${x.led('led')} mA`);
        x.set('pr', 0);
        x.run(100);
        assert.ok(x.led('led') < 0.001, 'ruler moving away: dark');
        assert.ok(x.v('q1', 'base') < -1, `and the base is pushed negative: ${x.v('q1', 'base')} V`);
    });

    test('lab-mosfet-field: the gate keeps the induced charge', () => {
        const x = bench('lab-mosfet-field');
        x.run(20);
        assert.ok(x.led('led') < 0.001, 'no ruler: off');
        x.set('pr', 0.3);
        x.run(300);
        // MEASURED 2026-11-23: gate 2.26 V, LED 7.15 mA at a third of the way.
        near(x.v('m', 'gate'), 2.26, 0.15, 'gate with the ruler a third of the way (V)');
        assert.ok(x.led('led') > 5, `LED on: ${x.led('led')} mA`);
        x.run(1000);
        near(x.v('m', 'gate'), 2.26, 0.15, 'a second later, the gate has kept it (V)');
        x.set('pr', 0);
        x.run(300);
        assert.ok(x.v('m', 'gate') < 0.2 && x.led('led') < 0.01, `ruler away: gate ${x.v('m', 'gate')} V`);
    });

    test('lab-electroscope: brighter for a positive ruler, dark for a negative one', () => {
        for (const rodVolts of [1000, -1000]) {
            const x = bench('lab-electroscope', (json) => { json.parts.find(p => p.kind === 'field_probe').params.rodVolts = rodVolts; });
            x.run(10);
            x.set('set', 1); x.run(20); x.set('set', 0); x.run(20);
            const preset = x.led('led');
            near(preset, 1.45, 0.15, 'after set: half brightness (mA)');
            x.set('pr', 1);
            x.run(300);
            if (rodVolts > 0) assert.ok(x.led('led') > 2 * preset, `positive ruler: brighter, ${x.led('led')} mA`);
            else assert.ok(x.led('led') < 0.01, `negative ruler: dark, ${x.led('led')} mA`);
            x.set('pr', 0);
            x.run(300);
            // Back to about the set brightness. While the ruler was near, the
            // gate lost a little charge through the solver's ~1 TΩ floor at
            // a MOSFET gate (MEASURED 2026-11-23: 1.13 mA after the positive
            // round trip), so a real electroscope is set again before each
            // reading.
            const away = x.led('led');
            assert.ok(away > 0.6 * preset && away < 1.25 * preset, `ruler away: ${away} mA, set ${preset} mA`);
        }
    });

    test('lab-touch-paper: from a mains adaptor a press on the paper lights the LED; on a battery it does not', () => {
        const x = bench('lab-touch-paper');
        x.run(40);
        assert.ok(mean(x, 40, () => x.led('led')) < 0.05, 'finger off: dark');
        x.set('pr', 1);
        x.run(250);
        // MEASURED 2026-11-23: 1.56 mA averaged over 50 Hz.
        near(mean(x, 40, () => x.led('led')), 1.56, 0.3, 'pressed, mean LED current (mA)');
        const y = bench('lab-touch-paper', (json) => { json.parts.find(p => p.kind === 'field_probe').params.adaptorFarads = 0; });
        y.run(40);
        y.set('pr', 1);
        y.run(250);
        assert.ok(mean(y, 40, () => y.led('led')) < 0.05, 'on a battery the press does nothing');
    });

    test('lab-motorboat: a weak battery makes it oscillate; a stiff one or decoupling does not', () => {
        const swing = (weak, dec) => {
            const x = bench('lab-motorboat');
            x.set('weak', weak); x.set('dec', dec);
            x.run(300);
            const tr = x.trace(200, 1, () => x.v('rs', 'b'));
            const vs = tr.map(([, v]) => v);
            return { lo: Math.min(...vs), hi: Math.max(...vs), tone: x.tone('spk') };
        };
        // MEASURED 2026-11-23: rail 6.20..8.71 V at about 9 Hz.
        const bad = swing(1, 0);
        assert.ok(bad.hi - bad.lo > 2, `weak battery: the rail swings ${bad.lo.toFixed(2)}..${bad.hi.toFixed(2)} V`);
        assert.ok(bad.tone.on && bad.tone.hz > 4 && bad.tone.hz < 20, `putt-putt in the speaker: ${JSON.stringify(bad.tone)}`);
        const fresh = swing(0, 0);
        assert.ok(fresh.hi - fresh.lo < 0.01, `fresh battery: steady rail ${fresh.lo}..${fresh.hi}`);
        const decoupled = swing(1, 1);
        assert.ok(decoupled.hi - decoupled.lo < 0.2, `decoupled: ${decoupled.lo.toFixed(3)}..${decoupled.hi.toFixed(3)} V, no oscillation`);
        assert.equal(decoupled.tone.on, false, 'and silent');
    });
});
