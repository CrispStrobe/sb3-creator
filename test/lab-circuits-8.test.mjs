/**
 * The sensing-transducer benches from `scripts/gen-lab-circuits-4.mjs --set=8`
 * do what their EXPECTED.md says: measured on the COMMITTED circuit.json, with
 * the stimuli a learner would set (sound level and distance at a listening
 * speaker or earphone, a thermocouple's hot junction, a magnet dropped through
 * a coil, metal near it, a battery on the tongue).
 *
 * Readouts come from the engine's own surfaces: node voltages, buzzerTone()
 * and the device state (bw-board acoustics.js / sensing-transducers.js). The
 * audio benches cost real time per simulated millisecond (an LM386 or two
 * oscillators running at audio rates), so every scenario keeps to tens of
 * milliseconds. Every number below was measured on the headless engine
 * (bw-board r4/transducers-20261123) when the bench was built; the tolerances
 * are bands around those measurements.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-8.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set 8, sensing transducers)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

/** Load a committed bench (optionally edited first) and name its parts by role. */
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
        tone (name) { return b.buzzerTone(ids[name]); },
        state (name) { return b.getDeviceState(ids[name]); },
        run (ms) {
            tMs += ms;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
        },
        set (name, value) { b.setControl(ids[name], value); },
        param (name, key, value) { b.setPartParam(ids[name], key, value); },
        get t () { return tMs; },
    };
    return api;
}

/** Set one param of the part named `name` before loading. */
const withParam = (name, key, value) => (json, ids) => { json.parts.find(p => p.id === ids[name]).params[key] = value; };

const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);

/**
 * Full periods (s) between same-direction edges a tone tracker recorded
 * (device state `_edges`, alternating rising/falling), keyed by end time so
 * repeated reads do not count a period twice.
 */
function periods (state, into = new Map()) {
    const e = (state._edges ?? []).map(Number);
    for (let i = 2; i < e.length; i++) into.set(e[i], (e[i] - e[i - 2]) / 1e9);
    return into;
}

