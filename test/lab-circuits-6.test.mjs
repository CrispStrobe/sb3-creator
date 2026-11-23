/**
 * The lab-* benches from `scripts/gen-lab-circuits-4.mjs --set=6` do what their
 * EXPECTED.md says: measured on the COMMITTED circuit.json, over time, with
 * the buttons, switches and world conditions a learner would change.
 *
 * assert-physics reads one instant (1 ms after power-on). Everything these
 * benches are about happens later: an induced pulse, an oscillator's
 * frequency, a speed that holds under load, a sensor cooled by moving air.
 * Every number below was measured on the headless engine when the bench was
 * built; the tolerances are bands around those measurements.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-6.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set 6)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

/** Load a committed bench and name its parts by role. */
function bench (id) {
    const c = Circuit.fromJSON(JSON.parse(readFileSync(join(EXAMPLES, id, 'circuit.json'), 'utf8')));
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
        /** Node voltage at a named terminal. */
        v (name, term) { return b.nodeVoltages.get(netOf(name, term)) ?? 0; },
        /** Current through a named terminal, in mA, sign dropped. */
        mA (name, term = 'a') { return Math.abs(b.branchCurrent(ids[name], term)) * 1e3; },
        state (name) { return b.getDeviceState(ids[name]); },
        run (ms) {
            tMs += ms;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
        },
        /** Run `ms` in steps of `step`, calling fn after each. */
        each (ms, step, fn) { const end = tMs + ms; while (tMs < end - 1e-9) { api.run(step); fn(tMs); } },
        set (name, value) { b.setControl(ids[name], value); },
        param (name, key, value) { c.setPartParam(ids[name], key, value); },
        get t () { return tMs; },
    };
    return api;
}

/** Rising crossings of `thr` in a [[t, v], …] trace. */
const rises = (tr, thr) => tr.flatMap((s, i) => (i && tr[i - 1][1] < thr && s[1] >= thr ? [s[0]] : []));
/** Frequency in Hz from the rising crossings of a trace. */
const hz = (tr, thr) => { const r = rises(tr, thr); return r.length > 2 ? (r.length - 1) / (r.at(-1) - r[0]) * 1000 : 0; };
const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);

