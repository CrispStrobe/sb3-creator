/**
 * The lab-* benches from scripts/gen-lab-circuits-4.mjs do what their
 * EXPECTED.md says — measured on the COMMITTED circuit.json, over time, with
 * the buttons, sliders and switches a learner would touch.
 *
 * assert-physics only reads node voltages at t = 1 ms. Most of these benches
 * are about what happens later (a latch that holds after release, a timer
 * that runs out, a triangle that turns round), so each gets a scenario here.
 * Currents are read with BoardImpl.branchCurrent; ledBrightness is not used
 * because it reports a windowed history, not the present state.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-4.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

/** Load a committed bench and name its parts by role. */
function bench(id) {
    const c = Circuit.fromJSON(JSON.parse(readFileSync(join(EXAMPLES, id, 'circuit.json'), 'utf8')));
    const b = c.board;
    const ids = benchIds(BENCHES[id]);
    let tMs = 0;
    const api = {
        c, b, ids,
        /** Node voltage at a named terminal. */
        v(name, term) {
            const n = b.getNets().find(n => n.terminals.some(x => x.part === ids[name] && x.terminal === term));
            assert.ok(n, `${id}: no net for ${name}.${term}`);
            return b.nodeVoltages.get(n.id) ?? 0;
        },
        /** Current INTO a named terminal, in mA, sign dropped. */
        mA(name, term = 'a') { return Math.abs(b.branchCurrent(ids[name], term)) * 1e3; },
        run(ms) {
            // A long advance is taken in 5 ms pieces, the way the app's frame
            // loop takes it: the engine caps the solver attempts per advance,
            // and one 60 ms advance over a 3 kHz sine exceeds that cap.
            const end = tMs + ms;
            while (tMs + 5 < end) { tMs += 5; b.advanceTo(BigInt(Math.round(tMs * 1e6))); }
            tMs = end;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
        },
        set(name, value) { b.setControl(ids[name], value); },
        param(name, key, value) { c.setPartParam(ids[name], key, value); },
        get t() { return tMs; },
    };
    return api;
}

