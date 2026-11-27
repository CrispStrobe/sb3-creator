/**
 * The threshold benches from `scripts/gen-lab-circuits-4.mjs --set=thresholds`
 * do what their EXPECTED.md says: measured on the COMMITTED circuit.json, with
 * the stimuli a learner would set (the LEVEL pot, buttons, the slide switch,
 * the sound level at the listening loudspeaker).
 *
 * lab-relay-hysteresis measures both of the relay's thresholds by turning
 * LEVEL up and back down in small steps and reading the coil voltage on each
 * side of every switch. lab-opamp-key-finder-leds reads the threshold LEDs
 * (the second LM324's outputs) beside the alarm latch.
 *
 * Every number was measured on the headless engine (bw-board de8083c5) when
 * the benches were built; the tolerances are bands around those measurements.
 * With THRESHOLDS_MEASURE=1 each scenario also prints what it measured.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-thresholds.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set thresholds)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const MEASURE = !!process.env.THRESHOLDS_MEASURE;
const report = (id, m) => { if (MEASURE) console.log(`MEASURED ${id} ${JSON.stringify(m)}`); };
const r3 = (x) => Math.round(x * 1000) / 1000;
const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got}, expected ${want} ± ${tol}`);

/** Load a committed bench and name its parts by role. */
function bench (id) {
    const json = JSON.parse(readFileSync(join(EXAMPLES, id, 'circuit.json'), 'utf8'));
    const ids = benchIds(BENCHES[id]);
    const b = Circuit.fromJSON(json).board;
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
        ids,
        v (name, term) { return b.nodeVoltages.get(netOf(name, term)) ?? 0; },
        run (ms) {
            tMs += ms;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
        },
        set (name, value) { b.setControl(ids[name], value); },
        param (name, key, value) { b.setPartParam(ids[name], key, value); },
        state (name) { return b.getDeviceState(ids[name]); },
        led (name) { return b.ledBrightness(ids[name]); },
    };
    return api;
}

