/**
 * The round-6 "x4" lab benches from `scripts/gen-lab-circuits-4.mjs --set=r6d`
 * do what their EXPECTED.md says: measured on the COMMITTED circuit.json, with
 * the stimuli a learner would set (buttons, slide switches, pots, the light
 * slider on a phototransistor, the Temperature slider of a transistor in its
 * own surroundings, a light path's knob).
 *
 * Readouts come from the engine's own surfaces: node voltages, device state
 * (meters, lamps), buzzerTone() and board.partTemperature(). The oscillating
 * benches cost real time per simulated millisecond, so every scenario keeps
 * to the shortest window that shows the behaviour. Every number below was
 * measured on the headless engine (bw-board f4aaec43) when the bench was
 * built; the tolerances are bands around those measurements.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r6d.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (round 6, set x4)');
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

/** Set params of named parts before loading: withParams(['q', 'surroundC', 70], …). */
const withParams = (...edits) => (json, ids) => {
    for (const [name, key, value] of edits) json.parts.find(p => p.id === ids[name]).params[key] = value;
};

const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);

/** Sample fn() every dt ms for total ms: [[tMs, value], …]. */
function sample (x, total, dt, fn) {
    const out = [];
    const end = x.t + total;
    while (x.t < end - 1e-9) { x.run(dt); out.push([x.t, fn()]); }
    return out;
}

/** Rising crossings of `level`: frequency (Hz, from first to last), duty (share of samples above). */
function freqDuty (s, level) {
    const up = [];
    for (let i = 1; i < s.length; i++) if (s[i - 1][1] < level && s[i][1] >= level) up.push(s[i][0]);
    const hi = s.filter(([, v]) => v >= level).length;
    const hz = up.length > 1 ? (up.length - 1) / ((up[up.length - 1] - up[0]) / 1000) : 0;
    return { hz, duty: hi / s.length, edges: up.length };
}

