/**
 * The r6b benches from `scripts/gen-lab-circuits-4.mjs --set=r6b` do what
 * their EXPECTED.md says: measured on the COMMITTED circuit.json, with the
 * stimuli a learner would set (buttons, slide switches, pots, the light
 * slider on a phototransistor, a transistor's temperature, the sound at a
 * listening speaker).
 *
 * Every circuit here is built from NPN transistors and an LM386 power
 * amplifier only. An LM386 that switches (a blinker, a tone) costs real time
 * per edge in the engine, so the oscillator scenarios watch a handful of
 * edges and no more; where a slow part (a blinking transistor pair) and a
 * fast one (a tone) share a bench, the slow part's timing capacitors are
 * scaled down for the test and the scaling is said beside it.
 *
 * Every number below was measured on the headless engine (bw-board f4aaec43)
 * when the bench was built; the tolerances are bands around those
 * measurements.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r6b.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set r6b, transistor and LM386 benches)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

/** Load a committed bench (optionally edited first) and name its parts by role. */
function bench (id, edit = null) {
    const json = JSON.parse(readFileSync(join(EXAMPLES, id, 'circuit.json'), 'utf8'));
    const ids = benchIds(BENCHES[id]);
    if (edit) edit(json, ids);
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
        state (name) { return b.getDeviceState(ids[name]); },
        temp (name) { return b.partTemperature(ids[name]); },
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

/** Set params of the part named `name` before loading. */
const withParams = (name, params) => (json, ids) => { Object.assign(json.parts.find(p => p.id === ids[name]).params, params); };
const edits = (...fs) => (json, ids) => { for (const f of fs) f(json, ids); };

const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);

/** Current through a resistor (A), from its two node voltages. */
const amps = (x, name, ohms) => (x.v(name, 'a') - x.v(name, 'b')) / ohms;

/**
 * Times (ms) at which `read()` crosses `thr`, sampled every `dt` ms until
 * `until` (or until `max` crossings have been seen).
 */
function edgesOf (x, read, thr, until, dt, max = Infinity) {
    const out = [];
    let last = read() > thr;
    while (x.t < until - 1e-9 && out.length < max) {
        x.run(dt);
        const now = read() > thr;
        if (now !== last) out.push({ t: x.t, up: now });
        last = now;
    }
    return out;
}

/** Mean frequency (Hz) from a speaker's tone-tracker edges over `win` ms. */
function toneHz (x, part, win, step = 2) {
    const per = new Map();
    const end = x.t + win;
    while (x.t < end - 1e-9) {
        x.run(step);
        const e = (x.state(part)._edges ?? []).map(Number);
        for (let i = 2; i < e.length; i++) per.set(e[i], (e[i] - e[i - 2]) / 1e9);
    }
    const p = [...per.values()];
    return { hz: p.length ? p.length / p.reduce((a, b) => a + b, 0) : 0, n: p.length };
}

