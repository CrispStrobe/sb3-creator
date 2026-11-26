/**
 * The r6h benches from `scripts/gen-lab-circuits-4.mjs --set=r6h` do what
 * their EXPECTED.md says: measured on the COMMITTED circuit.json, with the
 * stimuli a learner would set (buttons, toggle and slide switches, pots, a
 * phototransistor's light slider, a light path's knob, the sound level at a
 * listening loudspeaker, a function generator's frequency).
 *
 * Readouts are the engine's own surfaces: node voltages, resistor currents,
 * device state (a relay, a lamp). Every LM386 oscillator flip costs the solver
 * a few hundred steps and every audio cycle through an op-amp stage a few
 * hundred more, so tones are timed over a few milliseconds and only the
 * metronome and the timer run for seconds.
 *
 * Every number was measured on the headless engine (bw-board d4113b4b) when
 * the bench was built; the tolerances are bands around those measurements.
 * With R6H_MEASURE=1 each scenario also prints what it measured.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r6h.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set r6h)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const MEASURE = !!process.env.R6H_MEASURE;
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

describe('lab benches (set r6h) behave as documented', { skip: SKIP }, () => {

    test('lab-beeper-diode-check: forward diodes beep, reversed ones stay silent, the meter shows each drop', () => {
        const x = bench('lab-beeper-diode-check');
        x.run(2);
        const pp = () => r3(x.span('u', 'vout', 3, 0.05).pp);
        const m = { idle: pp() };
        const parts = ['bsi', 'bge', 'bled', 'bir'];
        for (const b of parts) {
            x.set(b, 1); x.run(2);
            m[b] = { pp: pp(), drop: r3(x.v('vm', 'a') - x.v('vm', 'b')), mA: r3(x.mA('rsrc')) };
            x.set(b, 0); x.run(2);
        }
        x.set('redclip', 1); x.set('blackclip', 1); x.run(2);
        for (const b of parts) { x.set(b, 1); x.run(2); m[`rev_${b}`] = { pp: pp(), uA: r3(x.mA('rsb') * 1000), v: r3(x.v('vm', 'a') - x.v('vm', 'b')) }; x.set(b, 0); x.run(2); }
        x.set('redclip', 0); x.run(2); m.clipsTogether = pp();
        report('lab-beeper-diode-check', m);
        // MEASURED 2026-11-24: idle < 0.05 -> observed 0.002 V pp.
        assert.ok(m.idle < 0.05, `nothing in the socket: silent (${m.idle} V pp)`);
        for (const b of parts) near(m[b].pp, 7.17, 0.05, `${b} forward: full tone (V pp)`);
        near(m.bsi.drop, 0.563, 0.03, 'silicon diode drop (V)');
        near(m.bge.drop, 0.277, 0.03, 'germanium diode drop (V)');
        near(m.bled.drop, 1.527, 0.05, 'red LED drop (V)');
        near(m.bir.drop, 0.938, 0.04, 'infrared LED drop (V)');
        // MEASURED 2026-11-24: rev_* pp < 0.05 -> observed 0.000-0.001 V pp.
        for (const b of parts) assert.ok(m[`rev_${b}`].pp < 0.05, `${b} reversed: silent (${m[`rev_${b}`].pp} V pp)`);
        near(m.rev_bsi.uA, 0.45, 0.05, 'reversed silicon diode: only the voltmeter\'s own current flows (µA)');
        near(m.rev_bsi.v, -4.48, 0.05, 'reversed: the diode blocks about 4.5 V, well short of breakdown (V)');
        near(m.rev_bge.uA - m.rev_bsi.uA, 0.2, 0.1, 'reversed germanium diode: about 0.2 µA leakage on top (µA)');
        near(m.clipsTogether, 7.17, 0.05, 'both clips on one row: a short, full tone (V pp)');
    });

    test('lab-beeper-transistor-check: base to emitter and base to collector beep, nothing else does', () => {
        const x = bench('lab-beeper-transistor-check');
        x.run(2);
        const pp = () => r3(x.span('u', 'vout', 3, 0.05).pp);
        const m = { idle: pp() };
        const pairs = [['rb', 'ke'], ['rb', 'kc'], ['re', 'kb'], ['rc', 'kb'], ['rc', 'ke'], ['re', 'kc']];
        for (const [r, k] of pairs) {
            x.set(r, 1); x.set(k, 1); x.run(2);
            m[`${r}-${k}`] = pp();
            x.set(r, 0); x.set(k, 0); x.run(2);
        }
        report('lab-beeper-transistor-check', m);
        // MEASURED 2026-11-24: idle < 0.05 -> observed 0.001 V pp.
        assert.ok(m.idle < 0.05, `no clips: silent (${m.idle} V pp)`);
        near(m['rb-ke'], 7.17, 0.05, 'red on base, black on emitter: tone (V pp)');
        near(m['rb-kc'], 7.17, 0.05, 'red on base, black on collector: tone (V pp)');
        // MEASURED 2026-11-24: the four silent pairs -> observed 0.000-0.001 V pp.
        for (const k of ['re-kb', 'rc-kb', 'rc-ke', 're-kc']) assert.ok(m[k] < 0.05, `${k}: silent (${m[k]} V pp)`);
    });

    test('lab-amp-metronome: one oscillator, three speeds; the knob sets each', () => {
        const run = (mode, pos, ms, step) => {
            const p = { rate: { position: pos } };
            if (mode !== 'tick') p.tick = { closed: false };
            if (mode === 'engine') p.engine = { closed: true };
            const x = bench('lab-amp-metronome', p);
            const ts = x.crossings('u', 'vout', 4.5, ms, step);
            return r3(period(ts.slice(1)));
        };
        const m = {
            sirenFast: run('siren', 1, 8, 0.01), sirenSlow: run('siren', 0, 20, 0.02),
            engineFast: run('engine', 1, 60, 0.1), engineSlow: run('engine', 0, 300, 0.5),
            tickFast: run('tick', 1, 1500, 2), tickSlow: run('tick', 0, 6000, 5),
        };
        report('lab-amp-metronome', m);
        near(m.sirenFast, 0.37, 0.03, '100 nF, knob up: period (ms), about 2.7 kHz');
        near(m.sirenSlow, 2.94, 0.1, '100 nF, knob down: period (ms), about 340 Hz');
        near(m.engineFast, 8.4, 0.4, 'ENGINE (2.2 µF), knob up: period (ms)');
        near(m.engineSlow, 67.5, 3, 'ENGINE, knob down: period (ms)');
        near(m.tickFast, 364, 15, 'TICK (100 µF), knob up: period (ms)');
        near(m.tickSlow, 2925, 100, 'TICK, knob down: period (ms)');
    });

    test('lab-amp-light-organ: the amplified bass lights red, the amplified treble blue', () => {
        const at = (f, settle) => {
            const x = bench('lab-amp-light-organ', { fg: { freq: f } });
            x.run(settle);
            const out = x.span('u', 'vout', 1000 / f, 1000 / f / 40);
            let tr = 0; let ba = 0; let n = 0;
            x.each(3000 / f, 1000 / f / 40, () => { tr += x.mA('r1'); ba += x.mA('r2'); n++; });
            return { outPp: r3(out.pp), treble: r3(tr / n), bass: r3(ba / n) };
        };
        const m = { bass: at(80, 40), treble: at(1500, 30) };
        report('lab-amp-light-organ', m);
        near(m.bass.outPp, 6.0, 0.2, 'amplifier output at 150 mV in: about 6 V pp (gain 20)');
        near(m.bass.bass, 3.8, 0.5, '80 Hz: red (bass) LED, mean mA');
        // MEASURED 2026-11-24: bass.treble < 0.1 -> observed 0 mA; treble.bass < 0.1 -> observed 0 mA.
        assert.ok(m.bass.treble < 0.1, `80 Hz: blue dark (${m.bass.treble} mA)`);
        near(m.treble.treble, 3.6, 0.5, '1.5 kHz: blue (treble) LED, mean mA');
        // MEASURED 2026-11-24: treble.bass < 0.1 -> observed 0 mA.
        assert.ok(m.treble.bass < 0.1, `1.5 kHz: red dark (${m.treble.bass} mA)`);
    });

    test('lab-flame-ir-latch: a flame switches it on, its own infrared keeps it on, a hand in the beam switches it off', () => {
        const x = bench('lab-flame-ir-latch');
        x.run(5);
        const st = () => ({ inp: r3(x.v('u', 'inp')), out: r3(x.v('u', 'vout')), amp: r3(x.mA('rled')), ir: r3(x.mA('rtx')) });
        const m = { dark: st() };
        x.set('pt', 0.001); x.run(5); m.glow1 = st();
        x.set('pt', 0.003); x.run(5); m.glow3 = st();
        x.set('pt', 0.02); x.run(5); m.flame = st();
        x.set('pt', 0); x.run(20); m.flameGone = st();
        x.set('beam', 1); x.run(10); m.handIn = st();
        x.set('beam', 0); x.run(20); m.handOut = st();
        report('lab-flame-ir-latch', m);
        near(m.dark.out, 0.90, 0.02, 'dark: output low (V)');
        near(m.dark.amp, 0, 0.01, 'dark: Darlington off (mA)');
        near(m.glow1.amp, 0.5, 0.05, 'light 0.001: the Darlington lights its LED with 0.5 mA');
        near(m.glow3.amp, 1.5, 0.1, 'light 0.003: three times the light, three times the current (mA)');
        near(m.glow3.out, 0.90, 0.02, 'a glimmer is not enough to switch (V)');
        near(m.flame.out, 8.10, 0.02, 'flame: output high (V)');
        near(m.flame.ir, 10.9, 0.3, 'flame: IR + red LED current (mA)');
        near(m.flameGone.out, 8.10, 0.02, 'flame gone: held on by its own infrared (V)');
        near(m.flameGone.amp, 5.68, 0.2, 'flame gone: Darlington still saturated (mA)');
        near(m.handIn.out, 0.90, 0.02, 'hand in the beam: off (V)');
        near(m.handOut.out, 0.90, 0.02, 'hand away again: stays off (V)');
        near(m.handOut.ir, 0, 0.01, 'hand away again: infrared dark (mA)');
    });

    test('lab-amp-midpoint: the LM386 holds the midpoint while the op-amp mirrors about it; two resistors do not', () => {
        const at = (sel, pos) => {
            const x = bench('lab-amp-midpoint', { sel: { position: sel }, pin: { position: pos } });
            x.run(20);
            return { mid: r3(x.v('sel', 'com')), w: r3(x.v('pin', 'wiper')), out: r3(x.v('op', '1_out')), led: r3(x.mA('rl')) };
        };
        const m = { ampLo: at(0, 0.25), ampHi: at(0, 0.75), ampEnd: at(0, 1), divLo: at(1, 0.25), divHi: at(1, 0.75) };
        report('lab-amp-midpoint', m);
        near(m.ampLo.mid, 4.50, 0.01, 'LM386 midpoint, red LED lit (V)');
        near(m.ampEnd.mid, 4.50, 0.01, 'LM386 midpoint, sinking the green LED current (V)');
        near(m.ampLo.out, 2 * m.ampLo.mid - m.ampLo.w, 0.02, 'inverting x1 about the midpoint (input low)');
        near(m.ampHi.out, 2 * m.ampHi.mid - m.ampHi.w, 0.02, 'inverting x1 about the midpoint (input high)');
        near(m.ampLo.led, 0.73, 0.05, 'output 1.9 V above the midpoint: red LED (mA)');
        near(m.ampEnd.led, -4.78, 0.1, 'input at +9 V: green LED (mA, negative = into the output)');
        near(m.divLo.mid, 5.85, 0.1, 'two 10 kΩ: the midpoint is dragged up (V)');
        near(m.divHi.mid, 2.10, 0.1, 'two 10 kΩ: ... and down (V)');
    });

    test('lab-opamp-schmitt: two thresholds with feedback, one without', () => {
        const sweep = (fb) => {
            const x = bench('lab-opamp-schmitt', { fb: { closed: fb }, pin: { position: 0.3 } });
            x.run(2);
            const high = () => x.v('u', '1_out') > 4;
            let up = null; let down = null; let p = 0.3;
            while (up === null && p < 0.9) { p = r3(p + 0.005); x.set('pin', p); x.run(1); if (high()) up = r3(x.v('pin', 'wiper')); }
            const outHi = r3(x.v('u', '1_out'));
            while (down === null && p > 0.1) { p = r3(p - 0.005); x.set('pin', p); x.run(1); if (!high()) down = r3(x.v('pin', 'wiper')); }
            return { up, down, outHi, outLo: r3(x.v('u', '1_out')) };
        };
        const m = { schmitt: sweep(true), comparator: sweep(false) };
        // In the middle: the output depends on where the input came from.
        const mid = bench('lab-opamp-schmitt', { pin: { position: 0.5 } });
        mid.run(2); m.midFromBelow = r3(mid.v('u', '1_out'));
        mid.set('pin', 0.8); mid.run(2); mid.set('pin', 0.5); mid.run(2); m.midFromAbove = r3(mid.v('u', '1_out'));
        report('lab-opamp-schmitt', m);
        near(m.schmitt.up, 5.57, 0.05, 'feedback: switches high at an input of (V)');
        near(m.schmitt.down, 3.76, 0.05, 'feedback: switches low at (V)');
        near(m.schmitt.outHi, 7.22, 0.05, 'output high (V)');
        near(m.schmitt.outLo, 0.35, 0.05, 'output low (V)');
        near(m.comparator.up, 4.5, 0.05, 'no feedback: up at (V)');
        near(m.comparator.down, 4.5, 0.05, 'no feedback: down at the same point (V)');
        near(m.midFromBelow, 0.35, 0.05, 'input in the middle, come from below: low');
        near(m.midFromAbove, 7.22, 0.05, 'input in the middle, come from above: high');
    });

    test('lab-opamp-sound-relay: a loud ring pulls the relay in, a quiet one does not, silence lets it go', () => {
        const x = bench('lab-opamp-sound-relay');
        const relay = () => !!x.state('k')?.energized;
        let envMax = 0;
        x.each(100, 2, () => { envMax = Math.max(envMax, x.v('ch', 'pos')); });
        const m = { envStart: r3(envMax), quietRelay: relay(), th: r3(x.v('sens', 'wiper')) };
        x.param('mic', 'soundDb', 70); x.run(60);
        m.soft = { out: r3(x.span('u', '1_out', 4, 0.02).pp), env: r3(x.v('ch', 'pos')), relay: relay() };
        x.param('mic', 'soundDb', 85);
        let on = null; const t1 = x.t;
        while (x.t < t1 + 150 && on === null) { x.run(5); if (relay()) on = r3(x.t - t1); }
        m.loudOnMs = on; m.lamp = r3(x.state('lamp')?.brightness ?? 0);
        x.param('mic', 'soundDb', 0);
        let off = null; const t2 = x.t;
        while (x.t < t2 + 1500 && off === null) { x.run(20); if (!relay()) off = r3(x.t - t2); }
        m.offMs = off;
        report('lab-opamp-sound-relay', m);
        near(m.th, 2.25, 0.01, 'sensitivity pot: threshold (V)');
        // MEASURED 2026-11-24: envStart < 1.6 -> observed 1.153 V (switch-on settling of the amplifiers).
        assert.ok(m.envStart < 1.6, `switch-on: the envelope stays below the threshold (${m.envStart} V)`);
        assert.equal(m.quietRelay, false, 'silence: relay out');
        near(m.soft.out, 2.2, 0.3, '70 dB ring: amplifier output (V pp)');
        assert.equal(m.soft.relay, false, '70 dB: relay stays out');
        near(m.loudOnMs, 75, 20, '85 dB ring: relay in after (ms)');
        near(m.lamp, 1.0, 0.05, 'relay in: lamp lit');
        // MEASURED 2026-11-24: offMs within 1500 -> observed 100 ms.
        assert.ok(m.offMs !== null, 'silence: the relay drops out again');
    });

    test('lab-opamp-relay-timer: the relay holds for 1.09 R C (the LM324 input bias helps the charge); START begins again; the long range is 100 times slower', () => {
        const x = bench('lab-opamp-relay-timer', { range: { position: 1 } });
        x.run(10);
        const m = { relay0: !!x.state('k')?.energized, thHi: r3(x.v('u', '1_pos')) };
        let off = null;
        while (x.t < 30000 && off === null) { x.run(50); if (!x.state('k')?.energized) off = x.t; }
        m.offS = r3(off / 1000); m.thLo = r3(x.v('u', '1_pos')); m.lamp = r3(x.state('lamp')?.brightness ?? 0);
        x.set('start', 1); x.run(100); x.set('start', 0); x.run(100);
        m.restart = !!x.state('k')?.energized; m.vcAfterStart = r3(x.v('u', '1_neg'));
        // Same knob, both ranges: the capacitor voltage after 0.2 s (short) and 20 s (long).
        const s = bench('lab-opamp-relay-timer', { range: { position: 1 } }); s.run(200); m.short200ms = r3(s.v('u', '1_neg'));
        const l = bench('lab-opamp-relay-timer', { range: { position: 0 } }); l.run(20000); m.long20s = r3(l.v('u', '1_neg'));
        report('lab-opamp-relay-timer', m);
        assert.equal(m.relay0, true, 'switch-on: timing, relay in');
        near(m.thHi, 6.07, 0.02, 'threshold while the output is high (V)');
        // 17.91 s until bw-board f706f932 gave the LM324 its input bias current:
        // 42.5 nA out of the - input into the capacitor, 1.12 RC -> 1.09 RC.
        // MEASURED at de8083c5 (and f48ea7ce): 17.41 s.
        near(m.offS, 17.4, 0.4, 'short range (4.7 µF), knob at 0.3: relay drops out after (s)');
        near(m.thLo, 5.63, 0.02, 'threshold after it has switched (V)');
        near(m.lamp, 0, 0.01, 'time up: lamp out');
        assert.equal(m.restart, true, 'START: timing again');
        near(m.vcAfterStart, 0.06, 0.05, 'START emptied the capacitor (V)');
        near(m.short200ms, 0.113, 0.01, 'short range, 0.2 s: capacitor (V)');
        near(m.long20s / m.short200ms, 1, 0.03, 'long range (470 µF) after 20 s = short range after 0.2 s');
    });

    test('lab-opamp-shift-register: each CLOCK press moves every bit one place', () => {
        const x = bench('lab-opamp-shift-register');
        const q = () => [1, 2, 3].map(i => (x.v('u', `${i}_out`) > 4 ? 1 : 0)).join('');
        x.run(50);
        const m = { start: q(), ref: r3(x.v('u', '1_neg')), high: null };
        const clk = (hold = 30) => { x.set('clock', 1); x.run(hold); x.set('clock', 0); x.run(60); return q(); };
        const seq = [];
        x.set('data', 1); x.run(30); seq.push(clk());
        m.high = r3(x.v('u', '1_out')); m.posHigh = r3(x.v('u', '1_pos'));
        seq.push(clk());
        x.set('data', 0); x.run(30); seq.push(clk()); seq.push(clk());
        x.set('data', 1); x.run(30); seq.push(clk(200));
        x.set('data', 0); x.run(30); seq.push(clk(5)); seq.push(clk()); seq.push(clk());
        m.seq = seq;
        report('lab-opamp-shift-register', m);
        assert.equal(m.start, '000', 'switch-on: all three latches reset');
        near(m.ref, 1.91, 0.02, 'common - input (V)');
        near(m.high, 7.2, 0.15, 'a latch that is set: output (V)');
        near(m.posHigh, 3.6, 0.1, '... holding its own + input above the - input (V)');
        assert.deepEqual(m.seq, ['100', '110', '011', '001', '100', '010', '001', '000'],
            'data 1,1,0,0,1,0,0,0 walks through the three stages (a long and a short press shift once each)');
    });
});
