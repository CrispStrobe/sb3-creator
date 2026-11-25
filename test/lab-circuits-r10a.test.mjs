/**
 * The r10a benches from `scripts/gen-lab-circuits-4.mjs --set=r10a` do what
 * their EXPECTED.md says: measured on the COMMITTED circuit.json, with the
 * stimuli a learner would set (buttons, toggle and slide switches, pots, a
 * phototransistor's light slider, a transistor's Temperature slider, the
 * Sound slider on a pickup, a light path's knob, the radio's tuning dial).
 *
 * Readouts are the engine's own surfaces: node voltages, resistor currents,
 * device state (a meter), the RF amplitude per station and the tone an
 * earphone or loudspeaker plays.
 *
 * Costs: the knock pickup's thuds and the radio's carrier make the solver
 * take small steps, so those two scenarios simulate a few hundred ms; the
 * monoflops and the Darlington timer run for seconds of DC with large steps.
 *
 * Every number was measured on the headless engine (bw-board 2965782a) when
 * the bench was built; the tolerances are bands around those measurements.
 * With R10A_MEASURE=1 each scenario also prints what it measured.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r10a.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set r10a)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const MEASURE = !!process.env.R10A_MEASURE;
const report = (id, m) => { if (MEASURE) console.log(`MEASURED ${id} ${JSON.stringify(m)}`); };

/** Load a committed bench and name its parts by role. */
function bench (id) {
    const json = JSON.parse(readFileSync(join(EXAMPLES, id, 'circuit.json'), 'utf8'));
    const ids = benchIds(BENCHES[id]);
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
        tone (name) { return b.buzzerTone(ids[name]); },
        rf (name, term) { return Object.fromEntries(b.rfVoltage(netOf(name, term)).map(s => [s.id, s.volts])); },
        temp (name) { return b.partTemperature(ids[name]); },
        run (ms) {
            tMs += ms;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
        },
        /** Run `ms` in steps of `step`, calling fn after each. */
        each (ms, step, fn) { const end = tMs + ms; while (tMs < end - 1e-9) { api.run(step); fn(tMs); } },
        set (name, value) { b.setControl(ids[name], value); },
        param (name, key, value) { b.setPartParam(ids[name], key, value); },
        get t () { return tMs; },
    };
    return api;
}