describe('lab r6b benches behave as documented', { skip: SKIP }, () => {
    // ---- followers built from the LM386 ----------------------------------

    test('lab-amp-ic-dimmer: the output follows the pot and never exceeds 8.1 V', () => {
        // Follower: -IN tied to the output, so vout = (4.5 + 20·vp)/21 inside
        // the 0.9 .. 8.1 V window. Measured: knob 0.25 -> 2.335 V, 0.5 ->
        // 4.401 V, 1 -> 8.097 V (LED 13.4 mA through 470 ohm).
        const at = (pos) => { const x = bench('lab-amp-ic-dimmer'); x.set('knob', pos); x.run(2); return x; };
        const lo = at(0.25);
        near(lo.v('u', 'vout'), 2.335, 0.05, 'knob 1/4: output (V)');
        near(lo.v('u', 'vout') - lo.v('knob', 'wiper'), 0.166, 0.05, 'knob 1/4: output tracks the wiper');
        const mid = at(0.5);
        near(mid.v('u', 'vout'), 4.401, 0.05, 'knob 1/2: output (V)');
        near(amps(mid, 'rs', 470) * 1e3, 5.75, 0.3, 'knob 1/2: LED current (mA)');
        const top = at(1);
        near(top.v('knob', 'wiper'), 9.0, 0.01, 'knob full: the wiper is at the battery');
        near(top.v('u', 'vout'), 8.097, 0.03, 'knob full: output stops at the amplifier limit');
        near(amps(top, 'rs', 470) * 1e3, 13.37, 0.3, 'knob full: LED current (mA)');
        const off = at(0);
        near(amps(off, 'rs', 470) * 1e3, 0, 0.05, 'knob at zero: LED dark (mA)');
    });

    test('lab-amp-ic-balance: the pot slides the light from green to red; the lag switch slows it', () => {
        // Measured: knob 0 -> red 0 / green 12.75 mA; 1/2 -> 5.40 / 5.88 mA;
        // 1 -> 13.37 / 0 mA.
        const at = (pos) => { const x = bench('lab-amp-ic-balance'); x.set('knob', pos); x.run(2); return x; };
        const a = at(0);
        near(amps(a, 'rs1', 470) * 1e3, 0, 0.05, 'knob 0: red (mA)');
        near(amps(a, 'rs2', 470) * 1e3, 12.75, 0.3, 'knob 0: green (mA)');
        const m = at(0.5);
        near(amps(m, 'rs1', 470) * 1e3, 5.40, 0.3, 'knob 1/2: red (mA)');
        near(amps(m, 'rs2', 470) * 1e3, 5.88, 0.3, 'knob 1/2: green (mA)');
        const z = at(1);
        near(amps(z, 'rs1', 470) * 1e3, 13.37, 0.3, 'knob full: red (mA)');
        near(amps(z, 'rs2', 470) * 1e3, 0, 0.05, 'knob full: green (mA)');
        // Knob from 0 to full at once. Lag off: the output is at 8.1 V 20 ms
        // later. Lag on (470 uF on +IN): 0.90 V after 20 ms, 3.55 V after
        // 0.5 s, 7.51 V after 2 s.
        const run = (lag) => {
            const x = bench('lab-amp-ic-balance', edits(withParams('knob', { position: 0 }), withParams('lag', { position: lag })));
            x.run(200);
            x.set('knob', 1);
            const r = [];
            for (const dt of [20, 480, 1500]) { x.run(dt); r.push(x.v('u', 'vout')); }
            return r;
        };
        const fast = run(0);
        near(fast[0], 8.097, 0.03, 'lag off: output after 20 ms (V)');
        const slow = run(1);
        near(slow[0], 0.903, 0.05, 'lag on: output after 20 ms (V)');
        near(slow[1], 3.55, 0.25, 'lag on: output after 0.5 s (V)');
        near(slow[2], 7.51, 0.25, 'lag on: output after 2 s (V)');
    });

    // ---- monostables built from the LM386 --------------------------------

    test('lab-amp-ic-pedestrian: red at rest, a press gives green for a pot-set time', () => {
        // Time pot at its short end (10 k + the chip's 50 k against 100 uF):
        // green for 1.4 s. At rest +IN sits near 0 V, -IN at 1.49 V: red.
        const x = bench('lab-amp-ic-pedestrian');
        x.set('time', 0);
        x.run(300);
        near(x.v('u', 'vout'), 0.90, 0.03, 'rest: output low (V)');
        near(x.v('u', 'inn'), 1.49, 0.03, 'rest: -IN bias (V)');
        assert.ok(amps(x, 'rs1', 1000) > 4e-3, 'rest: red lit'); // MEASURED 2026-11-24: amps(rs1) -> observed 6.3e-3.
        x.set('btn', 1); x.run(100); x.set('btn', 0);
        near(x.v('u', 'vout'), 8.10, 0.03, 'pressed: output high (V)');
        assert.ok(amps(x, 'rs2', 1000) > 4e-3, 'pressed: green lit'); // MEASURED 2026-11-24: amps(rs2) -> observed 6.2e-3.
        const ed = edgesOf(x, () => x.v('u', 'vout'), 4.5, x.t + 3000, 50, 1);
        assert.equal(ed.length, 1, 'one return to red');
        near(ed[0].t - 400, 1400, 100, 'green time with the pot at its short end (ms)');
        near(x.v('u', 'vout'), 0.90, 0.03, 'back to red (V)');
        // The longest time, pot fully up (110 k in parallel with the chip's
        // 50 k): 5.7 s, measured to 100 ms.
        const y = bench('lab-amp-ic-pedestrian');
        y.run(300); y.set('btn', 1); y.run(100); y.set('btn', 0);
        const ey = edgesOf(y, () => y.v('u', 'vout'), 4.5, y.t + 7000, 100, 1);
        assert.equal(ey.length, 1, 'pot up: one return to red');
        near(ey[0].t - 400, 5700, 200, 'green time with the pot fully up (ms)');
        assert.deepEqual(y.b.getWarnings().filter(w => w.type === 'polarized-cap-reversed'), [], 'the timing capacitor is never reversed');
    });

    test('lab-amp-ic-exposure: brighter light, shorter green time', () => {
        // The phototransistor (1 mA at full light) empties the 47 uF timing
        // capacitor. Button held 100 ms; green time after the release, to
        // 10 ms: light 0.2 -> 1.07 s, 0.6 -> 0.43 s, 1 -> 0.25 s.
        const onTime = (light) => {
            const x = bench('lab-amp-ic-exposure');
            x.set('pt', light);
            x.run(300);
            near(x.v('u', 'vout'), 0.90, 0.03, `light ${light}: ready (red) (V)`);
            x.set('btn', 1); x.run(100);
            near(x.v('u', 'vout'), 8.10, 0.03, `light ${light}: exposing (green) (V)`);
            x.set('btn', 0);
            const ed = edgesOf(x, () => x.v('u', 'vout'), 4.5, x.t + 1600, 10, 1);
            assert.equal(ed.length, 1, `light ${light}: one pulse`);
            return ed[0].t - 400;
        };
        const dim = onTime(0.2);
        const mid = onTime(0.6);
        const full = onTime(1);
        near(dim, 1070, 60, 'light 0.2: green time (ms)');
        near(mid, 430, 40, 'light 0.6: green time (ms)');
        near(full, 250, 30, 'light 1: green time (ms)');
    });

    // ---- heat ---------------------------------------------------------------

    test('lab-resistor-heat: 0.81 W warms the 100 ohm resistor by about 30 K; 1 k barely', () => {
        // Measured: 100 ohm at 37.7 / 50.1 / 55.7 C after 1 / 3 / 6 s; its
        // diode 0.580 -> 0.534 V. Switched to 1 k at 6 s: 3 s later 100 ohm
        // at 31.9 C, 1 k at 27.5 C.
        const x = bench('lab-resistor-heat');
        x.run(1);
        near(x.v('vm1', 'a'), 0.580, 0.005, 'cold: diode 1 (V)');
        near(x.v('vm2', 'a'), 0.580, 0.005, 'cold: diode 2 (V)');
        const p = (x.v('rh', 'a') - x.v('rh', 'b')) ** 2 / 100;
        near(p, 0.808, 0.01, 'power in 100 ohm (W)');
        x.run(1000);
        near(x.temp('rh'), 37.7, 1, '1 s: 100 ohm (C)');
        x.run(5000);
        near(x.temp('rh'), 55.7, 1, '6 s: 100 ohm (C)');
        near(x.v('vm1', 'a'), 0.534, 0.005, '6 s: diode 1 (V)');
        near(x.v('vm2', 'a'), 0.580, 0.003, '6 s: diode 2 unchanged (V)');
        x.set('sw', 1);
        x.run(3000);
        near(x.temp('rh'), 31.9, 1, 'switched: 100 ohm cooling (C)');
        near(x.temp('rk'), 27.5, 0.7, 'switched: 1 k warms a little (C)');
        const pk = (x.v('rk', 'a') - x.v('rk', 'b')) ** 2 / 1000;
        near(pk, 0.081, 0.002, 'power in 1 k (W)');
    });

    test('lab-warm-stops-blinker: blinks at room temperature, stops when the transistor is warmed', () => {
        // Q1 (surroundC, 1.5 s) biased at the edge by the trim pot (0.65).
        // At 25 C the LED blinks about 1.2 times a second (edges every
        // 0.36 .. 0.48 s); warmed to 70 C the LED stays dark (Q2's collector
        // at 7.7 V); cooled back to 25 C it blinks again.
        const x = bench('lab-warm-stops-blinker');
        const led = () => x.v('led', 'cathode');
        let ed = edgesOf(x, led, 3, 2500, 10);
        // MEASURED 2026-11-24: ed.length (25 C, 0..2.5 s) -> observed 6.
        assert.ok(ed.length >= 5, `room temperature: blinking (${ed.length} edges in 2.5 s)`);
        x.param('q1', 'surroundC', 70);
        x.run(4000);
        near(x.temp('q1'), 70, 3, 'warmed: Q1 temperature (C)');
        ed = edgesOf(x, led, 3, x.t + 2000, 10);
        assert.equal(ed.length, 0, 'warmed: no more blinking');
        near(led(), 7.7, 0.15, 'warmed: LED dark (Q2 collector, V)');
        x.param('q1', 'surroundC', 25);
        x.run(4000);
        ed = edgesOf(x, led, 3, x.t + 2500, 10);
        // MEASURED 2026-11-24: ed.length (back at 25 C) -> observed at least 4 (a steady 25 C run gives 6 edges per 2.5 s).
        assert.ok(ed.length >= 4, `cooled: blinking again (${ed.length} edges)`);
        // Ice-cold (0 C) the edge is crossed the other way: the LED stays lit.
        const y = bench('lab-warm-stops-blinker', withParams('q1', { surroundC: 0 }));
        y.run(1500);
        const ey = edgesOf(y, () => y.v('led', 'cathode'), 3, y.t + 2000, 10);
        assert.equal(ey.length, 0, 'ice: no blinking');
        near(y.v('led', 'cathode'), 0.1, 0.1, 'ice: LED steadily lit (Q2 collector, V)');
    });

    // ---- LM386 relaxation blinkers -------------------------------------------

    test('lab-amp-ic-blinker: two LEDs alternate; the smaller capacitor blinks faster', () => {
        // 10 uF: output edges at 318, 624 ms. 4.7 uF: 150, 294 ms.
        const run = (pos, until) => {
            const x = bench('lab-amp-ic-blinker', withParams('cs', { position: pos }));
            x.run(5);
            near(x.v('u', 'vout'), 8.10, 0.05, 'start: output high');
            assert.ok(amps(x, 'rs1', 1000) > 4e-3, 'start: red lit'); // MEASURED 2026-11-24: amps(rs1) -> observed 6.4e-3.
            near(amps(x, 'rs2', 1000), 0, 1e-4, 'start: green dark');
            const ed = edgesOf(x, () => x.v('u', 'vout'), 4.5, until, 2);
            return { x, ed };
        };
        const slow = run(0, 640);
        assert.equal(slow.ed.length, 2, '10 uF: two edges by 640 ms');
        near(slow.ed[0].t, 318, 6, '10 uF: first edge (ms)');
        near(slow.ed[1].t, 624, 6, '10 uF: second edge (ms)');
        assert.deepEqual(slow.ed.map(e => e.up), [false, true], '10 uF: down (green) then up (red) again');
        const fast = run(1, 310);
        assert.equal(fast.ed.length, 2, '4.7 uF: two edges by 310 ms');
        near(fast.ed[0].t, 150, 6, '4.7 uF: first edge (ms)');
        near(fast.ed[1].t, 294, 6, '4.7 uF: second edge (ms)');
    });

    test('lab-amp-ic-ticker: a speaker tick at each LED change, silence between', () => {
        // Edges at 318 and 623 ms; speaker 1 ms after them -0.76 V / +0.83 V,
        // decaying with 47 uF x 55 ohm; 0.000 V halfway between.
        const x = bench('lab-amp-ic-ticker');
        x.run(1);
        const spk = [];
        let last = x.v('u', 'vout') > 4.5;
        const ed = [];
        while (x.t < 640) {
            x.run(1);
            const now = x.v('u', 'vout') > 4.5;
            if (now !== last) ed.push(x.t);
            last = now;
            spk.push([x.t, x.v('spk', 'a')]);
        }
        assert.equal(ed.length, 2, 'two LED changes by 640 ms');
        near(ed[0], 318, 6, 'first change (ms)');
        near(ed[1], 623, 6, 'second change (ms)');
        const at = (t) => spk.find(([tt]) => tt >= t)[1];
        near(at(ed[0]), -0.76, 0.1, 'tick on the falling edge (V)');
        near(at(ed[1]), 0.83, 0.1, 'tick on the rising edge (V)');
        near(at(ed[0] + 5), -0.11, 0.06, 'tick decayed 5 ms later (V)');
        near(at((ed[0] + ed[1]) / 2), 0, 0.005, 'silent between the ticks (V)');
    });

    test('lab-amp-ic-spokes: the knob runs the ticks from 2.5 a second to a 60 Hz buzz', () => {
        // Knob 0 (47 k): half-periods of 198 ms. Knob 1 (1 k): 8 ms.
        const slow = bench('lab-amp-ic-spokes');
        slow.run(1);
        const es = edgesOf(slow, () => slow.v('u', 'vout'), 4.5, 420, 2);
        assert.equal(es.length, 2, 'knob 0: two edges by 420 ms');
        near(es[1].t - es[0].t, 198, 8, 'knob 0: half-period (ms)');
        const fast = bench('lab-amp-ic-spokes', withParams('rate', { position: 1 }));
        fast.run(1);
        const ef = edgesOf(fast, () => fast.v('u', 'vout'), 4.5, 60, 0.5);
        // MEASURED 2026-11-24: ef.length (knob 1, 0..60 ms) -> observed 7 (edges every 8 ms from 10 ms).
        assert.ok(ef.length >= 6, `knob 1: buzzing (${ef.length} edges in 60 ms)`);
        const half = (ef[ef.length - 1].t - ef[1].t) / (ef.length - 2);
        near(half, 8, 1, 'knob 1: half-period (ms)');
    });

    test('lab-amp-ic-colour-pitch: the green LED gives a lower note than the red; a larger C a much lower one', () => {
        // Measured 8..20 ms: red 878 Hz, green 795 Hz, red with 470 nF 182 Hz.
        const pitch = (sets, warm, win) => {
            const x = bench('lab-amp-ic-colour-pitch');
            for (const [k, v] of Object.entries(sets)) x.set(k, v);
            x.run(warm);
            return toneHz(x, 'spk', win).hz;
        };
        const red = pitch({}, 8, 12);
        const green = pitch({ colour: 1 }, 8, 12);
        const big = pitch({ size: 1 }, 8, 12);
        near(red, 878, 25, 'red LED (Hz)');
        near(green, 795, 25, 'green LED (Hz)');
        near(big, 182, 15, 'red LED, 470 nF (Hz)');
        assert.ok(red - green > 50, `green is lower than red (${red.toFixed(0)} vs ${green.toFixed(0)} Hz)`); // MEASURED 2026-11-24: red - green -> observed 83.
    });

    test('lab-amp-ic-light-tone: light raises the pitch; the larger capacitor lowers it', () => {
        // Measured 8..20 ms: dark 678 Hz, light 0.3 1672 Hz, light 1 1898 Hz,
        // light 0.3 with 470 nF 354 Hz.
        const pitch = (sets) => {
            const x = bench('lab-amp-ic-light-tone');
            for (const [k, v] of Object.entries(sets)) x.set(k, v);
            x.run(8);
            return toneHz(x, 'spk', 12).hz;
        };
        near(pitch({ pt: 0 }), 678, 25, 'dark (Hz)');
        near(pitch({ pt: 0.3 }), 1672, 50, 'light 0.3 (Hz)');
        near(pitch({ pt: 1 }), 1898, 60, 'full light (Hz)');
        near(pitch({ pt: 0.3, size: 1 }), 354, 20, 'light 0.3, 470 nF (Hz)');
    });

    test('lab-amp-ic-baby-monitor: the pot scales what the earphone gets; silence is silence', () => {
        // Output swing 30..40 ms: 85 dB full 0.117 V, pot 0.3 0.034 V, silent 0.
        const swing = (sets, db) => {
            const x = bench('lab-amp-ic-baby-monitor', db === undefined ? null : withParams('mic', { soundDb: db }));
            for (const [k, v] of Object.entries(sets)) x.set(k, v);
            x.run(30);
            let lo = 99; let hi = -99;
            const end = x.t + 10;
            while (x.t < end - 1e-9) { x.run(0.1); const v = x.v('u', 'vout'); lo = Math.min(lo, v); hi = Math.max(hi, v); }
            return { pp: hi - lo, mean: x.v('u', 'vout') };
        };
        const full = swing({});
        near(full.pp, 0.117, 0.015, 'full sensitivity: output swing (V)');
        const low = swing({ sens: 0.3 });
        near(low.pp, 0.034, 0.006, 'sensitivity 0.3: output swing (V)');
        near(low.pp / full.pp, 0.29, 0.04, 'the swing scales with the pot');
        const quiet = swing({}, 0);
        near(quiet.pp, 0, 0.001, 'silent: no swing (V)');
        near(quiet.mean, 4.5, 0.02, 'silent: output at half supply (V)');
    });

    test('lab-morse-power-amp: key gives a tone; weak attenuation overdrives the amplifier', () => {
        // Output range 12..16 ms after key down: strong/x20 4.31..5.13 V;
        // strong + gain resistor 3.47..5.93 V; weak/x20 0.93..8.04 V.
        const range = (att, gain) => {
            const x = bench('lab-morse-power-amp');
            x.set('att', att); x.set('gain', gain); x.set('key', 1);
            x.run(12);
            let lo = 99; let hi = -99;
            while (x.t < 16 - 1e-9) { x.run(0.05); const v = x.v('u', 'vout'); lo = Math.min(lo, v); hi = Math.max(hi, v); }
            return { lo, hi, x };
        };
        const up = bench('lab-morse-power-amp');
        up.run(6);
        near(up.v('u', 'vout'), 4.5, 0.01, 'key up: amplifier at rest (V)');
        const a = range(0, 0);
        near(a.hi - a.lo, 0.83, 0.08, 'strong, gain 20: swing (V)');
        const b = range(0, 1);
        near(b.hi - b.lo, 2.45, 0.2, 'strong, gain resistor: swing (V)');
        const c = range(1, 0);
        near(c.lo, 0.93, 0.05, 'weak: clipped at the bottom (V)');
        near(c.hi, 8.04, 0.1, 'weak: clipped at the top (V)');
        near(c.x.tone('spk').hz, 783, 15, 'tone (Hz)');
    });

    test('lab-ultrasonic-sweep: the knob sweeps 12 to 22 kHz; the tuning capacitor halves it', () => {
        // Collector frequency 0.6..1.2 ms: knob 0 11.8 kHz, 1/2 15.6 kHz,
        // 1 22.0 kHz; with the tuning capacitor 5.5 / 11.6 kHz (knob 0 / 1).
        const khz = (sets) => {
            const x = bench('lab-ultrasonic-sweep');
            for (const [k, v] of Object.entries(sets)) x.set(k, v);
            x.run(0.6);
            const up = edgesOf(x, () => x.v('q1', 'collector'), 4.5, 1.2, 0.002).filter(e => e.up).map(e => e.t);
            return (up.length - 1) / (up[up.length - 1] - up[0]);
        };
        near(khz({ pitch: 0 }), 11.8, 0.6, 'knob 0 (kHz)');
        near(khz({ pitch: 0.5 }), 15.6, 0.8, 'knob 1/2 (kHz)');
        near(khz({ pitch: 1 }), 22.0, 1.0, 'knob full (kHz)');
        near(khz({ pitch: 0, tune: 1 }), 5.5, 0.4, 'knob 0, tuning C in (kHz)');
        near(khz({ pitch: 1, tune: 1 }), 11.6, 0.6, 'knob full, tuning C in (kHz)');
    });

    test('lab-amp-ic-coin-toss: held it flickers, released it keeps whichever state it was in', () => {
        const red = (x) => amps(x, 'rs1', 1000);
        const rest = bench('lab-amp-ic-coin-toss');
        rest.run(5);
        near(rest.v('u', 'vout'), 0.90, 0.03, 'rest: output low');
        assert.ok(rest.v('green', 'anode') > 1.5, 'rest: green lit'); // MEASURED 2026-11-24: green anode -> observed 2.02 V.
        const toss = (releaseMs) => {
            const x = bench('lab-amp-ic-coin-toss');
            x.run(5);
            x.set('btn', 1);
            const ed = edgesOf(x, () => x.v('u', 'vout'), 4.5, releaseMs, 0.5);
            x.set('btn', 0);
            const atRelease = x.v('u', 'vout');
            x.run(50);
            return { ed, atRelease, x };
        };
        const tails = toss(43);
        // MEASURED 2026-11-24: edges while held (5..43 ms) -> observed 12 (5.5, 11, 13.5, 17, 19.5 ... ms).
        assert.ok(tails.ed.length >= 10, `held: flickering (${tails.ed.length} edges)`);
        near(tails.ed[0].t, 5.5, 0.6, 'the press itself flips it (ms)');
        near(tails.ed[1].t, 11, 1, 'then it oscillates (ms)');
        near(tails.x.v('u', 'vout'), 0.90, 0.03, 'released low: stays low');
        assert.ok(tails.x.v('green', 'anode') > 1.5, 'released low: green'); // MEASURED 2026-11-24: green anode -> observed 2.02 V.
        const heads = toss(45);
        near(heads.atRelease, 8.10, 0.05, 'released high');
        near(heads.x.v('u', 'vout'), 8.10, 0.03, 'released high: stays high');
        near(red(heads.x) * 1e3, 6.39, 0.3, 'released high: red (mA)');
        assert.ok(heads.x.v('green', 'anode') < 0.3, 'released high: green shorted by the transistor'); // MEASURED 2026-11-24: green anode -> observed below 0.1 V.
    });

    // ---- a slow transistor pair modulating or gating the LM386 tone -------

    /** Tone rising edges labelled with the astable phase (`phaseHigh()`), over `ms`. */
    function phasedTone (x, phaseHigh, ms) {
        const rows = [];
        let lastV = x.v('u', 'vout') > 4.5;
        let lastUp = null;
        while (x.t < ms - 1e-9) {
            x.run(0.02);
            const v = x.v('u', 'vout') > 4.5;
            if (v && !lastV) { if (lastUp !== null) rows.push({ t: x.t, hz: 1000 / (x.t - lastUp), high: phaseHigh() }); lastUp = x.t; }
            lastV = v;
        }
        return rows;
    }

    test('lab-amp-ic-siren: the tone jumps an octave with the blinker', () => {
        // Astable capacitors scaled 22 uF -> 470 nF (phases of about 11 ms).
        // Measured: 943..962 Hz while Q2 is on, 1852..1923 Hz while it is off.
        const x = bench('lab-amp-ic-siren', edits(withParams('c1', { farads: 470e-9 }), withParams('c2', { farads: 470e-9 })));
        const rows = phasedTone(x, () => x.v('q2', 'collector') > 4.5, 34);
        const settled = rows.filter((r, i) => i > 0 && rows[i - 1].high === r.high && (i < 2 || rows[i - 2].high === r.high));
        const lo = settled.filter(r => !r.high).map(r => r.hz);
        const hi = settled.filter(r => r.high).map(r => r.hz);
        // MEASURED 2026-11-24: lo.length -> observed 13, hi.length -> observed 15 (0..34 ms).
        assert.ok(lo.length >= 6 && hi.length >= 6, `both phases seen (${lo.length} / ${hi.length})`);
        for (const f of lo) near(f, 950, 25, 'Q2 on: low tone (Hz)');
        for (const f of hi) near(f, 1900, 60, 'Q2 off: high tone (Hz)');
    });

    test('lab-amp-ic-beeps: the tone runs only while Q1 is off', () => {
        // Astable capacitors scaled 10 uF -> 220 nF (phases of about 6.4 ms).
        // Measured: 685..694 Hz in the Q1-off phases, no edge in the others.
        const x = bench('lab-amp-ic-beeps', edits(withParams('c1', { farads: 220e-9 }), withParams('c2', { farads: 220e-9 })));
        const onPhase = () => x.v('q1', 'collector') > 2;
        const rows = phasedTone(x, onPhase, 40);
        const inBeep = rows.filter((r, i) => i > 0 && r.t - rows[i - 1].t < 2);
        // MEASURED 2026-11-24: inBeep.length (0..40 ms) -> observed 7.
        assert.ok(inBeep.length >= 5, `beeps sounded (${inBeep.length} periods)`);
        for (const r of inBeep) { assert.ok(r.high, `tone edge at ${r.t.toFixed(2)} ms falls in a Q1-off phase`); near(r.hz, 690, 15, 'beep pitch (Hz)'); }
        // In a Q1-on phase the timing capacitor is clamped near 0.7 V and the output sits high.
        const y = bench('lab-amp-ic-beeps', edits(withParams('c1', { farads: 220e-9 }), withParams('c2', { farads: 220e-9 })));
        while (!(y.v('q1', 'collector') < 0.5 && y.t > 14)) y.run(0.1);
        y.run(1);
        near(y.v('u', 'inn'), 0.75, 0.15, 'pause: timing capacitor clamped (V)');
        near(y.v('u', 'vout'), 8.1, 0.05, 'pause: output parked high (V)');
    });

    test('lab-amp-ic-chirp: each rising edge of the slow astable gives one falling chirp, silence between', () => {
        // Measured on the authored bench: Q2's collector rises at 3 ms
        // (switch-on) and again at 303.9 ms. Each rise gives a burst: from
        // about 1.2 kHz up to 2.5 kHz (first) / 3.3 kHz (second) while the
        // kick builds, then gliding down to about 1.1 kHz until the gate
        // closes, 79 ms / 394 ms; no tone edge between the bursts. Test run:
        // 2383 Hz over 15..25 ms, 1154 Hz over 65..79 ms, tone again 0.6 ms
        // after the second rise.
        const x = bench('lab-amp-ic-chirp');
        const up = [];
        let lastV = x.v('u', 'vout') > 4.5;
        let rise = null;
        let lastQ = x.v('q2', 'collector') > 4.5;
        while (x.t < 330 - 1e-9) {
            x.run(0.05);
            const v = x.v('u', 'vout') > 4.5;
            if (v && !lastV) up.push(x.t);
            lastV = v;
            const q = x.v('q2', 'collector') > 4.5;
            if (q && !lastQ && x.t > 100) rise = x.t;
            lastQ = q;
        }
        const hzAt = (from, to) => {
            const e = up.filter(t => t >= from && t <= to);
            return (e.length - 1) / (e[e.length - 1] - e[0]) * 1000;
        };
        const first = up.filter(t => t < 150);
        near(first[first.length - 1], 79, 6, 'first chirp ends (ms)');
        near(hzAt(15, 25), 2350, 250, 'first chirp near its top (Hz)');
        near(hzAt(65, 79), 1150, 120, 'first chirp at its end (Hz)');
        assert.deepEqual(up.filter(t => t > 90 && t < 300), [], 'silent between the chirps'); // MEASURED 2026-11-24: last edge of chirp 1 -> observed 79.2 ms, first of chirp 2 -> observed 304.5 ms.
        near(rise, 303.9, 3, 'the astable kicks again (ms)');
        const second = up.filter(t => t > 300);
        // MEASURED 2026-11-24: second.length (300..330 ms) -> observed 68.
        assert.ok(second.length > 40, `second chirp sounding (${second.length} edges)`);
        near(second[0] - rise, 0.6, 1.5, 'the chirp starts with the kick (ms)');
        assert.ok(hzAt(315, 330) > 2500, `second chirp high (${hzAt(315, 330).toFixed(0)} Hz)`); // MEASURED 2026-11-24: hzAt(315, 330) -> observed 2828.
    });
});
