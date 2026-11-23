/**
 * Behaviour of the lab-* transistor-fundamentals benches, driven through time.
 *
 * `assert-physics` reads one instant of each bench (the authored state at
 * 1 ms) and `expected-quantities-hold` solves the operating points a sentence
 * names. Neither can follow a SEQUENCE: an alarm that must stay on after the
 * loop is mended, a fuse that must stay blown after the short is released, a
 * clap latch that must remember a pulse. Those are the whole point of these
 * circuits, so each bench here is loaded from its shipped circuit.json, its
 * controls are operated in order, and the state after each step is asserted.
 *
 * Every number below was measured on the headless engine when the bench was
 * built; the tolerances are bands around those measurements wide enough for
 * solver noise and narrow enough that a different circuit state cannot pass.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab circuit scenarios');
const SKIP = gate.skip || false;

let Circuit = null;
if (!SKIP) {
    ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));
}

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

/** A bench loaded from disk with small helpers for reading it. */
function bench (id) {
    const c = Circuit.fromJSON(JSON.parse(readFileSync(join(EXAMPLES, id, 'circuit.json'), 'utf8')));
    const netOf = (pt) => {
        const [p, t] = pt.split('.');
        for (const n of c.board.getNets()) for (const x of n.terminals) if (x.part === p && x.terminal === t) return n.id;
        throw new Error(`${id}: ${pt} is on no net`);
    };
    let now = 0;
    // A board sub-steps its devices at most 200 times per advance (1 ms
    // each), so a long advance over a free-running 555 is taken in 50 ms
    // pieces, the way the app's frame loop takes it.
    const advance = (ms) => {
        const target = BigInt(Math.round(ms * 1e6));
        while (c.board.timeNs + 50_000_000n < target) c.board.advanceTo(c.board.timeNs + 50_000_000n);
        c.board.advanceTo(target);
    };
    return {
        c,
        /** advance to an absolute time in ms */
        at: (ms) => { now = ms; advance(ms); },
        /** advance by a relative time in ms */
        wait: (ms) => { now += ms; advance(now); },
        set: (part, v) => c.board.setControl(part, v),
        slide: (part, v) => c.setPartParam(part, 'position', v),
        V: (pt) => c.board.nodeVoltages.get(netOf(pt)),
        mA: (pt) => { const [p, t] = pt.split('.'); return Math.abs(c.board.branchCurrent(p, t)) * 1e3; },
    };
}

const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);
const lit = (b, led, what) => assert.ok(b.mA(led) > 2, `${what}: ${led} carries ${b.mA(led).toFixed(3)} mA, expected lit`);
const dark = (b, led, what) => assert.ok(b.mA(led) < 0.05, `${what}: ${led} carries ${b.mA(led).toFixed(3)} mA, expected dark`);

