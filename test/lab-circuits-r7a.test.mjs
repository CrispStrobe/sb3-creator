/**
 * The r7a benches from `scripts/gen-lab-circuits-4.mjs --set=r7a` do what
 * their EXPECTED.md says: measured on the COMMITTED circuit.json with the
 * stimuli a learner would set (buttons, slide switches, pots, a magnet
 * dropped through a coil, the voice level at a loudspeaker used as a
 * microphone, the distance of an earphone from the speaker, a hand near a
 * ferrite rod, the temperature of a transistor).
 *
 * Readouts come from the engine's own surfaces: node voltages, meter
 * readings, buzzerTone() and the device state. The amplifier benches cost
 * real time per simulated millisecond (an LM386 swinging at audio rates), so
 * those scenarios keep to tens of milliseconds. Every number below was
 * measured on the headless engine (bw-board f4aaec43, bw-circuit-ui 141b2cc)
 * when the bench was built; the tolerances are bands around those
 * measurements.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r7a.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set r7a, preamps, induction pulses, thresholds)');
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

/** Set params of parts named in `edits` ({name: {key: value}}) before loading. */
const withParams = (edits) => (json, ids) => {
    for (const [name, kv] of Object.entries(edits)) Object.assign(json.parts.find(p => p.id === ids[name]).params, kv);
};

const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);

/** Peak-to-peak of a node over `ms`, sampled every `step` ms. */
function pp (x, name, term, ms, step = 0.1) {
    let lo = Infinity, hi = -Infinity;
    for (let t = 0; t < ms - 1e-9; t += step) { x.run(step); const v = x.v(name, term); lo = Math.min(lo, v); hi = Math.max(hi, v); }
    return hi - lo;
}