describe('lab benches (set 6) behave as documented', { skip: SKIP }, () => {
    test('lab-coil-pulse: windings conduct, are isolated, and pass on only a change', () => {
        const x = bench('lab-coil-pulse');
        x.run(700);
        // MEASURED 2026-11-23 (bw-board e339fcb): x.v('cp', 'pos') > 8.9 -> observed 8.992.
        assert.ok(x.v('cp', 'pos') > 8.9, `pulse capacitor charged: ${x.v('cp', 'pos')} V`);
        // MEASURED 2026-11-23 (bw-board e339fcb): x.mA('rl') < 0.01 -> observed 0.
        assert.ok(x.mA('rl') < 0.01, 'no pulse yet: flash LED dark');
        near(x.mA('rt'), 6.93, 0.2, 'tester LED through winding A');
        x.set('sw', 1); x.run(5);
        // MEASURED 2026-11-23 (bw-board e339fcb): x.mA('rt') < 0.01 -> observed 7.02e-4.
        assert.ok(x.mA('rt') < 0.01, `tester from A to B: ${x.mA('rt')} mA`);
        // Re-measured on bw-board 0bc7baf: the dark LED in series with the
        // meter now follows the exponential junction law at the meter's
        // sub-uA current and drops less (7.02 -> 7.47 V across the gap).
        near(x.state('vm').reading, 7.47, 0.1, 'the voltmeter across the A-B gap');
        x.set('sw', 0); x.run(5);

        x.set('dump', 1);
        let s1 = 0, flash = 0;
        x.each(20, 0.05, () => { s1 = Math.max(s1, x.v('t1', 's1')); flash = Math.max(flash, x.mA('rl')); });
        near(s1, 17.9, 1, 'induced peak on winding B');
        near(flash, 14.8, 1, 'flash current');
        x.run(980);
        near(x.mA('rl'), 6.0, 0.6, 'one second later the flash is fading');
        x.run(1000);
        near(x.mA('rl'), 2.2, 0.5, 'two seconds later it is nearly out');
        // MEASURED 2026-11-23 (bw-board e339fcb): x.v('cp', 'pos') < 0.1 -> observed 0.01977.
        assert.ok(x.v('cp', 'pos') < 0.1, 'held button: the capacitor stays empty, steady current induces nothing');
        x.set('dump', 0); x.run(1000);
        // MEASURED 2026-11-23 (bw-board e339fcb): x.v('cp', 'pos') > 8.9 -> observed 9.
        assert.ok(x.v('cp', 'pos') > 8.9, 'released: recharged');
        x.set('dump', 1); flash = 0;
        x.each(20, 0.05, () => { flash = Math.max(flash, x.mA('rl')); });
        // MEASURED 2026-11-23 (bw-board e339fcb): flash > 12 -> observed 14.83.
        assert.ok(flash > 12, `a second dump flashes again: ${flash} mA`);
    });

    test('lab-meissner-am: a 10.7 kHz carrier whose envelope follows the 500 Hz audio', () => {
        const x = bench('lab-meissner-am');
        const tr = [];
        x.each(7, 0.01, (t) => tr.push([t, x.v('q1', 'collector'), x.v('q2', 'collector')]));
        const late = tr.filter(s => s[0] > 2);
        const c1 = late.map(s => [s[0], s[1]]);
        near(hz(c1, 9), 10660, 300, 'carrier frequency');
        const sw = Math.max(...c1.map(s => s[1])) - Math.min(...c1.map(s => s[1]));
        // MEASURED 2026-11-23 (bw-board e339fcb): sw > 12 -> observed 14.32.
        assert.ok(sw > 12, `the tank swings ${sw} V peak to peak`);
        // envelope: the deepest dip of Q2's collector in each 0.2 ms (about
        // two carrier cycles), from 2 ms on
        const env = [];
        for (let k = 2; k < 6.95; k += 0.2) {
            const w = late.filter(s => s[0] >= k && s[0] < k + 0.2);
            env.push(Math.min(...w.map(s => s[2])));
        }
        // MEASURED 2026-11-23 (bw-board e339fcb): Math.min(...env) < 4.5 -> observed 3.719;
        //   Math.max(...env) > 8.9 -> observed 8.98.
        assert.ok(Math.min(...env) < 4.5 && Math.max(...env) > 8.9, `envelope ${Math.min(...env)}..${Math.max(...env)} V`);
        let repeat = 0, half = 0;
        for (let i = 0; i + 10 < env.length; i++) repeat = Math.max(repeat, Math.abs(env[i] - env[i + 10]));
        for (let i = 0; i + 5 < env.length; i++) half = Math.max(half, Math.abs(env[i] - env[i + 5]));
        // MEASURED 2026-11-23 (bw-board e339fcb): half > 3 -> observed 5.261.
        assert.ok(half > 3, `half an audio period apart the envelope differs by ${half} V`);
        // MEASURED 2026-11-23 (bw-board e339fcb): repeat < 1 -> observed 0.4487.
        assert.ok(repeat < 1, `the envelope repeats every 2 ms (500 Hz): worst difference ${repeat} V`);
    });

    test('lab-lc-oscillator: a steady 1.67 kHz swing from power-on', () => {
        const x = bench('lab-lc-oscillator');
        const tr = [];
        x.each(30, 0.02, (t) => tr.push([t, x.v('q', 'collector')]));
        const early = tr.filter(s => s[0] <= 10), late = tr.filter(s => s[0] > 20);
        const pp = (w) => Math.max(...w.map(s => s[1])) - Math.min(...w.map(s => s[1]));
        near(hz(late, 9), 1674, 25, 'frequency');
        // MEASURED 2026-11-23 (bw-board e339fcb): pp(early) > 16 -> observed 18.99; pp(late) > 16 -> observed 18.38.
        assert.ok(pp(early) > 16 && pp(late) > 16, `swing ${pp(early)} then ${pp(late)} V`);
        assert.ok(Math.abs(pp(late) - pp(early)) < 0.1 * pp(early), 'the amplitude holds instead of dying away');
    });

    test('lab-motor-speed: regulated, the speed holds under load; by hand it sags', () => {
        const reg = bench('lab-motor-speed');
        reg.run(1200);
        const w0 = reg.state('m').omega;
        near(w0, 227, 6, 'regulated speed (rad/s)');
        near(reg.state('meter').reading, 1.05, 0.15, 'speed voltage on the meter');
        reg.param('m', 'loadTorque', 0.001);
        reg.run(600);
        assert.ok(reg.state('m').omega > 0.96 * w0, `regulated, loaded: ${reg.state('m').omega} rad/s (was ${w0})`);

        const man = bench('lab-motor-speed');
        man.set('sw', 1);
        man.run(500);
        const m0 = man.state('m').omega;
        near(m0, 191, 5, 'manual speed (rad/s)');
        man.param('m', 'loadTorque', 0.001);
        man.run(500);
        near(man.state('m').omega, 103, 8, 'manual, loaded: the speed sags');
    });

    test('lab-airflow-sensor: moving air cools the sensor, the meter rises, the alarm trips, the fan cycles', () => {
        const x = bench('lab-airflow-sensor');
        const go = (ms) => x.each(ms, 200, () => {});
        x.run(1);
        // MEASURED 2026-11-23 (bw-board e339fcb): x.mA('rl') > 4 -> observed 5.47.
        assert.ok(x.mA('rl') > 4, 'power-on: the cold sensor reads as a draught');
        go(10000);
        near(x.v('ntc', 'b'), 6.1, 0.15, 'still air, warmed up: sensor voltage');
        // MEASURED 2026-11-23 (bw-board e339fcb): x.mA('rl') < 0.05 -> observed 4.92e-9.
        assert.ok(x.mA('rl') < 0.05, 'still air: no alarm');
        // MEASURED 2026-11-23 (bw-board e339fcb): Math.abs(x.state('meter').reading) < 0.25 -> observed 0.09972.
        assert.ok(Math.abs(x.state('meter').reading) < 0.25, `still air: meter near zero (${x.state('meter').reading})`);
        const still = x.state('meter').reading;
        x.b.world.set('airflowMs', 2); go(6000);
        near(x.v('ntc', 'b'), 5.0, 0.15, 'at 2 m/s: sensor voltage');
        assert.ok(x.state('meter').reading > still + 0.9, `the meter rises with airflow (${x.state('meter').reading} V)`);
        // MEASURED 2026-11-23 (bw-board e339fcb): x.mA('rl') > 4 -> observed 5.47.
        assert.ok(x.mA('rl') > 4, 'at 2 m/s: draught alarm');
        assert.equal(x.state('fan').omega > 1, false, 'no fan in a cool room');
        x.b.world.set('airflowMs', 0); x.b.world.set('temperatureC', 32); go(8000);
        // The fan blows on its own sensor (airflowGain 0.01 m/s per rad/s):
        // each start cools S back under the thermostat level and the fan
        // stops again. MEASURED (bw-board e339fcb) over 15 s: 6 starts, S
        // 6.352..6.405 V, at most 0.226 m/s of fan air, no draught alarm.
        // Without the gain S climbs to 6.60 V and the fan runs flat out.
        let starts = 0, prev = x.state('fan').omega, sMin = 9, sMax = 0, air = 0, alarm = 0;
        x.each(15000, 100, () => {
            const w = x.state('fan').omega;
            if (prev < 5 && w >= 5) starts++;
            prev = w;
            sMin = Math.min(sMin, x.v('ntc', 'b')); sMax = Math.max(sMax, x.v('ntc', 'b'));
            air = Math.max(air, x.b.effectiveAirflowMs()); alarm = Math.max(alarm, x.mA('rl'));
        });
        // MEASURED 2026-11-23 (bw-board e339fcb): starts >= 4 -> observed 6; starts <= 9 -> observed 6.
        assert.ok(starts >= 4 && starts <= 9, `warm room: the thermostat cycles the fan (${starts} starts in 15 s)`);
        // MEASURED 2026-11-23 (bw-board e339fcb): sMin > 6.30 -> observed 6.352; sMax < 6.45 -> observed 6.405.
        assert.ok(sMin > 6.30 && sMax < 6.45, `warm room: the fan holds S near the thermostat level (${sMin.toFixed(3)}..${sMax.toFixed(3)} V)`);
        // MEASURED 2026-11-23 (bw-board e339fcb): air > 0.1 -> observed 0.2265; air < 0.4 -> observed 0.2265.
        assert.ok(air > 0.1 && air < 0.4, `the fan's own air reaches the sensor (${air.toFixed(3)} m/s)`);
        // MEASURED 2026-11-23 (bw-board e339fcb): alarm < 0.05 -> observed 4.92e-9.
        assert.ok(alarm < 0.05, 'the fan never cools the sensor into a draught alarm');
    });

    test('lab-amp-horn: an LM386 oscillates, biased at half the supply; the button raises the note', () => {
        const x = bench('lab-amp-horn');
        x.run(100);   // past the power-on thump: the coupling capacitor has found its level
        // Over 100 ms (17 periods at the low note) the output averages to its
        // bias and the speaker side of the 100 uF to zero.
        const window = () => {
            let out = 0, spk = 0, n = 0, lo = 99, hi = -99;
            x.each(100, 0.05, () => {
                const v = x.v('spk', 'a');
                out += x.v('u', 'vout'); spk += v; n++; lo = Math.min(lo, v); hi = Math.max(hi, v);
            });
            return { hz: x.b.buzzerTone(x.ids.spk).hz, out: out / n, spk: spk / n, lo, hi };
        };
        // MEASURED (bw-board e339fcb): idle 173.2 Hz, output 4.433 V average,
        // speaker -0.009 V average and -4.00..+4.00 V; button held 439.5 Hz,
        // 4.496 V; released again 175.1 Hz.
        const idle = window();
        near(idle.hz, 175, 12, 'idle note (Hz)');
        near(idle.out, 4.5, 0.15, 'amp output averages to half the 9 V supply');
        near(idle.spk, 0, 0.05, 'the speaker side of the 100 uF carries no DC');
        // MEASURED 2026-11-23 (bw-board e339fcb): idle.hi > 3.5 -> observed 3.997.
        assert.ok(idle.lo < -3.5 && idle.hi > 3.5, `the speaker swings both ways: ${idle.lo.toFixed(2)}..${idle.hi.toFixed(2)} V`);
        x.set('btn', 1); x.run(30);
        const pressed = window();
        near(pressed.hz, 439, 20, 'button held: 10 k across 22 k, the higher note (Hz)');
        near(pressed.out, 4.5, 0.15, 'button held: still biased at half the supply');
        x.set('btn', 0); x.run(30);
        near(window().hz, 175, 12, 'released: back to the low note (Hz)');
    });

    test('lab-solar-cell: I-V points, the bias trick, and a fan that needs light', () => {
        const x = bench('lab-solar-cell');
        x.run(1);
        const point = (pos) => { x.param('load', 'position', pos); x.run(1); return [x.v('pv1', 'pos'), x.mA('am')]; };
        const pts = [0, 0.5, 0.9, 0.95, 1].map(point);
        const want = [[0.572, 5.65], [0.567, 11.08], [0.516, 46.07], [0.362, 58.42], [0.131, 59.48]];
        pts.forEach(([v, i], k) => { near(v, want[k][0], 0.01, `load step ${k}: volts`); near(i, want[k][1], 1, `load step ${k}: mA`); });
        const power = pts.map(([v, i]) => v * i);
        assert.equal(power.indexOf(Math.max(...power)), 2, `power peaks in the middle: ${power}`);
        x.param('load', 'position', 0.5); x.set('sl', 0); x.run(1);
        near(x.v('pv1', 'pos'), 0.576, 0.01, 'open circuit at half light');
        // MEASURED 2026-11-23 (bw-board e339fcb): x.mA('am') < 0.01 -> observed 0.
        assert.ok(x.mA('am') < 0.01, 'open circuit: no current');
        x.set('sl', 1);

        const light = (L) => { for (const p of ['pv1', 'pv2', 'pv3']) x.param(p, 'light', L); x.run(800); };
        light(0);
        // MEASURED 2026-11-23 (bw-board e339fcb): x.mA('rc') < 0.05 -> observed 4.77e-5.
        assert.ok(x.mA('rc') < 0.05, 'dark: the biased transistor is off');
        light(0.2);
        // MEASURED 2026-11-23 (bw-board e339fcb): x.mA('rc') > 5 -> observed 6.366.
        assert.ok(x.mA('rc') > 5, `20 % light on top of the bias: LED ${x.mA('rc')} mA`);
        // MEASURED 2026-11-23 (bw-board e339fcb): x.state('fan').omega < 1 -> observed 0.
        assert.ok(x.state('fan').omega < 1, 'the fan does not start at 20 % light');
        light(1);
        near(x.v('pv1', 'pos'), 0.595, 0.01, 'full light, same load: voltage barely higher');
        // MEASURED 2026-11-23 (bw-board e339fcb): x.state('fan').omega > 20 -> observed 22.29.
        assert.ok(x.state('fan').omega > 20, `full light: the fan runs (${x.state('fan').omega} rad/s)`);
        x.set('sb', 0); x.run(5);
        // MEASURED 2026-11-23 (bw-board e339fcb): x.mA('rc') < 0.05 -> observed 6.00e-5.
        assert.ok(x.mA('rc') < 0.05, 'without the bias even full light cannot open the base');
    });

    test('lab-nand-pips: a slow gate switches a fast one on and off', () => {
        const x = bench('lab-nand-pips');
        const tr = [];
        x.each(1500, 0.25, (t) => tr.push([t, x.v('u', '1y'), x.v('u', '2y')]));
        const slow = tr.map(s => [s[0], s[1]]);
        near(hz(slow.filter(s => s[0] > 500), 2.5), 2.53, 0.25, 'pip rate');
        // inside one complete high stretch of gate 1, the tone runs at ~567 Hz
        const r = rises(slow, 2.5);
        const fall = tr.find(s => s[0] > r[0] && s[1] < 2.5)[0];
        const window = tr.filter(s => s[0] > r[0] + 5 && s[0] < fall).map(s => [s[0], s[2]]);
        near(hz(window, 2.5), 567, 30, 'tone inside a pip');
        const quiet = tr.filter(s => s[0] > fall + 1 && s[0] < r[1] - 1).map(s => s[2]);
        // MEASURED 2026-11-23 (bw-board e339fcb): Math.min(...quiet) > 4.5 -> observed 4.997.
        assert.ok(Math.min(...quiet) > 4.5, 'between pips gate 2 rests high: silence');
        x.set('sw', 1); x.run(5);
        const cont = [];
        x.each(100, 0.1, (t) => cont.push([t, x.v('u', '2y')]));
        near(hz(cont, 2.5), 567, 30, 'continuous tone');
    });

    test('lab-nand-one-shot: one press, a beep of fixed length after release', () => {
        const x = bench('lab-nand-one-shot');
        const tone = [];
        x.each(100, 0.25, (t) => tone.push([t, x.v('u', '4y')]));
        assert.equal(rises(tone, 2.5).length, 0, 'idle: silent');
        // MEASURED 2026-11-23 (bw-board e339fcb): x.mA('rl') < 0.05 -> observed 0.
        assert.ok(x.mA('rl') < 0.05, 'idle: LED dark');
        x.set('go', 1); x.run(100); x.set('go', 0);
        const released = x.t;
        const tr = [];
        x.each(1300, 0.25, (t) => tr.push([t, x.mA('rl'), x.v('u', '4y')]));
        const lit = tr.filter(s => s[1] > 1);
        // Re-measured on bw-board 0bc7baf: the exponential charging diode drops
        // less, the timing capacitor starts higher (4.69 V) and the beep lasts
        // longer (888 -> 969.5 ms).
        near(lit.at(-1)[0] - released, 970, 60, 'LED time after release (ms)');
        const during = tr.filter(s => s[0] < lit.at(-1)[0]).map(s => [s[0], s[2]]);
        near(hz(during, 2.5), 567, 30, 'beep pitch');
        const after = tr.filter(s => s[0] > lit.at(-1)[0] + 5).map(s => [s[0], s[2]]);
        assert.equal(rises(after, 2.5).length, 0, 'after the timer: silent again');
    });
});
