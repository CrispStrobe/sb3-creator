/**
 * The r6g benches from `scripts/gen-lab-circuits-4.mjs --set=r6g` do what
 * their EXPECTED.md says: measured on the COMMITTED circuit.json, with the
 * stimuli a learner would set (buttons, slide switches, pots, the sound at a
 * loudspeaker used as a microphone).
 *
 * Every circuit here is built from NPN transistors and an LM386 power
 * amplifier only. Sound at the microphone and an LM386 that switches both
 * cost real time in the engine, so each scenario plays a few tens of
 * milliseconds of sound and an oscillator scenario watches a few periods.
 *
 * Every number below was measured on the headless engine (bw-board d4113b4b)
 * when the bench was built; the tolerances are bands around those
 * measurements.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r6g.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set r6g, transistor and LM386 benches)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

/** Load a committed bench and name its parts by role. */
function bench (id) {
    const json = JSON.parse(readFileSync(join(EXAMPLES, id, 'circuit.json'), 'utf8'));
    const ids = benchIds(BENCHES[id]);
    const c = Circuit.fromJSON(json);
    const b = c.board;
    let tMs = 0;
    const netOf = (name, term) => {
        const n = b.getNets().find(n => n.terminals.some(x => x.part === ids[name] && x.terminal === term));
        assert.ok(n, `${id}: no net for ${name}.${term}`);
        return n.id;
    };
    return {
        c, b, ids,
        v (name, term) { return b.nodeVoltages.get(netOf(name, term)) ?? 0; },
        tone (name) { return b.buzzerTone(ids[name]); },
        run (ms) {
            tMs += ms;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
        },
        set (name, value) { b.setControl(ids[name], value); },
        param (name, key, value) { b.setPartParam(ids[name], key, value); },
        get t () { return tMs; },
    };
}

const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);

/** Current through a resistor (mA), from its two node voltages. */
const mA = (x, name, ohms) => (x.v(name, 'a') - x.v(name, 'b')) / ohms * 1e3;

/** Lowest, highest and mean of a node over `ms`, sampled every `dt` ms. */
function span (x, name, term, ms, dt) {
    let lo = Infinity; let hi = -Infinity; let s = 0; let n = 0;
    const end = x.t + ms;
    while (x.t < end - 1e-9) { x.run(dt); const v = x.v(name, term); lo = Math.min(lo, v); hi = Math.max(hi, v); s += v; n++; }
    return { lo, hi, pp: hi - lo, mean: s / n };
}

/** Mean and peak of a resistor's current (mA) over `ms`, sampled every 0.1 ms. */
function current (x, name, ohms, ms) {
    let s = 0; let n = 0; let pk = 0;
    const end = x.t + ms;
    while (x.t < end - 1e-9) { x.run(0.1); const i = mA(x, name, ohms); s += i; n++; pk = Math.max(pk, i); }
    return { avg: s / n, pk };
}