describe('lab benches (set thresholds)', { skip: SKIP }, () => {
    test('lab-relay-hysteresis: the relay pulls in at pullInV, holds below it, and lets go only at dropOutV', () => {
        const x = bench('lab-relay-hysteresis');
        const coil = () => x.v('k', 'coil_a') - x.v('k', 'coil_b');
        const isIn = () => x.state('k').energized;
        x.run(1);
        const m = { start: { coil: r3(coil()), in: isIn() } };
        x.run(19);
        m.rest = { coil: r3(coil()), in: isIn(), redOn: x.led('lin') > 0.05, greenOn: x.led('lout') > 0.05 };
        // LEVEL in steps of 0.01, 6 ms each (the relay switches 5 ms after
        // its coil crosses a threshold). A switch is recorded with the coil
        // voltage of the step before it and of the step it happened in: the
        // threshold lies between the two.
        let p = 0.5; let prev = isIn(); let before = coil();
        const events = [];
        const sweep = (to) => {
            const d = to > p ? 0.01 : -0.01;
            while (Math.abs(p - to) > 1e-9) {
                p = Math.round((p + d) * 100) / 100;
                x.param('level', 'position', p);
                x.run(6);
                const now = isIn(); const v = coil();
                if (now !== prev) events.push({ at: p, in: now, before: r3(before), after: r3(v) });
                prev = now; before = v;
            }
        };
        sweep(0.9);
        const top = { coil: r3(coil()), in: isIn() };
        sweep(0.6); m.holding = { coil: r3(coil()), in: isIn() };
        sweep(0.3);
        sweep(0.6); m.outAgain = { coil: r3(coil()), in: isIn() };
        m.top = top; m.events = events;
        // TAP with LEVEL back at 0.5 and the relay out.
        x.param('level', 'position', 0.5); x.run(30);
        const tapBefore = isIn();
        x.set('tap', 1); x.run(2); const kick = r3(coil()); x.run(20); x.set('tap', 0); x.run(100);
        m.tap = { before: tapBefore, kick, after: isIn(), coil: r3(coil()), redOn: x.led('lin') > 0.05 };
        report('lab-relay-hysteresis', m);

        near(m.start.coil, 3.14, 0.05, 'LEVEL 0.5 at switch-on: coil (V)');
        assert.equal(m.rest.in, false, 'at switch-on the relay is out (3.1 V is below pull-in)');
        assert.ok(m.rest.greenOn && !m.rest.redOn, 'OUT lit, IN dark');
        assert.equal(events.length, 2, `exactly one pull-in and one drop-out: ${JSON.stringify(events)}`);
        const [pull, drop] = events;
        assert.equal(pull.in, true); assert.equal(drop.in, false);
        assert.ok(pull.before < 6 && pull.after > 6, `pull-in between ${pull.before} and ${pull.after} V: 6 V (pullInV)`);
        assert.ok(pull.after - pull.before < 0.15, 'pull-in bracketed to 0.15 V');
        near(pull.at, 0.83, 0.02, 'pull-in at LEVEL');
        assert.ok(drop.before > 2.5 && drop.after < 2.5, `drop-out between ${drop.after} and ${drop.before} V: 2.5 V (dropOutV)`);
        assert.ok(drop.before - drop.after < 0.15, 'drop-out bracketed to 0.15 V');
        near(drop.at, 0.39, 0.02, 'drop-out at LEVEL');
        assert.equal(m.top.in, true, 'LEVEL 0.9: in');
        near(m.holding.coil, 4.0, 0.05, 'LEVEL 0.6 on the way down: coil (V)');
        assert.equal(m.holding.in, true, 'LEVEL 0.6 on the way down: still in, below pull-in');
        assert.equal(m.outAgain.in, false, 'LEVEL 0.6 on the way up again: still out, above drop-out');
        assert.equal(m.tap.before, false, 'LEVEL 0.5: out before the tap');
        assert.ok(m.tap.kick > 7.5, `TAP lifts the coil over pull-in (${m.tap.kick} V)`);
        assert.equal(m.tap.after, true, 'after the tap the relay holds itself in at LEVEL 0.5');
        near(m.tap.coil, 3.1, 0.1, 'after the tap: coil back at the LEVEL setting (V)');
        assert.ok(m.tap.redOn, 'IN lit after the tap');
    });

    test('lab-opamp-key-finder-leds: the threshold LEDs show the level against THRESHOLD; the latch holds the alarm until RESET', () => {
        const x = bench('lab-opamp-key-finder-leds');
        x.run(40);
        const HI = 3.75;
        const look = () => ({ alarm: x.v('u', '4_out') > HI, over: x.v('w', '1_out') > HI, under: x.v('w', '2_out') > HI,
            level: r3(x.v('cl', 'a')) });
        const whistle = (db) => { x.param('mic', 'soundDb', db); x.run(10); const during = look(); x.param('mic', 'soundDb', 0); x.run(10); return { during, after: look() }; };
        const reset = () => { x.set('reset', 1); x.run(5); x.set('reset', 0); x.run(5); return look(); };
        const m = { quiet: look(), thr: r3(x.v('thr', 'wiper')), ledOut: r3(x.v('w', '2_out')) };
        m.n80 = whistle(80);
        m.n90 = whistle(90);
        x.run(1500); m.n90later = look();
        m.reset = reset();
        x.param('sens', 'position', 1); x.run(30); m.sensQuiet = look();
        m.s60 = whistle(60); m.s70 = whistle(70);
        m.reset2 = reset();
        // THRESHOLD turned down below the quiet level: OVER lights in silence
        // and the alarm trips by itself.
        x.param('sens', 'position', 0); x.param('thr', 'position', 0.4); x.run(30); m.low = { ...look(), thr: r3(x.v('thr', 'wiper')) };
        report('lab-opamp-key-finder-leds', m);
        const lit = (s, alarm, over, under) => s.alarm === alarm && s.over === over && s.under === under;
        near(m.thr, 4.95, 0.01, 'THRESHOLD as built (V)');
        near(m.quiet.level, 4.166, 0.02, 'quiet: the level line (V)');
        assert.ok(lit(m.quiet, false, false, true), `quiet: UNDER lit, OVER and ALARM dark ${JSON.stringify(m.quiet)}`);
        near(m.ledOut, 7.236, 0.05, 'a lit threshold LED is driven from the op-amp output (V)');
        assert.ok(lit(m.n80.during, false, false, true), `80 dB: still UNDER ${JSON.stringify(m.n80.during)}`);
        near(m.n80.during.level, 4.48, 0.05, '80 dB: level (V)');
        assert.ok(lit(m.n90.during, true, true, false), `90 dB: OVER and the ALARM ${JSON.stringify(m.n90.during)}`);
        near(m.n90.during.level, 5.34, 0.05, '90 dB: level (V)');
        assert.ok(lit(m.n90.after, true, true, false), 'whistle just stopped: the level still over, the alarm held');
        assert.ok(lit(m.n90later, true, false, true), `1.5 s of silence: back UNDER, the ALARM still held ${JSON.stringify(m.n90later)}`);
        assert.ok(lit(m.reset, false, false, true), 'RESET: the alarm off');
        assert.ok(lit(m.s60.during, false, false, true), 'SENSITIVE, 60 dB: UNDER');
        assert.ok(lit(m.s70.during, true, true, false), 'SENSITIVE, 70 dB: OVER and the ALARM — 20 dB more sensitive');
        assert.equal(m.reset2.alarm, false, 'RESET again');
        near(m.low.thr, 3.6, 0.01, 'THRESHOLD at 0.4 (V)');
        assert.ok(lit(m.low, true, true, false), `THRESHOLD below the quiet level: OVER lit in silence and the alarm trips by itself ${JSON.stringify(m.low)}`);
    });
});