describe('lab benches behave as documented', { skip: SKIP }, () => {
    test('lab-transistor-flip-flop: set and reset latch after release', () => {
        const x = bench('lab-transistor-flip-flop');
        const red = () => x.mA('r1'), green = () => x.mA('r2');
        x.run(5);
        assert.ok(green() > 5 && red() < 0.5, `power-on: green ${green()}, red ${red()}`);
        x.set('set', 1); x.run(20); x.set('set', 0); x.run(50);
        assert.ok(red() > 5 && green() < 0.5, `after SET: red ${red()}, green ${green()}`);
        x.set('set', 1); x.run(20); x.set('set', 0); x.run(50);
        assert.ok(red() > 5 && green() < 0.5, 'a second SET changes nothing');
        x.set('reset', 1); x.run(20); x.set('reset', 0); x.run(50);
        assert.ok(green() > 5 && red() < 0.5, `after RESET: red ${red()}, green ${green()}`);
    });

    test('lab-base-current: Ic is beta times Ib until the LED current runs out', () => {
        const x = bench('lab-base-current');
        x.run(1);
        const beta = x.mA('amc') / x.mA('amb');
        assert.ok(Math.abs(beta - 100) < 3, `Ic/Ib = ${beta}`);
        x.set('pot', 1); x.run(1);                       // only the 10 k minimum left
        assert.ok(x.mA('amc') < 100 * x.mA('amb') * 0.2, 'with 10 k the transistor saturates');
        x.param('sw', 'position', 1); x.run(1);         // fingertip path, not touched
        assert.ok(x.mA('amc') < 0.01, `open base: Ic ${x.mA('amc')} mA`);
        x.set('finger', 1); x.run(1);
        assert.ok(x.mA('amc') > 0.3 && x.mA('amc') < 0.45, `fingertip: Ic ${x.mA('amc')} mA`);
    });

    test('lab-transistor-curves: flat above saturation, collapses below it', () => {
        const x = bench('lab-transistor-curves');
        const ic = [];
        for (const vce of [2, 5, 8]) { x.set('vce', vce); x.run(1); ic.push(x.mA('amc')); }
        const ib = x.mA('amb');
        for (const i of ic) assert.ok(Math.abs(i / ib - 100) < 3, `active region Ic/Ib = ${i / ib}`);
        x.set('vce', 0.6); x.run(1);
        assert.ok(x.v('q', 'collector') < 0.3, `source 0.6 V: V_CE ${x.v('q', 'collector')} V should be in saturation`);
        assert.ok(x.mA("amc") < 0.85 * 100 * ib, `source 0.6 V: Ic ${x.mA('amc')} mA should be well below beta*Ib`);
    });

    test('lab-delay-off-timer: on at once, still on after 5 s, out by 40 s', () => {
        const x = bench('lab-delay-off-timer');
        x.run(100);
        assert.ok(x.mA('rl') < 0.01, 'idle: dark');
        x.set('btn', 1); x.run(200); x.set('btn', 0);
        assert.ok(x.mA('rl') > 5, 'pressed: lit');
        x.run(5000);
        assert.ok(x.mA('rl') > 5, `5 s after release: ${x.mA('rl')} mA`);
        x.run(35000);
        assert.ok(x.mA('rl') < 1, `40 s after release: ${x.mA('rl')} mA`);
    });

    test('lab-transistor-two-diodes: each junction conducts one way only', () => {
        const x = bench('lab-transistor-two-diodes');
        x.run(1);
        assert.ok(x.mA('ra') > 4, 'B-E forward conducts');
        assert.ok(x.mA('rb') > 4, 'B-C forward conducts');
        assert.ok(x.mA('rc') < 0.01, 'B-E reversed blocks');
        assert.ok(x.mA('rd') < 0.01, 'B-C reversed blocks');
    });

    test('lab-battery-threshold: 0, 1, 2 or 3 LEDs with rising voltage', () => {
        const x = bench('lab-battery-threshold');
        const lit = () => ['r1', 'r2', 'r3'].filter(r => x.mA(r) > 1).length;
        for (const [volts, n] of [[3.5, 0], [4.8, 1], [6, 2], [9, 3]]) {
            x.set('bat', volts); x.run(1);
            assert.equal(lit(), n, `${volts} V lights ${lit()}`);
        }
    });

    test('lab-heat-alarm: warming the NTC puts the LED out', () => {
        const x = bench('lab-heat-alarm');
        x.run(1);
        assert.ok(x.mA('rl') > 5, 'cold: lit');
        x.set('ntc', 0.7); x.run(1);
        assert.ok(x.mA('rl') < 0.1, `warm: ${x.mA('rl')} mA`);
    });

    test('lab-ce-vs-follower: gain about -2.2 versus about +1', () => {
        const x = bench('lab-ce-vs-follower');
        x.set('pot', 0.6); x.run(1);
        const a = [x.v('pot', 'wiper'), x.v('q1', 'collector'), x.v('q2', 'emitter')];
        x.set('pot', 0.8); x.run(1);
        const b = [x.v('pot', 'wiper'), x.v('q1', 'collector'), x.v('q2', 'emitter')];
        const dIn = b[0] - a[0];
        const gCE = (b[1] - a[1]) / dIn, gF = (b[2] - a[2]) / dIn;
        assert.ok(gCE < -1.9 && gCE > -2.3, `common-emitter gain ${gCE}`);
        assert.ok(gF > 0.95 && gF < 1.05, `follower gain ${gF}`);
    });

    test('lab-push-pull: class B has a dead zone, class AB follows through zero', () => {
        const x = bench('lab-push-pull');
        x.run(40);
        let deadB = 0, worstAB = 0;
        for (let i = 0; i < 40; i++) {
            x.run(0.5);
            const s = x.v('sig', 'out');
            if (Math.abs(s) < 0.5) deadB = Math.max(deadB, Math.abs(x.v('rl1', 'a')));
            worstAB = Math.max(worstAB, Math.abs(x.v('rl2', 'a') - s));
        }
        assert.ok(deadB < 0.01, `class B output near zero crossing: ${deadB} V`);
        assert.ok(worstAB < 0.3, `class AB tracks the input within ${worstAB} V`);
    });

    test('lab-two-led-monostable: green for about 11 s after release', () => {
        const x = bench('lab-two-led-monostable');
        x.run(500);
        assert.ok(x.mA('rr') > 5 && x.mA('rg') < 0.1, 'idle: red');
        x.set('go', 1); x.run(500); x.set('go', 0);
        let tGreen = 0;
        while (x.mA('rg') > 1 && tGreen < 20000) { x.run(100); tGreen += 100; }
        assert.ok(Math.abs(tGreen - 11400) < 600, `green lasted ${tGreen} ms`);
        assert.ok(x.mA('rr') > 5, 'back to red');
    });

    test('lab-virtual-ground: buffered midpoint holds, bare divider drifts', () => {
        const x = bench('lab-virtual-ground');
        x.run(1);
        assert.ok(Math.abs(x.v('u', '1_out') - 4.5) < 0.02);
        assert.ok(x.v('rc', 'b') > 6, `bare divider: ${x.v('rc', 'b')} V`);
        assert.ok(x.mA('rA') > 4 && x.mA('rB') > 2, 'both loads draw current');
    });

    test('lab-wheatstone-bridge: null at the ratio of each unknown', () => {
        const x = bench('lab-wheatstone-bridge');
        const meter = () => x.v('rn', 'b') - x.v('pot', 'wiper');
        x.set('pot', 6.8 / 16.8); x.run(1);
        assert.ok(Math.abs(meter()) < 0.01, `6.8 k null: ${meter()} V`);
        x.param('sw', 'position', 1); x.run(1);
        assert.ok(Math.abs(meter()) > 0.5, 'other unknown: off balance');
        x.set('pot', 4.7 / 14.7); x.run(1);
        assert.ok(Math.abs(meter()) < 0.01, `4.7 k null: ${meter()} V`);
    });

    test('lab-window-comparator: dark off, middle on, bright off', () => {
        const x = bench('lab-window-comparator');
        for (const [light, on] of [[0, false], [0.2, false], [0.5, true], [0.8, false], [1, false]]) {
            x.param('pt', 'light', light); x.run(1);
            assert.equal(x.mA('rled') > 2, on, `light ${light}: LED ${x.mA('rled')} mA`);
        }
    });

    test('lab-2bit-dac: four equal 0.5 V steps', () => {
        const x = bench('lab-2bit-dac');
        for (const [b1, b0, out] of [[0, 0, 0], [0, 1, 0.5], [1, 0, 1.0], [1, 1, 1.5]]) {
            x.param('s1', 'position', b1); x.param('s0', 'position', b0); x.run(1);
            assert.ok(Math.abs(x.v('r4', 'b') - out) < 0.01, `${b1}${b0}: ${x.v('r4', 'b')} V`);
        }
    });

    test('lab-2bit-adc: the pot walks the LEDs 00, 01, 10, 11', () => {
        const x = bench('lab-2bit-adc');
        for (const [pos, msb, lsb] of [[0.1, 0, 0], [0.4, 0, 1], [0.6, 1, 0], [0.9, 1, 1]]) {
            x.set('pot', pos); x.run(1);
            assert.deepEqual([x.mA('rm') > 2 ? 1 : 0, x.mA('rl') > 2 ? 1 : 0], [msb, lsb], `pot ${pos}`);
        }
    });

    test('lab-function-generator: triangle and square at the same few hertz', () => {
        const x = bench('lab-function-generator');
        let prev = null; const rises = []; let lo = 99, hi = -99;
        while (x.t < 2500) {
            x.run(2);
            const sq = x.v('us', '1_out') > 4;
            if (prev === false && sq) rises.push(x.t);
            prev = sq;
            if (x.t > 600) { const tri = x.v('ui', 'out'); lo = Math.min(lo, tri); hi = Math.max(hi, tri); }
        }
        assert.ok(rises.length >= 3, `square rose ${rises.length} times`);
        const f = (rises.length - 1) / (rises.at(-1) - rises[0]) * 1000;
        assert.ok(f > 3 && f < 8, `frequency ${f} Hz`);
        assert.ok(hi - lo > 2 && lo > 2 && hi < 8, `triangle ${lo}..${hi} V`);
    });
});

