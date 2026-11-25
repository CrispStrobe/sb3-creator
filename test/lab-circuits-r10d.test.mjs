/**
 * The r10d benches from `scripts/gen-lab-circuits-4.mjs --set=r10d` do what
 * their EXPECTED.md says: measured on the COMMITTED circuit.json, with the
 * stimuli a learner would set (a field probe's distance knob, a button,
 * slide and toggle switches, pots).
 *
 * Readouts are the engine's own surfaces: node voltages, resistor currents,
 * a meter's reading. Every flip of an LM386 oscillator costs the solver many
 * steps, so tones are listened to for a few milliseconds only. Two scenarios
 * shorten a time that the claim does not depend on, and say so: the field
 * probe's hand movement (moveSeconds) and, for timing the chime's monoflop,
 * the tone generator's own capacitor (the pulse length is set by the
 * monoflop alone).
 *
 * Every number was measured on the headless engine (bw-board 2965782a) when
 * the bench was built; the tolerances are bands around those measurements.
 * With R10D_MEASURE=1 each scenario also prints what it measured.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r10d.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set r10d)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const MEASURE = !!process.env.R10D_MEASURE;
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
        get t () { return tMs; },
    };
    return api;
}

/** Measured chime length (ms): 100 kOhm x 4.7 uF monoflop. */
const CHIME_MS = 310;

