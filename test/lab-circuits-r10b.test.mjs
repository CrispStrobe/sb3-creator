/**
 * The r10b benches from `scripts/gen-lab-circuits-4.mjs --set=r10b` do what
 * their EXPECTED.md says: measured on the COMMITTED circuit.json, with the
 * stimuli a learner would set (buttons, toggle and slide switches, pots, a
 * phototransistor's light slider, a humidity comb's slider, a light guide's
 * gap knob, a field probe's knob, the sound level at a listening
 * loudspeaker).
 *
 * Readouts are the engine's own surfaces: node voltages, resistor currents,
 * device state (a relay). Every 555 tone costs the solver real time (about
 * two minutes per simulated second of a 1 kHz tone on a loaded machine), so
 * tones are timed over a few milliseconds; only silent or slow benches run
 * for seconds. lab-555-wail edits two capacitors for that reason (stated in
 * its test and its EXPECTED.md).
 *
 * Every number was measured on the headless engine (bw-board 2965782a) when
 * the bench was built; the tolerances are bands around those measurements.
 * With R10B_MEASURE=1 each scenario also prints what it measured.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r10b.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set r10b)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const MEASURE = !!process.env.R10B_MEASURE;
const report = (id, m) => { if (MEASURE) console.log(`MEASURED ${id} ${JSON.stringify(m)}`); };

/** Load a committed bench (its params optionally edited first) and name its parts by role. */
function bench (id, params = null) {
    const json = JSON.parse(readFileSync(join(EXAMPLES, id, 'circuit.json'), 'utf8'));
    const ids = benchIds(BENCHES[id]);
    for (const [name, kv] of Object.entries(params ?? {})) Object.assign(json.parts.find(p => p.id === ids[name]).params, kv);
    const c = Circuit.fromJSON(json);
    const b = c.board;
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
    const api = {
        c, b, ids,
        v (name, term) { return b.nodeVoltages.get(netOf(name, term)) ?? 0; },
        /** Current through a resistor, a → b, in mA. */
        mA (name) { return (api.v(name, 'a') - api.v(name, 'b')) / json.parts.find(p => p.id === ids[name]).params.ohms * 1e3; },
        state (name) { return b.getDeviceState(ids[name]); },
        run (ms) {
            tMs += ms;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
        },
        /** Run `ms` in steps of `step`, calling fn after each. */
        each (ms, step, fn) { const end = tMs + ms; while (tMs < end - 1e-9) { api.run(step); fn(tMs); } },
        /** Lowest and highest value of a node over the next `ms`. */
        span (name, term, ms, step = 0.05) {
            let lo = Infinity; let hi = -Infinity;
            api.each(ms, step, () => { const x = api.v(name, term); lo = Math.min(lo, x); hi = Math.max(hi, x); });
            return { lo, hi, pp: hi - lo };
        },
        /** Times (ms) at which a node crosses `level`, over the next `ms`. */
        crossings (name, term, level, ms, step) {
            const ts = []; let prev = api.v(name, term) > level;
            api.each(ms, step, (t) => { const h = api.v(name, term) > level; if (h !== prev) ts.push(t); prev = h; });
            return ts;
        },
        set (name, value) { b.setControl(ids[name], value); },
        param (name, key, value) { b.setPartParam(ids[name], key, value); },
        get t () { return tMs; },
    };
    return api;
}

