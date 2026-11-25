/**
 * The r6c benches from `scripts/gen-lab-circuits-4.mjs --set=r6c` do what
 * their EXPECTED.md says: measured on the COMMITTED circuit.json, with the
 * stimuli a learner would set (buttons, switches, slide switches, pots, the
 * battery voltage, a phototransistor's light, a light path's knob, the
 * Temperature slider of a part in its own surroundings, the sound level at a
 * listening loudspeaker, a function generator's frequency and amplitude).
 *
 * Readouts are the engine's own surfaces: node voltages, buzzerTone() and the
 * tone tracker's edge list on a loudspeaker or earphone, device state (a
 * relay) and partTemperature(). Every LM386 here switches (a relaxation
 * oscillator, a latch, a monoflop), and each flip of an LM386 costs the solver
 * a few hundred steps, so every scenario keeps its number of flips small: tones
 * are timed over a few milliseconds, blinkers over a few periods.
 *
 * Every number was measured on the headless engine (bw-board f4aaec43) when
 * the bench was built; the tolerances are bands around those measurements.
 * With R6X3_MEASURE=1 each scenario also prints what it measured.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r6c.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set r6c)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const MEASURE = !!process.env.R6X3_MEASURE;
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
        tone (name) { return b.buzzerTone(ids[name]); },
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
        /**
         * Pitch (Hz) of a loudspeaker or earphone from the tone tracker's
         * crossings after `fromMs` (same-direction crossings: whole periods).
         */
        hz (name, fromMs) {
            const e = (api.state(name)?._edges ?? []).map(Number).filter(t => t / 1e6 > fromMs);
            if (e.length < 3) return 0;
            const n = Math.floor((e.length - 1) / 2);
            return 1e9 * n / (e[2 * n] - e[0]);
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

describe('lab benches (set r6c) behave as documented', { skip: SKIP }, () => {

    test('lab-ir-flash-toggle: each press of SEND toggles the lamp once', () => {
        const x = bench('lab-ir-flash-toggle');
        x.run(1);
        const m = { out1: r3(x.v('u', 'vout')), inn1: r3(x.v('u', 'inn')), q1c1: r3(x.v('q1', 'collector')) };
        x.run(49);
        m.presses = [];
        for (let i = 0; i < 3; i++) {
            x.set('send', 1); x.run(30); const outLit = r3(x.v('u', 'vout')); x.set('send', 0);
            let fall = null; const t0 = x.t;
            while (x.t < t0 + 600 && fall === null) { x.run(10); if (x.v('u', 'vout') < 4.5) fall = x.t - t0; }
            x.run(50);
            m.presses.push([outLit, fall, x.v('q1', 'collector') < 1]);
        }
        report('lab-ir-flash-toggle', m);
        near(m.out1, 0.90, 0.02, 'switch-on: monoflop idle (output low)');
        near(m.inn1, 3.00, 0.01, '- input reference (V)');
        near(m.q1c1, 7.18, 0.05, 'switch-on: lamp (red) off');
        for (const [outLit] of m.presses) near(outLit, 8.10, 0.02, 'light arriving: monoflop fires');
        for (const [, fall] of m.presses) near(fall, 120, 15, 'monoflop falls back after the light is gone (ms)');
        assert.deepEqual(m.presses.map(p => p[2]), [true, false, true], 'lamp on, off, on');
    });

    test('lab-ir-pulse-dimmer: the duty pot sets the flash length, and the receiver LED follows it', () => {
        const at = (pos) => {
            const x = bench('lab-ir-pulse-dimmer', { duty: { position: pos } });
            x.run(60);
            let hi = 0; let n = 0; let led = 0; let tx = 0;
            x.each(30, 0.1, () => { hi += x.v('u', 'vout') > 4.5 ? 1 : 0; n++; led += x.mA('rled'); tx += x.mA('rtx'); });
            return { duty: r3(hi / n), ledMa: r3(led / n), txMa: r3(tx / n), hold: r3(x.v('ch', 'pos')) };
        };
        const m = { short: at(0.2), long: at(0.8) };
        report('lab-ir-pulse-dimmer', m);
        near(m.short.duty, 0.22, 0.05, 'pot at 0.2: fraction of time the IR LED flashes');
        near(m.long.duty, 0.70, 0.05, 'pot at 0.8: fraction of time the IR LED flashes');
        near(m.long.ledMa, 7.3, 0.8, 'long flashes: receiver LED (mA)');
        // MEASURED 2026-11-24: short.ledMa < 0.5 -> observed 0.021 (bench probe).
        assert.ok(m.short.ledMa < 0.5, `short flashes: receiver LED dark (${m.short.ledMa} mA)`);
        assert.ok(m.short.txMa < m.long.txMa / 2, `short flashes: the transmitter uses much less (${m.short.txMa} against ${m.long.txMa} mA)`);
    });

    test('lab-ir-music-link: the LED brightness follows the music, so the earphone plays it in proportion', () => {
        const at = (amp) => {
            const x = bench('lab-ir-music-link', { fg: { amplitude: amp } });
            x.run(60);
            const out = x.span('u', 'vout', 6, 0.05); const t0 = x.t; const ear = x.span('ear', 'a', 6, 0.05);
            return { out: r3(out.pp), ear: r3(ear.pp), hz: r3(x.hz('ear', t0 - 6)), ledMa: r3(x.mA('rtx')) };
        };
        const m = { full: at(0.05), half: at(0.025) };
        report('lab-ir-music-link', m);
        near(m.full.out, 2.0, 0.1, 'transmitter output swing at 50 mV in (V pp)');
        near(m.full.hz, 440, 20, 'the earphone plays the 440 Hz (Hz)');
        near(m.half.ear / m.full.ear, 0.5, 0.08, 'half the music, half at the earphone');
    });

    test('lab-diff-pair-amp: a few millivolts flip the comparator; switched to the capacitor it blinks', () => {
        const x = bench('lab-diff-pair-amp');
        x.run(1);
        const m = { in1: r3(x.v('q2', 'base')), ref1: r3(x.v('q1', 'base')), out1: r3(x.v('u', 'vout')) };
        // Up in steps of 0.005 until the output falls, then down until it rises.
        let up = null; let down = null; let p = 0.49;
        while (up === null && p < 0.56) { p = Math.round((p + 0.005) * 1000) / 1000; x.set('pot', p); x.run(3); if (x.v('u', 'vout') < 4.5) up = [p, r3(x.v('q2', 'base')), r3(x.v('q1', 'base'))]; }
        while (down === null && p > 0.44) { p = Math.round((p - 0.005) * 1000) / 1000; x.set('pot', p); x.run(3); if (x.v('u', 'vout') > 4.5) down = [p, r3(x.v('q2', 'base')), r3(x.v('q1', 'base'))]; }
        Object.assign(m, { up, down });
        const y = bench('lab-diff-pair-amp', { sel: { position: 1 } });
        const flips = []; let h = null;
        y.each(3000, 10, (t) => { const n = y.v('u', 'vout') > 4.5; if (h !== null && n !== h) flips.push(t); h = n; });
        m.flips = flips;
        report('lab-diff-pair-amp', m);
        near(m.ref1, 4.59, 0.02, 'reference with the output high (V)');
        near(m.out1, 8.10, 0.02, 'pot at 0.4: input below the reference, output high');
        near(m.up[0], 0.515, 0.003, 'turning up: the output falls at (pot)');
        near(m.up[1], 4.62, 0.02, '... with the input at (V)');
        near(m.down[0], 0.485, 0.003, 'turning down: it rises again only at (pot)');
        near(m.down[1], 4.37, 0.02, '... with the input at (V)');
        // MEASURED 2026-11-24: flips.length >= 6 -> observed 9 flips in 3 s.
        assert.ok(flips.length >= 6, `capacitor: blinking (${flips})`);
        const halves = flips.slice(1).map((t, i) => t - flips[i]);
        for (const hh of halves) near(hh, 135, 15, 'blink half period (ms)');
    });

    test('lab-eq-preamp: with the EQ in, treble is cut and bass kept', () => {
        const at = (f, eq) => {
            const x = bench('lab-eq-preamp', { fg: { freq: f }, eq: { closed: eq } });
            x.run(120);
            return r3(x.span('u', 'vout', f < 500 ? 20 : 4, 0.02).pp);
        };
        const m = { bassEq: at(100, true), trebleEq: at(3000, true), trebleFlat: at(3000, false), bassFlat: at(100, false) };
        report('lab-eq-preamp', m);
        near(m.bassFlat, 2.16, 0.1, 'bass, EQ out: output swing (V pp)');
        near(m.bassEq / m.bassFlat, 0.98, 0.05, 'bass (100 Hz): the EQ takes almost nothing away');
        near(m.trebleFlat, 2.42, 0.1, 'treble, EQ out: output swing (V pp)');
        near(m.trebleEq / m.trebleFlat, 0.23, 0.05, 'treble (3 kHz): the EQ cuts it to under a quarter');
    });

    test('lab-amp-baby-monitor: the earphone plays the nursery; close to the speaker it howls', () => {
        const x = bench('lab-amp-baby-monitor', { mic: { soundDb: 0 } });
        x.run(600);
        const m = { q1c: r3(x.v('q1', 'collector')), q2c: r3(x.v('q2', 'collector')), out: r3(x.v('u', 'vout')) };
        m.quiet = r3(x.span('u', 'vout', 10, 0.05).pp);
        x.param('mic', 'soundDb', 60); x.run(10); m.voice = r3(x.span('u', 'vout', 15, 0.05).pp);
        x.param('mic', 'soundDb', 0); x.param('mic', 'distanceCm', 3); x.run(30);
        const t0 = x.t; m.howl = r3(x.span('u', 'vout', 10, 0.05).pp); m.howlHz = r3(x.hz('ep', t0));
        report('lab-amp-baby-monitor', m);
        near(m.q1c, 4.82, 0.1, 'settled: first stage collector (V)');
        near(m.q2c, 5.02, 0.1, 'settled: second stage collector (V)');
        near(m.out, 4.49, 0.05, 'settled: amplifier output at half the supply (V)');
        // MEASURED 2026-11-24: quiet < 0.05 -> observed 0.001; howl > 6 -> observed 7.202.
        assert.ok(m.quiet < 0.05, `settled and quiet: ${m.quiet} V pp`);
        near(m.voice, 2.72, 0.4, 'voice at 60 dB, earphone 100 cm away: output (V pp)');
        // MEASURED 2026-11-24: m.howl > 6 -> observed 7.202.
        assert.ok(m.howl > 6, `earphone 3 cm from the speaker: howl ${m.howl} V pp`);
        near(m.howlHz, 9580, 600, 'the howl\'s pitch (Hz)');
    });

    test('lab-optical-astable: green and red take turns, the light closing the loop', () => {
        const x = bench('lab-optical-astable');
        x.run(1);
        const m = { q1c1: r3(x.v('q1', 'collector')), A1: r3(x.v('rl', 'b')), P1: r3(x.v('pt', 'collector')) };
        const flips = []; let on = x.v('q1', 'collector') < 3; let redOn = 0; let pDark = 0;
        x.each(1500, 5, (t) => {
            const n = x.v('q1', 'collector') < 3;
            if (n !== on) flips.push([t, n]);
            on = n;
            if (!n) redOn = Math.max(redOn, x.mA('rl')); else pDark = Math.max(pDark, x.v('pt', 'collector'));
        });
        Object.assign(m, { flips, redOn: r3(redOn), pDark: r3(pDark) });
        report('lab-optical-astable', m);
        // MEASURED 2026-11-24: flips.length >= 7 -> observed 9 flips in 1.5 s.
        assert.ok(flips.length >= 7, `it oscillates: ${JSON.stringify(flips)}`);
        const steady = flips.slice(2);
        for (let i = 1; i < steady.length; i++) {
            const d = steady[i][0] - steady[i - 1][0];
            if (steady[i - 1][1]) near(d, 180, 25, 'Q1 on (green), LED dark (ms)');
            else near(d, 190, 30, 'Q1 off, LED lit (red) (ms)');
        }
        near(m.redOn, 1.3, 0.3, 'LED lit: current through 4.7 kΩ (mA)');
    });

    test('lab-ir-tone-link: the key sends the tone over infrared, the earphone plays it', () => {
        const x = bench('lab-ir-tone-link');
        x.run(1);
        const m = { out1: r3(x.v('u', 'vout')), P1: r3(x.v('pt', 'collector')) };
        x.run(19); m.idleEar = r3(x.span('ear', 'a', 5, 0.1).pp);
        x.set('key', 1); x.run(3);
        let t0 = x.t; m.P = r3(x.span('pt', 'collector', 10, 0.05).pp); m.hz = r3(x.hz('ear', t0)); m.ear = r3(x.span('ear', 'a', 4, 0.05).pp);
        x.set('link', 1); x.run(3); m.earFar = r3(x.span('ear', 'a', 4, 0.05).pp); m.Pfar = r3(x.span('pt', 'collector', 4, 0.05).pp);
        report('lab-ir-tone-link', m);
        near(m.out1, 0.90, 0.02, 'key up: transmitter parked low, IR LED dark');
        near(m.hz, 616, 25, 'key down: the tone at the earphone (Hz)');
        // MEASURED 2026-11-24: ear > 2 -> observed 5.0; idleEar < 0.5 -> observed 0.17 (coupling caps settling) (bench probe).
        assert.ok(m.ear > 2, `key down: the earphone plays it (${m.ear} V pp)`);
        // MEASURED 2026-11-24: m.idleEar < 0.5 -> observed 0.166.
        assert.ok(m.idleEar < 0.5, `key up: nothing much at the earphone (${m.idleEar} V pp)`);
        assert.ok(m.Pfar < m.P / 4, `60 cm: much less light (${m.Pfar} against ${m.P} V pp)`);
    });

    test('lab-amp-struck-note: the key charges the supply capacitor; the note dies away when it is let go', () => {
        const x = bench('lab-amp-struck-note');
        x.run(2);
        const m = { vs0: r3(x.v('u', 'vs')) };
        x.set('key', 1); const t0 = x.t; x.run(20); m.vsKey = r3(x.v('u', 'vs')); m.hzKey = r3(x.hz('spk', t0 + 8));
        x.set('key', 0);
        m.decay = [];
        for (let i = 0; i < 6; i++) { const sp = x.span('u', 'vout', 8, 0.05); m.decay.push([r3(x.v('u', 'vs')), r3(sp.pp)]); }
        m.endPp = r3(x.span('u', 'vout', 6, 0.1).pp); m.vsEnd = r3(x.v('u', 'vs'));
        report('lab-amp-struck-note', m);
        near(m.vs0, 0, 0.01, 'key never pressed: no supply');
        near(m.vsKey, 8.5, 0.15, 'key down: the capacitor charged (V)');
        near(m.hzKey, 295, 15, 'the note (Hz)');
        for (let i = 1; i < m.decay.length; i++) assert.ok(m.decay[i][1] < m.decay[i - 1][1] + 0.05, `the swing shrinks: ${JSON.stringify(m.decay)}`);
        // MEASURED 2026-11-24: decay[0] pp > 5 -> observed 6.6; endPp < 0.05 -> observed 0 (bench probe).
        assert.ok(m.decay[0][1] > 5, `just struck: loud (${m.decay[0][1]} V pp)`);
        // MEASURED 2026-11-24: m.endPp < 0.05 -> observed 0.006.
        assert.ok(m.endPp < 0.05, `50 ms later: silent (${m.endPp})`);
        near(m.vsEnd, 3.5, 0.2, 'what the amplifier leaves on the capacitor (V)');
    });

    test('lab-amp-audiometer: the knob sweeps the tone from about 800 Hz to beyond 12 kHz', () => {
        const at = (pos, ms) => { const x = bench('lab-amp-audiometer', { pitch: { position: pos } }); x.run(ms); return r3(x.hz('spk', ms / 3)); };
        const m = { low: at(0, 12), mid: at(0.5, 5), high: at(1, 2.4) };
        report('lab-amp-audiometer', m);
        near(m.low, 772, 30, 'knob at 0: 26 kΩ in the timing path (Hz)');
        near(m.mid, 1982, 80, 'knob at half (Hz)');
        near(m.high, 12760, 600, 'knob at 1: 1.2 kΩ (Hz)');
    });

    test('lab-clap-toggle-relay: one clap switches the lamp on, the next one off; talking does nothing', () => {
        const x = bench('lab-clap-toggle-relay');
        x.run(100);
        const relay = () => !!x.state('k')?.energized;
        const m = { q1c0: r3(x.v('q1', 'collector')), q2c0: r3(x.v('q2', 'collector')), relay0: relay() };
        x.param('mic', 'soundWave', 'voice'); x.param('mic', 'soundDb', 70); x.run(40); m.talkRelay = relay(); m.talkT = r3(x.v('qp', 'collector'));
        x.param('mic', 'soundDb', 0); x.param('mic', 'soundWave', 'noise'); x.run(40);
        const clap = () => { x.param('mic', 'soundDb', 120); x.run(20); x.param('mic', 'soundDb', 0); x.run(80); return [relay(), r3(x.v('q1', 'collector'))]; };
        m.clap1 = clap(); m.lamp1 = !!(x.state('lamp')?.brightness > 0.5);
        m.clap2 = clap();
        report('lab-clap-toggle-relay', m);
        assert.equal(m.relay0, false, 'switch-on: relay out, lamp dark');
        near(m.q2c0, 0.09, 0.05, 'switch-on: Q2 conducts (green)');
        assert.equal(m.talkRelay, false, 'talking at 70 dB: nothing');
        assert.equal(m.clap1[0], true, 'first clap: relay in');
        near(m.clap1[1], 0.10, 0.03, 'first clap: Q1 on (red) (V)');
        assert.equal(m.lamp1, true, 'first clap: the lamp lights');
        assert.equal(m.clap2[0], false, 'second clap: relay out again');
        near(m.clap2[1], 7.20, 0.05, 'second clap: Q1 off (V)');
        near(m.talkT, 9.0, 0.01, 'talking: the trigger line never moves (V)');
    });

    test('lab-dusk-parking-light: dark switches the parking light on, and it needs clearly more light to go off', () => {
        const x = bench('lab-dusk-parking-light');
        x.run(1);
        const m = { L1: r3(x.v('pt', 'emitter')), q2c1: r3(x.v('q2', 'collector')), out1: r3(x.v('u', 'vout')) };
        const on = () => x.v('u', 'vout') > 4.5;
        m.way = [];
        for (const l of [0.3, 0.2, 0.15, 0.1, 0.15, 0.2, 0.25, 0.3]) { x.set('pt', l); x.run(2); m.way.push([l, on()]); }
        x.set('pt', 0.05); x.run(2); m.lampOn = r3(x.mA('rlamp')); m.innDark = r3(x.v('u', 'inn'));
        report('lab-dusk-parking-light', m);
        near(m.L1, 2.78, 0.05, 'daylight (light 0.5): phototransistor emitter (V)');
        near(m.out1, 0.90, 0.02, 'daylight: amplifier output low, light off');
        assert.deepEqual(m.way.map(([, o]) => o), [false, false, true, true, true, true, false, false],
            'dimming: on below 0.2; brightening: still on at 0.2, off at 0.25');
        near(m.lampOn, 15, 3, 'dark: parking light current (mA)');
    });

    test('lab-auto-dip-beam: HIGH BEAM latches, the oncoming car\'s light dips it', () => {
        const x = bench('lab-auto-dip-beam');
        x.run(5);
        const m = { q1c0: r3(x.v('q1', 'collector')), q2c0: r3(x.v('q2', 'collector')) };
        x.set('set', 1); x.run(5); x.set('set', 0); x.run(5);
        m.q1cHigh = r3(x.v('q1', 'collector')); m.highMa = r3(x.mA('rc1'));
        x.set('pt', 0.1); x.run(5); m.q1cDusk = r3(x.v('q1', 'collector'));
        x.set('pt', 0.3); x.run(5); m.q1cCar = r3(x.v('q1', 'collector')); m.q2cCar = r3(x.v('q2', 'collector'));
        x.set('pt', 0); x.run(5); m.q2cAfter = r3(x.v('q2', 'collector'));
        report('lab-auto-dip-beam', m);
        near(m.q2c0, 0.10, 0.05, 'switch-on: dipped (green)');
        near(m.q1c0, 6.18, 0.1, 'switch-on: high beam off');
        near(m.q1cHigh, 0.12, 0.08, 'HIGH BEAM pressed and released: Q1 holds on');
        near(m.highMa, 12.6, 1.5, 'high beam LED current (mA)');
        near(m.q1cDusk, 0.19, 0.1, 'dusk light (0.1): stays on high beam');
        near(m.q2cCar, 0.10, 0.05, 'oncoming headlights (0.3): dipped');
        near(m.q2cAfter, 0.10, 0.05, 'car gone: stays dipped');
    });

    test('lab-mirror-thermo-alarm: warm Q2 or cold Q1 sounds the alarm; both alike do not', () => {
        const M = (t1, t2) => {
            const x = bench('lab-mirror-thermo-alarm', { q1: { surroundC: t1 }, q2: { surroundC: t2 } });
            x.run(1);
            const mm = { M: r3(x.v('q2', 'collector')), inp: r3(x.v('u', 'inp')) };
            const t0 = x.t; x.run(8); mm.hz = r3(x.hz('spk', t0 + 2)); mm.pp = r3(x.span('u', 'vout', 2, 0.05).pp);
            return mm;
        };
        const m = { room: M(25, 25), fingers: M(25, 33), hot: M(25, 70), bothHot: M(70, 70), cool: M(10, 25), ice: M(0, 25) };
        // The slider: Q2 moved from 25 °C into hot water at t = 0.
        const x = bench('lab-mirror-thermo-alarm');
        x.run(10);
        x.param('q2', 'surroundC', 70);
        let alarmAt = null; let tAt = null;
        while (x.t < 1500 && alarmAt === null) { x.run(20); if (x.v('u', 'inp') > 1) { alarmAt = x.t - 10; tAt = x.b.partTemperature(x.ids.q2); } }
        m.alarmAt = alarmAt; m.tAt = tAt && r3(tAt);
        report('lab-mirror-thermo-alarm', m);
        near(m.room.M, 6.50, 0.05, 'both at room: mirror collector (V)');
        near(m.fingers.M, 5.34, 0.05, 'Q2 in the fingers (33 °C): collector (V)');
        near(m.bothHot.M, 6.48, 0.05, 'both in hot water: balanced again (V)');
        near(m.cool.M, 3.57, 0.05, 'Q1 at 10 °C: collector (V)');
        for (const k of ['room', 'fingers', 'bothHot', 'cool']) {
            // MEASURED 2026-11-24: pp < 0.01 -> observed 0 in all four (kill NPN on).
            assert.ok(m[k].pp < 0.01, `${k}: silent (${m[k].pp})`);
        }
        near(m.hot.hz, 616, 25, 'Q2 in hot water: alarm tone (Hz)');
        near(m.ice.hz, 616, 25, 'Q1 in ice water: alarm tone (Hz)');
        near(m.alarmAt, 700, 150, 'Q2 into hot water: alarm after (ms)');
        near(m.tAt, 47, 4, 'Q2 temperature when the alarm starts (°C)');
    });

    test('lab-freezer-diode-alarm: cold sensor diode silent, a thawing one sounds the alarm', () => {
        const M = (t) => {
            const x = bench('lab-freezer-diode-alarm', { dsense: { surroundC: t } });
            x.run(1);
            const mm = { M: r3(x.v('q2', 'collector')), inp: r3(x.v('u', 'inp')) };
            const t0 = x.t; x.run(8); mm.hz = r3(x.hz('spk', t0 + 2)); mm.pp = r3(x.span('u', 'vout', 2, 0.05).pp);
            return mm;
        };
        const m = { freezer: M(-10), ice: M(0), cool: M(5), thaw: M(10), room: M(25) };
        const x = bench('lab-freezer-diode-alarm');
        x.run(10);
        x.param('dsense', 'surroundC', 25);
        let alarmAt = null; let tAt = null;
        while (x.t < 2000 && alarmAt === null) { x.run(20); if (x.v('u', 'inp') > 1) { alarmAt = x.t - 10; tAt = x.b.partTemperature(x.ids.dsense); } }
        m.alarmAt = alarmAt; m.tAt = tAt && r3(tAt);
        report('lab-freezer-diode-alarm', m);
        near(m.freezer.M, 2.57, 0.05, 'sensor at -10 °C: Q2 collector (V)');
        near(m.ice.M, 1.68, 0.05, 'sensor at 0 °C: Q2 collector (V)');
        near(m.cool.M, 1.13, 0.05, 'sensor at 5 °C: Q2 collector (V)');
        for (const k of ['freezer', 'ice', 'cool']) {
            // MEASURED 2026-11-24: pp < 0.01 -> observed 0 (kill NPN on).
            assert.ok(m[k].pp < 0.01, `${k}: silent (${m[k].pp})`);
        }
        near(m.thaw.hz, 616, 25, 'sensor at 10 °C: alarm (Hz)');
        near(m.room.hz, 616, 25, 'sensor at 25 °C: alarm (Hz)');
        near(m.tAt, 8, 2, 'sensor temperature when the alarm starts (°C)');
    });

    test('lab-amp-touch-latch: a touch sets the LM386 latch, RESET clears it; as a monoflop it falls back by itself', () => {
        const x = bench('lab-amp-touch-latch');
        x.run(1);
        const m = { inp1: r3(x.v('u', 'inp')), inn1: r3(x.v('u', 'inn')), out1: r3(x.v('u', 'vout')) };
        x.run(9);
        x.set('touch', 1); x.run(5); m.outTouched = r3(x.v('u', 'vout'));
        x.set('touch', 0); x.run(50); m.inpHeld = r3(x.v('u', 'inp')); m.outHeld = r3(x.v('u', 'vout')); m.ledHeld = r3(x.mA('rl'));
        x.run(300); m.outLater = r3(x.v('u', 'vout'));
        x.set('reset', 1); x.run(5); x.set('reset', 0); x.run(20); m.outReset = r3(x.v('u', 'vout')); m.inpReset = r3(x.v('u', 'inp'));
        x.set('mode', 1); x.run(20);
        x.set('touch', 1); x.run(20); x.set('touch', 0);
        const t0 = x.t; let fall = null;
        while (x.t < t0 + 500 && fall === null) { x.run(5); if (x.v('u', 'vout') < 4.5) fall = x.t - t0; }
        m.monoMs = fall; m.inpAfter = r3(x.v('u', 'inp'));
        report('lab-amp-touch-latch', m);
        near(m.inn1, 3.00, 0.01, '- input reference (V)');
        near(m.inp1, 0.46, 0.02, 'switch-on: + input with the output low (V)');
        near(m.out1, 0.90, 0.02, 'switch-on: output low, LED dark');
        near(m.outTouched, 8.10, 0.02, 'touched: output high');
        near(m.inpHeld, 4.18, 0.03, 'released: the 47 kΩ holds the + input (V)');
        near(m.outLater, 8.10, 0.02, 'a third of a second later: still set');
        near(m.ledHeld, 6.3, 0.4, 'set: LED current (mA)');
        near(m.outReset, 0.90, 0.02, 'RESET: output low again');
        near(m.monoMs, 245, 40, 'monoflop: output falls back after (ms)');
    });

    test('lab-diff-pair-charging: red while the capacitor is below half, both dark at half, green above', () => {
        const x = bench('lab-diff-pair-charging');
        x.run(1);
        const m = { cap1: r3(x.v('q1', 'base')), ref: r3(x.v('q2', 'base')), led1: r3(x.mA('rled')) };
        const samples = [];
        x.each(2750, 250, (t) => samples.push([t, r3(x.v('q1', 'base')), r3(x.mA('rled'))]));
        m.samples = samples;
        x.set('empty', 1); x.run(50); x.set('empty', 0); x.run(5); m.ledEmptied = r3(x.mA('rled')); m.capEmptied = r3(x.v('q1', 'base'));
        report('lab-diff-pair-charging', m);
        const at = (t) => samples.find(([s]) => Math.abs(s - t) < 1);
        near(m.led1, 1.28, 0.1, 'capacitor empty: red LED current (mA, + = red)');
        near(at(1251)[2], 1.28, 0.1, '1.25 s: still red');
        near(at(1501)[2], 0, 0.1, '1.5 s (capacitor at half): both dark');
        near(at(2501)[2], -1.75, 0.1, '2.5 s: green (mA, - = green)');
        near(at(1501)[1], 4.43, 0.05, 'the capacitor at the changeover (V)');
        near(m.ledEmptied, 1.28, 0.1, 'emptied: red again');
    });

    test('lab-ir-barrier-alarm: a broken beam sounds the alarm; flipped, the tone means the beam is intact', () => {
        const x = bench('lab-ir-barrier-alarm');
        x.run(1);
        const m = { L1: r3(x.v('pt', 'emitter')), kill1: r3(x.v('qk', 'base')), inp1: r3(x.v('u', 'inp')) };
        x.run(4); m.intactPp = r3(x.span('u', 'vout', 5, 0.1).pp);
        x.set('beam', 1); x.run(1); m.Lblocked = r3(x.v('pt', 'emitter'));
        let t0 = x.t; x.run(12); m.hzBlocked = r3(x.hz('spk', t0 + 3));
        x.set('beam', 0); x.run(5); m.clearedPp = r3(x.span('u', 'vout', 5, 0.1).pp);
        x.set('sel', 1); t0 = x.t; x.run(12); m.hzInverse = r3(x.hz('spk', t0 + 3));
        x.set('beam', 1); x.run(5); m.inverseBlockedPp = r3(x.span('u', 'vout', 5, 0.1).pp);
        report('lab-ir-barrier-alarm', m);
        near(m.L1, 2.20, 0.1, 'beam intact: receiver voltage (V)');
        near(m.inp1, 0.04, 0.03, 'beam intact: oscillator held off');
        // MEASURED 2026-11-24: intactPp < 0.01 -> observed 0.
        assert.ok(m.intactPp < 0.01, `beam intact: silent (${m.intactPp})`);
        near(m.Lblocked, 0, 0.01, 'beam blocked: no light, no signal (V)');
        near(m.hzBlocked, 616, 25, 'beam blocked: alarm (Hz)');
        // MEASURED 2026-11-24: clearedPp < 0.05 -> observed 0.002 (probe).
        assert.ok(m.clearedPp < 0.05, `beam clear again: silent (${m.clearedPp})`);
        near(m.hzInverse, 616, 25, 'switch right, beam intact: tone (Hz)');
        // MEASURED 2026-11-24: inverseBlockedPp < 0.05 -> observed 0.002.
        assert.ok(m.inverseBlockedPp < 0.05, `switch right, beam blocked: silent (${m.inverseBlockedPp})`);
    });
    test('lab-amp-blinker: the LM386 blinks the red / green pair; closed, the switch clicks the speaker at each edge', () => {
        const x = bench('lab-amp-blinker');
        x.run(1);
        const m = { out1: r3(x.v('u', 'vout')), inp1: r3(x.v('u', 'inp')), red1: r3(x.mA('r1')), green1: r3(x.mA('r2')) };
        // Flips of the output (4.5 V crossings), sampled every 2 ms; the
        // switch is closed half way through.
        const flips = []; let hi = x.v('u', 'vout') > 4.5; let spkOpen = 0; let spkClosed = 0; let redHi = 0; let greenLo = 0;
        x.each(219, 2, (t) => {
            const h = x.v('u', 'vout') > 4.5;
            if (h !== hi) flips.push(t);
            hi = h;
            spkOpen = Math.max(spkOpen, Math.abs(x.v('spk', 'a')));
            if (h) redHi = Math.max(redHi, x.mA('r1')); else greenLo = Math.max(greenLo, x.mA('r2'));
        });
        x.set('sw', 1);
        x.each(240, 2, (t) => {
            const h = x.v('u', 'vout') > 4.5;
            if (h !== hi) flips.push(t);
            hi = h;
            spkClosed = Math.max(spkClosed, Math.abs(x.v('spk', 'a')));
        });
        Object.assign(m, { flips, spkOpen: r3(spkOpen), spkClosed: r3(spkClosed), redHi: r3(redHi), greenLo: r3(greenLo) });
        report('lab-amp-blinker', m);
        near(m.out1, 8.10, 0.02, 'switch-on: the output starts high');
        near(m.inp1, 5.12, 0.03, 'switch-on: + input at the upper threshold');
        near(m.red1, 6.3, 0.4, 'switch-on: red LED current (mA)');
        near(m.green1, 0, 0.05, 'switch-on: green LED dark (mA)');
        // MEASURED 2026-11-24: flips.length >= 5 -> observed 5 (117, 199, 277, 359, 439 ms).
        assert.ok(flips.length >= 5, `at least five flips in 460 ms: ${flips}`);
        const halves = flips.slice(1).map((t, i) => t - flips[i]);
        for (const h of halves) near(h, 80, 8, 'half period (ms)');
        near(m.redHi, 6.3, 0.4, 'output high: red LED current (mA)');
        near(m.greenLo, 6.2, 0.4, 'output low: green LED current (mA)');
        // MEASURED 2026-11-24: spkOpen < 0.01 -> observed 0; spkClosed > 0.4 -> observed 0.852 (bench probe).
        assert.ok(m.spkOpen < 0.01, `switch open: the speaker is silent (${m.spkOpen} V)`);
        // MEASURED 2026-11-24: m.spkClosed > 0.4 -> observed 0.842.
        assert.ok(m.spkClosed > 0.4, `switch closed: the speaker gets a kick at each edge (${m.spkClosed} V)`);
    });

    test('lab-amp-probe-harp: touch points pick notes, the probes measure, open probes are silent', () => {
        const x = bench('lab-amp-probe-harp');
        x.run(1);
        const m = { out1: r3(x.v('u', 'vout')), inn1: r3(x.v('u', 'inn')) };
        m.idle = r3(x.span('u', 'vout', 5, 0.1).pp);
        const note = (key, ms) => { x.set(key, 1); const t0 = x.t; x.run(ms); const hz = x.hz('spk', t0 + 3); x.set(key, 0); x.run(3); return r3(hz); };
        m.k1 = note('k1', 12);
        m.k2 = note('k2', 14);
        m.k4 = note('k4', 25);
        x.set('probes', 1);
        let t0 = x.t; x.run(25); m.obj = r3(x.hz('spk', t0 + 5));
        x.set('obj', 0); x.run(15); m.objOpen = r3(x.span('u', 'vout', 12, 0.1).pp);
        x.set('probes', 0); x.run(5);
        report('lab-amp-probe-harp', m);
        near(m.out1, 8.08, 0.03, 'switch-on: output high');
        // MEASURED 2026-11-24: idle < 0.05 -> observed 0.021 (the output settling, no tone).
        assert.ok(m.idle < 0.05, `nothing touched: no tone (${m.idle} V swing)`);
        near(m.k1, 860, 30, 'first touch point (Hz)');
        near(m.k2, 517, 20, 'second touch point (Hz)');
        near(m.k4, 245, 12, 'fourth touch point (Hz)');
        assert.ok(m.k1 > m.k2 && m.k2 > m.k4, 'further along the chain, lower notes');
        near(m.obj, 218, 12, 'probes on the 11.75 kΩ object (Hz)');
        // MEASURED 2026-11-24: objOpen < 0.05 -> observed 0.001.
        assert.ok(m.objOpen < 0.05, `probes on 48 kΩ: no tone (${m.objOpen} V swing)`);
    });

    test('lab-touch-morse: a fingertip on the Darlington keys the tone', () => {
        const x = bench('lab-touch-morse');
        x.run(1);
        const m = { inp1: r3(x.v('u', 'inp')), out1: r3(x.v('u', 'vout')), kill1: r3(x.v('qk', 'base')) };
        m.idle = r3(x.span('u', 'vout', 10, 0.1).pp);
        x.set('touch', 1); x.run(1);
        m.node = r3(x.v('rup', 'b')); m.killTouched = r3(x.v('qk', 'base'));
        const t0 = x.t; x.run(14); m.hz = r3(x.hz('spk', t0 + 3));
        x.set('touch', 0); x.run(10);
        const after = x.span('u', 'vout', 5, 0.1); m.afterPp = r3(after.pp); m.afterOut = r3(after.hi);
        report('lab-touch-morse', m);
        near(m.inp1, 0.03, 0.03, 'untouched: kill NPN holds the + input low');
        near(m.out1, 0.90, 0.02, 'untouched: output parked low');
        near(m.kill1, 0.69, 0.03, 'untouched: kill NPN base');
        // MEASURED 2026-11-24: idle < 0.01 -> observed 0.003.
        assert.ok(m.idle < 0.01, `untouched: silent (${m.idle})`);
        near(m.node, 0.69, 0.05, 'touched: Darlington pulls the node down (V)');
        near(m.killTouched, 0.28, 0.05, 'touched: kill NPN base below conduction (V)');
        near(m.hz, 616, 25, 'touched: the tone (Hz)');
        // MEASURED 2026-11-24: afterPp < 0.05 -> observed 0; afterOut < 1 -> observed 0.90.
        assert.ok(m.afterPp < 0.05 && m.afterOut < 1, `released: silent again (${m.afterPp} V swing, ${m.afterOut} V)`);
    });

    test('lab-trip-wire-siren: breaking the wire latches a two-tone siren; only mending AND reset stop it', () => {
        const x = bench('lab-trip-wire-siren');
        x.run(1);
        const m = { q1c1: r3(x.v('q1', 'collector')), q2c1: r3(x.v('q2', 'collector')), inp1: r3(x.v('u', 'inp')) };
        x.run(19);
        m.armedPp = r3(x.span('u', 'vout', 10, 0.1).pp);
        // Wait (silently) for the astable's Q4 to conduct, then break the wire.
        let n = 0; while (x.v('q4', 'collector') > 1 && n++ < 80) x.run(5);
        x.set('wire', 0); let t0 = x.t; x.run(12);
        m.q1cTripped = r3(x.v('q1', 'collector')); m.hzLow = r3(x.hz('spk', t0 + 3)); m.q4cLow = r3(x.v('q4', 'collector'));
        x.set('wire', 1); x.run(3);
        m.q1cMended = r3(x.v('q1', 'collector')); m.mendedPp = r3(x.span('u', 'vout', 3, 0.1).pp);
        x.set('reset', 1); x.run(2); x.set('reset', 0); x.run(5);
        m.q1cReset = r3(x.v('q1', 'collector')); m.resetPp = r3(x.span('u', 'vout', 5, 0.1).pp);
        n = 0; while (x.v('q4', 'collector') < 3 && n++ < 80) x.run(5);
        x.set('wire', 0); t0 = x.t; x.run(12);
        m.hzHigh = r3(x.hz('spk', t0 + 3)); m.q4cHigh = r3(x.v('q4', 'collector'));
        report('lab-trip-wire-siren', m);
        near(m.q1c1, 7.05, 0.1, 'armed: Q1 off (V)');
        near(m.q2c1, 0.09, 0.05, 'armed: Q2 on, green lit (V)');
        near(m.inp1, 0.03, 0.03, 'armed: kill NPN holds the oscillator off');
        // MEASURED 2026-11-24: armedPp < 0.01 -> observed 0.
        assert.ok(m.armedPp < 0.01, `armed: silent (${m.armedPp})`);
        near(m.q1cTripped, 0.09, 0.05, 'wire broken: Q1 latched on, red lit (V)');
        near(m.hzLow, 500, 20, 'siren, Q4 conducting: the low tone (Hz)');
        near(m.q1cMended, 0.09, 0.05, 'wire mended: still latched (V)');
        // MEASURED 2026-11-24: mendedPp > 5 -> observed 7.172.
        assert.ok(m.mendedPp > 5, `wire mended: the siren goes on (${m.mendedPp} V swing)`);
        near(m.q1cReset, 7.05, 0.1, 'reset: armed again (V)');
        // MEASURED 2026-11-24: resetPp < 0.05 -> observed 0.001.
        assert.ok(m.resetPp < 0.05, `reset: silent (${m.resetPp})`);
        near(m.hzHigh, 616, 20, 'siren, Q4 off: the high tone (Hz)');
        // MEASURED 2026-11-24: hzHigh > hzLow * 1.15 -> observed 615.8 against 499.8 (x1.23).
        assert.ok(m.hzHigh > m.hzLow * 1.15, `two clearly different tones (${m.hzHigh} against ${m.hzLow} Hz)`);
    });

    test('lab-steered-toggle-toss: one STEP, one toggle; TOSS toggles 55 times a second and stops where it stops', () => {
        const x = bench('lab-steered-toggle-toss');
        x.run(10);
        const red = () => x.v('q1', 'collector') < 1;
        const m = { q1c0: r3(x.v('q1', 'collector')), q2c0: r3(x.v('q2', 'collector')), steps: [] };
        for (let i = 0; i < 4; i++) {
            x.set('step', 1); x.run(10); const pressed = red(); x.set('step', 0); x.run(10);
            m.steps.push([pressed, red()]);
        }
        x.set('toss', 1);
        let flips = 0; let last = red();
        x.each(100, 1, () => { const s = red(); if (s !== last) flips++; last = s; });
        x.set('toss', 0); x.run(5);
        const held = red(); x.run(40);
        Object.assign(m, { flips, held, after: red(), tossOut: r3(x.v('u', 'vout')) });
        report('lab-steered-toggle-toss', m);
        near(m.q1c0, 7.20, 0.05, 'switch-on: Q1 off');
        near(m.q2c0, 0.09, 0.05, 'switch-on: Q2 on (green)');
        assert.deepEqual(m.steps, [[true, true], [false, false], [true, true], [false, false]], 'each press toggles once; release does nothing');
        near(m.flips, 6, 1, 'TOSS held 100 ms: about 55 toggles a second');
        assert.equal(m.after, m.held, 'released: the coin stays where it fell');
        near(m.tossOut, 8.10, 0.02, 'released: the oscillator parked high');
    });

    test('lab-schmitt-supply-watch: the pot and the battery both meet hysteresis', () => {
        const x = bench('lab-schmitt-supply-watch');
        x.run(1);
        const m = { in1: r3(x.v('q1', 'base')), q1c1: r3(x.v('q1', 'collector')), q2c1: r3(x.v('q2', 'collector')), e1: r3(x.v('re', 'a')) };
        const warn = () => x.v('q2', 'collector') < 6;
        const potWay = [];
        for (const p of [0.55, 0.5, 0.45, 0.5, 0.55, 0.6]) { x.set('pot', p); x.run(1); potWay.push([p, warn(), r3(x.v('q2', 'collector'))]); }
        m.potWay = potWay;
        x.set('pot', 0.45); x.run(1); m.warnLed = r3(x.mA('rc2')); x.set('pot', 0.6); x.run(1);
        let down = null; let up = null; let w = warn();
        for (let v = 9; v >= 6.5; v -= 0.25) { x.set('bat', v); x.run(1); const nw = warn(); if (nw && !w && down === null) down = v; w = nw; }
        for (let v = 6.5; v <= 9.01; v += 0.25) { x.set('bat', v); x.run(1); const nw = warn(); if (!nw && w && up === null) up = v; w = nw; }
        Object.assign(m, { down, up });
        report('lab-schmitt-supply-watch', m);
        near(m.q2c1, 9.0, 0.01, 'fresh 9 V battery, pot at 0.6: no warning');
        near(m.e1, 2.24, 0.05, 'Q1 carries the shared emitter current (V across 1 kΩ)');
        assert.deepEqual(m.potWay.map(([p, wn]) => [p, wn]), [[0.55, false], [0.5, true], [0.45, true], [0.5, true], [0.55, true], [0.6, false]],
            'turning down, the warning comes on at 0.5; turning back, it stays on at 0.55 and goes off only at 0.6');
        near(m.warnLed, 2.7, 0.3, 'warning LED current (mA)');
        near(m.down, 7.25, 0.01, 'battery falling: warning at (V)');
        near(m.up, 8.25, 0.01, 'battery recovering: warning off at (V)');
    });
});
