/**
 * The magnetic-coupling benches from `scripts/gen-lab-circuits-4.mjs
 * --set=r7mech` do what their EXPECTED.md says, measured on the COMMITTED
 * circuit.json with the controls a learner has: the field sources' distance
 * dials, the lamp switch, the astable's pot, the push button.
 *
 * Readouts are node voltages and device states (bw-board
 * src/magnetic-coupling.js). The cable tracer runs an LM386 at audio rates
 * and the pendulum needs seconds of simulated swing, so the scenarios are
 * few. Every number was measured on the headless engine (bw-board master
 * 2c62bd54) when the bench was built.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r7mech.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set r7mech, magnetic coupling)');
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
    const netOf = (name, term) => {
        const n = b.getNets().find(n => n.terminals.some(x => x.part === ids[name] && x.terminal === term));
        assert.ok(n, `${id}: no net for ${name}.${term}`);
        return n.id;
    };
    const api = {
        c, b, ids,
        v (name, term) { return b.nodeVoltages.get(netOf(name, term)) ?? 0; },
        tone (name) { return b.buzzerTone(ids[name]); },
        state (name) { return b.getDeviceState(ids[name]); },
        run (ms) {
            tMs += ms;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
        },
        set (name, value) { b.setControl(ids[name], value); },
        param (name, key, value) { b.setPartParam(ids[name], key, value); },
        get t () { return tMs; },
    };
    return api;
}

/** Set one param of the part named `name` before loading. */
const withParam = (name, key, value) => (json, ids) => { json.parts.find(p => p.id === ids[name]).params[key] = value; };

const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);


/** Amplitude (V peak) of the f Hz part of samples [[tMs, v], …] (correlation). */
function amplitudeAt (samples, f) {
    let s = 0, c = 0;
    for (const [t, v] of samples) { s += v * Math.sin(2 * Math.PI * f * t / 1000); c += v * Math.cos(2 * Math.PI * f * t / 1000); }
    return 2 * Math.hypot(s, c) / samples.length;
}

describe('lab magnetic-coupling benches (set r7mech) behave as documented', { skip: SKIP }, () => {
    test('lab-cable-tracer: a loaded cable hums near the pickup, an unloaded one does not; the telephone is heard close by', () => {
        const listen = (phone, cable, lamp) => {
            const x = bench('lab-cable-tracer');
            x.b.setPower(true);
            if (phone !== null) { x.set('phone', phone); x.set('cable', cable); x.set('lampsw', lamp); }
            x.run(60);
            const s = [];
            for (let i = 0; i < 400; i++) { x.run(0.1); s.push([x.t, x.v('spk', 'a')]); }
            return { a50: amplitudeAt(s, 50), a800: amplitudeAt(s, 800), x };
        };
        const rest = listen(null, null, null);
        const on = listen(0, 0.9, 0);
        const off = listen(0, 0.9, 1);
        const phone = listen(0.75, 0, 0);
        // MEASURED 2026-11-25: rest.a50 -> observed 0.0047, rest.a800 -> 0.0225.
        assert.ok(rest.a50 < 0.01 && rest.a800 < 0.05, `at rest: ${rest.a50} V hum, ${rest.a800} V tone`);
        // MEASURED 2026-11-25: on.a50 -> observed 0.142.
        assert.ok(on.a50 > 0.07, `loaded cable 3.9 cm away: ${on.a50} V of 50 Hz`);
        // MEASURED 2026-11-25: off.a50 -> observed 0.0051.
        assert.ok(off.a50 < on.a50 / 10, `lamp off: ${off.a50} V of 50 Hz`);
        // MEASURED 2026-11-25: phone.a800 -> observed 0.627.
        assert.ok(phone.a800 > 0.1, `telephone 15.75 cm away: ${phone.a800} V of 800 Hz`);
        assert.ok(phone.a800 > 5 * rest.a800, 'nearer, louder');
    });

    test('lab-pendulum-kick: pulses near its own rate swing the clip up, fast pulses do not', () => {
        const swing = (pos) => {
            const x = bench('lab-pendulum-kick');
            x.b.setPower(true);
            x.set('pot', pos);
            x.run(8000);
            return x.state('pend');
        };
        const tuned = swing(0.82), fast = swing(1), slow = swing(0.72);
        // MEASURED 2026-11-25: tuned.amplitudeDeg -> observed 9.02, fast -> 0.76, slow -> 0.51.
        assert.ok(tuned.amplitudeDeg > 5, `pot 0.82: ${tuned.amplitudeDeg}°`);
        assert.ok(fast.amplitudeDeg < 1.5, `pot 1 (fast pulses): ${fast.amplitudeDeg}°`);
        assert.ok(slow.amplitudeDeg < tuned.amplitudeDeg / 3, `pot 0.72 (too slow): ${slow.amplitudeDeg}°`);
        near(tuned.naturalHz, 1.287, 0.002, 'natural frequency of a 15 cm pendulum');
    });

    test('lab-wireless-click: each press clicks across a hand\'s width; holding is silent; far away it fades', () => {
        const press = (pos) => {
            const x = bench('lab-wireless-click');
            x.b.setPower(true);
            if (pos !== undefined) x.set('tx', pos);
            x.run(5);
            const before = x.v('ep', 'a');
            x.set('key', 1);
            let peak = 0;
            for (let i = 0; i < 100; i++) { x.run(0.01); peak = Math.max(peak, x.v('ep', 'a')); }
            x.run(20);
            const held = x.v('ep', 'a');
            x.set('key', 0);
            let back = 0;
            for (let i = 0; i < 100; i++) { x.run(0.01); back = Math.max(back, x.v('ep', 'a')); }
            return { before, peak, held, back };
        };
        const hand = press(), far = press(0.2);
        near(hand.before, 0, 1e-6, 'nothing before the press');
        // MEASURED 2026-11-25: hand.peak -> observed 0.462.
        assert.ok(hand.peak > 0.2, `click at 8 cm: ${hand.peak} V`);
        assert.ok(Math.abs(hand.held) < 1e-3, `held: ${hand.held} V`);
        assert.ok(hand.back < 1e-3, `release: the reversed pulse is blocked (${hand.back} V)`);
        // MEASURED 2026-11-25: far.peak -> observed 0.00079.
        assert.ok(far.peak < hand.peak / 20, `at 24 cm: ${far.peak} V`);
    });
});