const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${Number(got).toFixed(4)}, expected ${want} +-${tol}`);
const r3 = (x) => Math.round(x * 1000) / 1000;
/** Mean period (ms) from a list of crossing times: every second one is a whole period. */
const period = (ts) => (ts.length < 3 ? 0 : (ts[ts.length - 1 - ((ts.length - 1) % 2)] - ts[0]) / Math.floor((ts.length - 1) / 2));

describe('lab benches (set r10b) behave as documented', { skip: SKIP }, () => {


    /** Mean frequency (Hz) of a 555 / amplifier output over the next `ms`, 0 when silent. */
    const freq = (x, name, term, level, ms, step) => { const p = period(x.crossings(name, term, level, ms, step)); return p > 0 ? r3(1000 / p) : 0; };
    const ledOn = (x, name) => x.v(name, 'anode') - x.v(name, 'cathode') > 1.5;

    test('lab-555-humidity-switch: breath switches DRY to WET, drying switches back only below the lower threshold', () => {
        const x = bench('lab-555-humidity-switch');
        const snap = () => ({ in: r3(x.v('u', 'trigger')), out: r3(x.v('u', 'output')), wet: r3(x.mA('rw')), dry: r3(x.mA('rdry')) });
        x.run(2); const m = { rest: snap() };
        for (const [k, rh] of [['breath', 0.9], ['drying74', 0.74], ['dry65', 0.65], ['back74', 0.74], ['wet80', 0.8]]) { x.set('comb', rh); x.run(2); m[k] = snap(); }
        report('lab-555-humidity-switch', m);
        near(m.rest.in, 0.089, 0.01, 'room air: input (V)');
        near(m.rest.dry, 6.652, 0.1, 'room air: DRY LED (mA)');
        near(m.rest.wet, 0, 0.01, 'room air: WET LED (mA)');
        near(m.breath.in, 8.601, 0.05, 'breath: input (V)');
        near(m.breath.wet, 5.809, 0.1, 'breath: WET LED (mA)');
        near(m.drying74.in, 4.5, 0.05, '74 % RH: input inside the window (V)');
        near(m.drying74.out, 0.29, 0.05, '74 % RH coming from breath: output stays low (V)');
        near(m.dry65.out, 8.667, 0.05, '65 % RH: back to DRY (V)');
        near(m.back74.out, 8.667, 0.05, '74 % RH coming from dry: output stays high (V)');
        near(m.wet80.in, 6.838, 0.05, '80 % RH: input above 6 V (V)');
        near(m.wet80.out, 0.29, 0.05, '80 % RH: WET (V)');
    });

    test('lab-555-direction-tester: forward junctions sound, reversed ones stay silent; a leak on CV raises the pitch', () => {
        const x = bench('lab-555-direction-tester');
        const tone = () => freq(x, 'u', 'output', 4.5, 8, 0.01);
        x.run(2); const m = { idle: tone() };
        for (const b of ['bsi', 'bled', 'bnpn', 'bpnp']) { x.set(b, 1); x.run(1); m[b] = { f: tone(), reset: r3(x.v('u', 'reset')) }; x.set(b, 0); x.run(1); }
        x.set('redclip', 1); x.set('blackclip', 1); x.run(1);
        for (const b of ['bsi', 'bled', 'bnpn', 'bpnp']) { x.set(b, 1); x.run(1); m[`rev_${b}`] = { f: tone(), reset: r3(x.v('u', 'reset')) }; x.set(b, 0); x.run(1); }
        x.set('redclip', 0); x.set('blackclip', 0); x.set('bsi', 1); x.run(1);
        x.set('leak', 1); for (const p of [0, 0.5, 1]) { x.set('lk', p); x.run(1); m[`leak${p}`] = { f: tone(), cv: r3(x.v('u', 'control')) }; }
        report('lab-555-direction-tester', m);
        near(m.idle, 0, 0.001, 'socket empty: silent (Hz)');
        for (const b of ['bsi', 'bled', 'bnpn']) near(m[b].f, 679.35, 5, `${b} forward: tone (Hz)`);
        near(m.bsi.reset, 7.661, 0.05, 'diode forward: reset pin (V)');
        near(m.bled.reset, 6.773, 0.05, 'LED forward: reset pin (V)');
        near(m.bpnp.f, 0, 0.001, 'PNP with red on its base: silent (Hz)');
        for (const b of ['bsi', 'bled', 'bnpn']) near(m[`rev_${b}`].f, 0, 0.001, `${b} reversed: silent (Hz)`);
        near(m.rev_bpnp.f, 679.35, 5, 'PNP with black on its base: tone (Hz)');
        near(m.leak0.f, 724.64, 8, 'leak 51.7 kΩ: pitch (Hz)');
        near(m.leak1.f, 976.29, 10, 'leak 4.7 kΩ: pitch (Hz)');
        near(m.leak1.cv, 3.511, 0.03, 'leak 4.7 kΩ: control pin (V)');
        // MEASURED 2026-11-25: leak1.f - leak0.f > 150 -> observed 251.7 Hz.
        assert.ok(m.leak1.f - m.leak0.f > 150, `a stronger leak raises the pitch (${m.leak0.f} -> ${m.leak1.f} Hz)`);
    });

    test('lab-555-morse-touch: the key and a moist fingertip lift reset and the tone sounds; a dry finger does not', () => {
        const x = bench('lab-555-morse-touch');
        const tone = () => freq(x, 'u', 'output', 4.5, 8, 0.01);
        x.run(2); const m = { idle: tone(), idleReset: r3(x.v('u', 'reset')) };
        x.set('key', 1); x.run(1); m.key = { f: tone(), reset: r3(x.v('u', 'reset')) }; x.set('key', 0); x.run(2); m.released = tone();
        x.set('touch', 1); x.run(1); m.moist = { f: tone(), reset: r3(x.v('u', 'reset')) }; x.set('touch', 0); x.run(2);
        x.set('skin', 1); x.set('touch', 1); x.run(1); m.dry = { f: tone(), reset: r3(x.v('u', 'reset')) };
        report('lab-555-morse-touch', m);
        near(m.idle, 0, 0.001, 'idle: silent (Hz)');
        near(m.key.f, 679.35, 5, 'KEY: tone (Hz)');
        near(m.released, 0, 0.001, 'KEY released: silent (Hz)');
        near(m.moist.f, 679.35, 5, 'moist finger: tone (Hz)');
        near(m.moist.reset, 8.97, 0.05, 'moist finger: the PNP lifts reset (V)');
        near(m.dry.f, 0, 0.001, 'dry finger: silent (Hz)');
        near(m.dry.reset, 0, 0.05, 'dry finger: reset stays low (V)');
    });

    test('lab-555-wail: CV sets the pitch; the slow 555 sweeps CV up and down; the button glides it up and back', () => {
        const t0 = Date.now();
        // Pitch against CV on the authored tone: the ramp capacitor cut to
        // 100 nF so it settles in milliseconds instead of seconds.
        const p = bench('lab-555-wail', { cr: { farads: 100e-9 } });
        p.set('mode', 1); p.run(40);
        const m = { low: { cv: r3(p.v('t', 'control')), f: freq(p, 't', 'output', 4.5, 6, 0.01) } };
        p.set('btn', 1); p.run(40);
        m.high = { cv: r3(p.v('t', 'control')), f: freq(p, 't', 'output', 4.5, 6, 0.01) };
        // The slow sweeps over seconds, with the tone capacitor raised to
        // 10 µF (the tone ticks at about 10 Hz; CV does not depend on it).
        const x = bench('lab-555-wail', { ct: { farads: 10e-6 } });
        const cv = [];
        x.each(4000, 50, (t) => cv.push([r3(t), r3(x.v('t', 'control'))]));
        m.wail = cv.filter((_, i) => i % 4 === 3);
        x.set('mode', 1); x.run(1500); m.sirenRest = r3(x.v('t', 'control'));
        x.set('btn', 1); x.run(500); m.held05 = r3(x.v('t', 'control')); x.run(1500); m.held2 = r3(x.v('t', 'control'));
        x.set('btn', 0); x.run(500); m.released05 = r3(x.v('t', 'control')); x.run(1000); m.released15 = r3(x.v('t', 'control'));
        m.wallS = (Date.now() - t0) / 1000;
        report('lab-555-wail', m);
        near(m.low.cv, 6.728, 0.05, 'SIREN, button up: CV (V)');
        near(m.low.f, 840.3, 15, 'SIREN, button up: pitch (Hz)');
        near(m.high.cv, 3.786, 0.05, 'SIREN, button held: CV (V)');
        near(m.high.f, 1369.9, 25, 'SIREN, button held: pitch (Hz)');
        const late = m.wail.filter(([t]) => t >= 1600).map(([, v]) => v);
        near(Math.min(...late), 4.652, 0.1, 'WAIL: CV trough after the first cycle (V)');
        near(Math.max(...late), 6.456, 0.1, 'WAIL: CV crest after the first cycle (V)');
        near(m.sirenRest, 6.693, 0.05, 'SIREN at rest: CV (V)');
        near(m.held05, 4.847, 0.1, 'button held 0.5 s: CV gliding down (V)');
        near(m.held2, 3.838, 0.05, 'button held 2 s: CV (V)');
        near(m.released05, 5.385, 0.1, 'released 0.5 s: CV gliding back (V)');
        near(m.released15, 6.438, 0.1, 'released 1.5 s: CV (V)');
    });

    test('lab-555-touch-timer: a finger starts it; with the guard the mains hum does not, without it the hum does', () => {
        const x = bench('lab-555-touch-timer');
        const t0 = Date.now();
        const st = () => ({ out: r3(x.v('u', 'output')), trig: r3(x.v('u', 'trigger')), k: !!x.state('k')?.energized, lamp: r3(x.mA('rl')) });
        x.run(100); const m = { rest: st() };
        x.set('pr', 1); const hum = x.span('u', 'trigger', 200, 0.5); m.humGuard = { lo: r3(hum.lo), hi: r3(hum.hi), ...st() };
        x.set('pr', 0); x.run(300);
        x.set('finger', 1); x.run(50); m.finger = st(); x.set('finger', 0); x.run(1000); m.after1s = st(); x.run(2000); m.after3s = st();
        x.set('guard', 0); x.run(100); m.unguardedQuiet = st();
        x.set('pr', 1); const hum2 = x.span('u', 'trigger', 300, 0.5); m.humOpen = { lo: r3(hum2.lo), hi: r3(hum2.hi), ...st() };
        m.wallS = (Date.now() - t0) / 1000;
        report('lab-555-touch-timer', m);
        near(m.rest.out, 0, 0.01, 'at rest: timer idle (V)');
        // MEASURED 2026-11-25: guarded hum lo > 8 -> observed 8.753 V.
        assert.ok(m.humGuard.lo > 8, `GUARD closed, cable close: the hum stays far above 3 V (${m.humGuard.lo} V)`);
        assert.equal(m.humGuard.k, false, 'GUARD closed, cable close: relay stays out');
        near(m.finger.trig, 1.713, 0.05, 'finger: trigger = 9 V x 0.47 / 2.47 (V)');
        assert.equal(m.finger.k, true, 'finger: relay pulls in');
        near(m.finger.lamp, 7.077, 0.2, 'finger: lamp LED (mA)');
        assert.equal(m.after1s.k, true, 'one second later: still on');
        assert.equal(m.after3s.k, false, 'three seconds later: off');
        assert.equal(m.unguardedQuiet.k, false, 'GUARD open, cable away: quiet');
        // MEASURED 2026-11-25: unguarded hum lo < 3 -> observed -8.19 V.
        assert.ok(m.humOpen.lo < 3, `GUARD open, cable close: the hum swings below 3 V (${m.humOpen.lo} V)`);
        assert.equal(m.humOpen.k, true, 'GUARD open, cable close: the timer fires by itself');
    });

    test('lab-555-touch-toggle: each short touch flips the output, a finger left on makes it blink', () => {
        const x = bench('lab-555-touch-toggle');
        const out = () => r3(x.v('u', 'output'));
        x.run(300); const m = { start: out(), node: r3(x.v('u', 'trigger')) };
        const taps = [];
        for (let i = 0; i < 3; i++) { x.set('touch', 1); x.run(40); x.set('touch', 0); x.run(400); taps.push([out(), !!x.state('k')?.energized]); }
        m.taps = taps;
        x.set('touch', 1); m.held = x.crossings('u', 'output', 4.5, 1500, 1).map(r3);
        report('lab-555-touch-toggle', m);
        near(m.start, 0, 0.01, 'switched on: output low (V)');
        near(m.node, 4.5, 0.01, 'switched on: input node between the thresholds (V)');
        // MEASURED 2026-11-25: v > 4.5 splits the output -> observed 6.988 V on and 0 V off.
        assert.deepEqual(m.taps.map(([v, k]) => [v > 4.5, k]), [[true, true], [false, false], [true, true]], 'three taps: on, off, on');
        near(m.taps[0][0], 6.988, 0.05, 'on: output with the relay coil as load (V)');
        assert.equal(m.held.length, 5, `finger held 1.5 s: it keeps flipping (${m.held})`);
        near(m.held[1] - m.held[0], 454, 30, 'held: first on-time (ms)');
        near(m.held[2] - m.held[1], 108, 15, 'held: off-time (ms)');
    });

    test('lab-555-sound-switch: a loud sound or a torch starts the timer, a quiet room does not', () => {
        const x = bench('lab-555-sound-switch');
        const t0 = Date.now();
        const st = () => ({ out: r3(x.v('u', 'output')), k: !!x.state('k')?.energized, q2c: r3(x.v('q2', 'collector')) });
        x.run(1500); const m = { rest: st(), q1c: r3(x.v('q1', 'collector')) };
        for (const db of [60, 70, 80, 90]) { x.param('mic', 'soundDb', db); const s = x.span('q2', 'collector', 10, 0.02); m[`db${db}`] = { pp: r3(s.pp), ...st() }; }
        x.param('mic', 'soundDb', 100); const s100 = x.span('q2', 'collector', 20, 0.02); m.db100 = { pp: r3(s100.pp), ...st() };
        x.param('mic', 'soundDb', 0); x.run(1000); m.after1s = st(); x.run(2000); m.after3s = st();
        x.set('src', 1); x.run(100); m.lightDark = st(); x.set('pt', 1); x.run(20); m.torch = st(); x.set('pt', 0);
        m.wallS = (Date.now() - t0) / 1000;
        report('lab-555-sound-switch', m);
        near(m.rest.q2c, 4.839, 0.1, 'quiet: second collector at rest (V)');
        assert.equal(m.rest.k, false, 'quiet: relay out');
        near(m.db80.pp, 0.184, 0.03, '80 dB: swing (V)');
        near(m.db90.pp, 0.58, 0.08, '90 dB: swing (V)');
        near(m.db100.pp, 1.684, 0.2, '100 dB: swing (V)');
        for (const db of [60, 70, 80, 90]) assert.equal(m[`db${db}`].k, false, `${db} dB: no start`);
        assert.equal(m.db100.k, true, '100 dB (a clap): the relay pulls in');
        assert.equal(m.after1s.k, true, 'one second later: still in');
        assert.equal(m.after3s.k, false, 'three seconds later: out');
        assert.equal(m.lightDark.k, false, 'light mode, dark: nothing');
        assert.equal(m.torch.k, true, 'light mode, torch: the relay pulls in');
    });

    test('lab-555-hysteresis-feedback: feedback narrows the switching window, too much makes it oscillate', () => {
        const x = bench('lab-555-hysteresis-feedback');
        const t0 = Date.now();
        const sweep = () => {
            let on = null; let off = null;
            for (let p = 0.2; p <= 0.9001; p += 0.01) { x.set('vin', p); x.run(3); if (on === null && x.v('u', 'output') > 4.5) on = r3(p); }
            for (let p = 0.9; p >= 0.1999; p -= 0.01) { x.set('vin', p); x.run(3); if (off === null && x.v('u', 'output') < 4.5) off = r3(p); }
            return { on, off };
        };
        x.run(5);
        const m = {};
        for (const fb of [0, 0.5, 0.75]) { x.set('fb', fb); x.set('vin', 0.2); x.run(5); m[`fb${fb}`] = sweep(); }
        x.set('fb', 1); x.set('vin', 0.2); x.run(5);
        const s = []; for (let p = 0.2; p <= 0.8001; p += 0.05) { x.set('vin', p); x.run(2); s.push([r3(p), x.crossings('u', 'output', 4.5, 10, 0.01).length]); }
        m.fb1 = s;
        m.wallS = (Date.now() - t0) / 1000;
        report('lab-555-hysteresis-feedback', m);
        near(m.fb0.on, 0.39, 0.015, 'feedback 104.7 kOhm: on at INPUT');
        near(m.fb0.off, 0.25, 0.015, 'feedback 104.7 kOhm: off at INPUT');
        near(m['fb0.75'].on, 0.35, 0.015, 'feedback 29.7 kOhm: on at INPUT');
        near(m['fb0.75'].off, 0.28, 0.015, 'feedback 29.7 kOhm: off at INPUT');
        const width = (w) => w.on - w.off;
        // MEASURED 2026-11-25: width(fb0) - width(fb0.75) > 0.04 -> observed 0.07.
        assert.ok(width(m.fb0) - width(m['fb0.75']) > 0.04, `more feedback, narrower window (${width(m.fb0)} -> ${width(m['fb0.75'])})`);
        // MEASURED 2026-11-25: changes per 10 ms at INPUT 0.2..0.5 >= 15 -> observed 18-28.
        for (const [p, n] of m.fb1.filter(([p]) => p <= 0.5)) assert.ok(n >= 15, `minimum feedback, INPUT ${p}: oscillates (${n} changes in 10 ms)`);
        for (const [p, n] of m.fb1.filter(([p]) => p >= 0.55)) assert.equal(n, 0, `minimum feedback, INPUT ${p}: steady on`);
    });

    test('lab-555-trip-latch: breaking the wire latches the alarm, only reset clears it', () => {
        const x = bench('lab-555-trip-latch');
        const tone = () => freq(x, 't', 'output', 4.5, 6, 0.01);
        const st = () => ({ out: r3(x.v('u', 'output')), f: tone() });
        x.run(2); const m = { armed: st() };
        x.set('wire', 0); x.run(2); m.broken = st();
        x.set('wire', 1); x.run(2); m.rejoined = st();
        x.set('reset', 1); x.run(2); m.resetHeld = st(); x.set('reset', 0); x.run(2); m.cleared = st();
        x.set('wire', 0); x.run(2); x.set('reset', 1); x.run(2); m.resetWhileBroken = st(); x.set('reset', 0); x.run(2); m.releasedWhileBroken = st();
        report('lab-555-trip-latch', m);
        near(m.armed.out, 0, 0.01, 'armed: latch off (V)');
        near(m.armed.f, 0, 0.001, 'armed: silent (Hz)');
        near(m.broken.out, 8.653, 0.05, 'wire broken: latch on (V)');
        near(m.broken.f, 678.7, 5, 'wire broken: tone (Hz)');
        near(m.rejoined.out, 8.653, 0.05, 'wire joined again: still latched (V)');
        near(m.resetHeld.f, 0, 0.001, 'RESET held: silent (Hz)');
        near(m.cleared.out, 0, 0.01, 'RESET released, wire intact: stays off (V)');
        near(m.resetWhileBroken.out, 0, 0.01, 'RESET held with the wire broken: off (V)');
        near(m.releasedWhileBroken.out, 8.653, 0.05, 'RESET released with the wire broken: on again (V)');
    });

    test('lab-555-twilight: dark lights the lamp, light the day LED, with a window that NARROW shrinks', () => {
        const x = bench('lab-555-twilight');
        const sweep = () => {
            let up = null; let down = null; const vin = {};
            for (let l = 0; l <= 1.0001; l += 0.025) { x.set('pt', l); x.run(1); if (up === null && x.v('u', 'output') < 4.5) { up = r3(l); vin.vUp = r3(x.v('u', 'trigger')); } }
            for (let l = 1; l >= -0.0001; l -= 0.025) { x.set('pt', Math.max(0, l)); x.run(1); if (down === null && x.v('u', 'output') > 4.5) { down = r3(l); vin.vDown = r3(x.v('u', 'trigger')); } }
            return { up, down, ...vin };
        };
        x.run(2); const m = { rest: { in: r3(x.v('u', 'trigger')), out: r3(x.v('u', 'output')), lamp: r3(x.mA('rlamp')), day: r3(x.mA('rday')) } };
        m.wide = sweep(); x.set('narrow', 1); x.run(1); m.cvNarrow = r3(x.v('u', 'control')); m.narrow = sweep();
        report('lab-555-twilight', m);
        near(m.rest.in, 1.1, 0.02, 'dusk (light 0.1): input = 0.5 mA x 0.1 x 22 kOhm (V)');
        near(m.rest.lamp, 6.746, 0.1, 'dusk: LAMP LED (mA)');
        near(m.rest.day, 0, 0.01, 'dusk: DAY LED (mA)');
        near(m.wide.up, 0.55, 0.0126, 'brightening: DAY at light (0..1), 6 V / 11 V');
        near(m.wide.vUp, 6.05, 0.05, 'brightening: input when DAY lights (V)');
        near(m.wide.down, 0.25, 0.0126, 'darkening: LAMP at light (0..1), 3 V / 11 V');
        near(m.wide.vDown, 2.75, 0.05, 'darkening: input when LAMP lights (V)');
        near(m.cvNarrow, 4.5, 0.01, 'NARROW: control pin (V)');
        near(m.narrow.up, 0.425, 0.0126, 'NARROW, brightening: DAY at light, 4.5 V / 11 V');
        near(m.narrow.down, 0.2, 0.0126, 'NARROW, darkening: LAMP at light, 2.25 V / 11 V');
    });

    test('lab-555-fibre-darlington: the fibre end near switches the Schmitt 555 and raises the tone', () => {
        const x = bench('lab-555-fibre-darlington');
        const m = { sw: [], tone: [] };
        x.run(2);
        for (const g of [10, 6, 4, 2, 1, 0]) { x.set('guide', g / 10); x.run(2); m.sw.push([g, r3(x.v('a', 'trigger')), r3(x.v('a', 'output')), r3(x.mA('rs'))]); }
        x.set('mode', 1);
        for (const g of [10, 4, 0]) { x.set('guide', g / 10); x.run(2); m.tone.push([g, freq(x, 'b', 'output', 4.5, 8, 0.01)]); }
        report('lab-555-fibre-darlington', m);
        near(m.sw[0][1], 0.515, 0.05, '10 mm gap: Darlington emitter (V)');
        near(m.sw[2][1], 2.836, 0.2, '4 mm gap: emitter just below 3 V (V)');
        near(m.sw[3][1], 7.992, 0.1, '2 mm gap: emitter above 6 V (V)');
        // MEASURED 2026-11-25: out < 4.5 splits the 555 output -> observed 0.333 V (NEAR) and 8.653 V (FAR).
        assert.deepEqual(m.sw.map(([g, , out]) => [g, out < 4.5]), [[10, false], [6, false], [4, false], [2, true], [1, true], [0, true]], 'NEAR from 2 mm, FAR from 4 mm');
        near(m.tone[0][1], 2080.4, 40, 'TONE, 10 mm gap (Hz)');
        near(m.tone[1][1], 3404.8, 60, 'TONE, 4 mm gap (Hz)');
        // MEASURED 2026-11-25: tone at 0 mm - tone at 10 mm > 1000 -> observed 1367.8 Hz.
        assert.ok(m.tone[2][1] - m.tone[0][1] > 1000, `the fibre end near raises the pitch (${m.tone[0][1]} -> ${m.tone[2][1]} Hz)`);
    });

    test('lab-555-amp-beats: the 555 and the LM386 oscillator beat at their difference frequency', () => {
        const x = bench('lab-555-amp-beats');
        const t0 = Date.now();
        x.run(3);
        // One pass of 45 ms: both oscillators' crossings and, per 555
        // period, how much of the time the two outputs agree (both high or
        // both low) and how far the mix swings. In step the mix swings fully;
        // out of step it hovers in the middle.
        const c555 = []; const clm = []; let p555 = x.v('t', 'output') > 4.5; let plm = x.v('u', 'vout') > 4.5;
        const win = []; let n = 0; let agree = 0; let lo = Infinity; let hi = -Infinity; let wEnd = x.t + 2.17;
        x.each(45, 0.02, (t) => {
            const a = x.v('t', 'output') > 4.5; if (a !== p555) c555.push(t); p555 = a;
            const b = x.v('u', 'vout') > 4.5; if (b !== plm) clm.push(t); plm = b;
            n++; if (a === b) agree++;
            const v = x.v('r1', 'b'); lo = Math.min(lo, v); hi = Math.max(hi, v);
            if (t >= wEnd) { win.push([r3(t), r3(agree / n), r3(hi - lo)]); n = 0; agree = 0; lo = Infinity; hi = -Infinity; wEnd += 2.17; }
        });
        const m = { f555: r3(1000 / period(c555)), flm: r3(1000 / period(clm)) };
        m.agreeMax = Math.max(...win.map(w => w[1])); m.agreeMin = Math.min(...win.map(w => w[1]));
        // Local minima of agreement: the moments the two are most out of step.
        m.outOfStep = win.filter((w, i) => i > 0 && i < win.length - 1 && w[1] < 0.3 && w[1] <= win[i - 1][1] && w[1] <= win[i + 1][1]).map(w => w[0]);
        m.win = win;
        m.wallS = (Date.now() - t0) / 1000;
        report('lab-555-amp-beats', m);
        near(m.f555, 460.4, 8, '555 (Hz)');
        near(m.flm, 513.1, 10, 'LM386 oscillator, TUNE at 0.35 (Hz)');
        // MEASURED 2026-11-25: agreeMax > 0.85 -> observed 0.944; agreeMin < 0.2 -> observed 0.065.
        assert.ok(m.agreeMax > 0.85 && m.agreeMin < 0.2, `the two drift fully in and out of step (${m.agreeMin} .. ${m.agreeMax})`);
        assert.equal(m.outOfStep.length, 2, `two out-of-step moments in 45 ms (${m.outOfStep})`);
        near(m.outOfStep[1] - m.outOfStep[0], 1000 / (m.flm - m.f555), 1.5, 'beat period = 1 / (difference frequency) (ms)');
    });

    test('lab-555-mic-fm: speech wobbles the 555 pitch, louder speech wider', () => {
        const x = bench('lab-555-mic-fm');
        const t0 = Date.now();
        const halfPeriods = () => { const ts = x.crossings('u', 'output', 4.5, 12, 0.01); const p = []; for (let i = 2; i < ts.length; i += 2) p.push(ts[i] - ts[i - 2]); return { n: p.length, min: r3(Math.min(...p) * 1000), max: r3(Math.max(...p) * 1000) }; };
        x.run(200); const m = { q2c: r3(x.v('q2', 'collector')), quiet: halfPeriods() };
        x.param('mic', 'soundDb', 94); x.run(20); m.db94 = halfPeriods();
        m.wallS = (Date.now() - t0) / 1000;
        report('lab-555-mic-fm', m);
        near(m.q2c, 4.904, 0.1, 'preamp settled after 0.2 s (V)');
        // MEASURED 2026-11-25: quiet max - min <= 15 -> observed 10 us.
        assert.ok(m.quiet.max - m.quiet.min <= 15, `silence: steady period (${m.quiet.min}-${m.quiet.max} us)`);
        near(m.quiet.min, 720, 15, 'silence: period (us)');
        // MEASURED 2026-11-25: db94 max - min >= 50 -> observed 80 us.
        assert.ok(m.db94.max - m.db94.min >= 50, `94 dB speech: the period wobbles (${m.db94.min}-${m.db94.max} us)`);
    });

    test('lab-counter-traffic-lights: red, red+amber, green, amber, red', () => {
        const x = bench('lab-counter-traffic-lights');
        const t0 = Date.now();
        const seq = []; let last = '';
        x.each(2600, 20, (t) => {
            const s = `${ledOn(x, 'red') ? 'R' : '-'}${ledOn(x, 'amber') ? 'A' : '-'}${ledOn(x, 'green') ? 'G' : '-'}`;
            if (s !== last) { seq.push([r3(t), s]); last = s; }
        });
        report('lab-counter-traffic-lights', { seq, wallS: (Date.now() - t0) / 1000 });
        assert.deepEqual(seq.map(([, s]) => s), ['R--', 'RA-', '--G', '-A-', 'R--', 'RA-'], 'red, red+amber, green, amber, red, red+amber');
        near(seq[2][0] - seq[1][0], 460, 40, 'one step (ms)');
        near(seq[4][0] - seq[3][0], 480, 40, 'one step (ms)');
    });
});