describe('lab round-6 x4 benches behave as documented', { skip: SKIP }, () => {
    test('lab-crossing-latch: ARRIVE latches the flasher on, LEAVE latches it off', () => {
        const x = bench('lab-crossing-latch');
        x.run(300);
        // Power-on: the 100 nF start capacitor puts the latch high, flasher dark.
        near(x.v('u', '1_out'), 7.50, 0.05, 'clear: comparator output (V)');
        near(x.v('u', '1_pos'), 6.04, 0.05, 'clear: + input held above 4.5 V by the output (V)');
        // MEASURED 2026-11-25: fl < 0.2 -> observed 0.093.
        assert.ok(x.v('qp', 'collector') < 0.2, 'clear: no supply for the flasher');
        x.set('arrive', 1); x.run(20); x.set('arrive', 0); x.run(20);
        near(x.v('u', '1_out'), 0.04, 0.05, 'occupied: comparator output (V)');
        near(x.v('u', '1_pos'), 2.17, 0.05, 'occupied: + input held below 4.5 V by the output (V)');
        near(x.v('qp', 'collector'), 8.91, 0.05, 'occupied: flasher supply (V)');
        // The two lamps take turns: count changes of Q1's state over 1.2 s.
        const s = sample(x, 1200, 20, () => [x.v('q1', 'collector'), x.v('q2', 'collector')]);
        let flips = 0; let both = 0;
        for (let i = 1; i < s.length; i++) if ((s[i][1][0] < 2) !== (s[i - 1][1][0] < 2)) flips++;
        for (const [, [a, b]] of s) if (a < 2 && b < 2) both++;
        // MEASURED 2026-11-25: flips >= 3 -> observed 4 (1.66 Hz flasher).
        assert.ok(flips >= 3, `occupied: the lamps alternate (${flips} changes in 1.2 s)`);
        // Both lamps lit only while the astable switches over: a few of the
        // 60 samples.
        // MEASURED 2026-11-25: both <= 6 -> observed 3.
        assert.ok(both <= 6, `occupied: never both lit for long (${both} samples)`);
        x.set('leave', 1); x.run(20); x.set('leave', 0); x.run(300);
        near(x.v('u', '1_out'), 7.50, 0.05, 'left: comparator output (V)');
        // MEASURED 2026-11-25: fl < 0.2 -> observed 0.024.
        assert.ok(x.v('qp', 'collector') < 0.2, 'left: flasher dark again');
    });

    test('lab-fusion-divider: the transistor divider halves the op-amp clock at 50 % duty', () => {
        const x = bench('lab-fusion-divider');
        x.run(15);
        const s = sample(x, 40, 0.02, () => [x.v('u', '1_out'), x.v('q1', 'collector')]);
        const clock = freqDuty(s.map(([t, [a]]) => [t, a]), 4);
        const ff = freqDuty(s.map(([t, [, b]]) => [t, b]), 2);
        near(clock.hz, 108, 4, 'op-amp clock at RATE 0.5 (Hz)');
        near(ff.hz, clock.hz / 2, 2, 'divider output: half the clock (Hz)');
        near(ff.duty, 0.50, 0.04, 'divider output duty');
    });

    test('lab-opamp-monoflop: with the diode one press gives one timed pulse; without it, it blinks', () => {
        const x = bench('lab-opamp-monoflop');
        x.run(1);
        near(x.v('u', '1_out'), 0.37, 0.1, 'switch-on: output starts low (one pulse) (V)');
        x.run(2500);
        near(x.v('u', '1_out'), 7.24, 0.05, 'waiting: output high (V)');
        near(x.v('u', '1_neg'), 4.95, 0.03, 'waiting: the diode holds the capacitor about 0.45 V above the middle (V)');
        x.set('start', 1); x.run(5); x.set('start', 0);
        const t0 = x.t - 5;
        near(x.v('u', '1_out'), 0.37, 0.1, 'START: output low (V)');
        let back = null;
        while (x.t < t0 + 1000) { x.run(10); if (x.v('u', '1_out') > 4) { back = x.t - t0; break; } }
        assert.ok(back !== null, 'the pulse ends by itself');
        near(back, 380, 30, 'pulse length (ms)');
        x.run(300);
        near(x.v('u', '1_out'), 7.24, 0.05, 'and it waits again (V)');
        const y = bench('lab-opamp-monoflop', withParams(['sw', 'position', 0]));
        y.run(1);
        const s = sample(y, 3000, 10, () => y.v('u', '1_out'));
        near(freqDuty(s, 4).hz, 0.95, 0.1, 'no diode: astable blink rate (Hz)');
    });

    test('lab-potato-x10: the amplifier shows ten times what the potato gives', () => {
        const x = bench('lab-potato-x10');
        x.run(1);
        near(x.state('meter').reading, 5.05, 0.02, 'through the amplifier: meter (V)');
        near(x.v('cell', 'pos'), 0.500, 0.001, 'the + input draws nothing from the potato (V)');
        x.set('sw', 0); x.run(5);
        near(x.state('meter').reading, 0.476, 0.003, 'meter straight on the potato (V)');
        // A zinc nail (0.85 V) would need 8.6 V: the LM358 on 9 V stops short.
        const z = bench('lab-potato-x10', withParams(['cell', 'volts', 0.85]));
        z.run(1);
        near(z.v('u', '1_out'), 7.49, 0.03, 'zinc nail: output at its ceiling (V)');
    });

    test('lab-opamp-add-subtract: sum and difference of an LED and a diode voltage', () => {
        const x = bench('lab-opamp-add-subtract');
        x.run(1);
        const led = x.v('sw', 'com'); const d = x.v('d', 'anode');
        near(led, 1.592, 0.01, 'red LED (V)');
        near(d, 0.580, 0.01, 'diode (V)');
        near(x.v('u', '1_out'), led + d, 0.003, 'adder = LED + diode (V)');
        near(x.v('u', '2_out'), led - d, 0.003, 'subtractor = LED - diode (V)');
        near(x.state('msum').reading, 2.173, 0.01, 'sum meter (V)');
        near(x.state('mdiff').reading, 1.012, 0.01, 'difference meter (V)');
        x.set('sw', 1); x.run(5);
        const g = x.v('sw', 'com'); const d2 = x.v('d', 'anode');
        near(g, 1.888, 0.01, 'green LED (V)');
        near(x.v('u', '1_out'), g + d2, 0.003, 'green: adder (V)');
        near(x.v('u', '2_out'), g - d2, 0.003, 'green: subtractor (V)');
    });

    test('lab-tone-mux: the select line puts one tone or the other on the line', () => {
        const x = bench('lab-tone-mux', withParams(['sel', 'position', 1]));
        x.run(10);
        near(x.v('sel', 'com'), 5.0, 0.01, 'S held high (V)');
        let s = sample(x, 30, 0.02, () => x.v('u2', '3y'));
        near(freqDuty(s, 2.5).hz, 568, 10, 'S high: the low tone on the line (Hz)');
        x.set('key', 1); x.run(5);
        s = sample(x, 30, 0.02, () => x.v('u2', '3y'));
        near(freqDuty(s, 2.5).hz, 1247, 20, 'KEY pressed: the high tone on the line (Hz)');
        const y = bench('lab-tone-mux');
        y.run(1);
        const sel = sample(y, 400, 0.1, () => y.v('sel', 'com'));
        let changes = 0;
        for (let i = 1; i < sel.length; i++) if ((sel[i][1] > 2.5) !== (sel[i - 1][1] > 2.5)) changes++;
        // MEASURED 2026-11-25: changes >= 3 -> observed 3 in 400 ms (at 176, 272 and 351 ms).
        assert.ok(changes >= 3, `slow oscillator flips S by itself (${changes} changes)`);
    });

    test('lab-gate-pump: a gate oscillator pumps the output to about 8.65 V from 5 V', () => {
        const x = bench('lab-gate-pump');
        x.run(1);
        near(x.v('vm', 'a'), 3.83, 0.1, '1 ms: reservoir filled through the diodes only (V)');
        x.run(99);
        near(x.v('vm', 'a'), 8.65, 0.03, '100 ms: pumped output (V)');
        const s = sample(x, 10, 0.02, () => x.v('u', '2y'));
        near(freqDuty(s, 2.5).hz, 1247, 25, 'pump clock (Hz)');
        const lo = Math.min(...s.map(([, v]) => v)); const hi = Math.max(...s.map(([, v]) => v));
        near(hi - lo, 4.89, 0.05, 'buffer swing that lifts the pump capacitor (V)');
    });

    test('lab-heat-watchdog: warming the sensor alone sounds the alarm; warming both does not', () => {
        const at = (tr, ts) => {
            const x = bench('lab-heat-watchdog', withParams(['qr', 'surroundC', tr], ['qs', 'surroundC', ts]));
            x.run(20);
            return x;
        };
        let x = at(25, 25);
        near(x.v('qs', 'collector'), 2.977, 0.03, 'both 25 °C: sensor collector (V)');
        near(x.v('u', '1y'), 0, 0.05, 'both 25 °C: no alarm');
        x = at(25, 28);
        near(x.v('qs', 'collector'), 2.455, 0.03, 'sensor 3 K warmer: collector (V)');
        near(x.v('u', '1y'), 0, 0.05, 'sensor 3 K warmer: still no alarm');
        x = at(25, 33);
        near(x.v('qs', 'collector'), 1.275, 0.03, 'sensor at 33 °C: collector (V)');
        near(x.v('u', '1y'), 4.68, 0.05, 'sensor at 33 °C: alarm (V)');
        const s = sample(x, 20, 0.05, () => x.v('u', '2y'));
        near(freqDuty(s, 2.5).hz, 567, 15, 'alarm tone (Hz)');
        for (const t of [33, 70, 0]) {
            x = at(t, t);
            // MEASURED 2026-11-25: collector > 2.9 -> observed 2.970 (33), 2.936 (70), 3.000 (0).
            assert.ok(x.v('qs', 'collector') > 2.9, `both at ${t} °C: the mirror cancels the drift`);
            near(x.v('u', '1y'), 0, 0.05, `both at ${t} °C: no alarm`);
        }
        // Live: the sensor's slider to 33 °C; it warms with its 1 s time constant.
        const y = at(25, 25);
        y.param('qs', 'surroundC', 33);
        let on = null;
        while (y.t < 3000) { y.run(50); if (y.v('u', '1y') > 2.5) { on = y.t - 20; break; } }
        assert.ok(on !== null, 'the alarm comes on');
        near(y.temp('qs'), 31.2, 0.5, 'alarm point (°C)');
        near(on, 1460, 120, 'after (ms)');
    });

    test('lab-scr-flash: a flash fires the thyristor; the room light changing slowly does not', () => {
        const x = bench('lab-scr-flash');
        x.run(5);
        for (let i = 1; i <= 30; i++) { x.set('pt', i * 0.02); x.run(20); }
        near(x.v('pt', 'emitter'), 3.0, 0.02, 'room light 0.6 on the phototransistor (V at its emitter)');
        near(x.v('qp', 'emitter'), 6.27, 0.05, 'slow room light: still off (anode V)');
        for (const [a, b, fires] of [[0, 0.6, false], [0, 1, true], [0.2, 1, true], [0.5, 1, false]]) {
            const z = bench('lab-scr-flash');
            z.run(5);
            if (a) { z.set('pt', a); z.run(30); }
            z.set('pt', b); z.run(1); z.set('pt', a); z.run(10);
            near(z.v('qp', 'emitter'), fires ? 0.78 : 6.27, 0.05, `light ${a} -> ${b} -> ${a}: anode (V)`);
        }
        const y = bench('lab-scr-flash');
        y.run(5); y.set('pt', 1); y.run(1); y.set('pt', 0); y.run(10);
        near((9 - y.v('fl', 'anode')) / 470 * 1000, 11.1, 0.3, 'fired: lamp current (mA)');
        y.set('main', 0); y.run(5); y.set('main', 1); y.run(10);
        near(y.v('qp', 'emitter'), 6.27, 0.05, 'main switch off and on: reset (anode V)');
    });

    test('lab-scr-dimmer: the DIMMER pot moves the firing point along the half-wave', () => {
        const rows = [];
        for (const pos of [1, 0.75, 0.5, 0.25]) {
            const x = bench('lab-scr-dimmer', withParams(['dim', 'position', pos]));
            x.run(40);
            let fire = null; let p = 0; let n = 0;
            for (let i = 0; i < 400; i++) {
                x.run(0.05);
                const ph = ((x.t % 20) / 20) * 360;
                const vl = x.v('lamp', 'a') - x.v('lamp', 'b');
                p += vl * vl / 120; n++;
                if (fire === null && ph < 180 && vl > 1) fire = ph;
            }
            rows.push({ pos, fire, mW: p / n * 1000 });
        }
        near(rows[0].fire, 16, 4, 'DIMMER full: fires early (°)');
        near(rows[1].fire, 55, 5, 'DIMMER 0.75 (°)');
        near(rows[2].fire, 83, 5, 'DIMMER 0.5 (°)');
        assert.equal(rows[3].fire, null, 'DIMMER 0.25: never fires, lamp dark');
        near(rows[0].mW, 196, 8, 'full: lamp power (mW)');
        near(rows[2].mW, 116, 8, 'half: lamp power (mW)');
        near(rows[3].mW, 0, 0.5, 'quarter: lamp power (mW)');
    });

    test('lab-amp-classes: class A conducts all the time, class C only on the peaks', () => {
        const frac = (lvl) => {
            const x = bench('lab-amp-classes', withParams(['lvl', 'position', lvl]));
            x.run(80);
            let a = 0; let c = 0; let n = 0;
            for (let i = 0; i < 400; i++) {
                x.run(0.005); n++;
                if (x.v('qa', 'emitter') / 1000 > 1e-5) a++;
                if ((9 - x.v('rcc', 'b')) / 1000 > 1e-5) c++;
            }
            return { a: a / n, c: c / n };
        };
        let r = frac(1);
        near(r.a, 1, 0, 'full level: class A conducts the whole cycle');
        near(r.c, 0.335, 0.03, 'full level: class C conducts a third of it');
        r = frac(0.6);
        near(r.a, 1, 0, 'level 0.6: class A still the whole cycle');
        near(r.c, 0.15, 0.04, 'level 0.6: class C less');
        r = frac(0.4);
        near(r.c, 0, 0, 'level 0.4: class C never reaches its threshold');
    });

    test('lab-common-base: CE inverts with gain, CC follows, CB gains without inverting', () => {
        const x = bench('lab-common-base');
        x.run(300);
        const rows = [];
        for (let i = 0; i < 400; i++) { x.run(0.005); rows.push([x.v('fg', 'out'), x.v('qe', 'collector'), x.v('qc', 'emitter'), x.v('qb', 'collector')]); }
        const mean = (k) => rows.reduce((a, r) => a + r[k], 0) / rows.length;
        const gain = (k) => {
            const m = mean(k); const m0 = mean(0);
            let cov = 0; let v0 = 0;
            for (const r of rows) { cov += (r[k] - m) * (r[0] - m0); v0 += (r[0] - m0) ** 2; }
            return cov / v0;
        };
        near(gain(1), -4.62, 0.1, 'common emitter: gain');
        near(gain(2), 0.998, 0.01, 'common collector: gain');
        near(gain(3), 4.62, 0.1, 'common base: gain');
    });

    test('lab-transistor-v-to-f: the pulse rate follows how far the input sits below 4.5 V', () => {
        const run = (pos) => {
            const x = bench('lab-transistor-v-to-f', withParams(['inp', 'position', pos]));
            x.run(30);
            const s = sample(x, 60, 0.02, () => x.v('u', '1_out'));
            const lo = Math.min(...s.map(([, v]) => v)); const hi = Math.max(...s.map(([, v]) => v));
            return { w: x.v('inp', 'wiper'), lo, hi, hz: freqDuty(s, (lo + hi) / 2).hz };
        };
        const r = run(0.5);
        near(r.lo, 5.05, 0.05, 'ramp bottom: the Schmitt lower threshold (V)');
        near(r.hi, 6.42, 0.05, 'ramp top: the Schmitt upper threshold (V)');
        near(r.hz, 72.4, 2, 'INPUT 0.5: rate (Hz)');
        const f = run(0.25);
        near(f.hz, 109.1, 3, 'INPUT 0.25: rate (Hz)');
        // Proportional: Hz per volt below the reference is the same.
        near(f.hz / (4.5 - f.w), r.hz / (4.5 - r.w), 1, 'Hz per volt below 4.5 V');
    });

    test('lab-mirror-thermometer: the meter reads the sensor temperature against the room', () => {
        const at = (T) => {
            const x = bench('lab-mirror-thermometer', withParams(['qs', 'surroundC', T]));
            x.run(2000);
            return x.state('meter').reading;
        };
        near(at(25), 0, 0.06, 'room: meter at zero (V)');
        const hot = at(70);
        near(hot, 4.16, 0.1, '70 °C: meter (V)');
        near(at(0), -2.3, 0.15, '0 °C: needle below zero (V)');
        // Live: the slider to 70 °C, the 1 s time constant.
        const x = bench('lab-mirror-thermometer');
        x.run(1000);
        x.param('qs', 'surroundC', 70);
        x.run(1000);
        near(x.temp('qs'), 53.8, 1, 'one time constant later (°C)');
        x.run(3000);
        near(x.state('meter').reading, hot, 0.1, 'settled (V)');
    });

    test('lab-light-volume-am: the flashing IR LED swells and fades the tone', () => {
        // The modulator is high for the first ~33 ms (IR LED on: the
        // phototransistor bridges the gain pins, high gain) and low from
        // ~34 ms to ~46 ms (LED off: gain 20).
        const x = bench('lab-light-volume-am');
        x.run(25);
        const win = () => sample(x, 5, 0.02, () => [x.v('spk', 'a'), x.v('q', 'collector'), x.v('u', '1_out')]);
        const pp = (s, k) => { const v = s.map(([, r]) => r[k]); return Math.max(...v) - Math.min(...v); };
        let s = win();
        near(s[0][1][2], 6.87, 0.05, 'modulator high: IR LED on (V)');
        near(pp(s, 1), 8.64, 0.15, 'phase-shift oscillator swing (V peak to peak)');
        const osc = s.map(([t, r]) => [t, r[1]]);
        const mid = (Math.max(...osc.map(([, v]) => v)) + Math.min(...osc.map(([, v]) => v))) / 2;
        near(freqDuty(osc, mid).hz, 1099, 30, 'phase-shift oscillator (Hz)');
        const loud = pp(s, 0);
        near(loud, 2.78, 0.15, 'LED on: speaker (V peak to peak)');
        x.run(37 - x.t);
        s = win();
        near(s[0][1][2], 0.01, 0.05, 'modulator low: IR LED off (V)');
        const soft = pp(s, 0);
        near(soft, 0.37, 0.05, 'LED off: speaker (V peak to peak)');
        // MEASURED 2026-11-25: loud / soft > 5 -> observed 7.6.
        assert.ok(loud / soft > 5, `light sets the volume (${(loud / soft).toFixed(2)} : 1)`);
    });

    test('lab-xor-reflect: only the LED\'s own reflected light counts as an object', () => {
        // Advanced in 1 ms steps; the averaged XOR (node N, after 47 k /
        // 220 nF) and the bounded comparator are read at the end of each
        // 60 ms phase.
        const x = bench('lab-xor-reflect');
        const to = (ms) => { while (x.t < ms - 1e-9) x.run(1); };
        to(60);
        near(x.v('ri', 'b'), 0.59, 0.05, 'surface at 2 cm: averaged XOR (V)');
        near(x.v('u', '1_out'), 2.52, 0.05, 'surface at 2 cm: comparator high, green LED lit (V)');
        x.set('surface', 1); to(120);
        near(x.v('ri', 'b'), 1.65, 0.05, 'surface 20 cm away: averaged XOR (V)');
        near(x.v('u', '1_out'), 0.79, 0.05, 'surface 20 cm away: comparator low, green LED dark (V)');
        x.set('pt', 0.5); to(180);
        near(x.v('ri', 'b'), 2.01, 0.05, 'no surface, lamp at 0.5: averaged XOR (V)');
        near(x.v('u', '1_out'), 0.76, 0.05, 'no surface, lamp at 0.5: still no object (V)');
        // The plain received signal is fooled: the yellow LED stays lit.
        let lit = 0;
        for (let i = 0; i < 10; i++) { x.run(0.13); if (x.v('u1', '2y') > 4) lit++; }
        assert.equal(lit, 10, 'lamp: the yellow "light seen" LED is on all the time');
        x.set('surface', 0.0526); to(240);
        near(x.v('u', '1_out'), 0.77, 0.05, 'surface at 2 cm but the lamp on: the lamp blinds it (V)');
        x.set('pt', 0); to(300);
        near(x.v('u', '1_out'), 2.52, 0.05, 'lamp off, surface at 2 cm: object again (V)');
    });

    test('lab-bird-chirps: tone bursts at the chirp rate, in phrases, silent in the pauses', () => {
        const x = bench('lab-bird-chirps');
        x.run(1);
        const rows = sample(x, 240, 0.02, () => [x.v('ug', '4y'), x.v('ug', '2y'), x.v('ug', '1y'), x.v('u', '1_out')]);
        const rising = (k) => {
            const e = [];
            for (let i = 1; i < rows.length; i++) if (rows[i - 1][1][k] < 2.5 && rows[i][1][k] >= 2.5) e.push(i);
            return e;
        };
        const voice = rising(2);
        const per = [];
        for (let i = 1; i < voice.length; i++) per.push(rows[voice[i]][0] - rows[voice[i - 1]][0]);
        const short = per.filter(p => p < 1.5);
        near(1000 * short.length / short.reduce((a, b) => a + b, 0), 2615, 60, 'voice (Hz)');
        // Bursts of voice: runs of edges separated by more than 1.5 ms. Two
        // chirps in each of the two phrases inside 240 ms.
        // MEASURED 2026-11-25: voice periods 0.38 ms; gaps >= 1.5 -> observed 17.4, 59.1, 17.5 ms.
        assert.equal(per.filter(p => p >= 1.5).length + 1, 4, 'two chirps per phrase, two phrases');
        const tri = rows.map(([, r]) => r[3]);
        near(Math.min(...tri), 1.775, 0.02, 'op-amp triangle bottom: the gate\'s lower switching level (V)');
        near(Math.max(...tri), 2.750, 0.02, 'op-amp triangle top: the upper switching level (V)');
        const phrase = rising(0).map(i => rows[i][0]);
        near(phrase[1] - phrase[0], 117, 5, 'phrase period (ms)');
        let inPause = 0;
        for (const i of voice) if (rows[i][1][0] < 2.5) inPause++;
        assert.equal(inPause, 0, 'the voice never sounds in a pause');
    });
});