const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${Number(got).toFixed(4)}, expected ${want} +-${tol}`);
const r3 = (x) => Math.round(x * 1000) / 1000;
/** Mean period (ms) from a list of crossing times: every second one is a whole period. */
const period = (ts) => (ts.length < 3 ? 0 : (ts[ts.length - 1 - ((ts.length - 1) % 2)] - ts[0]) / Math.floor((ts.length - 1) / 2));

describe('lab benches (set r10d) behave as documented', { skip: SKIP }, () => {

    test('lab-amp-dc-gain: the meter reads gain × input, the gain set by the resistor across pins 1 and 8', () => {
        const x = bench('lab-amp-dc-gain');
        x.run(5);
        const rd = () => ({ vin: r3(x.v('vin', 'a') * 1000), out: r3(x.state('meter').reading) });
        const m = { open: rd() };
        for (const s of ['s1', 's2', 's3', 's4']) { x.set(s, 1); x.run(5); m[s] = rd(); x.set(s, 0); x.run(5); }
        x.set('pin', 0); x.run(5); m.zero = rd();
        report('lab-amp-dc-gain', m);
        near(m.open.vin, 9.545, 0.05, 'input at half knob (mV)');
        near(m.open.out, 0.189, 0.01, 'pins 1-8 open: meter (V), gain 20');
        near(m.s1.out, 0.383, 0.01, '1 kOhm across pins 1-8: meter (V), gain 40');
        near(m.s2.out, 0.818, 0.015, '220 Ohm: meter (V), gain 86');
        near(m.s3.out, 1.437, 0.02, '47 Ohm: meter (V), gain 151');
        near(m.s4.out, 1.893, 0.02, 'wire: meter (V), gain 198');
        near(m.zero.out, 0.004, 0.01, 'input at zero: meter at zero (V)');
        near(m.s4.out / m.open.out, 10, 0.3, 'shorting pins 1-8 raises the DC gain tenfold');
    });

    test('lab-amp-schmitt-sweep: the output snaps high near 2.3 V and back low only near 1.6 V', () => {
        const x = bench('lab-amp-schmitt-sweep');
        x.run(5);
        const m = { rest: { out: r3(x.v('u', 'vout')), inn: r3(x.v('u', 'inn')), green: r3(x.mA('rg')), red: r3(x.mA('rr')) } };
        let prev = x.v('vm', 'a');
        for (let p = 0.8; p <= 0.95 && !m.up; p += 0.005) {
            x.set('pot', p); x.run(2);
            if (x.v('u', 'vout') > 4.5) m.up = { knob: r3(p), lastBelow: r3(prev) };
            prev = x.v('vm', 'a');
        }
        m.high = { out: r3(x.v('u', 'vout')), red: r3(x.mA('rr')), green: r3(x.mA('rg')) };
        for (let p = 0.7; p >= 0.5 && !m.down; p -= 0.005) {
            x.set('pot', p); x.run(2);
            if (x.v('u', 'vout') < 4.5) m.down = { knob: r3(p), lastAbove: r3(prev) };
            prev = x.v('vm', 'a');
        }
        report('lab-amp-schmitt-sweep', m);
        near(m.rest.inn, 1.184, 0.02, 'reference on the - input (V)');
        near(m.rest.out, 0.901, 0.02, 'knob at zero: output low (V)');
        near(m.rest.green, 6.09, 0.2, 'green LED on (mA)');
        near(m.up.lastBelow, 2.281, 0.03, 'wiper just before the upward snap (V)');
        near(m.high.out, 8.098, 0.02, 'output high (V)');
        near(m.high.red, 6.39, 0.2, 'red LED on (mA)');
        near(m.down.lastAbove, 1.641, 0.03, 'wiper just before the downward snap (V)');
        near(m.up.lastBelow - m.down.lastAbove, 0.64, 0.06, 'hysteresis on the wiper (V)');
    });

    test('lab-mosfet-tone-key: a negative charge near the gate wire starts the tone, taking it away stops it', () => {
        // The hand movement is shortened from 0.2 s to 5 ms: the induced
        // charge depends on the end position, not on how fast it is reached.
        const x = bench('lab-mosfet-tone-key', { pr: { moveSeconds: 0.005 } });
        x.run(5);
        const st = () => ({ gate: r3(x.v('m', 'gate1')), drain: r3(x.v('m', 'drain')), inp: r3(x.v('u', 'inp')), led: r3(x.mA('rl')) });
        const m = { rest: { ...st(), pp: r3(x.span('u', 'vout', 4, 0.05).pp) } };
        x.set('pr', 0.3); x.run(8);
        m.near = st();
        const ts = x.crossings('u', 'vout', 4.5, 8, 0.02);
        m.near.periodMs = r3(period(ts));
        m.near.pp = r3(x.span('u', 'vout', 4, 0.02).pp);
        x.run(10);
        m.held = { gate: r3(x.v('m', 'gate1')), pp: r3(x.span('u', 'vout', 4, 0.02).pp) };
        x.set('pr', 0); x.run(8);
        m.away = { ...st(), pp: r3(x.span('u', 'vout', 4, 0.05).pp) };
        report('lab-mosfet-tone-key', m);
        near(m.rest.gate, 0, 0.02, 'no ruler: gate at 0 V');
        near(m.rest.drain, 0.303, 0.03, 'channel on: drain (V)');
        near(m.rest.inp, 0.506, 0.03, '+ input clamped through the germanium diode (V)');
        near(m.rest.led, 1.511, 0.05, 'LED shows the channel current (mA)');
        // MEASURED 2026-11-25: m.rest.pp < 0.01 -> observed 0.000 V pp.
        assert.ok(m.rest.pp < 0.01, `no ruler: silent (${m.rest.pp} V pp)`);
        near(m.near.gate, -2.218, 0.1, 'ruler a third of the way: gate (V), beyond pinch-off');
        near(m.near.drain, 7.835, 0.05, 'channel off: drain (V)');
        near(m.near.led, 0, 0.01, 'LED out (mA)');
        near(m.near.pp, 7.178, 0.05, 'tone at the output (V pp)');
        near(m.near.periodMs, 3.56, 0.15, 'tone period (ms)');
        near(m.held.gate, -2.212, 0.1, 'ruler held still: the gate keeps its charge (V)');
        near(m.held.pp, 7.178, 0.05, 'and the tone goes on (V pp)');
        near(m.away.gate, 0.004, 0.03, 'ruler away: gate back near 0 V');
        // MEASURED 2026-11-25: m.away.pp < 0.01 -> observed 0.002 V pp.
        assert.ok(m.away.pp < 0.01, `ruler away: silent (${m.away.pp} V pp)`);
        near(m.away.led, 1.511, 0.05, 'LED on again (mA)');
    });

    test('lab-door-chime: a short press starts the tone at once', () => {
        const x = bench('lab-door-chime');
        x.run(20);
        const m = { rest: { q1c: r3(x.v('q1', 'collector')), inp: r3(x.v('u', 'inp')), pp: r3(x.span('u', 'vout', 3, 0.05).pp) } };
        x.set('door', 1); x.run(5); x.set('door', 0);
        m.pressed = { q1c: r3(x.v('q1', 'collector')), q2b: r3(x.v('q2', 'base')), pp: r3(x.span('u', 'vout', 6, 0.02).pp) };
        report('lab-door-chime', m);
        near(m.rest.q1c, 5.45, 0.1, 'at rest Q1 is off (V): its collector holds the kill NPN on');
        near(m.rest.inp, 0.03, 0.03, 'oscillator + input held low (V)');
        // MEASURED 2026-11-25: m.rest.pp < 0.01 -> observed 0.0000006 V pp.
        assert.ok(m.rest.pp < 0.01, `silent at rest (${m.rest.pp} V pp)`);
        near(m.pressed.q1c, 0.075, 0.05, 'pulse running: Q1 on (V)');
        // MEASURED 2026-11-25: m.pressed.q2b < -3 -> observed -4.915 V.
        assert.ok(m.pressed.q2b < -3, `Q2's base driven below zero by the 4.7 uF (${m.pressed.q2b} V)`);
        near(m.pressed.pp, 7.178, 0.05, 'the chime sounds (V pp)');
    });

    test('lab-door-chime: the pulse that gates the chime lasts about 0.31 s however short the press', () => {
        // Timed on the monoflop alone: the tone generator's pull-up (rv) is
        // lifted to 1 GOhm so it cannot start, because a third of a second of
        // LM386 oscillation costs the solver far too many steps. The pulse is
        // Q1's collector held low, which is exactly what releases the tone.
        const x = bench('lab-door-chime', { rv: { ohms: 1e9 } });
        x.run(50);
        const t0 = x.t;
        x.set('door', 1); x.run(10); x.set('door', 0);
        let tEnd = null;
        x.each(500, 2, (t) => { if (tEnd === null && x.v('q1', 'collector') > 2.5) tEnd = t; });
        const m = { pulseMs: tEnd === null ? null : r3(tEnd - t0), q1c: r3(x.v('q1', 'collector')), qkb: r3(x.v('qk', 'base')) };
        report('lab-door-chime (pulse)', m);
        assert.notEqual(m.pulseMs, null, 'the pulse ends by itself');
        near(m.pulseMs, CHIME_MS, 25, 'pulse length (ms), about 0.69 x 100 kOhm x 4.7 uF');
        near(m.qkb, 0.678, 0.05, 'afterwards the kill NPN is on again (base, V)');
    });

    test('lab-amp-supply-decoupling: a weak battery makes it howl, the adaptor makes it hum, decoupling cures both', () => {
        const run = (cfg) => {
            const x = bench('lab-amp-supply-decoupling', Object.fromEntries(Object.entries(cfg).map(([k, v]) => [k, { position: v }])));
            x.run(60);
            const out = x.span('u', 'vout', 40, 0.25);
            const ts = x.crossings('u', 'vout', (out.lo + out.hi) / 2, 60, 0.25);
            const vs = x.span('u', 'vs', 20, 0.25);
            return { lo: r3(out.lo), hi: r3(out.hi), pp: r3(out.pp), periodMs: r3(period(ts)), crossings: ts.length, vsLo: r3(vs.lo), vsHi: r3(vs.hi) };
        };
        const m = { fresh: run({}), weak: run({ weak: 1 }), weakDec: run({ weak: 1, dec: 1 }), adaptor: run({ src: 1 }), adaptorDec: run({ src: 1, dec: 1 }) };
        report('lab-amp-supply-decoupling', m);
        assert.equal(m.fresh.crossings, 0, 'fresh battery: no oscillation');
        near(m.fresh.vsLo, 8.999, 0.01, 'fresh battery: supply steady (V)');
        near(m.weak.periodMs, 8.18, 0.6, 'weak battery: it howls by itself (period, ms)');
        near(m.weak.hi, 3.461, 0.3, 'howl: output top (V)');
        // MEASURED 2026-11-25: m.weak.vsLo < 5 -> observed 3.653 V.
        assert.ok(m.weak.vsLo < 5, `the supply at the chip dips by volts (${m.weak.vsLo} V)`);
        // MEASURED 2026-11-25: m.weakDec.pp < 0.1 -> observed 0.025 V pp.
        assert.ok(m.weakDec.pp < 0.1, `weak battery, decoupled: quiet (${m.weakDec.pp} V pp)`);
        near(m.weakDec.vsLo, 8.752, 0.02, 'decoupled: steady supply behind the 47 Ohm (V)');
        // MEASURED 2026-11-25: m.adaptor.pp > 5 -> observed 6.494 V pp.
        assert.ok(m.adaptor.pp > 5, `adaptor: loud hum (${m.adaptor.pp} V pp)`);
        near(m.adaptorDec.pp, 0.116, 0.03, 'adaptor, decoupled: faint hum (V pp)');
        near(m.adaptorDec.periodMs, 10, 0.3, 'that hum is the 100 Hz ripple (period, ms)');
    });
});