describe('lab sensing-transducer benches (set 8) behave as documented', { skip: SKIP }, () => {
    test('lab-voice-fm: speaking into the speaker wobbles the 555 tone', () => {
        // The 555's period, from the piezo's tone edges, while silent and
        // while a vowel at 94 dB SPL reaches the speaker. At build time:
        // silent 680 Hz with the periods within 0.4 % (sd), voice 682 Hz with
        // a 3.3 % sd and the extremes at about -8 % / +7 %.
        const spread = (db) => {
            const x = bench('lab-voice-fm', withParam('mic', 'soundDb', db));
            x.run(15);
            const per = new Map();
            while (x.t < 45) { x.run(5); periods(x.state('pz'), per); }
            const p = [...per.values()];
            const mean = p.reduce((a, b) => a + b, 0) / p.length;
            const sd = Math.sqrt(p.reduce((a, b) => a + (b - mean) ** 2, 0) / p.length);
            return { hz: 1 / mean, sd: sd / mean, n: p.length };
        };
        const quiet = spread(0);
        near(quiet.hz, 680, 15, 'silent: the 555 frequency (Hz)');
        // MEASURED 2026-11-23 (scripts/threshold-observe.mjs): quiet.sd < 0.01 -> observed 0.0039.
        assert.ok(quiet.sd < 0.01, `silent: steady periods (sd ${quiet.sd})`);
        const voice = spread(94);
        near(voice.hz, 682, 15, 'speaking: same average pitch (Hz)');
        // MEASURED 2026-11-23 (scripts/threshold-observe.mjs): voice.sd > 0.025 -> observed 0.0333.
        assert.ok(voice.sd > 0.025, `speaking: the period follows the voice (sd ${voice.sd})`);
        assert.ok(voice.sd > 4 * quiet.sd, 'the wobble is the voice, not the oscillator');
    });

    test('lab-feedback-howl: close and at full gain it howls; far away or turned down it does not', () => {
        // At 3 cm the loop gain (3 mV/Pa · 1 Pa·m/A / r_eff · ×200 / 8 Ω) is
        // above one: within 30 ms the speaker carries its full rated current
        // (level 1) at about 390 Hz. At 20 cm, or with the volume pot at half,
        // the switch-on thump dies away: by 60 ms the amplifier output sits
        // still at 4.5 V.
        const swing = (x) => { let lo = 9; let hi = 0; for (let i = 0; i < 12; i++) { x.run(0.25); const v = x.v('u', 'vout'); lo = Math.min(lo, v); hi = Math.max(hi, v); } return hi - lo; };
        const near3 = bench('lab-feedback-howl');
        near3.run(30);
        const t = near3.tone('spk');
        assert.equal(t.on, true);
        near(t.level, 1, 0.001, '3 cm: howl at full level');
        near(t.hz, 387, 25, '3 cm: howl pitch (Hz)');
        // MEASURED 2026-11-23 (scripts/threshold-observe.mjs): swing(near3) > 5 -> observed 6.95.
        assert.ok(swing(near3) > 5, '3 cm: the amplifier swings rail to rail');
        for (const [what, edit] of [['20 cm', withParam('ep', 'distanceCm', 20)], ['volume at half', withParam('vol', 'position', 0.5)]]) {
            const x = bench('lab-feedback-howl', edit);
            x.run(60);
            // MEASURED 2026-11-23 (scripts/threshold-observe.mjs): swing(x) < 0.05 -> observed 1.2e-11 (20 cm) and 0.00011 (half volume).
            assert.ok(swing(x) < 0.05, `${what}: no howl`);
        }
    });

    test('lab-ring-relay: the bell pulls the relay in; silence and talking do not', () => {
        // Built silent so the switch-on is cheap to simulate: the amplifier's
        // own switch-on step leaves the relay out (coil about 2.5 V at 5 ms,
        // pull-in is 3.7 V). Then the bell at 110 dB: relay in within 20 ms,
        // held across the clapper's strikes. Bell off: out again within
        // 20 ms. Talking at 80 dB: stays out.
        const x = bench('lab-ring-relay', withParam('mic', 'soundDb', 0));
        x.run(300);
        assert.equal(x.state('k').energized, false, 'silent: relay out');
        x.param('mic', 'soundDb', 110);
        x.run(20);
        assert.equal(x.state('k').energized, true, 'ringing: relay in');
        let dropped = 0;
        for (let i = 0; i < 10; i++) { x.run(2); if (!x.state('k').energized) dropped++; }
        assert.equal(dropped, 0, 'held between the strikes');
        // MEASURED 2026-11-23 (scripts/threshold-observe.mjs): brightness > 0.9 -> observed 0.998.
        assert.ok(x.state('lamp').brightness > 0.9, 'the lamp is lit');
        x.param('mic', 'soundDb', 0);
        x.run(30);
        assert.equal(x.state('k').energized, false, 'bell stopped: relay out');
        x.param('mic', 'soundDb', 80);
        x.run(30);
        assert.equal(x.state('k').energized, false, 'talking at 80 dB: relay stays out');
    });

    test('lab-thermocouple: room, match and lighter on the meter', () => {
        // Type T against a 25 °C bench, ×101: 0 V; 31.82 mV → 3.21 V (match,
        // 600 °C); 49.85 mV → 5.03 V (lighter, 900 °C).
        for (const [hotC, emfMv, out] of [[25, 0, 0.005], [600, 31.82, 3.21], [900, 49.85, 5.03]]) {
            const x = bench('lab-thermocouple', withParam('tc', 'hotC', hotC));
            x.run(1);
            near(x.state('tc').emfV * 1e3, emfMv, 0.02, `${hotC} °C: EMF (mV)`);
            near(x.v('u', '1_out'), out, 0.02, `${hotC} °C: amplifier output (V)`);
        }
        // A warmer bench means a warmer cold junction: less EMF.
        const x = bench('lab-thermocouple');
        x.b.setTemperature(35);
        x.run(1);
        assert.ok(x.v('u', '1_out') < 3.21 - 0.03, `bench at 35 °C: ${x.v('u', '1_out')} V`);
    });

    test('lab-magnet-drop: the falling magnet flips the flip-flop, reset flips it back', () => {
        // At rest Q2 conducts (green). Dropped from 20 cm the magnet arrives
        // after about 0.2 s; the entry pulse (≈ 2.4 V) turns Q1 on (red).
        // Turned over, it still flips: now on the exit pulse, a little later.
        const x = bench('lab-magnet-drop');
        x.run(50);
        // MEASURED 2026-11-23 (scripts/threshold-observe.mjs): q2 < 0.3 -> observed 0.090; q1 > 6 -> observed 7.20.
        assert.ok(x.v('q2', 'collector') < 0.3 && x.v('q1', 'collector') > 6, 'at rest: Q2 on, green');
        x.param('coil', 'drops', 1);
        let peak = 0; let flipAt = null;
        while (x.t < 400) { x.run(1); peak = Math.max(peak, x.state('coil').emfV); if (flipAt === null && x.v('q1', 'collector') < 1) flipAt = x.t; }
        near(peak, 2.42, 0.1, 'entry pulse (V)');
        near(flipAt - 50, 190, 15, 'flips when the magnet reaches the coil (ms after the drop)');
        // MEASURED 2026-11-23 (scripts/threshold-observe.mjs): q1 < 0.3 -> observed 0.094; q2 > 6 -> observed 6.91.
        assert.ok(x.v('q1', 'collector') < 0.3 && x.v('q2', 'collector') > 6, 'stays flipped: red');
        x.set('reset', 1); x.run(10); x.set('reset', 0); x.run(10);
        // MEASURED 2026-11-23 (scripts/threshold-observe.mjs): q2 < 0.3 -> observed 0.090.
        assert.ok(x.v('q2', 'collector') < 0.3, 'reset: green again');
        x.param('coil', 'magnetPolarity', -1);
        x.param('coil', 'drops', 2);
        const t0 = x.t; let flip2 = null;
        while (x.t < t0 + 350) { x.run(1); if (flip2 === null && x.v('q1', 'collector') < 1) flip2 = x.t - t0; }
        assert.ok(flip2 !== null, 'south pole first: still flips');
        assert.ok(flip2 > flipAt - 50, `on the exit pulse: ${flip2} ms against ${flipAt - 50} ms`);
    });

    test('lab-coil-compass: more current, more field, more deflection', () => {
        // 1.5 V, 22 Ω + rheostat + 6.6 Ω of wire: 50.5 mA at full (0.299 mT
        // inside, compass 30.3°), 11.65 mA at the far end of the rheostat
        // (7.7°). Switch open: nothing.
        const x = bench('lab-coil-compass');
        x.run(20);
        near(x.state('coil').compassDeg, 0, 0.01, 'switch open: compass points north');
        x.set('sw', 1); x.run(20);
        let s = x.state('coil');
        near(s.amps * 1e3, 50.5, 0.5, 'full current (mA)');
        near(s.fieldT * 1e3, 0.299, 0.005, 'field inside (mT)');
        near(s.compassDeg, 30.3, 0.5, 'compass deflection (°)');
        x.set('pot', 0); x.run(20);
        s = x.state('coil');
        near(s.amps * 1e3, 11.65, 0.2, 'rheostat all in (mA)');
        near(s.compassDeg, 7.7, 0.3, 'compass deflection (°)');
    });

    test('lab-metal-detector: a coin on the search coil raises the beat', () => {
        // The beat at the earphone, from its tone edges. At build time: about
        // 195 Hz with no metal; a coin flat on the search coil lowers its
        // inductance 5 % and raises the beat by ≈ 38 Hz.
        const x = bench('lab-metal-detector');
        x.run(20);
        const beat = (ms) => {
            const from = x.t;
            x.run(ms);
            const per = [...periods(x.state('ep')).entries()].filter(([t]) => t / 1e6 > from + 4).map(([, p]) => p);
            return per.length / per.reduce((a, b) => a + b, 0);
        };
        const none = beat(20);
        near(none, 195, 25, 'no metal: beat (Hz)');
        x.param('ls', 'metalCm', 0);
        const coin = beat(20);
        near(coin - none, 38, 12, 'coin on the coil: the beat rises (Hz)');
        assert.ok(x.state('ls').metalShift < -0.049, 'the coin lowered L by 5 %');
    });

    test('lab-tongue-battery: 9 V tastes, 1.5 V does not, and the electrodes stay charged', () => {
        // 9 V: 3.47 mA, interface 2.05 V, taste strong, acid at the + contact.
        // 1.5 V: 0.35 µA, no taste. Released after 9 V: 1.75 V left 5 ms later.
        const x = bench('lab-tongue-battery');
        x.run(1);
        near(x.state('tongue').amps * 1e3, 0, 1e-6, 'not touching: nothing');
        x.set('touch', 1); x.run(300);
        let s = x.state('tongue');
        near(s.amps * 1e3, 3.47, 0.05, '9 V: current (mA)');
        near(s.polarisationV, 2.05, 0.03, '9 V: electrode polarisation (V)');
        assert.equal(s.taste, 'strong');
        assert.equal(s.sourAt, 'a', 'sour at the + contact');
        x.set('touch', 0); x.run(5);
        near(x.v('vm', 'a'), 1.75, 0.05, 'released: voltage left on the electrodes (V)');
        const y = bench('lab-tongue-battery', withParam('sw', 'position', 0));
        y.set('touch', 1); y.run(300);
        s = y.state('tongue');
        near(s.amps * 1e6, 0.35, 0.05, '1.5 V: current (µA)');
        assert.equal(s.taste, 'none');
    });
});
