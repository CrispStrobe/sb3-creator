/**
 * The discrete-NPN lab benches from scripts/lib/lab-benches-r6a.mjs
 * (`node scripts/gen-lab-circuits-4.mjs --set=r6a`) do what their
 * EXPECTED.md says: measured on the COMMITTED circuit.json, with the stimuli
 * a learner has (buttons, switches, slide switches, a pot, the Temperature
 * slider of a transistor on its leads).
 *
 * Pitches come from the earphone's own tone tracker (device state `_edges`,
 * alternating rising/falling crossings of the coil current): `pitch()` runs a
 * window and averages the periods between same-direction edges recorded in
 * THAT window, so a previous setting cannot leak into the reading. The audio
 * benches cost real time per simulated millisecond (three transistors
 * switching at audio rates), so every window is a few milliseconds. Every
 * number was measured on the headless engine (bw-board f4aaec43) when the
 * bench was built; the bands around them are tolerances, not targets.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r6a.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the discrete-NPN lab bench scenarios (set r6a)');
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
    const api = {
        c, b, ids,
        v (name, term) { return b.nodeVoltages.get(netOf(name, term)) ?? 0; },
        /** Current into a named part's terminal, mA, sign dropped. */
        mA (name, term = 'a') { return Math.abs(b.branchCurrent(ids[name], term)) * 1e3; },
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
    return api;
}

/** Set params of named parts before loading: edit({ mat: { position: 0 } }). */
const withParams = (byName) => (json, ids) => {
    for (const [name, params] of Object.entries(byName)) Object.assign(json.parts.find(p => p.id === ids[name]).params, params);
};