describe('lab circuits (builder 1): behaviour over time', { skip: SKIP }, () => {
    test('lab-touch-darlington: the pair switches where one transistor only glimmers', () => {
        const b = bench('lab-touch-darlington');
        b.at(1);
        dark(b, 'led1.anode', 'untouched single'); dark(b, 'led2.anode', 'untouched Darlington');
        b.set('touch', 1); b.at(3);
        near(b.mA('led1.anode'), 0.378, 0.05, 'single-stage LED current');
        near(b.mA('led2.anode'), 6.37, 0.3, 'Darlington LED current');
        near(b.V('q3.collector'), 0.764, 0.05, 'Darlington on-state collector');
    });

    test('lab-touch-off: touching steals the lamp current', () => {
        const b = bench('lab-touch-off');
        b.at(1);
        near(b.mA('led1.anode'), 7.13, 0.3, 'untouched lamp');
        b.set('touch', 1); b.at(3);
        dark(b, 'led1.anode', 'touched lamp');
        near(b.V('led1.anode'), 0.774, 0.05, 'shunt node while touched');
    });

    test('lab-bicolor-polarity: the colour follows the polarity', () => {
        const b = bench('lab-bicolor-polarity');
        b.at(1);
        lit(b, 'red.anode', 'A positive'); dark(b, 'green.anode', 'A positive');
        b.set('swap', 1); b.at(30);
        dark(b, 'red.anode', 'B positive'); lit(b, 'green.anode', 'B positive');
        b.set('swap', 0); b.at(60);
        lit(b, 'red.anode', 'swapped back');
    });

    test('lab-shunt-gates: NOT, NAND and NOR truth tables, and the current they waste', () => {
        const b = bench('lab-shunt-gates');
        const row = (a, bb, not, nand, nor, supply) => {
            for (const [p, v] of [['notA', a], ['nandA', a], ['nandB', bb], ['norA', a], ['norB', bb]]) b.set(p, v);
            b.wait(1);
            for (const [led, on] of [['led1.anode', not], ['led2.anode', nand], ['led3.anode', nor]])
                (on ? lit : dark)(b, led, `A=${a} B=${bb}`);
            near(b.mA('bat.pos'), supply, 0.3, `supply current A=${a} B=${bb}`);
        };
        b.at(1);
        row(0, 0, 1, 1, 1, 21.39);
        row(1, 0, 0, 1, 0, 25.13);
        row(0, 1, 1, 1, 0, 23.26);
        row(1, 1, 0, 0, 0, 27.0);
    });

    test('lab-wet-dry-probe: one probe, two opposite indicators', () => {
        const b = bench('lab-wet-dry-probe');
        b.at(1);
        lit(b, 'dry.anode', 'dry probe'); dark(b, 'wet.anode', 'dry probe');
        b.set('probe', 0.99); b.wait(1);
        assert.ok(b.mA('wet.anode') > 5, 'probe at 100 kOhm: wet LED on');
        b.set('probe', 1); b.wait(1);
        lit(b, 'wet.anode', 'probes shorted'); dark(b, 'dry.anode', 'probes shorted');
    });

    test('lab-diff-pair: the tail current moves from side to side', () => {
        const b = bench('lab-diff-pair');
        b.at(1);
        const i1 = b.mA('led1.anode'), i2 = b.mA('led2.anode');
        assert.ok(i1 > 1 && i2 > 1, `balanced: both sides conduct (${i1.toFixed(2)}, ${i2.toFixed(2)} mA)`);
        near(i1 + i2, 3.76, 0.2, 'balanced: the two sides share the tail current');
        b.set('pot', 0.3); b.wait(1);
        dark(b, 'led2.anode', 'input low'); near(b.mA('led1.anode'), 3.67, 0.2, 'input low: all of it on the reference side');
        b.set('pot', 0.7); b.wait(1);
        dark(b, 'led1.anode', 'input high'); near(b.mA('led2.anode'), 4.59, 0.2, 'input high: all of it on the input side');
    });

    test('lab-break-loop-alarm: a cut loop alarms and mending it does not clear it', () => {
        const b = bench('lab-break-loop-alarm');
        b.at(50);
        dark(b, 'alarm.anode', 'armed at power-on');
        b.slide('loop', 1); b.at(60);
        near(b.mA('alarm.anode'), 7.0, 0.3, 'loop broken: alarm current');
        near(b.V('q1.collector'), 8.25, 0.1, 'loop broken: q1 off');
        near(b.V('q2.collector'), 0.126, 0.05, 'loop broken: q2 on');
        b.slide('loop', 0); b.at(70);
        near(b.mA('alarm.anode'), 7.0, 0.3, 'loop mended: alarm still on');
        b.set('arm', 1); b.at(80); b.set('arm', 0); b.at(90);
        dark(b, 'alarm.anode', 're-armed');
        near(b.V('q1.collector'), 0.073, 0.05, 're-armed: q1 on');
        b.slide('loop', 1); b.set('arm', 1); b.at(100); b.set('arm', 0); b.at(110);
        lit(b, 'alarm.anode', 'cannot be armed while the loop is open');
    });

    test('lab-electronic-fuse: trips on a short, stays blown, resets by button', () => {
        const b = bench('lab-electronic-fuse');
        b.at(20);
        near(b.mA('load.anode'), 14.69, 0.5, 'normal load');
        dark(b, 'tripled.anode', 'normal');
        b.set('short', 1); b.at(25);
        dark(b, 'load.anode', 'short: load cut'); lit(b, 'tripled.anode', 'short: tripped');
        near(b.mA('tripled.anode'), 3.24, 0.2, 'trip LED current');
        b.set('short', 0); b.at(40);
        dark(b, 'load.anode', 'short removed: still blown'); lit(b, 'tripled.anode', 'still tripped');
        near(b.mA('bat.pos'), 11.17, 0.4, 'the tripped latch draws its own current');
        b.set('reset', 1); b.at(45); b.set('reset', 0); b.at(60);
        near(b.mA('load.anode'), 14.69, 0.5, 'reset: load back'); dark(b, 'tripled.anode', 'reset');
    });

    test('lab-schmitt-clap: one clap latches, reset clears', () => {
        const b = bench('lab-schmitt-clap');
        b.at(30);
        dark(b, 'led.anode', 'quiet at power-on');
        b.set('clap', 1); b.at(35); b.set('clap', 0); b.at(150);
        lit(b, 'led.anode', 'stays on after the clap');
        b.set('reset', 1); b.at(155); b.set('reset', 0); b.at(200);
        dark(b, 'led.anode', 'reset');
    });
    test('lab-am-detector: diode and capacitor recover the 500 Hz envelope', () => {
        const b = bench('lab-am-detector');
        const env = [], am = [];
        for (let i = 1; i <= 800; i++) { b.at(i * 0.01); env.push(b.V('cs.a')); am.push(b.V('rsrc.a')); }
        near(Math.max(...am), 4.56, 0.05, 'AM peak (carrier + both side frequencies)');
        const w = env.slice(300);
        // Re-measured when the piezo became a real capacitor (it loads ENV
        // through the coupling capacitor): 3.29/0.35 V before, 3.12/0.65 V now.
        near(Math.max(...w), 3.12, 0.1, 'envelope maximum');
        near(Math.min(...w), 0.65, 0.1, 'envelope minimum');
        let repeat = 0, half = 0;
        for (let i = 300; i + 200 < env.length; i++) repeat = Math.max(repeat, Math.abs(env[i] - env[i + 200]));
        for (let i = 300; i + 100 < env.length; i++) half = Math.max(half, Math.abs(env[i] - env[i + 100]));
        assert.ok(repeat < 0.05, `the envelope repeats every 2 ms (500 Hz): worst difference ${repeat.toFixed(3)} V`);
        assert.ok(half > 2, `half a modulation period apart the envelope differs by ${half.toFixed(3)} V — it carries the tone`);
    });

    test('lab-applause-meter: fast attack, slow release, applause holds the light', () => {
        const b = bench('lab-applause-meter');
        b.at(10);
        dark(b, 'led.anode', 'quiet');
        b.set('clap', 1); b.wait(50); b.set('clap', 0);
        near(b.V('chold.a'), 2.17, 0.15, 'hold capacitor after one clap');
        near(b.mA('led.anode'), 3.18, 0.3, 'LED after one clap');
        b.wait(250); near(b.mA('led.anode'), 2.31, 0.3, 'LED 0.25 s after the clap');
        b.wait(750); near(b.mA('led.anode'), 0.81, 0.2, 'LED 1 s after the clap');
        for (let k = 0; k < 4; k++) { b.set('clap', 1); b.wait(50); b.set('clap', 0); b.wait(150); }
        near(b.V('chold.a'), 2.92, 0.15, 'hold capacitor after applause');
        near(b.mA('led.anode'), 4.76, 0.3, 'applause keeps the LED brighter than one clap');
        b.wait(1500); near(b.mA('led.anode'), 0.61, 0.2, 'faded 1.5 s after the last clap');
    });
    test('lab-coin-toss: the coin freezes on the face it showed at release', () => {
        const b = bench('lab-coin-toss');
        b.at(5);
        dark(b, 'heads.anode', 'power-on'); lit(b, 'tails.anode', 'power-on');
        // Re-measured when 555 timing became event-exact and LED colours got
        // their own forward voltages: the sequence was heads/tails/tails/tails/
        // heads at 8.2 mA each, it is now heads/heads/heads/tails/heads with
        // red heads at 8.46 mA and green tails at 7.69 mA.
        const litMA = { heads: 8.46, tails: 7.69 };
        for (const [hold, face] of [[300, 'heads'], [320, 'heads'], [340, 'heads'], [360, 'tails'], [380, 'heads']]) {
            b.set('toss', 1); b.wait(hold); b.set('toss', 0); b.wait(200);
            const other = face === 'heads' ? 'tails' : 'heads';
            near(b.mA(`${face}.anode`), litMA[face], 0.3, `hold ${hold} ms: ${face}`);
            dark(b, `${other}.anode`, `hold ${hold} ms`);
            b.wait(300);
            near(b.mA(`${face}.anode`), litMA[face], 0.3, `hold ${hold} ms: ${face} is kept`);
        }
    });

    test('lab-charge-pump: the reservoir climbs above the battery and sags under load', () => {
        const b = bench('lab-charge-pump');
        b.at(800);
        near(b.V('cres.a'), 14.36, 0.4, 'reservoir after 0.8 s');
        // 2.67 mA before blue LEDs got their own 3.1 V forward voltage; 2.44 mA now.
        near(b.mA('led.anode'), 2.44, 0.2, 'LED load current');
        b.set('heavy', 1);
        let low = Infinity;
        for (let i = 0; i < 400; i += 5) { b.wait(5); low = Math.min(low, b.V('cres.a')); }
        assert.ok(low < 9.5, `heavy load: the output sags below the battery voltage (lowest ${low.toFixed(2)} V)`);
        assert.ok(low > 7, `heavy load: the pump still delivers (lowest ${low.toFixed(2)} V)`);
    });
    test('lab-counter-timer: counts in binary to eight and stops its own clock', () => {
        const b = bench('lab-counter-timer');
        const count = () => ['done', 'b2', 'b1', 'b0'].map(n => (b.mA(`${n}.anode`) > 1 ? '1' : '0')).join('');
        b.at(100); assert.equal(count(), '0000', 'nothing counted yet');
        b.at(250); assert.equal(count(), '0001', 'first tick');
        b.at(2000); assert.equal(count(), '1000', 'stopped at eight');
        b.at(3000); assert.equal(count(), '1000', 'the clock stays stopped');
        assert.ok(b.V('osc.reset') < 0.5, 'the stop transistor holds the 555 in reset');
        b.set('start', 1); b.wait(20); b.set('start', 0); b.wait(230);
        assert.equal(count(), '0001', 'start clears the count and the clock runs again');
    });

    test('lab-beats: the together-LED swells and fades at the difference frequency', () => {
        const b = bench('lab-beats');
        const A = [], B = [];
        for (let t = 1; t <= 6000; t++) { b.at(t); A.push(b.V('oscA.output') > 4.5); B.push(b.V('oscB.output') > 4.5); }
        const rate = (x) => { const e = []; for (let i = 1; i < x.length; i++) if (x[i] && !x[i - 1]) e.push(i); return (e.length - 1) / ((e.at(-1) - e[0]) / 1000); };
        const fa = rate(A), fb = rate(B);
        near(fa, 4.99, 0.05, 'oscillator A (Hz)'); near(fb, 5.50, 0.05, 'oscillator B (Hz)');
        // fraction of each 200 ms window during which both are high
        const both = []; for (let i = 0; i + 200 <= 6000; i += 100) { let n = 0; for (let k = i; k < i + 200; k++) n += A[k] && B[k]; both.push(n / 200); }
        assert.ok(Math.max(...both) > 0.35, `in step: both high for ${Math.max(...both).toFixed(2)} of the time`);
        assert.ok(Math.min(...both) < 0.2, `out of step: both high for ${Math.min(...both).toFixed(2)} of the time`);
        // smooth over five windows, then time the upward crossings of the mean
        const sm = both.map((_, i) => { const w = both.slice(Math.max(0, i - 2), i + 3); return w.reduce((a, x) => a + x, 0) / w.length; });
        const mean = sm.reduce((a, x) => a + x, 0) / sm.length;
        const ups = []; for (let i = 1; i < sm.length; i++) if (sm[i - 1] < mean && sm[i] >= mean) ups.push(i);
        assert.ok(ups.length >= 2, `the together-LED swells more than once in 6 s (${ups.length} rises)`);
        const spacing = (ups.at(-1) - ups[0]) / (ups.length - 1) / 10;
        near(spacing, 1 / (fb - fa), 0.3, 'time between in-step moments (s) = 1 / beat frequency');
    });
    test('lab-capacitive-level: every band of water slows the 555', () => {
        const b = bench('lab-capacitive-level');
        const rate = () => {
            const e = []; let last = false;
            for (let i = 0; i < 2000; i++) { b.wait(1); const h = b.V('osc.output') > 4.5; if (h && !last) e.push(i); last = h; }
            const ee = e.slice(1); return (ee.length - 1) / ((ee.at(-1) - ee[0]) / 1000);
        };
        for (const [bands, want] of [[0, 13.70], [1, 6.85], [2, 4.58], [3, 3.44]]) {
            if (bands) b.slide(`level${bands}`, 1);
            near(rate(), want, 0.2, `${bands} band(s) of water: blinks per second`);
        }
    });
});