const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${Number(got).toFixed(4)}, expected ${want} +-${tol}`);
const r3 = (x) => Math.round(x * 1000) / 1000;

describe('lab benches (set r10a) behave as documented', { skip: SKIP }, () => {

    test('lab-cap-two-way-leds: charging current through red, discharging current through green', () => {
        const x = bench('lab-cap-two-way-leds');
        const m = {};
        x.run(20);
        m.charge20 = r3(x.mA('r')); m.redDrop = r3(x.v('red', 'anode') - x.v('red', 'cathode'));
        x.run(780);
        m.charge800 = r3(x.mA('r')); m.cap800 = r3(x.v('c', 'pos'));
        x.set('sel', 1); x.run(20);
        m.dis20 = r3(x.mA('r')); m.greenDrop = r3(x.v('green', 'anode') - x.v('green', 'cathode'));
        x.run(780);
        m.dis800 = r3(x.mA('r')); m.capAfter = r3(x.v('c', 'pos'));
        report('lab-cap-two-way-leds', m);
        near(m.charge20, 13.6, 0.4, 'charging, 20 ms after the throw: current into the capacitor (mA)');
        near(m.redDrop, 1.85, 0.15, 'the red LED carries it, forward (V)');
        // MEASURED 2026-11-25: m.charge800 < 1 -> observed 0.274 mA.
        assert.ok(m.charge800 < 1, `0.8 s later the charging current has died away: ${m.charge800} mA`);
        near(m.dis20, -10.0, 0.4, 'discharging, 20 ms after the throw: current out of the capacitor (mA)');
        near(m.greenDrop, 2.10, 0.15, 'the green LED carries it, forward (V)');
        // MEASURED 2026-11-25: m.dis800 > -1 -> observed -0.22 mA.
        assert.ok(m.dis800 > -1, `0.8 s later the discharge has died away too: ${m.dis800} mA`);
        // MEASURED 2026-11-25: m.capAfter > 1.5 -> observed 1.906 V.
        assert.ok(m.capAfter > 1.5, `the capacitor keeps the LEDs' threshold: ${m.capAfter} V left`);
    });

    test('lab-salt-water-probe: pure water barely conducts, salt water lights the LED', () => {
        const x = bench('lab-salt-water-probe');
        x.run(50);
        const pure = { mA: r3(x.mA('r')), water: r3(x.v('led', 'cathode')) };
        x.set('salt', 1); x.run(50);
        const salt = { mA: r3(x.mA('r')), water: r3(x.v('led', 'cathode')), taste: x.state('brine').taste };
        report('lab-salt-water-probe', { pure, salt });
        // MEASURED 2026-11-25: pure.mA < 0.05 -> observed 0.015 mA.
        assert.ok(pure.mA < 0.05, `demineralised water: the LED stays dark (${pure.mA} mA)`);
        near(pure.water, 7.63, 0.1, 'demineralised water: most of the battery stands across the water (V)');
        near(salt.mA, 6.74, 0.3, 'salt water: the LED lights (mA)');
        near(salt.water, 4.11, 0.2, 'salt water: the electrodes\' decomposition voltage plus the brine (V)');
    });

    test('lab-led-reference-switch: the LED in the emitter sets the switching point at about a quarter of the travel', () => {
        const x = bench('lab-led-reference-switch');
        x.run(1);
        const m = {};
        for (const p of [0.2, 0.25, 0.3, 0.4, 1]) { x.set('pot', p); x.run(1); m[p] = { led: r3(x.mA('rl')), ref: r3(x.v('q', 'emitter')) }; }
        report('lab-led-reference-switch', m);
        // MEASURED 2026-11-25: m[0.25].led < 0.05 -> observed 0 mA.
        assert.ok(m[0.2].led < 0.05 && m[0.25].led < 0.05, `below a quarter of the travel the green LED is dark (${m[0.25].led} mA)`);
        near(m[0.25].ref, 1.65, 0.05, 'the reference LED holds the emitter (V)');
        near(m[0.3].led, 4.23, 0.5, 'at 0.3 of the travel it is on (mA)');
        near(m[0.4].led, 5.16, 0.2, 'and fully on from 0.4 (mA)');
        near(m[1].led, 5.2, 0.2, 'the rest of the travel changes nothing (mA)');
    });

    test('lab-darlington-delay-on: the LED comes on seconds after ON, and fades seconds after OFF', () => {
        const x = bench('lab-darlington-delay-on');
        x.run(10);
        x.set('on', 1);
        const m = {};
        x.run(1000); m.on1 = r3(x.mA('rl'));
        x.run(1500); m.on2_5 = r3(x.mA('rl'));
        x.run(2500); m.on5 = r3(x.mA('rl')); m.cap = r3(x.v('c', 'pos'));
        x.set('on', 0);
        x.run(1000); m.off1 = r3(x.mA('rl'));
        x.run(1000); m.off2 = r3(x.mA('rl'));
        x.run(3000); m.off5 = r3(x.mA('rl'));
        report('lab-darlington-delay-on', m);
        // MEASURED 2026-11-25: m.on1 < 0.1 -> observed 0 mA.
        assert.ok(m.on1 < 0.1, `1 s after ON the LED is still dark (${m.on1} mA)`);
        near(m.on2_5, 6.4, 1.5, '2.5 s after ON it is half way up (mA)');
        near(m.on5, 14.5, 0.3, '5 s after ON it is fully on (mA)');
        near(m.off1, 11.7, 1.5, '1 s after OFF it is fading (mA)');
        near(m.off2, 4.75, 1.0, '2 s after OFF it is dim (mA)');
        // MEASURED 2026-11-25: m.off5 < 0.05 -> observed 0 mA.
        assert.ok(m.off5 < 0.05, `5 s after OFF it is out (${m.off5} mA)`);
    });

    test('lab-npn-warm-on: warming the transistor turns its LED on, cooling turns it off', () => {
        const x = bench('lab-npn-warm-on');
        x.run(10);
        const m = { room: r3(x.mA('rl')) };
        x.param('q', 'surroundC', 50); x.run(5000); m.warm = r3(x.mA('rl')); m.warmC = r3(x.temp('q'));
        x.param('q', 'surroundC', 70); x.run(5000); m.hot = r3(x.mA('rl'));
        x.param('q', 'surroundC', 25); x.run(6000); m.back = r3(x.mA('rl'));
        report('lab-npn-warm-on', m);
        near(m.room, 0.19, 0.05, 'room temperature, SET as built: the transistor barely conducts (mA)');
        near(m.warm, 1.2, 0.3, 'warmed to 50 degrees (mA)');
        near(m.hot, 3.9, 0.6, 'hot air, 70 degrees: the LED is on (mA)');
        // MEASURED 2026-11-25: m.hot > 15 * m.room -> observed 3.879 / 0.188 = 20.6.
        assert.ok(m.hot > 15 * m.room, `heating raises the current many times over: ${m.room} -> ${m.hot} mA`);
        near(m.back, 0.2, 0.06, 'back at room temperature it goes out again (mA)');
    });

    test('lab-pair-heat-balance: heat one transistor and its LED takes the current; heat both and nothing changes', () => {
        const x = bench('lab-pair-heat-balance');
        x.run(10);
        const st = () => [r3(x.mA('r1')), r3(x.mA('r2'))];
        const m = { room: st() };
        x.param('q1', 'surroundC', 70); x.run(5000); m.q1hot = st();
        x.param('q2', 'surroundC', 70); x.run(5000); m.bothHot = st();
        x.param('q1', 'surroundC', 25); x.run(5000); m.q2hot = st();
        report('lab-pair-heat-balance', m);
        near(m.room[0], 2.27, 0.1, 'room: red (mA)'); near(m.room[1], 2.27, 0.1, 'room: green (mA)');
        near(m.q1hot[0], 4.58, 0.15, 'Q1 hot: red takes almost all the tail current (mA)');
        // MEASURED 2026-11-25: m.q1hot[1] < 0.3 -> observed 0.118 mA.
        assert.ok(m.q1hot[1] < 0.3, `Q1 hot: green almost out (${m.q1hot[1]} mA)`);
        near(m.bothHot[0] - m.bothHot[1], 0.125, 0.1, 'both hot: they share again (mA difference)');
        near(m.bothHot[0] + m.bothHot[1], 4.73, 0.2, 'both hot: the tail current hardly moved (mA)');
        near(m.q2hot[1], 4.58, 0.15, 'Q2 hot alone: now green takes it (mA)');
        // MEASURED 2026-11-25: m.q2hot[0] < 0.3 -> observed 0.121 mA.
        assert.ok(m.q2hot[0] < 0.3, `Q2 hot: red almost out (${m.q2hot[0]} mA)`);
    });

    test('lab-torch-toggle: each flash of the torch changes the flip-flop over; darkness does nothing', () => {
        const x = bench('lab-torch-toggle');
        x.run(20);
        const st = () => [r3(x.mA('rc1')), r3(x.mA('rc2'))];
        const m = { start: st(), flashes: [] };
        for (let i = 0; i < 3; i++) {
            x.set('pt', 0.5); x.run(40); const lit = st();
            x.set('pt', 0); x.run(40); m.flashes.push({ lit, dark: st() });
        }
        x.set('pt', 0.05); x.run(40); m.weak = st(); x.set('pt', 0); x.run(40);
        x.set('pt', 0.01); x.run(40); m.faint = st();
        report('lab-torch-toggle', m);
        near(m.start[0], 0.3, 0.1, 'built: red dim (mA)'); near(m.start[1], 6.89, 0.2, 'built: green on (mA)');
        const red = (s) => s[0] > 5 && s[1] < 1; const green = (s) => s[1] > 5 && s[0] < 1;
        assert.ok(red(m.flashes[0].lit) && red(m.flashes[0].dark), `first flash: red on, and it stays on in the dark ${JSON.stringify(m.flashes[0])}`);
        assert.ok(green(m.flashes[1].lit) && green(m.flashes[1].dark), `second flash: back to green ${JSON.stringify(m.flashes[1])}`);
        assert.ok(red(m.flashes[2].dark), `third flash: red again ${JSON.stringify(m.flashes[2])}`);
        assert.ok(green(m.weak), `a weak torch (light 0.05) still toggles it ${JSON.stringify(m.weak)}`);
        assert.ok(green(m.faint), `a glimmer (light 0.01) does not ${JSON.stringify(m.faint)}`);
    });

    test('lab-monoflop-diode-edge: direct trigger follows the button, edge trigger gives a fixed pulse, the diode lengthens it', () => {
        const x = bench('lab-monoflop-diode-edge');
        x.run(1500);
        const m = { rest: [r3(x.mA('rc1')), r3(x.mA('rc2'))] };
        /** Press for `hold` ms; how long (ms) the red LED stays on, from the press. */
        const pulse = (hold) => {
            x.set('go', 1); const t0 = x.t; let end = null;
            x.each(2200, 20, (t) => { if (t - t0 >= hold) x.set('go', 0); if (end === null && t - t0 > 20 && x.mA('rc1') < 1) end = t - t0; });
            x.set('go', 0); x.run(1500);
            return end;
        };
        m.direct100 = pulse(100); m.direct1500 = pulse(1500);
        x.set('mode', 1); x.run(300);
        m.edge100 = pulse(100); m.edge1500 = pulse(1500);
        x.set('bypass', 0); x.run(300);
        m.diode100 = pulse(100);
        report('lab-monoflop-diode-edge', m);
        // MEASURED 2026-11-25: m.rest[0] < 0.1 -> observed 0 mA.
        assert.ok(m.rest[0] < 0.1 && m.rest[1] > 6, `at rest green is on, red off ${JSON.stringify(m.rest)}`);
        near(m.direct100, 680, 40, 'direct, short press: the timed pulse (ms)');
        near(m.direct1500, 1540, 40, 'direct, button held 1.5 s: red stays on while it is held (ms)');
        near(m.edge100, 680, 40, 'edge trigger, short press (ms)');
        near(m.edge1500, 680, 40, 'edge trigger, held 1.5 s: the same pulse (ms)');
        near(m.diode100, 740, 30, 'diode in Q2\'s base: one diode drop more to climb (ms)');
        // MEASURED 2026-11-25: m.diode100 - m.edge100 > 20 -> observed 740 - 680 = 60 ms.
        assert.ok(m.diode100 - m.edge100 > 20, `the diode lengthens the pulse: ${m.edge100} -> ${m.diode100} ms`);
    });

    test('lab-knock-flicker: a hard knock flashes the LED, a soft one does not', () => {
        const x = bench('lab-knock-flicker');
        let quiet = 0;
        x.each(400, 5, () => { if (x.t > 300) quiet = Math.max(quiet, x.mA('rl')); });
        const listen = (ms) => { let mx = 0; const on = []; x.each(ms, 5, (t) => { const i = x.mA('rl'); mx = Math.max(mx, i); if (i > 5) on.push(t); }); return { mx: r3(mx), first: on[0] ?? null, n: on.length }; };
        x.param('pick', 'soundDb', 110);
        const hard = listen(300);
        x.param('pick', 'soundDb', 80); x.run(100);
        const soft = listen(250);
        report('lab-knock-flicker', { quiet: r3(quiet), hard, soft });
        // MEASURED 2026-11-25: quiet < 0.05 -> observed 0 mA.
        assert.ok(quiet < 0.05, `no knocking: the LED is dark (${r3(quiet)} mA)`);
        near(hard.mx, 14.9, 0.5, 'a hard knock (110 dB at the pickup): a full flash (mA)');
        near(hard.first, 505, 15, 'the flash comes with the knock at 0.5 s (ms)');
        // MEASURED 2026-11-25: hard.n * 5 < 150 -> observed 15 samples, 75 ms.
        assert.ok(hard.n * 5 < 150, `the flash lasts a tenth of a second or so, not the whole time: ${hard.n * 5} ms`);
        // MEASURED 2026-11-25: soft.mx < 0.5 -> observed 0 mA.
        assert.ok(soft.mx < 0.5, `a soft knock (80 dB) leaves it dark: ${soft.mx} mA`);
    });

    test('lab-relax-metronome: clicks from four a second to one every 2.3 s; the small capacitor makes a tone', () => {
        const x = bench('lab-relax-metronome');
        x.run(10);
        const fires = (ms) => { const ts = []; let prev = x.v('cs', 'pos'); x.each(ms, 5, (t) => { const v = x.v('cs', 'pos'); if (v < prev - 1) ts.push(t); prev = v; }); return ts; };
        const per = (ts) => r3((ts.at(-1) - ts[1]) / (ts.length - 2));
        x.set('rate', 1); const fast = fires(1600);
        let click = 0;
        x.each(300, 0.05, () => { click = Math.max(click, x.v('spk', 'a')); });
        x.set('rate', 0); const slow = fires(7500);
        x.set('rate', 1); x.set('tone', 1); x.run(60);
        const tone = x.tone('spk');
        const m = { fast: per(fast), nFast: fast.length, slow: per(slow), nSlow: slow.length, click: r3(click), toneHz: r3(tone.hz) };
        report('lab-relax-metronome', m);
        near(m.fast, 248, 15, 'knob up: a click every quarter second (ms)');
        near(m.slow, 2270, 100, 'knob down: a click every 2.3 s (ms)');
        // MEASURED 2026-11-25: m.click > 0.5 -> observed 2.332 V (scratch run, 0.05 ms samples).
        assert.ok(m.click > 0.5, `each discharge kicks the loudspeaker: ${m.click} V peak`);
        near(m.toneHz, 344, 20, 'TONE, knob up: the same circuit buzzes (Hz)');
    });

    test('lab-comp-monoflop: START lights ACTIVE for under a second, with LONG for over half a minute', () => {
        const x = bench('lab-comp-monoflop');
        x.run(500);
        const st = () => ({ active: r3(x.mA('ra')), ready: r3(x.v('rr', 'b')) });
        const m = { rest: st() };
        const fire = (ms, step, probeAt) => {
            x.set('start', 1); x.run(200); m[`during${probeAt}`] = st(); x.set('start', 0);
            const t0 = x.t - 200; let end = null;
            x.each(ms, step, (t) => { if (end === null && x.mA('ra') < 0.5) end = t - t0; });
            return end;
        };
        m.short = fire(2000, 50, 'Short');
        x.run(1000);
        m.again = fire(2000, 50, 'Again');
        x.set('long', 1); x.run(2000);
        m.long = fire(45000, 1000, 'Long');
        m.after = st();
        report('lab-comp-monoflop', m);
        // MEASURED 2026-11-25: m.rest.active < 0.1 -> observed 0 mA.
        assert.ok(m.rest.active < 0.1, `at rest ACTIVE is dark (${m.rest.active} mA)`);
        near(m.rest.ready, 2.02, 0.1, 'at rest READY is lit (V across it)');
        near(m.duringShort.active, 7.2, 0.3, 'running: ACTIVE lit (mA)');
        // MEASURED 2026-11-25: m.duringShort.ready < 0.5 -> observed 0.09 V.
        assert.ok(m.duringShort.ready < 0.5, `running: READY shorted out (${m.duringShort.ready} V)`);
        near(m.short, 800, 100, '4.7 µF: the ACTIVE time (ms)');
        near(m.again, m.short, 100, 'the next press runs as long (ms)');
        near(m.long, 37200, 2000, 'LONG (+220 µF): the ACTIVE time (ms)');
        near(m.after.ready, 2.02, 0.1, 'afterwards READY again (V)');
    });

    test('lab-transistor-and-or: NAND plus a PNP inverter is AND, NOR plus a PNP inverter is OR', () => {
        const x = bench('lab-transistor-and-or');
        x.run(2);
        const m = {};
        for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
            x.set('a', a); x.set('b', b); x.run(2);
            m[`${a}${b}`] = { nand: r3(x.v('rnand', 'b')), nor: r3(x.v('rnor', 'b')), and: r3(x.mA('rl1')), or: r3(x.mA('rl2')) };
        }
        report('lab-transistor-and-or', m);
        const ON = 6.9; const OFF = 0.05;
        for (const k of ['00', '10', '01']) near(m[k].nand, 9, 0.05, `${k}: NAND output high (V)`);
        near(m['11'].nand, 0.11, 0.1, '11: NAND output low (V)');
        near(m['00'].nor, 9, 0.05, '00: NOR output high (V)');
        // MEASURED 2026-11-25: m[k].nor < 0.1 -> observed 0.053 / 0.053 / 0.041 V.
        for (const k of ['10', '01', '11']) assert.ok(m[k].nor < 0.1, `${k}: NOR output low (${m[k].nor} V)`);
        // MEASURED 2026-11-25: AND LED off-states < OFF (0.05) -> observed 0 mA.
        for (const k of ['00', '10', '01']) assert.ok(m[k].and < OFF, `${k}: AND dark (${m[k].and} mA)`);
        near(m['11'].and, ON, 0.2, '11: AND lit (mA)');
        assert.ok(m['00'].or < OFF, `00: OR dark (${m['00'].or} mA)`);
        for (const k of ['10', '01', '11']) near(m[k].or, 7.0, 0.2, `${k}: OR lit (mA)`);
    });

    test('lab-rf-preamp-radio: the RF stage amplifies the carrier; the emitter-follower detector is louder than the diode', () => {
        const x = bench('lab-rf-preamp-radio');
        x.run(40);
        const gain = x.rf('q1', 'collector').rf612 / x.rf('q1', 'base').rf612;
        const diode = x.tone('ep');
        x.set('det', 1); x.run(60);
        const follower = x.tone('ep');
        x.set('tc', 0.265); x.run(60);
        const other = x.tone('ep');
        const m = { gain: r3(gain), diode: { hz: r3(diode.hz), uA: r3(diode.amps * 1e6) }, follower: { hz: r3(follower.hz), uA: r3(follower.amps * 1e6) }, other: { hz: r3(other.hz), uA: r3(other.amps * 1e6) } };
        report('lab-rf-preamp-radio', m);
        near(m.gain, 131, 15, 'RF gain of the first stage at 612 kHz');
        near(m.diode.hz, 400, 8, 'diode detector: the 612 kHz station\'s 400 Hz (Hz)');
        near(m.diode.uA, 28.7, 6, 'diode detector: earphone current (µA rms)');
        near(m.follower.hz, 400, 8, 'emitter follower: the same programme (Hz)');
        near(m.follower.uA, 484, 50, 'emitter follower: earphone current (µA rms)');
        // MEASURED 2026-11-25: follower / diode > 5 -> observed 484 / 28.7 = 16.9.
        assert.ok(m.follower.uA > 5 * m.diode.uA, `the follower drives the earphone harder: ${m.diode.uA} -> ${m.follower.uA} µA`);
        near(m.other.hz, 600, 15, 'tuned to 810 kHz: its 600 Hz (Hz)');
    });

    test('lab-ir-photo-darlington: the bare phototransistor reaches a few cm, the photo-Darlington far further but sees room light', () => {
        const x = bench('lab-ir-photo-darlington');
        x.run(2);
        const st = () => ({ red: r3(x.mA('rr')), green: r3(x.mA('rg')) });
        const m = {};
        for (const sel of [0, 1]) {
            x.set('rx', sel);
            for (const d of [1, 2, 5, 10, 20]) { x.param('link', 'distanceCm', d); x.run(2); m[`${sel}@${d}`] = st(); }
        }
        x.param('link', 'distanceCm', 30);
        for (const sel of [0, 1]) { x.set('rx', sel); x.set('pt', 0.01); x.run(2); m[`room${sel}`] = st(); x.set('pt', 0); x.run(2); m[`dark${sel}`] = st(); }
        report('lab-ir-photo-darlington', m);
        near(m['0@1'].red, 14.8, 0.5, 'bare, 1 cm: red bright (mA)');
        near(m['0@2'].red, 4.0, 0.4, 'bare, 2 cm (as built) (mA)');
        near(m['0@5'].red, 0.66, 0.1, 'bare, 5 cm: barely (mA)');
        // MEASURED 2026-11-25: m['0@10'].red < 0.3 -> observed 0.165 mA.
        assert.ok(m['0@10'].red < 0.3, `bare, 10 cm: dark (${m['0@10'].red} mA)`);
        near(m['1@10'].green, 14.3, 0.4, 'Darlington, 10 cm: still full (mA)');
        near(m['1@20'].green, 4.1, 0.5, 'Darlington, 20 cm (mA)');
        // MEASURED 2026-11-25: m.room0.red < 0.2 -> observed 0.068 mA.
        assert.ok(m.room0.red < 0.2, `bare, 30 cm, a little room light: dark (${m.room0.red} mA)`);
        near(m.room1.green, 6.8, 0.6, 'Darlington, 30 cm, the same room light lights it (mA)');
        near(m.dark1.green, 1.83, 0.3, 'Darlington, 30 cm, room dark: only the beam (mA)');
    });

    test('lab-fibre-bend-meter: the needle falls as the loop in the fibre is bent tighter', () => {
        const x = bench('lab-fibre-bend-meter');
        x.run(2);
        const m = {};
        for (const r of [5, 2, 1, 0.7, 0.4]) { x.param('guide', 'bendRadiusCm', r); x.run(2); m[r] = r3(x.state('meter').reading); }
        report('lab-fibre-bend-meter', m);
        near(m[5], 3.78, 0.1, 'gentle 5 cm loop: meter (V)');
        near(m[2], 3.5, 0.1, '2 cm loop (V)');
        near(m[1], 3.04, 0.1, '1 cm loop (V)');
        near(m[0.4], 1.65, 0.15, 'tight 4 mm loop (V)');
        // MEASURED 2026-11-25: each tighter loop reads lower -> observed 3.777 > 3.499 > 3.035 > 2.638 > 1.645.
        assert.ok(m[5] > m[2] && m[2] > m[1] && m[1] > m[0.7] && m[0.7] > m[0.4], `monotonic: ${JSON.stringify(m)}`);
    });
});
