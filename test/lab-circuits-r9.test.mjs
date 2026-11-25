/**
 * The "r9" benches from `scripts/gen-lab-circuits-4.mjs --set=r9` do what
 * their EXPECTED.md says: measured on the COMMITTED circuit.json, with the
 * stimuli a learner would set (the temperature around a PTC, the light on a
 * solar cell, a music generator, the jar's level switches, how close a wire
 * is to the mains).
 *
 * Readouts come from the engine's own surfaces: node voltages, LED
 * brightness, the device state (cd4046 vcoHz and locked, the motor's
 * velocity, the counter's count), a transducer's tone. Oscillators cost real
 * time, so each scenario is short; the ~100 kHz fibre link keeps to a few
 * tenths of a millisecond.
 *
 * Every number below was measured on the headless engine (bw-board
 * r9/engine-robust-20261125, bw-circuit-ui e3441d2) when the bench was
 * built; the tolerances are bands around those measurements. R9_OBSERVE=1
 * prints each measured value beside its claim.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r9.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (r9)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

/** Load a committed bench, its role params edited first ({role: {key: value}}). */
function bench (id, edits = {}) {
    const json = JSON.parse(readFileSync(join(EXAMPLES, id, 'circuit.json'), 'utf8'));
    const ids = benchIds(BENCHES[id]);
    for (const [role, kv] of Object.entries(edits)) {
        const p = json.parts.find(q => q.id === ids[role]);
        assert.ok(p, `${id}: no part ${role}`);
        Object.assign(p.params, kv);
    }
    const c = Circuit.fromJSON(json);
    const b = c.board;
    let tMs = 0;
    const nets = new Map();
    const netOf = (name, term) => {
        const key = `${name}.${term}`;
        if (!nets.has(key)) {
            const n = b.getNets().find(n => n.terminals.some(x => x.part === ids[name] && x.terminal === term));
            assert.ok(n, `${id}: no net for ${key}`);
            nets.set(key, n.id);
        }
        return nets.get(key);
    };
    const api = {
        c, b, ids,
        v (name, term) { return b.nodeVoltages.get(netOf(name, term)) ?? 0; },
        /** Voltage across a two-lead part (a minus b, or anode minus cathode). */
        across (name, a = 'a', k = 'b') { return api.v(name, a) - api.v(name, k); },
        tone (name) { return b.buzzerTone(ids[name]); },
        state (name) { return b.getDeviceState(ids[name]); },
        light (name) { return b.opticalReport()?.receivers[ids[name]]?.light ?? 0; },
        /** Advance `ms`, in steps of at most 1 ms (one advance has a bounded step budget). */
        run (ms) {
            const end = tMs + ms;
            while (tMs < end - 1e-9) {
                tMs = Math.min(end, tMs + 1);
                b.advanceTo(BigInt(Math.round(tMs * 1e6)));
                assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
            }
        },
        set (name, value) { b.setControl(ids[name], value); },
        param (name, key, value) { b.setPartParam(ids[name], key, value); },
        get t () { return tMs; },
        /** Lowest and highest value of f() sampled every `step` ms for `ms` ms. */
        span (f, ms, step = 0.05) {
            let lo = Infinity; let hi = -Infinity;
            for (let s = 0; s < ms - 1e-9; s += step) { api.run(step); const y = f(); lo = Math.min(lo, y); hi = Math.max(hi, y); }
            return { lo, hi, pp: hi - lo };
        },
        /** Frequency (Hz) of f() crossing `level` upwards, sampled every `step` ms for `ms` ms. */
        hz (f, level, ms, step = 0.02) {
            let last = f() > level; let first = null; let lastRise = null; let n = 0;
            for (let s = 0; s < ms - 1e-9; s += step) {
                api.run(step);
                const up = f() > level;
                if (up && !last) { n++; if (first === null) first = tMs; lastRise = tMs; }
                last = up;
            }
            return n >= 2 ? (n - 1) / ((lastRise - first) / 1000) : 0;
        },
        /** hz() of two signals over the same window. */
        hzPair (fa, fb, level, ms, step = 0.02) {
            const st = [fa, fb].map(f => ({ f, last: f() > level, first: null, lastRise: null, n: 0 }));
            for (let s = 0; s < ms - 1e-9; s += step) {
                api.run(step);
                for (const c of st) {
                    const up = c.f() > level;
                    if (up && !c.last) { c.n++; if (c.first === null) c.first = tMs; c.lastRise = tMs; }
                    c.last = up;
                }
            }
            return st.map(c => (c.n >= 2 ? (c.n - 1) / ((c.lastRise - c.first) / 1000) : 0));
        },
        /** Fraction of samples (every `step` ms over `ms` ms) where f() is true. */
        frac (f, ms, step = 0.05) {
            let on = 0; let n = 0;
            for (let s = 0; s < ms - 1e-9; s += step) { api.run(step); n++; if (f()) on++; }
            return on / n;
        },
    };
    return api;
}