const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${Number(got).toFixed(4)}, expected ${want} +-${tol}`);

/**
 * Run `ms`, then the pitch of the earphone over that window: mean period of
 * same-direction edges recorded inside it, the number of periods and their
 * spread (max − min over mean).
 */
function pitch (x, name, ms) {
    const t0 = BigInt(Math.round(x.t * 1e6));
    x.run(ms);
    const e = (x.state(name)._edges ?? []).filter(v => v > t0).map(Number);
    const p = [];
    for (let i = 2; i < e.length; i++) p.push((e[i] - e[i - 2]) / 1e6);
    if (!p.length) return { hz: 0, n: 0, spread: 0 };
    const m = p.reduce((a, b) => a + b, 0) / p.length;
    return { hz: 1000 / m, n: p.length, spread: (Math.max(...p) - Math.min(...p)) / m };
}

/** Average of fn() sampled every dt ms over `ms`. */
function average (x, fn, ms, dt) {
    let s = 0; let n = 0;
    for (let k = 0; k < Math.round(ms / dt); k++) { x.run(dt); s += fn(); n++; }
    return s / n;
}

describe('discrete-NPN lab benches (set r6a) behave as documented', { skip: SKIP }, () => {
    test('lab-npn-two-tone-bell: silent until a button is held; LOW, HIGH and both give three pitches', () => {
        const x = bench('lab-npn-two-tone-bell');
        x.run(5);
        // MEASURED 2026-11-25: x.v('q3', 'collector') > 8.9 -> observed 9.000 (driver off, no earphone current).
        assert.ok(x.v('q3', 'collector') > 8.9, 'idle: the earphone carries no current');
        assert.equal(pitch(x, 'ep', 5).n, 0, 'idle: no tone');
        x.set('low', 1); x.run(6);
        near(pitch(x, 'ep', 8).hz, 465, 15, 'LOW (100 kΩ) pitch (Hz)');
        x.set('low', 0); x.set('high', 1); x.run(4);
        near(pitch(x, 'ep', 6).hz, 824, 25, 'HIGH (33 kΩ) pitch (Hz)');
        x.set('low', 1); x.run(4);
        near(pitch(x, 'ep', 6).hz, 910, 25, 'both (25 kΩ) pitch (Hz)');
        x.set('low', 0); x.set('high', 0); x.run(5);
        assert.equal(pitch(x, 'ep', 10).n, 0, 'released: the tone stops');
    });

    test('lab-npn-four-tone-keys: none, B, A, A+B are four rising notes', () => {
        const want = [[[], 569], [['kb'], 689], [['ka'], 824], [['ka', 'kb'], 1104]];
        let last = 0;
        for (const [keys, hz] of want) {
            const x = bench('lab-npn-four-tone-keys');
            for (const k of keys) x.set(k, 1);
            x.run(4);
            const p = pitch(x, 'ep', 6);
            near(p.hz, hz, hz * 0.03, `keys ${keys.join('+') || 'none'} pitch (Hz)`);
            assert.ok(p.hz > last, 'each combination is higher than the one before');
            last = p.hz;
        }
    });

    test('lab-npn-police-siren: SIREN raises the pitch, the smaller resistor more; SOFT rounds the current', () => {
        const x = bench('lab-npn-police-siren');
        x.run(5);
        near(pitch(x, 'ep', 6).hz, 428, 15, 'siren button up (Hz)');
        x.set('siren', 1); x.run(4);
        near(pitch(x, 'ep', 5).hz, 794, 25, 'SIREN with 47 kΩ in parallel (Hz)');
        x.set('pick', 1); x.run(4);
        near(pitch(x, 'ep', 5).hz, 1050, 35, 'SIREN with 15 kΩ in parallel (Hz)');
        // Softness: share of samples the earphone current spends between 10 %
        // and 90 % of its swing (a square wave is almost never there).
        const shape = (soft) => {
            const y = bench('lab-npn-police-siren', withParams({ soft: { closed: soft } }));
            y.run(6);
            const s = [];
            for (let i = 0; i < 500; i++) { y.run(0.005); s.push(y.mA('q3', 'emitter')); }
            const lo = Math.min(...s); const hi = Math.max(...s);
            return { mid: s.filter(v => v > lo + 0.1 * (hi - lo) && v < lo + 0.9 * (hi - lo)).length / s.length, hi };
        };
        const hard = shape(false);
        const soft = shape(true);
        // MEASURED 2026-11-25: hard.mid < 0.15 -> observed 0.078.
        assert.ok(hard.mid < 0.15, `SOFT open: square current (${hard.mid})`);
        // MEASURED 2026-11-25: soft.mid > 0.4 -> observed 0.574.
        assert.ok(soft.mid > 0.4, `SOFT closed: rounded current (${soft.mid})`);
        near(hard.hi, 3.92, 0.2, 'SOFT open: peak earphone current (mA)');
        near(soft.hi, 2.70, 0.2, 'SOFT closed: peak earphone current (mA)');
    });

    test('lab-npn-swell-siren: silent idle; holding the button swells the pitch, releasing lets it sink; SLOW is slower', () => {
        const x = bench('lab-npn-swell-siren');
        x.run(5);
        assert.equal(pitch(x, 'ep', 10).n, 0, 'idle: bias capacitor empty, no tone');
        x.set('push', 1);
        const w = [];
        for (let i = 0; i < 6; i++) w.push(pitch(x, 'ep', 6).hz);
        near(w[0], 381, 25, 'push, 0–6 ms: pitch (Hz)');
        near(w[3], 578, 20, 'push, 18–24 ms: pitch (Hz)');
        near(w[5], 637, 20, 'push, 30–36 ms: pitch (Hz)');
        assert.ok(w[0] < w[1] && w[1] < w[2] && w[2] < w[3] && w[3] < w[4] && w[4] < w[5], `rises while held: ${w.map(h => h.toFixed(0))}`);
        const pushed = x.v('cb', 'pos');
        near(pushed, 7.0, 0.2, 'bias capacitor after 36 ms (V)');
        x.set('push', 0);
        const first = pitch(x, 'ep', 15).hz;
        x.run(30);
        const later = pitch(x, 'ep', 15).hz;
        near(first, 640, 20, 'released, 0–15 ms: pitch (Hz)');
        near(later, 612, 20, 'released, 45–60 ms: pitch (Hz)');
        // MEASURED 2026-11-25: first - later > 15 -> observed 27.7 Hz.
        assert.ok(first - later > 15, `released: the pitch sinks (${first.toFixed(1)} -> ${later.toFixed(1)})`);
        near(x.v('cb', 'pos'), 6.04, 0.15, 'released 60 ms: bias capacitor (V)');
        const s = bench('lab-npn-swell-siren', withParams({ slow: { position: 1 } }));
        s.run(5); s.set('push', 1); s.run(20);
        near(pitch(s, 'ep', 10).hz, 386, 30, 'SLOW, push 20–30 ms: pitch (Hz)');
        near(s.v('cb', 'pos'), 1.90, 0.1, 'SLOW: bias capacitor after 30 ms (V), against 6.5 V without');
    });

    test('lab-npn-probe-tone: probes apart are silent; less resistance, higher pitch, dimmer LED; HIGH whistles', () => {
        const x = bench('lab-npn-probe-tone');
        x.run(3);
        assert.equal(pitch(x, 'ep', 8).n, 0, 'probes apart (an insulator): no tone');
        // MEASURED 2026-11-25: x.v('q3', 'collector') > 8.9 -> observed 9.000 (driver off).
        assert.ok(x.v('q3', 'collector') > 8.9, 'probes apart: no earphone current');
        near(x.mA('led', 'anode'), 3.21, 0.1, 'probes apart: LED steadily lit (mA)');
        // [MATERIAL position (×1 MΩ), settle ms, window ms, Hz, LED average mA]
        const rows = [[0, 1, 1, 5196, 2.37], [0.047, 2, 3, 2254, 2.84], [0.2, 3, 6, 793, 3.09], [1, 10, 20, 180.7, 3.18]];
        let lastHz = Infinity; let lastLed = 0;
        for (const [pos, settle, win, hz, led] of rows) {
            const y = bench('lab-npn-probe-tone', withParams({ probes: { closed: true }, mat: { position: pos } }));
            y.run(settle);
            const p = pitch(y, 'ep', win);
            near(p.hz, hz, hz * 0.03, `MATERIAL ${pos}: pitch (Hz)`);
            const l = average(y, () => y.mA('led', 'anode'), win, 0.05);
            near(l, led, 0.12, `MATERIAL ${pos}: LED average (mA)`);
            assert.ok(p.hz < lastHz && l > lastLed, 'more resistance: lower pitch and a brighter LED');
            lastHz = p.hz; lastLed = l;
        }
        const h = bench('lab-npn-probe-tone', withParams({ probes: { closed: true }, high: { position: 1 } }));
        h.run(1);
        near(pitch(h, 'ep', 1).hz, 9746, 400, 'HIGH, fruit: pitch (Hz)');
    });

    test('lab-npn-diode-horn: keyed horn note; the diode in the coupling path raises it and changes its duty', () => {
        const x = bench('lab-npn-diode-horn');
        x.run(3);
        near(x.v('q1', 'collector'), 0, 0.01, 'key up: unpowered');
        const run = (plain) => {
            const y = bench('lab-npn-diode-horn', withParams({ plain: { closed: plain } }));
            y.set('key', 1); y.run(12);
            const duty = average(y, () => (y.mA('q3', 'collector') > 2 ? 1 : 0), 15, 0.05);
            return { ...pitch(y, 'ep', 15), duty };
        };
        const plain = run(true);
        const diode = run(false);
        near(plain.hz, 168.4, 5, 'diode bridged: pitch (Hz)');
        near(plain.duty, 0.49, 0.04, 'diode bridged: earphone on-share');
        near(diode.hz, 198.1, 6, 'diode in the path: pitch (Hz)');
        near(diode.duty, 0.67, 0.04, 'diode in the path: earphone on-share');
        // MEASURED 2026-11-25: diode.spread < 0.01 -> observed 0.00008 (a steady note, not a stall).
        assert.ok(diode.spread < 0.01, `diode in the path: steady periods (${diode.spread})`);
    });

    test('lab-earphone-click: one click at make, one at break, none while steady, either polarity', () => {
        const x = bench('lab-earphone-click');
        x.run(50);
        for (const rev of [0, 1]) {
            x.set('sa', rev); x.set('sb', rev); x.run(100);
            x.set('key', 1); x.run(3);
            // MEASURED 2026-11-25: amps > 0.8e-3 -> observed 1.04e-3 (make, either polarity).
            assert.ok(x.tone('ep').amps > 0.8e-3, `polarity ${rev}: a click at make (${x.tone('ep').amps})`);
            near(x.mA('led', 'anode'), 3.67, 0.1, `polarity ${rev}: LED current while held (mA)`);
            x.run(130);
            // MEASURED 2026-11-25: amps < 0.1e-3 -> observed 0.036e-3 (held 100 ms).
            assert.ok(x.tone('ep').amps < 0.1e-3, `polarity ${rev}: silent while the current is steady`);
            near(x.mA('led', 'anode'), 3.67, 0.1, `polarity ${rev}: still flowing (mA)`);
            x.set('key', 0); x.run(3);
            // MEASURED 2026-11-25: amps > 0.8e-3 -> observed 1.05e-3 (break, either polarity).
            assert.ok(x.tone('ep').amps > 0.8e-3, `polarity ${rev}: a click at break`);
            x.run(130);
        }
        near(x.v('ep', 'b'), 0, 0.01, 'key up: no voltage left on the earphone');
    });

    test('lab-npn-heat-alarm: warming the sensing transistor dims the LED, cooling restores it', () => {
        const x = bench('lab-npn-heat-alarm');
        const led = (c) => { x.param('q1', 'surroundC', c); x.run(8000); return x.mA('led', 'anode'); };
        near(led(25), 11.95, 0.5, 'room temperature: LED current (mA)');
        near(x.v('q1', 'base'), 0.581, 0.01, 'room temperature: sensor base (V)');
        near(led(33), 7.98, 0.6, 'fingers (33 °C): dimmer (mA)');
        near(x.temp('q1'), 33, 0.5, 'the transistor reached its surroundings (°C)');
        // MEASURED 2026-11-25: led(70) < 0.05 -> observed 0.000.
        assert.ok(led(70) < 0.05, 'hot air: the LED is out');
        near(led(0), 14.24, 0.4, 'ice: full brightness (mA)');
        near(led(25), 11.8, 0.6, 'back at room temperature (mA)');
        const y = bench('lab-npn-heat-alarm', withParams({ set: { position: 0.75 }, q1: { surroundC: 40 } }));
        y.run(8000);
        near(y.mA('led', 'anode'), 13.5, 0.5, 'trimmer turned: 40 °C hardly dims it (mA)');
    });

    test('lab-npn-astable-states: switches give both blinking, one blinking, both on, one on, both off', () => {
        const x = bench('lab-npn-astable-states');
        const watch = (ms) => {
            let r = 0; let g = 0; let rT = 0; let gT = 0; let n = 0; let pr = null; let pg = null;
            for (let i = 0; i < ms / 20; i++) {
                x.run(20);
                const rn = x.mA('red', 'anode') > 3; const gn = x.mA('green', 'anode') > 3;
                n++; if (rn) r++; if (gn) g++;
                if (pr !== null && rn !== pr) rT++;
                if (pg !== null && gn !== pg) gT++;
                pr = rn; pg = gn;
            }
            return { red: r / n, green: g / n, rT, gT };
        };
        x.run(500);
        let s = watch(2000);
        // MEASURED 2026-11-25: rT >= 5 && gT >= 5 -> observed 10 and 10 in 3 s (7 and 7 here).
        assert.ok(s.rT >= 5 && s.gT >= 5, `both blink (${s.rT}, ${s.gT} toggles)`);
        near(s.red, 0.5, 0.1, 'red lit half the time');
        x.set('dark', 1); s = watch(1500);
        assert.equal(s.red, 0, 'DARK: red bypassed');
        // MEASURED 2026-11-25: gT >= 3 -> observed 6 in 2 s.
        assert.ok(s.gT >= 3, `DARK: green keeps blinking (${s.gT} toggles)`);
        x.set('dark', 0); x.set('hold', 0); x.run(1000); s = watch(1000);
        assert.deepEqual([s.red, s.green, s.rT, s.gT], [1, 1, 0, 0], 'HOLD open: both steadily on');
        x.set('hold', 1); x.set('en1', 0); x.run(500); s = watch(1000);
        assert.deepEqual([s.red, s.green, s.rT, s.gT], [0, 1, 0, 0], 'EN1 open: red off, green on');
        x.set('en2', 0); s = watch(500);
        assert.deepEqual([s.red, s.green], [0, 0], 'EN1 and EN2 open: both off');
        x.set('en1', 1); s = watch(1000);
        assert.deepEqual([s.red, s.green, s.rT, s.gT], [1, 0, 0, 0], 'only EN2 open: red on, green off');
        x.set('en2', 1); x.run(500); s = watch(2000);
        // MEASURED 2026-11-25: rT >= 5 -> observed 9 in 3 s.
        assert.ok(s.rT >= 5 && s.gT >= 5, 'all closed again: both blink');
    });

    test('lab-npn-fade: UP crossfades green to red, DOWN back; the small capacitor is faster', () => {
        const x = bench('lab-npn-fade');
        x.run(10);
        near(x.mA('green', 'anode'), 3.21, 0.1, 'start: green (mA)');
        // MEASURED 2026-11-25: x.mA('red', 'anode') < 0.01 -> observed 0.00 (capacitor empty).
        assert.ok(x.mA('red', 'anode') < 0.01, 'start: red dark');
        x.set('up', 1); x.run(2000);
        near(x.v('q1', 'base'), 3.07, 0.15, 'UP 2 s: capacitor (V)');
        near(x.mA('red', 'anode'), 0.84, 0.15, 'UP 2 s: red fading in (mA)');
        near(x.mA('green', 'anode'), 0.85, 0.15, 'UP 2 s: green fading out (mA)');
        x.run(2000);
        near(x.mA('red', 'anode'), 2.63, 0.2, 'UP 4 s: red (mA)');
        // MEASURED 2026-11-25: green < 0.05 -> observed 0.000.
        assert.ok(x.mA('green', 'anode') < 0.05, 'UP 4 s: green out');
        x.set('up', 0); x.run(2000);
        near(x.v('q1', 'base'), 4.66, 0.15, 'released 2 s: the level sinks only slowly (V)');
        x.set('down', 1); x.run(3000);
        near(x.mA('green', 'anode'), 1.61, 0.2, 'DOWN 3 s: green back (mA)');
        near(x.mA('red', 'anode'), 0.15, 0.1, 'DOWN 3 s: red almost out (mA)');
        const f = bench('lab-npn-fade', withParams({ fast: { position: 1 } }));
        f.run(10); f.set('up', 1); f.run(1000);
        near(f.v('q1', 'base'), 5.40, 0.2, 'FAST, UP 1 s: capacitor (V)');
        near(f.mA('red', 'anode'), 3.08, 0.2, 'FAST, UP 1 s: red (mA)');
    });

    test('lab-npn-shunt-pair: ON moves the current to red, OFF moves it back to green', () => {
        const x = bench('lab-npn-shunt-pair');
        x.run(5);
        near(x.mA('gl', 'anode'), 13.15, 0.3, 'left idle: green (mA)');
        near(x.mA('redr', 'anode'), 15.06, 0.3, 'right idle: red (mA)');
        // MEASURED 2026-11-25: other LEDs < 0.05 -> observed 0.000 and 0.003.
        assert.ok(x.mA('redl', 'anode') < 0.05 && x.mA('gr', 'anode') < 0.05, 'idle: the other LED of each pair is dark');
        x.set('on', 1); x.set('off', 1); x.run(5);
        near(x.mA('redl', 'anode'), 15.06, 0.3, 'ON held: left red (mA)');
        near(x.mA('gr', 'anode'), 13.15, 0.3, 'OFF held: right green (mA)');
        // MEASURED 2026-11-25: other LEDs < 0.05 -> observed 0.003 and 0.000.
        assert.ok(x.mA('gl', 'anode') < 0.05 && x.mA('redr', 'anode') < 0.05, 'held: the first LED of each pair is dark');
    });

    test('lab-npn-and-gate: the LED lights only for A and B', () => {
        const x = bench('lab-npn-and-gate');
        x.run(2);
        for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
            x.set('a', a); x.set('b', b); x.run(2);
            if (a && b) near(x.mA('led', 'anode'), 7.15, 0.2, 'A and B: LED (mA)');
            // MEASURED 2026-11-25: LED < 0.01 -> observed 0.000 for 00, 10, 01.
            else assert.ok(x.mA('led', 'anode') < 0.01, `A=${a} B=${b}: dark`);
        }
    });
});