describe('lab-two-band-light-organ', { skip: SKIP }, () => {
    const average = (x, freq) => {
        x.param('sig', 'freq', freq);
        const period = 1000 / freq, step = Math.min(period / 20, 1);
        // Settle for 30 ms (more than six time constants of the slower 4.7 k /
        // 1 uF filter) or five periods, then average over 10 ms or four periods.
        x.run(Math.max(30, 5 * period));
        let hi = 0, lo = 0, n = 0;
        for (let t = 0; t < Math.max(10, 4 * period); t += step) { x.run(step); hi += x.mA('r1'); lo += x.mA('r2'); n++; }
        return { treble: hi / n, bass: lo / n };
    };
    test('low notes light the bass LED, high notes the treble LED', () => {
        const low = average(bench('lab-two-band-light-organ'), 20);
        const high = average(bench('lab-two-band-light-organ'), 3000);
        assert.ok(low.bass > 1 && low.treble < 0.2 * low.bass, `20 Hz: ${JSON.stringify(low)}`);
        assert.ok(high.treble > 1 && high.bass < 0.2 * high.treble, `3 kHz: ${JSON.stringify(high)}`);
    });
});

describe('lab-v-to-f', { skip: SKIP }, () => {
    const hertz = (pos) => {
        const x = bench('lab-v-to-f');
        x.set('pot', pos);
        const falls = [];
        let prev = null;
        while (x.t < 4000) {
            x.run(0.5);
            const high = x.v('us', '1_out') > 3;
            if (prev === true && !high && x.t > 800) falls.push(x.t);
            prev = high;
        }
        return falls.length > 1 ? (falls.length - 1) / (falls.at(-1) - falls[0]) * 1000 : 0;
    };
    test('flashes per second rise in step with the input voltage', () => {
        const f0 = hertz(0), f1 = hertz(0.2), f3 = hertz(0.6);
        assert.equal(f0, 0, 'no input, no flashes');
        assert.ok(Math.abs(f1 - 2.65) < 0.3, `0.89 V over the reference: ${f1} Hz`);
        assert.ok(f3 / f1 > 2.4 && f3 / f1 < 3.0, `three times the input gives ${f3 / f1} times the rate`);
    });
});