describe('lab r7a benches behave as documented', { skip: SKIP }, () => {
    test('lab-speaker-click: steady current is silent, make and break click, the leads reversed reverse the current', () => {
        const x = bench('lab-speaker-click');
        x.run(20);
        near(x.state('am').reading, 0, 1e-6, 'button open: no current (A)');
        x.set('btn', 1);
        let click = 0;
        for (let i = 0; i < 40; i++) { x.run(1); click = Math.max(click, x.tone('spk').level); }
        // MEASURED 2026-11-24: click > 0.1 -> observed 0.171.
        assert.ok(click > 0.1, `press: a click (level ${click})`);
        x.run(400);
        near(x.state('am').reading, 0.1485, 0.002, 'held: 4.5 V / 30 ohm (A)');
        // MEASURED 2026-11-24: level < 0.01 -> observed 0 (400 ms after the press).
        assert.ok(x.tone('spk').level < 0.01, 'held: silent');
        x.set('btn', 0);
        click = 0;
        for (let i = 0; i < 40; i++) { x.run(1); click = Math.max(click, x.tone('spk').level); }
        // MEASURED 2026-11-24: click > 0.1 -> observed 0.172.
        assert.ok(click > 0.1, `release: a second click (level ${click})`);
        x.set('swa', 1); x.set('swb', 1); x.set('btn', 1);
        x.run(30);
        near(x.state('am').reading, -0.1485, 0.002, 'reversed: the same current the other way (A)');
    });

    test('lab-amp-timbre: the buttons change the waveform, not the pitch', () => {
        // Speaker voltage sampled every 40 µs over 12 ms (about two periods):
        // `sharp` = rms(dv/dt) / (2π·f·rms(v)) is 1 for a sine and large for
        // a square wave's edges.
        const x = bench('lab-amp-timbre');
        const look = () => {
            const v = [];
            for (let i = 0; i < 300; i++) { x.run(0.04); v.push(x.v('spk', 'a')); }
            const m = v.reduce((a, b) => a + b, 0) / v.length;
            const rms = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length);
            let d2 = 0;
            for (let i = 1; i < v.length; i++) d2 += ((v[i] - v[i - 1]) / 4e-5) ** 2;
            const t = x.tone('spk');
            return { hz: t.hz, rms, sharp: Math.sqrt(d2 / (v.length - 1)) / (2 * Math.PI * t.hz * rms) };
        };
        x.run(60);
        const plain = look();
        x.set('bright', 1); x.run(40);
        const bright = look();
        x.set('bright', 0); x.set('soft', 1); x.run(60);
        const soft = look();
        near(plain.hz, 189, 6, 'plain pitch (Hz)');
        near(bright.hz, plain.hz, 4, 'bright: same pitch (Hz)');
        near(soft.hz, plain.hz, 4, 'soft: same pitch (Hz)');
        // MEASURED 2026-11-24: plain.sharp > 3 -> observed 5.59 (40 µs sampling).
        assert.ok(plain.sharp > 3, `plain: a square wave's edges (sharp ${plain.sharp})`);
        // MEASURED 2026-11-24: bright.rms > 1.6 * plain.rms -> observed 1.108 against 0.542 V.
        assert.ok(bright.rms > 1.6 * plain.rms, `bright: louder (${bright.rms} against ${plain.rms} V rms)`);
        // MEASURED 2026-11-24: bright.sharp > 3 -> observed 30.3 at 10 µs sampling while building.
        assert.ok(bright.sharp > 3, `bright: edges kept (sharp ${bright.sharp})`);
        assert.ok(soft.sharp < plain.sharp / 2.5, `soft: far rounder than plain (${soft.sharp} against ${plain.sharp})`);
        // MEASURED 2026-11-24: soft.sharp < 2 -> observed 1.13.
        assert.ok(soft.sharp < 2, `soft: close to a sine (sharp ${soft.sharp})`);
    });

    test('lab-mic-preamp: the preamp lifts the voice, the pot sets how much reaches the earphone', () => {
        const x = bench('lab-mic-preamp');
        x.run(25);
        near(x.v('q', 'collector'), 4.85, 0.15, 'preamp collector rests (V)');
        const qc = pp(x, 'q', 'collector', 10);
        const full = pp(x, 'u', 'vout', 10);
        // MEASURED 2026-11-24: qc > 0.04 -> observed 0.0771 (voice, 80 dB).
        assert.ok(qc > 0.04, `voice: tens of millivolts at the collector (${qc} V p-p)`);
        near(full, 1.58, 0.3, 'full volume: amplifier output (V p-p)');
        x.set('vol', 0.3);
        x.run(10);
        const third = pp(x, 'u', 'vout', 10);
        near(third / full, 0.3, 0.08, 'volume at 0.3: output in proportion');
    });

    test('lab-preamp-howl: close and loud it whistles; far away or turned down it does not', () => {
        const near5 = bench('lab-preamp-howl');
        near5.run(35);
        const t = near5.tone('spk');
        // MEASURED 2026-11-24: t.level > 0.8 -> observed 0.937 at 35 ms (1 by 36 ms while building).
        assert.ok(t.level > 0.8, `5 cm: whistle near full level (${t.level})`);
        near(t.hz, 2860, 300, '5 cm: whistle pitch (Hz)');
        const loud = pp(near5, 'u', 'vout', 3, 0.05);
        // MEASURED 2026-11-24: loud > 5 -> observed 7.06.
        assert.ok(loud > 5, `5 cm: the amplifier swings rail to rail (${loud} V p-p)`);
        for (const [what, edit] of [['40 cm', withParams({ ep: { distanceCm: 40 } })], ['volume at 0.1', withParams({ vol: { position: 0.1 } })]]) {
            const x = bench('lab-preamp-howl', edit);
            x.run(35);
            const quiet = pp(x, 'u', 'vout', 3, 0.05);
            // MEASURED 2026-11-24: quiet < 0.5 -> observed 0.232 (40 cm, the dying switch-on thump) and 0.007 (volume 0.1).
            assert.ok(quiet < 0.5, `${what}: no whistle (${quiet} V p-p)`);
        }
    });

    test('lab-pulse-flipflop: a pulse across the transformer sets the flip-flop, reset clears it', () => {
        const x = bench('lab-pulse-flipflop');
        x.run(100);
        // MEASURED 2026-11-24: q2 < 0.3 -> observed 0.090; q1 > 6 -> observed 7.20.
        assert.ok(x.v('q2', 'collector') < 0.3 && x.v('q1', 'collector') > 6, 'rest: green');
        x.set('pulse', 1);
        let peak = 0;
        for (let i = 0; i < 30; i++) { x.run(1); peak = Math.max(peak, x.v('t', 's1')); }
        x.set('pulse', 0);
        x.run(50);
        near(peak, 5.02, 0.3, 'pulse in the large winding (V)');
        // MEASURED 2026-11-24: q1 < 0.3 -> observed 0.094; q2 > 6 -> observed 6.91.
        assert.ok(x.v('q1', 'collector') < 0.3 && x.v('q2', 'collector') > 6, 'set: red, and it stays');
        x.set('reset', 1); x.run(10); x.set('reset', 0); x.run(20);
        // MEASURED 2026-11-24: q2 < 0.3 -> observed 0.090.
        assert.ok(x.v('q2', 'collector') < 0.3, 'reset: green again');
    });

    test('lab-magnet-speed: the fast magnet makes the bigger pulse and the brighter flash', () => {
        const flash = (pos, coil, ms) => {
            const x = bench('lab-magnet-speed');
            x.set('sw', pos);
            x.run(150);
            x.param(coil, 'drops', 1);
            let ma = 0, emf = 0;
            const end = x.t + ms;
            while (x.t < end) { x.run(1); ma = Math.max(ma, (x.v('rl', 'a') - x.v('rl', 'b')) / 470 * 1e3); emf = Math.max(emf, Math.abs(x.state(coil).emfV)); }
            return { ma, emf };
        };
        const slow = flash(0, 'slow', 250);
        const fast = flash(1, 'fast', 450);
        near(slow.emf * 1e3, 26.8, 2, 'slow magnet: pulse (mV)');
        near(fast.emf * 1e3, 90.9, 5, 'fast magnet: pulse (mV)');
        // MEASURED 2026-11-24: slow.ma < 2 -> observed 1.09.
        assert.ok(slow.ma < 2, `slow magnet: barely a glow (${slow.ma} mA)`);
        // MEASURED 2026-11-24: fast.ma > 10 -> observed 13.98.
        assert.ok(fast.ma > 10, `fast magnet: a bright flash (${fast.ma} mA)`);
    });

    test('lab-magnet-monostable: each drop lights the LED for about 0.3 s; turned down, nothing', () => {
        const x = bench('lab-magnet-monostable');
        x.run(250);
        // MEASURED 2026-11-24: q1 > 7 -> observed 7.71; q2 < 0.3 -> observed 0.089.
        assert.ok(x.v('q1', 'collector') > 7 && x.v('q2', 'collector') < 0.3, 'rest: LED off');
        for (const drop of [1, 2]) {
            x.param('coil', 'drops', drop);
            const t0 = x.t;
            let on = null, off = null;
            while (x.t < t0 + 700) {
                x.run(2);
                const c = x.v('q1', 'collector');
                if (on === null && c < 3) on = x.t - t0;
                if (on !== null && off === null && c > 6) off = x.t - t0;
            }
            near(on, 190, 15, `drop ${drop}: lights when the magnet reaches the coil (ms)`);
            near(off - on, 322, 40, `drop ${drop}: lit for (ms)`);
        }
        const y = bench('lab-magnet-monostable', withParams({ sens: { position: 0.5 } }));
        y.run(250);
        y.param('coil', 'drops', 1);
        let lit = false;
        while (y.t < 250 + 500) { y.run(2); if (y.v('q1', 'collector') < 3) lit = true; }
        assert.equal(lit, false, 'sensitivity halfway down: the same magnet does nothing');
    });

    test('lab-coil-audio-link: stepped up against stepped down, a factor of about four', () => {
        const level = (pos) => {
            const x = bench('lab-coil-audio-link');
            x.set('sw', pos);
            x.run(40);
            return { inp: pp(x, 'q', 'base', 3, 0.05), out: pp(x, 'u', 'vout', 3, 0.05) };
        };
        const up = level(0);
        const down = level(1);
        near(up.inp * 1e3, 25.0, 2, 'stepped up: preamp input (mV p-p)');
        near(down.inp * 1e3, 6.3, 0.8, 'stepped down: preamp input (mV p-p)');
        near(up.out, 3.0, 0.3, 'stepped up: amplifier output (V p-p)');
        near(up.out / down.out, 3.93, 0.4, 'ratio of the two outputs');
    });

    test('lab-threshold-tester: the twin junction cancels the indicator threshold and its drift', () => {
        // Sweep the test pot up from 0 in 0.5 % steps; the reading where Q1's
        // collector falls below 6 V (the yellow LED coming on).
        const sweep = (x) => {
            for (let p = 0; p <= 1.0001; p += 0.005) {
                x.set('pot', p); x.run(2);
                if (x.v('q1', 'collector') < 6) return x.state('vm').reading;
            }
            return null;
        };
        const read = (ref, sw, edit = null) => {
            const x = bench('lab-threshold-tester', edit);
            x.run(5);
            x.set('ref', ref);
            for (const [k, v] of Object.entries(sw)) x.set(k, v);
            x.run(edit ? 6000 : 5);
            return sweep(x);
        };
        near(read(0, { swd: 0 }), 0.041, 0.02, 'twin reference, nothing in between (V)');
        near(read(0, { swd: 1, swj: 0 }), 0.124, 0.03, 'germanium diode (V)');
        near(read(0, { swd: 1, swj: 1, swl: 0 }), 1.323, 0.05, 'red LED (V)');
        near(read(0, { swd: 1, swj: 1, swl: 1 }), 1.613, 0.05, 'green LED (V)');
        const groundRef = read(1, { swd: 0 });
        near(groundRef, 0.714, 0.03, 'ground reference: the indicator threshold included (V)');
        const hot = withParams({ q1: { surroundC: 70 }, q2: { surroundC: 70 } });
        near(read(0, { swd: 0 }, hot), 0.042, 0.02, 'twin reference at 70 °C: unchanged (V)');
        near(read(1, { swd: 0 }, hot) - groundRef, -0.089, 0.02, 'ground reference at 70 °C: −2 mV/K (V)');
    });

    test('lab-depletion-touch: normally on; a charge near gate 1 switches it off', () => {
        const x = bench('lab-depletion-touch');
        const ma = () => (x.v('rl', 'a') - x.v('rl', 'b'));   // 1 kΩ: volts = mA
        x.run(20);
        near(ma(), 3.73, 0.1, 'gates at the source: the channel conducts (mA)');
        x.set('comb', 1); x.run(400);
        near(x.v('m', 'gate1'), -4.19, 0.3, 'charge near: gate 1 (V)');
        // MEASURED 2026-11-24: ma < 0.05 -> observed 0.000.
        assert.ok(ma() < 0.05, `charge near: pinched off (${ma()} mA)`);
        x.set('comb', 0); x.run(400);
        near(ma(), 4.01, 0.3, 'charge taken away: on again (mA)');
        x.set('comb', 1); x.run(400); x.set('touch', 1); x.run(20); x.set('touch', 0); x.run(20);
        near(ma(), 3.73, 0.1, 'touched while the charge is near: gate back at the source (mA)');
        x.set('comb', 0); x.run(400);
        near(x.v('m', 'gate1'), 4.53, 0.3, 'then taken away: the trapped charge lifts gate 1 (V)');
        // MEASURED 2026-11-24: ma > 5 -> observed 6.10.
        assert.ok(ma() > 5, `brighter than at rest (${ma()} mA)`);
    });

    test('lab-dual-gate-pinch: either gate pinches the channel off; one gate dims the LED smoothly', () => {
        const x = bench('lab-dual-gate-pinch');
        const ma = () => (x.v('rl', 'a') - x.v('rl', 'b'));
        x.run(10);
        near(x.v('m', 'source'), 3.33, 0.05, 'source lifted by the divider (V)');
        near(ma(), 3.06, 0.1, 'both gates at the source level (mA)');
        let last = ma();
        for (const p of [0.33, 0.3, 0.27, 0.24, 0.22, 0.2]) {
            x.set('g2', p); x.run(5);
            const now = ma();
            assert.ok(now < last, `gate 2 down to ${p}: dimmer (${now} after ${last} mA)`);
            last = now;
        }
        // MEASURED 2026-11-24: last > 0.03 -> observed 0.072 (gate 2 at -1.08 V).
        assert.ok(last > 0.03, `still a glimmer just above pinch-off (${last} mA)`);
        x.set('g2', 0.1); x.run(5);
        assert.equal(x.state('m').pinchedBy, 'gate2');
        // MEASURED 2026-11-24: ma < 0.01 -> observed 0.000.
        assert.ok(ma() < 0.01, 'gate 2 below pinch-off: off');
        x.set('g2', 1); x.set('g1', 0.1); x.run(5);
        assert.equal(x.state('m').pinchedBy, 'gate1');
        // MEASURED 2026-11-24: ma < 0.01 -> observed 0.000.
        assert.ok(ma() < 0.01, 'gate 1 alone below pinch-off: off, gate 2 high or not');
    });

    test('lab-rod-pickup: all stations at once; the base capacitor removes them; a hand near the rod hums', () => {
        // The stations are the engine's default bench broadcast (612 kHz with
        // a 400 Hz tone, 810 kHz two-tone, 1215 kHz 1 kHz). Nothing is
        // tuned, so all rectify in the base junction together. Compared at the
        // same moment after switch-on with and without the 4.7 nF at the base,
        // so the amplifier's switch-on transient is common to both.
        const level = (position) => {
            const x = bench('lab-rod-pickup', withParams({ sw: { position } }));
            x.run(25);
            return { qc: x.v('q', 'collector'), pp: pp(x, 'u', 'vout', 10, 0.25) };
        };
        const open = level(0);
        near(open.qc, 4.79, 0.15, 'preamp collector (V)');
        const bypassed = level(1);
        // MEASURED 2026-11-25: bypassed.pp < 0.5 * open.pp -> observed STATIONS_EVIDENCE.
        assert.ok(bypassed.pp < 0.5 * open.pp, `4.7 nF at the base: the stations gone (${bypassed.pp} against ${open.pp} V p-p)`);
        // The hand, with the base capacitor in (no stations), against the same
        // bench without it: 60 ms after switch-on the amplifier's own
        // switch-on transient has not quite died away, so the comparison is
        // with and without the hand at the same moment.
        const hum = (position) => {
            const y = bench('lab-rod-pickup', withParams({ sw: { position: 1 }, hand: { position } }));
            y.run(60);
            return { pp: pp(y, 'u', 'vout', 20, 0.25), hz: y.tone('spk').hz };
        };
        const withHand = hum(1);
        const without = hum(0);
        near(withHand.hz, 50, 5, 'hand close: mains hum (Hz)');
        // MEASURED 2026-11-24: withHand.pp > 1.8 * without.pp -> observed 0.477 against 0.214 V.
        assert.ok(withHand.pp > 1.8 * without.pp, `hand close: hum (${withHand.pp} against ${without.pp} V p-p)`);
    });
});