describe('lab r6g benches behave as documented', { skip: SKIP }, () => {
    test('lab-npn-horn-follower: the transistors make the tone, the amplifier copies it at gain one', () => {
        // Speaker pitch after 6 ms: as authored 669 Hz, HIGH held 889..906 Hz,
        // slide switch 912 Hz, both 1380 Hz. Input / output swing over
        // 2 ms: 3.15 V in, 3.06 V out (gain 0.97).
        const horn = (high, pick) => {
            const x = bench('lab-npn-horn-follower');
            x.set('high', high); x.set('pick', pick);
            x.run(6);
            return x;
        };
        const low = horn(0, 0);
        near(low.tone('spk').hz, 669, 15, 'as authored: pitch (Hz)');
        const inp = span(low, 'u', 'inp', 2, 0.05);
        const out = span(low, 'u', 'vout', 2, 0.05);
        near(inp.pp, 3.15, 0.15, 'square wave arriving at +IN (V p-p)');
        near(out.pp / inp.pp, 0.97, 0.04, 'the amplifier\'s gain (output swing / input swing)');
        near(out.lo - inp.lo, 0.16, 0.1, 'the output\'s low level follows the input\'s (V)');
        near(out.hi - inp.hi, 0.08, 0.1, 'the output\'s high level follows the input\'s (V)');
        near(horn(1, 0).tone('spk').hz, 895, 25, 'HIGH held: pitch (Hz)');
        near(horn(0, 1).tone('spk').hz, 912, 25, 'smaller base resistor: pitch (Hz)');
        near(horn(1, 1).tone('spk').hz, 1380, 40, 'both: pitch (Hz)');
    });

    test('lab-amp-ic-light-organ: loud music lights the LED; the preamp makes ordinary music enough', () => {
        // LED current over 10 ms, 30 ms after the sound starts (440 Hz tone
        // at the speaker): quiet 0; direct 80 dB 0; direct 110 dB mean 3.74
        // mA, peaks 15.0 mA; preamp 80 dB, pot 1/2 mean 6.23 mA; pot 0.1: 0.
        const organ = (db, pre, sens) => {
            const x = bench('lab-amp-ic-light-organ');
            x.set('pre', pre); x.set('sens', sens);
            x.run(25);
            x.param('mic', 'soundWave', 'tone'); x.param('mic', 'soundDb', db);
            x.run(5);
            const out = span(x, 'u', 'vout', 5, 0.05);
            return { out, led: current(x, 'rl', 470, 10) };
        };
        const quiet = organ(0, 0, 0.5);
        near(quiet.out.mean, 4.5, 0.01, 'quiet: amplifier at half supply (V)');
        near(quiet.led.pk, 0, 0.05, 'quiet: LED dark (mA)');
        const soft = organ(80, 0, 0.5);
        near(soft.out.pp, 0.055, 0.015, 'direct, 80 dB: amplifier swing (V)');
        near(soft.led.pk, 0, 0.05, 'direct, 80 dB: LED dark (mA)');
        const loud = organ(110, 0, 0.5);
        near(loud.led.avg, 3.74, 0.8, 'direct, 110 dB: mean LED current (mA)');
        near(loud.led.pk, 15.0, 1.0, 'direct, 110 dB: LED flashes at full current on the peaks (mA)');
        const pre = organ(80, 1, 0.5);
        near(pre.led.avg, 6.23, 1.2, 'preamp, 80 dB, pot 1/2: mean LED current (mA)');
        near(pre.led.pk, 15.0, 1.0, 'preamp, 80 dB: LED peaks (mA)');
        const turned = organ(80, 1, 0.1);
        near(turned.out.pp, 0.50, 0.08, 'preamp, pot turned down: amplifier swing (V)');
        near(turned.led.pk, 0, 0.05, 'preamp, pot turned down: LED dark (mA)');
    });

    test('lab-amp-ic-applause: applause fills the hold capacitor, the LED stays lit and fades after', () => {
        // Noise at 110 dB for 60 ms, then silence. 10 uF: LED about 4.4 mA at
        // the end of the applause, 0.78 mA 300 ms later, dark after 1.2 s.
        // 47 uF: slower to fill (2.32 mA), 1.61 mA 300 ms after.
        const clap = (hold) => {
            const x = bench('lab-amp-ic-applause');
            x.set('hold', hold);
            x.run(20);
            const m = { rest: mA(x, 'rl', 470) };
            x.param('mic', 'soundWave', 'noise'); x.param('mic', 'soundDb', 110);
            x.run(60);
            m.during = mA(x, 'rl', 470);
            m.held = x.v('rb', 'a');
            x.param('mic', 'soundDb', 0);
            x.run(300); m.after300 = mA(x, 'rl', 470);
            x.run(900); m.after1200 = mA(x, 'rl', 470);
            return m;
        };
        const short = clap(0);
        near(short.rest, 0, 0.05, 'switch-on: LED dark (mA)');
        near(short.during, 4.4, 0.6, '10 uF, applause: LED current (mA)');
        near(short.held, 1.65, 0.15, '10 uF, applause: hold capacitor (V)');
        near(short.after300, 0.78, 0.3, '10 uF, 300 ms after: fading (mA)');
        near(short.after1200, 0, 0.1, '10 uF, 1.2 s after: dark (mA)');
        const long = clap(1);
        near(long.during, 2.32, 0.4, '47 uF, applause: LED current (mA)');
        near(long.after300, 1.61, 0.3, '47 uF, 300 ms after: still lit (mA)');
        assert.ok(long.after1200 > short.after1200, '47 uF holds longer than 10 uF'); // MEASURED 2026-11-24: compares two measurements, no literal.
        // The Sound slider's own waveform (a sung vowel) at 110 dB lights it
        // too (measured 3.05 mA after 60 ms); talking at 80 dB does not.
        const sung = bench('lab-amp-ic-applause');
        sung.run(20);
        sung.param('mic', 'soundDb', 110);
        sung.run(60);
        near(mA(sung, 'rl', 470), 3.05, 0.5, 'vowel at 110 dB: LED lit (mA)');
        const x = bench('lab-amp-ic-applause');
        x.run(20);
        x.param('mic', 'soundDb', 80);
        x.run(60);
        near(mA(x, 'rl', 470), 0, 0.05, 'talking at 80 dB: LED dark (mA)');
    });

    test('lab-amp-ic-clap-latch: a loud sound latches the LED, talking does not, RESET clears it', () => {
        // Armed at switch-on (Q2 conducting, emitters 3.29 V, LED 0). Pot 1/2
        // puts Q1's base at 3.39 V; the trigger flips up near 3.9 V and back
        // near 3.0 V. The microphone's sound (a sung vowel, the waveform the
        // Sound slider plays) for 20 ms: 80 dB nothing; 120 dB latches at pot
        // 1/2 (LED 1.19 mA); 110 dB does not at pot 1/2 but does at pot 0.8
        // (base 3.84 V; LED 1.38 mA).
        const led = (x) => mA(x, 'rc1', 2200) - x.v('r12', 'a') / 20;
        const armed = (pot) => {
            const x = bench('lab-amp-ic-clap-latch');
            x.set('thr', pot);
            x.run(300);
            return x;
        };
        const sound = (x, db) => {
            x.param('mic', 'soundDb', db); x.run(20);
            x.param('mic', 'soundDb', 0); x.run(30);
        };
        const x = armed(0.5);
        near(x.v('q1', 'base'), 3.39, 0.03, 'armed: Q1 base at the pot (V)');
        near(x.v('re', 'a'), 3.29, 0.03, 'armed: Q2 holds the emitters (V)');
        near(led(x), 0, 0.05, 'armed: LED dark (mA)');
        sound(x, 80);
        near(led(x), 0, 0.05, 'talking at 80 dB: still dark (mA)');
        sound(x, 120);
        near(led(x), 1.19, 0.1, 'clap at 120 dB: LED latched (mA)');
        near(x.v('re', 'a'), 2.64, 0.05, 'latched: Q1 now carries the emitter current (V)');
        x.run(100);
        near(led(x), 1.19, 0.1, '100 ms of silence later: still lit (mA)');
        x.set('reset', 1); x.run(5); x.set('reset', 0); x.run(20);
        near(led(x), 0, 0.05, 'RESET: dark again (mA)');

        const dull = armed(0.5);
        sound(dull, 110);
        near(led(dull), 0, 0.05, 'pot 1/2, 110 dB: not enough (mA)');
        const keen = armed(0.8);
        near(keen.v('q1', 'base'), 3.84, 0.03, 'pot 0.8: Q1 base nearer the switching point (V)');
        sound(keen, 110);
        near(led(keen), 1.38, 0.1, 'pot 0.8, 110 dB: latched (mA)');
    });

    test('lab-amp-ic-pot-piano: the key sounds the note, the pot tunes, OCTAVE halves, RANGE widens', () => {
        // Pitch from the output's edges 4..14 ms after the key goes down:
        // narrow range, pot at 0 (10 k in) 500 Hz, pot 1/2 851 Hz; OCTAVE
        // 249 Hz; wide range pot 0 588 Hz,
        // pot 1/2 1110 Hz.
        const key = (sets) => {
            const x = bench('lab-amp-ic-pot-piano');
            for (const [k, v] of Object.entries(sets)) x.set(k, v);
            x.set('key', 1);
            x.run(4);
            const e = [];
            let last = x.v('u', 'vout') > 4.5;
            while (x.t < 14 - 1e-9) {
                x.run(0.005);
                const now = x.v('u', 'vout') > 4.5;
                if (now !== last) e.push(x.t);
                last = now;
            }
            return 1000 * (e.length - 1) / 2 / (e[e.length - 1] - e[0]);
        };
        const up = bench('lab-amp-ic-pot-piano');
        up.run(6);
        near(up.v('u', 'vout'), 8.10, 0.03, 'key up: output parked high (V)');
        near(up.v('u', 'inn'), 0, 0.01, 'key up: timing capacitor empty (V)');
        assert.equal(up.tone('spk').on, false, 'key up: silence');
        const low = key({ tune: 0 });
        near(low, 500, 15, 'pot 0: pitch (Hz)');
        const mid = key({ tune: 0.5 });
        near(mid, 851, 25, 'pot 1/2: pitch (Hz)');
        near(key({ tune: 0, octave: 1 }) / low, 0.5, 0.03, 'OCTAVE: half the pitch');
        const wideLow = key({ tune: 0, range: 1 });
        near(wideLow, 588, 20, 'wide range, pot 0: pitch (Hz)');
        const wideMid = key({ tune: 0.5, range: 1 });
        near(wideMid, 1110, 50, 'wide range, pot 1/2: pitch (Hz)');
        near((wideMid / wideLow) / (mid / low), 1.11, 0.05, 'the same pot turn spans more with the small range resistor');
    });
});