// R9_OBSERVE=1 prints every measured value beside its claim (used to write
// the MEASURED notes and the EXPECTED.md tables).
const OBSERVE = Boolean(process.env.R9_OBSERVE);
const near = (got, want, tol, what) => {
    if (OBSERVE) console.log(`OBSERVE near ${what}: ${got} (claim ${want} +-${tol})`);
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);
};
/** Pass a bounded value through, printing it when observing. */
const seen = (what, v) => { if (OBSERVE) console.log(`OBSERVE seen ${what}: ${v}`); return v; };

/** Count level changes of f() > level, sampled every `step` ms over `ms` ms. */
function toggles (x, f, level, ms, step) {
    let last = f() > level; let n = 0;
    for (let s = 0; s < ms - 1e-9; s += step) { x.run(step); const up = f() > level; if (up !== last) n++; last = up; }
    return n;
}

describe('r9 benches behave as documented', { skip: SKIP }, () => {
    test('lab-ptc-window-blink: inside the window green and steady; outside it the red LED flashes', () => {
        const at = (surroundC) => {
            const x = bench('lab-ptc-window-blink', { ptc: { surroundC } });
            x.run(300);
            return x;
        };
        const ok = at(25);
        near(ok.v('u', '1_out'), 6.17, 0.05, '25 C: amplified sensor (V)');
        assert.ok(seen('25 C: green LED', ok.b.ledBrightness(ok.ids.green)) > 0.2, '25 C: green on');
        assert.equal(seen('25 C: red toggles', toggles(ok, () => ok.v('qp', 'collector'), 5, 300, 5)), 0, '25 C: red steady');
        assert.ok(seen('25 C: red LED', ok.b.ledBrightness(ok.ids.red)) < 0.01, '25 C: red off');
        for (const t of [15, 35]) {
            const x = at(t);
            assert.ok(seen(`${t} C: green LED`, x.b.ledBrightness(x.ids.green)) < 0.01, `${t} C: green off`);
            const n = seen(`${t} C: red toggles in 400 ms`, toggles(x, () => x.v('qp', 'collector'), 5, 400, 5));
            assert.ok(n >= 3, `${t} C: red flashes (${n} changes in 400 ms)`);
        }
    });

    test('lab-chopper-tacho: each slot clicks the speaker; the meter follows the motor\'s speed', () => {
        const at = (light) => {
            const x = bench('lab-chopper-tacho', { cell: { light } });
            x.run(150);
            const w = x.state('m').velocity;
            const pulses = 4 * w / (2 * Math.PI);
            return { x, w, pulses, tone: x.tone('spk')?.hz ?? 0, meter: x.v('meter', 'a') };
        };
        const full = at(1);
        near(full.w, 226, 15, 'full light: motor speed (rad/s)');
        near(full.tone, full.pulses, 0.05 * full.pulses, 'full light: speaker clicks at slots x revolutions (Hz)');
        near(full.meter, 1.72, 0.25, 'full light: rate meter (V)');
        const dim = at(0.1);
        assert.ok(seen('dim: motor speed (rad/s)', dim.w) < 0.7 * full.w, 'less light, slower motor');
        // The dim motor is still speeding up a little; the speaker's pitch
        // (from its last few clicks) trails the instantaneous speed.
        near(dim.tone, dim.pulses, 0.2 * dim.pulses, 'dim: clicks follow the slower shaft (Hz)');
        assert.ok(dim.tone < 0.5 * full.tone, 'dim: a much lower buzz');
        assert.ok(seen('dim: meter (V)', dim.meter) < full.meter - 0.1, 'dim: the meter reads lower');
    });

    test('lab-fibre-pll-music: the 4046 loop turns the light pulses back into the music', () => {
        const x = bench('lab-fibre-pll-music');
        x.run(0.25);
        const tr = [];
        for (let i = 0; i < 40; i++) { x.run(0.005); tr.push([x.t, x.v('u', 'dem_out')]); }
        // One-bin DFTs over the 0.2 ms window: the music's 5 kHz, and 10 kHz
        // (two whole cycles in the window, orthogonal to it) as the floor.
        const bin = (kHz) => {
            let re = 0, im = 0;
            for (const [t, v] of tr) { re += v * Math.cos(2 * Math.PI * kHz * t); im += v * Math.sin(2 * Math.PI * kHz * t); }
            return 2 * Math.hypot(re, im) / tr.length;
        };
        near(x.state('u').vcoHz, 70000, 12000, 'the VCO near the transmitter\'s rate (Hz)');
        const music = seen('5 kHz at dem_out (V)', bin(5)), other = seen('10 kHz at dem_out (V)', bin(10));
        near(music, 0.66, 0.2, 'the demodulator output carries the 5 kHz music (V)');
        assert.ok(other < music / 3, 'and not a tone it was not sent');
    });

    test('lab-ptc-fibre-tone: warmer sensor, brighter LED, higher pitch at the far end', () => {
        const at = (surroundC) => {
            const x = bench('lab-ptc-fibre-tone', { ptc: { surroundC } });
            x.run(20);
            const hz = x.hz(() => x.v('q2', 'collector'), 4.5, 10, 0.02);
            return { x, hz, out: x.v('a', 'vout') };
        };
        const cool = at(25), warm = at(45);
        near(cool.out, 5.07, 0.15, '25 C: LM386 output (V)');
        assert.ok(seen('45 C: LM386 output (V)', warm.out) > cool.out + 1, 'warmer: higher drive');
        near(cool.hz, 540, 60, '25 C: pitch (Hz)');
        assert.ok(seen('45 C: pitch (Hz)', warm.hz) > cool.hz * 1.08, 'warmer: higher pitch');
    });

    test('lab-ptc-fibre-pll: the 4046 locks onto the pulses; its control voltage reads the temperature', () => {
        const at = (surroundC) => {
            const x = bench('lab-ptc-fibre-pll', { ptc: { surroundC } });
            x.run(12);
            return { x, vco: x.state('u').vcoHz, ctl: x.v('u', 'vco_in'), meter: x.v('meter', 'a') };
        };
        const cool = at(25), warm = at(45);
        near(cool.vco, 880, 120, '25 C: VCO (Hz)');
        assert.ok(seen('45 C: VCO (Hz)', warm.vco) > cool.vco * 1.1, 'warmer: faster pulses, VCO follows');
        assert.ok(seen('45 C: meter (V)', warm.meter) > seen('25 C: meter (V)', cool.meter) + 0.2, 'warmer: the meter reads higher');
        seen('25 C: control (V)', cool.ctl); seen('45 C: control (V)', warm.ctl);
    });

    test('lab-pll-jar-level: the level bar fills with the jar and the beeper sounds when full', () => {
        const at = (level) => {
            const x = bench('lab-pll-jar-level');
            for (const s of ['s1', 's2', 's3'].slice(0, level)) x.set(s, 1);
            x.run(40);
            return { x, amp: x.v('o', '2_out'), half: x.b.ledBrightness(x.ids.half), full: x.b.ledBrightness(x.ids.full),
                tone: x.tone('pz')?.hz ?? 0 };
        };
        const r = [null, 1, 2, 3].map(l => (l === null ? null : at(l)));
        r.forEach((y, i) => { if (y) { seen(`level ${i}: amplifier (V)`, y.amp); seen(`level ${i}: half`, y.half); seen(`level ${i}: full`, y.full); seen(`level ${i}: tone`, y.tone); } });
        assert.ok(r[1].amp < r[2].amp && r[2].amp < r[3].amp, 'more water, more signal');
        assert.ok(r[1].half < 0.01 && r[1].full < 0.01, 'level 1: both LEDs dark');
        assert.ok(r[2].half > 0.1 && r[3].half > 0.1, 'level 2 and full: half LED lit');
        assert.ok(r[2].full < 0.01, 'level 2: full LED dark');
        assert.ok(r[3].full > 0.1, 'full: full LED lit');
        assert.ok(r[2].tone === 0 || !r[2].x.tone('pz')?.on, 'level 2: silent');
        assert.ok(r[3].tone > 100, 'full: the beeper sounds');
    });

    test('lab-hum-counter: a wire near the mains clocks the counter 50 times a second', () => {
        const x = bench('lab-hum-counter');
        x.run(10);
        const c0 = x.state('cnt').count;
        x.run(200);
        const counted = (x.state('cnt').count - c0 + 16) % 16;
        // 200 ms of 50 Hz hum: 10 counts (the 4-bit count wraps at 16).
        near(seen('counts in 200 ms', counted), 10, 1, 'counts in 200 ms');
        x.set('reset', 1); x.run(5);
        assert.equal(x.state('cnt').count, 0, 'RESET clears the count');
        x.set('reset', 0);
        x.set('ant', 0); x.run(300);
        const d0 = x.state('cnt').count; x.run(100);
        assert.equal(seen('far away: counts in 100 ms', (x.state('cnt').count - d0 + 16) % 16), 0, 'wire far from the mains: no counting');
    });
});
