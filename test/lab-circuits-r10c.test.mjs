/**
 * The r10c benches from `scripts/gen-lab-circuits-4.mjs --set=r10c` do what
 * their EXPECTED.md says: measured on the COMMITTED circuit.json, with the
 * stimuli a learner would set (buttons, toggle and slide switches, pots, the
 * sound level at a listening loudspeaker, a light path's knob).
 *
 * Every bench is built on one quad op-amp (LM324). Readouts are the engine's
 * own surfaces: node voltages and resistor currents. Op-amp oscillators cost
 * the solver a few hundred steps per edge, so audio-rate tones are timed
 * over a few milliseconds and only the slow blinkers run for seconds; the
 * one LM386 (the alarm tone of lab-ir-reflect-alarm) is sampled for 2 ms.
 *
 * Every number was measured on the headless engine (bw-board 2965782a) when
 * the bench was built; the tolerances are bands around those measurements.
 * With R10C_MEASURE=1 each scenario also prints what it measured.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r10c.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set r10c)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const MEASURE = !!process.env.R10C_MEASURE;
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
        run (ms) {
            tMs += ms;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
        },
        each (ms, step, fn) { const end = tMs + ms; while (tMs < end - 1e-9) { api.run(step); fn(tMs); } },
        span (name, term, ms, step = 0.05) {
            let lo = Infinity; let hi = -Infinity;
            api.each(ms, step, () => { const x = api.v(name, term); lo = Math.min(lo, x); hi = Math.max(hi, x); });
            return { lo: r3(lo), hi: r3(hi), pp: r3(hi - lo) };
        },
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

describe('lab benches (set r10c) behave as documented', { skip: SKIP }, () => {

    test('lab-opamp-plus-minus: the comparator flips within millivolts of zero; the LED pair clamps at a threshold each way', () => {
        const x = bench('lab-opamp-plus-minus');
        x.run(5);
        const m = { authored: { vin: r3(x.v('vin', 'a')), cmp: r3(x.v('u', '1_out')), pair: r3(x.v('vm', 'a')) } };
        const at = (p) => { x.param('knob', 'position', p); x.run(5); return { vin: r3(x.v('vin', 'a')), cmp: r3(x.v('u', '1_out')), pair: r3(x.v('vm', 'a')), mA: r3(x.mA('r2')) }; };
        m.below = at(0.4999); m.above = at(0.5001); m.top = at(1); m.bottom = at(0); m.small = at(0.55); m.smallNeg = at(0.45);
        report('lab-opamp-plus-minus', m);
        near(m.below.vin, -0.002, 0.001, 'knob a ten-thousandth below the middle: input −1.8 mV (V)');
        near(m.below.cmp, -8.655, 0.05, 'input −1.8 mV: comparator at its lower limit, green LED (V)');
        near(m.above.cmp, 7.222, 0.05, 'input +1.8 mV: comparator at its upper limit, red LED (V)');
        near(m.top.pair, 1.695, 0.05, 'knob up: the pair stops at the red LED\'s threshold (V)');
        near(m.bottom.pair, -2.015, 0.05, 'knob down: the pair stops at the green LED\'s threshold (V)');
        near(m.top.mA, 5.53, 0.1, 'knob up: red LED current (mA)');
        near(m.small.pair, 0.9, 0.01, '+0.9 V in: below both thresholds, the pair follows the input (V)');
        near(m.smallNeg.pair, -0.9, 0.01, '−0.9 V in: likewise (V)');
        // MEASURED 2026-11-25: |small.mA| < 0.01 -> observed 0.000 mA.
        assert.ok(Math.abs(m.small.mA) < 0.01, `0.9 V: no LED conducts (${m.small.mA} mA)`);
    });

    test('lab-opamp-sawtooth: a triangle and square; the diode makes the return twenty times faster', () => {
        const x = bench('lab-opamp-sawtooth');
        x.run(30);
        const tri = x.span('u', '1_out', 50, 0.2);
        const ts = x.crossings('u', '2_out', 3.75, 100, 0.1);
        const iv = ts.slice(1).map((t, i) => r3(t - ts[i]));
        x.set('shape', 1); x.run(30);
        const ts2 = x.crossings('u', '2_out', 3.75, 60, 0.1);
        const iv2 = ts2.slice(1).map((t, i) => r3(t - ts2[i]));
        const m = { tri, period: r3(period(ts)), halves: [Math.min(...iv), Math.max(...iv)], sawPeriod: r3(period(ts2)), sawHalves: [Math.min(...iv2), Math.max(...iv2)] };
        report('lab-opamp-sawtooth', m);
        near(m.tri.lo, 3.27, 0.06, 'triangle bottom (V)');
        near(m.tri.hi, 6.54, 0.06, 'triangle top (V)');
        near(m.period, 42.77, 0.5, 'triangle period (ms)');
        near(m.halves[0], 16.15, 0.3, 'falling half (ms)');
        near(m.halves[1], 26.6, 0.3, 'rising half (ms)');
        near(m.sawPeriod, 27.42, 0.5, 'SHAPE closed: sawtooth period (ms)');
        near(m.sawHalves[0], 0.86, 0.15, 'SHAPE closed: the fast return (ms)');
        near(m.sawHalves[1], 26.56, 0.3, 'SHAPE closed: the slow ramp is unchanged (ms)');
    });

    test('lab-opamp-hand-astable: the buttons flip it at the two thresholds; AUTO makes it run by itself', () => {
        const x = bench('lab-opamp-hand-astable');
        x.run(5);
        const m = { start: [r3(x.v('vm', 'a')), r3(x.v('u', '1_out'))] };
        x.set('charge', 1); let flip = null; x.each(400, 5, (t) => { if (flip === null && x.v('u', '1_out') < 3.75) flip = t - 5; }); x.set('charge', 0); x.run(50);
        m.charge = { ms: flip, cap: r3(x.v('vm', 'a')), out: r3(x.v('u', '1_out')) };
        x.run(500); m.hold = r3(x.v('u', '1_out'));
        const t0 = x.t; x.set('drain', 1); flip = null; x.each(400, 5, (t) => { if (flip === null && x.v('u', '1_out') > 3.75) flip = t - t0; }); x.set('drain', 0); x.run(50);
        m.drain = { ms: flip, cap: r3(x.v('vm', 'a')), out: r3(x.v('u', '1_out')) };
        x.set('auto', 1); x.run(1000);
        const ts = x.crossings('u', '1_out', 3.75, 3200, 5);
        m.auto = { period: r3(period(ts)), edges: ts.length, cap: x.span('vm', 'a', 1500, 5) };
        report('lab-opamp-hand-astable', m);
        near(m.start[1], 7.24, 0.05, 'empty capacitor: output high, green LED (V)');
        near(m.charge.ms, 205, 15, 'CHARGE held: the output drops when the capacitor passes 5.5 V (ms)');
        near(m.charge.out, 0.374, 0.05, 'charged: output low, red LED (V)');
        near(m.hold, 0.374, 0.05, 'buttons released: it stays low (V)');
        near(m.drain.ms, 195, 15, 'DRAIN held: the output rises when the capacitor falls below 3 V (ms)');
        near(m.drain.out, 7.24, 0.05, 'drained: output high again (V)');
        near(m.auto.period, 1470, 40, 'AUTO: period of the free-running astable (ms)');
        near(m.auto.cap.lo, 3.13, 0.08, 'AUTO: capacitor turns at the lower threshold (V)');
        near(m.auto.cap.hi, 5.41, 0.08, 'AUTO: capacitor turns at the upper threshold (V)');
    });

    test('lab-opamp-toggle: SET and RESET work the first latch; each TOGGLE press flips the second', () => {
        const x = bench('lab-opamp-toggle');
        x.run(5);
        const st = () => [r3(x.v('u', '1_out')), r3(x.v('u', '2_out'))];
        const m = { start: st() };
        x.set('set', 1); x.run(20); x.set('set', 0); x.run(20); m.set = st();
        x.set('reset', 1); x.run(20); x.set('reset', 0); x.run(20); m.reset = st();
        for (let i = 1; i <= 4; i++) { x.set('tog', 1); x.run(150); m[`held${i}`] = st(); x.set('tog', 0); x.run(800); m[`tog${i}`] = st(); }
        report('lab-opamp-toggle', m);
        const HI = 7.22; const LO = 0.005;
        near(m.start[0], LO, 0.01, 'switched on: first latch off (V)');
        near(m.start[1], LO, 0.01, 'switched on: toggle off (V)');
        near(m.set[0], HI, 0.05, 'SET pressed and released: latch on (V)');
        near(m.reset[0], LO, 0.01, 'RESET pressed and released: latch off (V)');
        for (const i of [1, 3]) { near(m[`held${i}`][1], HI, 0.05, `press ${i}, held: on (V)`); near(m[`tog${i}`][1], HI, 0.05, `press ${i}, released: on (V)`); }
        for (const i of [2, 4]) { near(m[`held${i}`][1], LO, 0.01, `press ${i}, held: off (V)`); near(m[`tog${i}`][1], LO, 0.01, `press ${i}, released: off (V)`); }
        for (const k of ['held1', 'tog1', 'held2', 'tog2']) near(m[k][0], LO, 0.01, `${k}: the toggle leaves the first latch alone (V)`);
    });

    test('lab-opamp-gates: AND and NAND on the left, OR and NOR on the right', () => {
        const x = bench('lab-opamp-gates');
        x.run(2);
        const m = {};
        for (const mode of [0, 1]) {
            x.param('mode', 'position', mode);
            for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { x.set('a', a); x.set('b', b); x.run(2); m[`${mode}:${a}${b}`] = [r3(x.v('u', '3_out')), r3(x.v('u', '4_out')), r3(x.v('sa', 'b'))]; }
        }
        report('lab-opamp-gates', m);
        const H = 7.2; const tol = 0.1;
        const want = { '0:00': 0, '0:10': 0, '0:01': 0, '0:11': 1, '1:00': 0, '1:10': 1, '1:01': 1, '1:11': 1 };
        for (const [k, on] of Object.entries(want)) {
            near(m[k][0], on ? H : 0, tol, `${k}: AND/OR output (V)`);
            near(m[k][1], on ? 0 : H, tol, `${k}: NAND/NOR output (V)`);
        }
        near(m['0:10'][2], 3.075, 0.02, 'one button: the averaged line (V)');
        near(m['0:11'][2], 6.13, 0.02, 'both buttons: the averaged line (V)');
    });

    test('lab-opamp-meter-stages: the bias current shows on the ×10 meter until ZERO nulls it; the ammeter survives a reversed circuit', () => {
        const x = bench('lab-opamp-meter-stages');
        x.run(5);
        const rd = () => ({ meter: r3(x.v('meter', 'a') - x.v('meter', 'b')), inp: r3((x.v('u', '1_pos') - x.v('u', '4_out')) * 1000), amps: r3(x.v('amps', 'a')), sense: r3(x.v('u', '2_pos')) });
        const m = { authored: rd() };
        x.param('zero', 'position', 0.448); x.run(5); m.nulled = rd();
        x.set('probe', 1); x.run(5); m.probe = rd(); x.set('probe', 0); x.run(5);
        x.param('pol', 'position', 1); x.run(5); m.reversed = rd(); m.reversed.uA = r3(x.mA('rp') * 1000);
        report('lab-opamp-meter-stages', m);
        near(m.authored.inp, 43.2, 1, 'nothing connected: the + input\'s 47.5 nA bias current through 1 MΩ ‖ 10 MΩ lifts the input (mV)');
        near(m.authored.meter, 0.432, 0.02, 'nothing connected: the ×10 meter shows the offset (V)');
        // MEASURED 2026-11-25: |nulled.meter| < 0.03 -> observed 0.000 V.
        assert.ok(Math.abs(m.nulled.meter) < 0.01, `ZERO turned to 0.448: offset nulled (${m.nulled.meter} V)`);
        near(m.probe.meter, 0.495, 0.01, 'PROBE: 50 mV in, 0.5 V on the meter (V)');
        near(m.authored.sense, 0.786, 0.005, 'ammeter: 10 Ω carries 79 mA (V)');
        near(m.authored.amps, 3.93, 0.03, 'ammeter: five times the sensing voltage, 1 V = 20 mA (V)');
        near(m.reversed.sense, -0.192, 0.02, 'reversed: the germanium diode holds the input at about −0.2 V (V)');
        near(m.reversed.uA, -59.6, 2, 'reversed: 10 kΩ limits the diode current (µA)');
        near(m.reversed.amps, 0.005, 0.01, 'reversed: the ammeter just reads zero (V)');
    });

    test('lab-opamp-staircase: equal steps on every clock, a quick reset at the top', () => {
        const x = bench('lab-opamp-staircase');
        // Levels just before each falling clock edge (the step happens on it).
        const levels = []; const drops = []; let prevClk = x.v('u', '1_out') > 3.75; let prevOut = 0;
        x.each(1700, 2, () => {
            const clk = x.v('u', '1_out') > 3.75; const out = x.v('u', '2_out');
            if (prevClk && !clk) levels.push(r3(prevOut));
            if (out < prevOut - 0.3) drops.push(r3(out));
            prevClk = clk; prevOut = out;
        });
        const steps = levels.slice(1).map((v, i) => r3(v - levels[i])).filter(d => d > 0);
        const m = { levels, steps, top: Math.max(...levels), bottom: Math.min(...levels.slice(1)), resets: drops.length };
        report('lab-opamp-staircase', m);
        // MEASURED 2026-11-25: steps.length >= 6 -> observed 9 steps.
        assert.ok(m.steps.length >= 6, `at least six steps in 1.7 s (${m.steps.length})`);
        for (const d of m.steps.slice(1)) near(d, 0.70, 0.06, 'each step is the same charge packet (V)');
        // MEASURED 2026-11-25: resets >= 1 -> observed 6 samples falling by > 0.3 V, two resets.
        assert.ok(m.resets >= 1, `the comparator reset the staircase (${m.resets} drops)`);
    });

    test('lab-opamp-hysteresis: the feedback ratio sets the window; the buffer keeps the knob\'s own resistance out of it', () => {
        const thresholds = (buffer, width) => {
            const probe = (from, p) => {
                const x = bench('lab-opamp-hysteresis', { buffer: { position: buffer }, width: { position: width }, knob: { position: from } });
                x.run(1); x.param('knob', 'position', p); x.run(1);
                return { high: x.v('u', '2_out') > 3.75, vin: x.v('vm', 'a') };
            };
            let lo = 0; let hi = 1;
            for (let i = 0; i < 10; i++) { const mid = (lo + hi) / 2; if (probe(0, mid).high) hi = mid; else lo = mid; }
            const up = probe(0, hi).vin;
            lo = 0; hi = 1;
            for (let i = 0; i < 10; i++) { const mid = (lo + hi) / 2; if (probe(1, mid).high) hi = mid; else lo = mid; }
            const dn = probe(1, lo).vin;
            return { up: r3(up), dn: r3(dn), width: r3(up - dn) };
        };
        const m = { b47: thresholds(1, 0), b15: thresholds(1, 1), d47: thresholds(0, 0), d15: thresholds(0, 1) };
        report('lab-opamp-hysteresis', m);
        near(m.b47.up, 4.42, 0.05, 'buffered, 47 kΩ: switches on at (V)');
        near(m.b47.dn, 2.88, 0.05, 'buffered, 47 kΩ: switches off at (V)');
        near(m.b47.width, 7.22 * 10 / 47, 0.06, 'buffered, 47 kΩ: window = swing × 10 kΩ / 47 kΩ (V)');
        near(m.b15.width, 4.8, 0.08, 'buffered, 15 kΩ: window about three times wider (V)');
        near(m.d47.width, 5.06, 0.1, 'unbuffered, 47 kΩ: the knob\'s resistance widens the window (V)');
        near(m.d15.width, 7.6, 0.1, 'unbuffered, 15 kΩ: the window nearly spans the output swing (V)');
    });

    test('lab-opamp-doubler: the red LED blinks twice for every blink of the green one', () => {
        const run = (p) => {
            const x = bench('lab-opamp-doubler', { width: { position: p } });
            x.run(800);
            const slow = []; const fast = []; let ps = x.v('u', '1_out') > 3.75; let pf = x.v('u', '4_out') > 3.75;
            x.each(2800, 5, (t) => {
                const s = x.v('u', '1_out') > 3.75; const f = x.v('u', '4_out') > 3.75;
                if (s !== ps) slow.push(t); if (f !== pf) fast.push(t); ps = s; pf = f;
            });
            return { slow: r3(period(slow)), fast: r3(period(fast)), nSlow: slow.length, nFast: fast.length, win: [r3(x.v('u', '2_neg')), r3(x.v('u', '3_pos'))] };
        };
        const m = { mid: run(0.3), shut: run(1) };
        report('lab-opamp-doubler', m);
        near(m.mid.slow, 673.8, 15, 'astable period (ms)');
        near(m.mid.fast, m.mid.slow / 2, 15, 'NAND output: half the period (ms)');
        // MEASURED 2026-11-25: shut.nFast === 0 -> observed 0 edges.
        assert.equal(m.shut.nFast, 0, 'WIDTH at zero: no window, the NAND output never switches');
    });

    test('lab-opamp-baby-monitor: microvolts at the loudspeaker become volts, ten times more with GAIN', () => {
        const x = bench('lab-opamp-baby-monitor');
        x.run(40);
        const m = { mid: r3(x.v('u', '4_out')), quiet: x.span('u', '3_out', 5, 0.05) };
        x.param('mic', 'soundDb', 50); x.run(10); m.db50 = x.span('u', '3_out', 10, 0.05);
        x.set('gain', 1); x.run(10); m.db50x = x.span('u', '3_out', 10, 0.05);
        x.param('mic', 'soundDb', 30); x.run(10); m.db30x = x.span('u', '3_out', 10, 0.05);
        report('lab-opamp-baby-monitor', m);
        near(m.mid, 4.5, 0.02, 'the stages idle at the 4.5 V midpoint (V)');
        // MEASURED 2026-11-25: quiet.pp < 0.02 -> observed 0.004 V pp.
        assert.ok(m.quiet.pp < 0.02, `silent nursery: no output (${m.quiet.pp} V pp)`);
        near(m.db50.pp, 0.113, 0.02, 'speech at 50 dB, gain 10^4 (V pp)');
        near(m.db50x.pp, 1.144, 0.15, 'speech at 50 dB, gain 10^5 (V pp)');
        near(m.db50x.pp / m.db50.pp, 10, 1.5, 'GAIN multiplies the output by ten');
        near(m.db30x.pp, 0.115, 0.02, '20 dB quieter (a tenth of the pressure) at gain 10^5: as loud as 50 dB at 10^4 (V pp)');
    });

    test('lab-opamp-hearing-limit: the PITCH knob sweeps the tone from about 660 Hz to about 14 kHz', () => {
        const f = (p, ms, step) => {
            const x = bench('lab-opamp-hearing-limit', { pitch: { position: p } });
            x.run(1);
            const ts = x.crossings('u', '1_out', 3.75, ms, step);
            return r3(1000 / period(ts));
        };
        const m = { low: f(0, 6, 0.01), mid: f(0.5, 3, 0.01), high: f(1, 1, 0.004) };
        report('lab-opamp-hearing-limit', m);
        near(m.low, 664, 25, 'knob down: 102 kΩ, the lowest pitch (Hz)');
        near(m.mid, 1266, 60, 'knob half way (Hz)');
        near(m.high, 14463, 1200, 'knob up: 2.2 kΩ, slew-limited top (Hz)');
    });

    test('lab-opamp-beats: the sum swells and fades at the difference of the two pitches', () => {
        const x = bench('lab-opamp-beats', { detune: { position: 0.6 } });
        x.run(3);
        const t1 = []; const t2 = []; const env = []; let p1 = x.v('u', '1_out') > 3.75; let p2 = x.v('u', '2_out') > 3.75;
        let lo = Infinity; let hi = -Infinity; let n = 0;
        x.each(30, 0.05, (t) => {
            const a = x.v('u', '1_out') > 3.75; const b = x.v('u', '2_out') > 3.75;
            if (a !== p1) t1.push(t); if (b !== p2) t2.push(t); p1 = a; p2 = b;
            const s = x.v('u', '3_out'); lo = Math.min(lo, s); hi = Math.max(hi, s);
            if (++n % 30 === 0) { env.push([r3(t), r3(hi - lo)]); lo = Infinity; hi = -Infinity; }
        });
        const f1 = 1000 / period(t1); const f2 = 1000 / period(t2);
        const big = env.reduce((a, b) => (b[1] > a[1] ? b : a)); const small = env.reduce((a, b) => (b[1] < a[1] ? b : a));
        const m = { f1: r3(f1), f2: r3(f2), beat: r3(Math.abs(f2 - f1)), env, max: big, min: small };
        report('lab-opamp-beats', m);
        near(m.f1, 930, 30, 'first generator (Hz)');
        near(m.beat, 50, 15, 'DETUNE at 0.6: the pitches differ by about 50 Hz');
        near(m.max[1], 2.3, 0.3, 'in step: the triangles add (V pp)');
        // MEASURED 2026-11-25: min < 0.8 -> observed 0.36 V pp.
        assert.ok(m.min[1] < 0.8, `opposite: they cancel (${m.min[1]} V pp)`);
    });

    test('lab-wien-mosfet: the MOSFET holds a clean sine; without it the oscillation grows until it clips', () => {
        const x = bench('lab-wien-mosfet');
        x.run(160);
        const s = x.span('u', '1_out', 10, 0.025);
        const ts = x.crossings('u', '1_out', x.v('u', '2_out'), 6, 0.025);
        const m = { sine: s, gate: r3(x.v('q', 'gate1') - x.v('q', 'source')), f: r3(1000 / period(ts)) };
        x.set('agcoff', 1); x.run(30);
        m.clipped = x.span('u', '1_out', 5, 0.025);
        report('lab-wien-mosfet', m);
        near(m.f, 1000, 80, 'Wien frequency 1/(2π·15 kΩ·10 nF) ≈ 1.06 kHz (Hz)');
        near(m.sine.pp, 2.46, 0.1, 'AGC: the amplitude settles at about 1.2 V peak (V pp)');
        near(m.gate, -0.91, 0.05, 'AGC: the gates sit near pinch-off, the channel a few hundred ohms more (V)');
        // MEASURED 2026-11-25: clipped.pp > 5 -> observed 7.454 V pp.
        assert.ok(m.clipped.pp > 5, `AGC OFF: it grows to the output limits (${m.clipped.pp} V pp)`);
    });

    test('lab-opamp-led-pitch: nulled for the red LED it is silent; the green LED sounds a tone', () => {
        const f = (sel, p, ms) => {
            const x = bench('lab-opamp-led-pitch', { sel: { position: sel }, null: { position: p } });
            x.run(3);
            const ts = x.crossings('u', '2_out', 3.75, ms, 0.01);
            return { hz: ts.length > 2 ? r3(1000 / period(ts)) : 0, edges: ts.length, diff: r3(x.v('vm', 'a') - x.v('vm', 'b')), led: r3(x.v('u', '3_out')) };
        };
        const m = { redAuthored: f(0, 0.1, 20), redNulled: f(0, 0.18, 12), greenSame: f(1, 0.18, 6) };
        report('lab-opamp-led-pitch', m);
        near(m.redAuthored.led, 1.598, 0.01, 'red LED forward voltage at 1.5 mA (V)');
        near(m.greenSame.led, 1.895, 0.01, 'green LED forward voltage at 1.5 mA (V)');
        near(m.redAuthored.hz, 164, 20, 'red, NULL at 0.1: 43 mV above the pot, a low tone (Hz)');
        assert.equal(m.redNulled.edges, 0, 'red, NULL at 0.18: the pot is above the LED, no tone');
        near(m.greenSame.hz, 828, 40, 'green, same NULL: 0.28 V difference, a tone again (Hz)');
    });

    test('lab-opamp-key-finder: a loud enough whistle latches the alarm; silence does not clear it, RESET does', () => {
        const x = bench('lab-opamp-key-finder');
        x.run(40);
        const al = () => r3(x.v('u', '4_out'));
        const whistle = (db) => { x.param('mic', 'soundDb', db); x.run(10); const a = al(); x.param('mic', 'soundDb', 0); x.run(10); return [a, al()]; };
        const reset = () => { x.set('reset', 1); x.run(5); x.set('reset', 0); x.run(5); return al(); };
        const m = { quiet: al(), margin: r3(x.v('vm', 'a') - x.v('vm', 'b')), n80: whistle(80), n90: whistle(90) };
        m.reset = reset();
        x.param('sens', 'position', 1); x.run(30); m.sensQuiet = al();
        m.s60 = whistle(60); m.s70 = whistle(70); m.reset2 = reset();
        report('lab-opamp-key-finder', m);
        const ON = 7.2; const OFF = 0.005;
        near(m.quiet, OFF, 0.01, 'quiet: alarm off (V)');
        near(m.n80[1], OFF, 0.01, 'normal, 80 dB whistle: not enough (V)');
        near(m.n90[0], ON, 0.1, 'normal, 90 dB whistle: alarm on (V)');
        near(m.n90[1], ON, 0.1, 'whistle stopped: the alarm holds itself (V)');
        near(m.reset, OFF, 0.01, 'RESET: alarm off (V)');
        near(m.s60[1], OFF, 0.01, 'SENSITIVE, 60 dB: not enough (V)');
        near(m.s70[1], ON, 0.1, 'SENSITIVE, 70 dB: alarm on and held — 20 dB more sensitive (V)');
        near(m.reset2, OFF, 0.01, 'RESET again (V)');
    });

    test('lab-opamp-gated-tones: the slow oscillator chops the tone into bursts; RATTLE makes them fast', () => {
        const run = () => {
            const x = bench('lab-opamp-gated-tones', { rattle: { position: 1 } });
            x.run(20);
            const gate = []; const halves = []; let pg = x.v('u', '1_out') > 3.75; let pt = x.v('u', '2_out') > 3.75;
            let lastRise = -1; let lastTone = null; let inClosed = 0;
            x.each(60, 0.02, (t) => {
                const g = x.v('u', '1_out') > 3.75; const tn = x.v('u', '2_out') > 3.75;
                if (g !== pg) { gate.push(t); if (g) lastRise = t; }
                if (tn !== pt) {
                    if (g && t - lastRise > 0.3) inClosed++;
                    if (!g && lastTone !== null) halves.push(t - lastTone);
                    lastTone = t;
                }
                pg = g; pt = tn;
            });
            const open = halves.filter(h => h < 2);
            return { gateHz: r3(1000 / period(gate)), toneHalves: open.length, inClosed,
                shortest: r3(Math.min(...open)), longest: r3(Math.max(...open)) };
        };
        const m = { plain: run() };
        report('lab-opamp-gated-tones', m);
        near(m.plain.gateHz, 69.5, 5, 'RATTLE: the gate opens and closes about 70 times a second (Hz)');
        // MEASURED 2026-11-25: toneHalves > 20 -> observed 24 half-periods.
        assert.ok(m.plain.toneHalves > 20, `the tone runs while the gate is open (${m.plain.toneHalves} half-periods)`);
        assert.equal(m.plain.inClosed, 0, 'no tone while the gate is closed');
    });

    test('lab-opamp-chirp: each sawtooth slides the pitch up several-fold and drops it at once; SLOW stretches the slide tenfold', () => {
        const x = bench('lab-opamp-chirp');
        x.run(40);
        const tone = []; const falls = []; const rises = [];
        let pt = x.v('u', '4_out') > 3.75; let pg = x.v('u', '1_out') > 3.75;
        x.each(115, 0.05, (t) => {
            const tn = x.v('u', '4_out') > 3.75; const g = x.v('u', '1_out') > 3.75;
            if (tn !== pt) tone.push(t);
            if (g !== pg) (g ? rises : falls).push(t);
            pt = tn; pg = g;
        });
        const hz = (a, b) => r3(tone.filter(t => t >= a && t < b).length / 2 / ((b - a) / 1000));
        const end = falls[0]; const again = rises.find(t => t > end);
        const m = { firstTone: r3(tone[0]), end: r3(end), again: r3(again),
            early: hz(tone[0], tone[0] + 10), late: hz(end - 10, end), after: hz(again, again + 8) };
        // SLOW: the same slide over a ten times larger capacitor. The control
        // voltage's climb from 2 V to 4 V is timed in both settings.
        const climb = (limitMs, step) => {
            let t2 = null; let t4 = null; const stop = x.t + limitMs;
            while (t4 === null && x.t < stop) {
                x.run(step); const v = x.v('u', '2_out');
                if (t2 === null && v > 2) t2 = x.t;
                if (t2 !== null && v > 4) t4 = x.t;
            }
            return r3(t4 - t2);
        };
        m.climbChick = climb(150, 0.1);
        x.set('slow', 1);
        m.climbCrow = climb(2000, 1);
        report('lab-opamp-chirp', m);
        near(m.early, 200, 120, 'start of a chirp: a low growl (Hz)');
        near(m.late, 700, 100, 'end of the slide: about 700 Hz (Hz)');
        assert.ok(m.late > 2.5 * m.early, `the pitch slides several-fold (${m.early} -> ${m.late} Hz)`);
        near(m.end - m.firstTone, 75, 12, 'one chirp rises for about 75 ms (ms)');
        near(m.again - m.end, 3.5, 2.5, 'the sawtooth drops back in a few milliseconds (ms)');
        near(m.after, 120, 100, 'right after the drop the pitch is low again (Hz)');
        near(m.climbCrow / m.climbChick, 10, 2, 'SLOW: the control voltage climbs about ten times slower');
    });

    test('lab-ir-reflect-alarm: an object near the sensor pair latches the alarm and starts the tone; RESET stops it', () => {
        const x = bench('lab-ir-reflect-alarm');
        x.run(15);
        const lvl = () => r3(x.v('meter', 'a') - x.v('meter', 'b'));
        const latch = () => r3(x.v('u', '3_out'));
        const m = { far: [lvl(), latch()] };
        x.param('surface', 'distanceCm', 5); x.run(10); m.five = [lvl(), latch()];
        x.param('surface', 'distanceCm', 3);
        let tLatch = null; const t0 = x.t;
        x.each(15, 0.5, (t) => { if (tLatch === null && x.v('u', '3_out') > 3.75) tLatch = r3(t - t0); });
        m.three = [lvl(), latch(), tLatch];
        m.tone = x.span('amp', 'vout', 2, 0.02).pp;
        x.param('surface', 'distanceCm', 20); x.run(2); m.away = latch();
        // RESET held 60 ms: the tone stops at once, and the rectified level drains (22 kΩ, 1 µF).
        x.set('reset', 1); x.run(60); x.set('reset', 0); x.run(3); m.reset = latch();
        m.toneAfter = x.span('amp', 'vout', 1, 0.02).pp;
        // Steady room light on the phototransistor: no pulses, nothing passes the band-pass.
        const y = bench('lab-ir-reflect-alarm', { pt: { light: 0.05 } });
        y.run(25); m.roomLight = [r3(y.v('meter', 'a') - y.v('meter', 'b')), r3(y.v('u', '3_out')), r3(y.v('pt', 'emitter'))];
        report('lab-ir-reflect-alarm', m);
        near(m.far[1], 0.005, 0.01, 'nothing in front: alarm off (V)');
        near(m.five[1], 0.005, 0.01, 'object at 5 cm: level below the threshold, alarm off (V)');
        near(m.three[1], 7.19, 0.1, 'object at 3 cm: alarm latched (V)');
        // MEASURED 2026-11-25: tone > 5 -> observed 7.175 V pp.
        assert.ok(m.tone > 5, `latched: the LM386 tone sounds (${m.tone} V pp)`);
        near(m.away, 7.19, 0.1, 'object gone: the alarm holds itself (V)');
        near(m.reset, 0.005, 0.01, 'RESET: alarm off (V)');
        // MEASURED 2026-11-25: toneAfter < 0.05 -> observed 0.000 V pp.
        assert.ok(m.toneAfter < 0.05, `RESET: the tone stops (${m.toneAfter} V pp)`);
        near(m.roomLight[1], 0.005, 0.01, 'steady room light alone: no alarm (V)');
    });
});
