/**
 * The r6f bench loader and assertion helpers, shared by
 * test/lab-circuits-r6f.test.mjs and lab-circuits-r6f-2.test.mjs. The set's
 * 29 scenarios ran past the 900 s per-file timeout as one file on CI
 * (2026-11-26, before any of them reported); each half now runs in its own
 * process. Nothing in a scenario changed.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './siblings.mjs';
import { injectEngine } from '../../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../../scripts/lib/lab-benches-r6f.mjs';

export function r6fGate (half) {
    const gate = requireSiblings('bw-board', 'bw-circuit-ui');
    siblingGuardTest(gate, `the lab bench scenarios (round 6, r6f, part ${half})`);
    return gate;
}

let Circuit;
export async function loadR6f (gate) {
    if (!gate.skip && !Circuit) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));
}

const EXAMPLES = join(import.meta.dirname, '..', '..', 'examples');

/** Load a committed bench, its role params edited first ({role: {key: value}}). */
export function bench (id, edits = {}) {
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

// R6HT_OBSERVE=1 prints every measured value beside its claim (used to write
// the MEASURED notes and the EXPECTED.md tables).
const OBSERVE = Boolean(process.env.R6HT_OBSERVE);
export const near = (got, want, tol, what) => {
    if (OBSERVE) console.log(`OBSERVE near ${what}: ${got} (claim ${want} +-${tol})`);
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);
};
/** Pass a bounded value through, printing it when observing. */
export const seen = (what, v) => { if (OBSERVE) console.log(`OBSERVE seen ${what}: ${v}`); return v; };

