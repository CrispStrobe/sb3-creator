/**
 * Scenarios 16-29 of the round-6 r6f lab benches, less lab-light-remote
 * (lab-circuits-r6f-3.test.mjs); the set, its header and scenarios 1-15 are
 * test/lab-circuits-r6f.test.mjs.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { r6fGate, loadR6f, bench, near, seen } from './helpers/lab-r6f-bench.mjs';

const gate = r6fGate(2);
const SKIP = gate.skip || false;
await loadR6f(gate);

describe('round-6 r6f benches behave as documented (part 2)', { skip: SKIP }, () => {
    test('lab-ptc-tone-bridge: the earphone falls silent at balance', () => {
        const pp = (T) => {
            const x = bench('lab-ptc-tone-bridge', { ptc: { surroundC: T } });
            x.run(10);
            return x.span(() => x.across('ear'), 3).pp;
        };
        // MEASURED 2026-11-24: pp(25) < 0.002 -> observed 0.0004 (balanced: silent).
        assert.ok(seen('25 C: earphone p-p (V)', pp(25)) < 0.002, '25 C: balanced');
        near(pp(35), 0.135, 0.015, '35 C: earphone p-p (V)');
        near(pp(15), 0.143, 0.015, '15 C: earphone p-p (V)');
        near(pp(50), 0.318, 0.03, '50 C: earphone p-p (V)');
    });

    test('lab-pll-lock: the VCO locks onto the transistor astable; out of range the red LED lights', () => {
        // Astable frequency from its collector, VCO frequency from the 4046.
        const x = bench('lab-pll-lock');
        // The loop rings for about 30 ms before it settles (VCO 777, 763,
        // 732, 734, 741 Hz in successive 6 ms windows against a 739 Hz astable).
        x.run(30);
        // Over the same 6 ms, from rising edges of the astable's collector and
        // of VCO_OUT (the 4046's last single period jitters with every PC2 correction).
        const [ref, vco] = x.hzPair(() => x.v('q2', 'collector'), () => x.v('u', 'vco_out'), 4.5, 6, 0.01);
        near(ref, 739, 20, 'as built: astable (Hz)');
        near(vco, ref, 0.01 * ref, 'locked: the VCO runs at the astable frequency on average (Hz)');
        near(x.v('a', 'vout'), 8.1, 0.1, 'locked: lock detector high, green LED');
        // MEASURED 2026-11-24: green LED > 1.8 V -> observed 2.01.
        assert.ok(seen('locked: green LED (V)', x.across('green', 'anode', 'cathode')) > 1.8, 'locked: green on');
        // Tuned below the VCO's range (532 Hz minimum) the loop cannot follow:
        // comparator II keeps pulling down against the 1 MOhm start bias and
        // the VCO wanders above its minimum, far from the astable.
        const out = bench('lab-pll-lock', { tune: { position: 0 } });
        out.run(20);
        const [low, vcoLow] = out.hzPair(() => out.v('q2', 'collector'), () => out.v('u', 'vco_out'), 4.5, 6, 0.01);
        // MEASURED 2026-11-24: astable with the tune pot at 0 < 532 Hz -> observed 396.8.
        assert.ok(seen('tune 0: astable (Hz)', low) < 532, `tune 0: astable ${low} Hz, below the VCO range`);
        // MEASURED 2026-11-24: VCO - astable > 50 Hz -> observed 194.9.
        assert.ok(seen('tune 0: VCO minus astable (Hz)', vcoLow - low) > 50, `tune 0: VCO ${vcoLow} Hz does not follow`);
        near(out.v('a', 'vout'), 0.9, 0.1, 'out of range: lock detector low, red LED');
        const man = bench('lab-pll-lock', { sw: { position: 1 } });
        man.run(6);
        near(man.state('u').vcoHz, 682, 8, 'manual: the VCO follows only the pot (Hz)');
    });

    test('lab-pll-fsk: the key shifts the tone, the loop turns it back into 0 and 1', () => {
        const x = bench('lab-pll-fsk');
        const one = () => x.v('a', 'vout') > 4.5;
        x.run(12);
        near(x.state('u').vcoHz, 700, 25, 'key up: locked to the low tone (Hz)');
        assert.equal(one(), false, 'key up: "0" LED');
        x.set('key', 1); x.run(12);
        near(x.state('u').vcoHz, 917, 25, 'key down: locked to the high tone (Hz)');
        assert.equal(one(), true, 'key down: "1" LED');
        // MEASURED 2026-11-24: "1" LED > 1.6 V -> observed 1.91.
        assert.ok(seen('key down: "1" LED (V)', x.across('one', 'anode', 'cathode')) > 1.6, '"1" LED on');
        x.set('key', 0); x.run(12);
        assert.equal(one(), false, 'key released: "0" again');
    });

    test('lab-pll-beats: the sum of the astable and the VCO swells and fades', () => {
        const x = bench('lab-pll-beats');
        x.run(5);
        const ast = x.hz(() => x.v('q2', 'collector'), 4.5, 6, 0.01);
        const vco = x.state('u').vcoHz;
        near(ast, 699, 15, 'astable (Hz)');
        near(vco, 782, 8, 'VCO, tune pot at half (Hz)');
        // Peak-to-peak of the amplifier output in 1.2 ms windows over 30 ms.
        const pp = [];
        for (let i = 0; i < 25; i++) pp.push(x.span(() => x.v('a', 'vout'), 1.2, 0.05).pp);
        const big = Math.max(...pp); const small = Math.min(...pp);
        // MEASURED 2026-11-24: big / small > 1.5 -> observed 2.02 (3.56 V vs 1.76 V peak to peak).
        assert.ok(seen('beat: loud/quiet window ratio', big / small) > 1.5, `beat: ${big} vs ${small}`);
    });

    test('lab-pll-hygrometer: moister air, higher pitch; the bridge meter swings through zero', () => {
        const x = bench('lab-pll-hygrometer');
        x.set('comb', 0.6); x.run(12);
        near(x.state('comb').ohms / 1e6, 1.468, 0.01, '60 % RH: comb (MOhm)');
        near(x.state('u').vcoHz, 340.6, 4, '60 % RH: tone (Hz)');
        x.set('comb', 0.66); x.run(8);
        near(x.state('u').vcoHz, 1077, 15, '66 % RH: tone (Hz)');
        const meter = (rh) => { const y = bench('lab-pll-hygrometer', { sel: { position: 1 } }); y.set('comb', rh); y.run(2); return y.state('meter').reading; };
        near(meter(0.5), -0.964, 0.05, 'bridge, 50 % RH (V)');
        near(meter(0.62), 0, 0.02, 'bridge, 62 % RH (V)');
        near(meter(0.74), 1.688, 0.05, 'bridge, 74 % RH (V)');
    });

    test('lab-ptc-alarm: the tone switches on at a higher temperature than it switches off', () => {
        // The sensor's time constant is shortened to 5 ms here so the sweep
        // (1 K every 20 ms) does not have to run the tone for seconds.
        const sweep = (mode) => {
            const x = bench('lab-ptc-alarm', { ptc: { thermalTau: 0.005 }, mode: { position: mode } });
            x.run(20);
            const startHigh = x.v('a', 'vout') > 4.5;
            let on = null; let off = null;
            for (let T = 26; T <= 50 && on === null; T++) { x.param('ptc', 'surroundC', T); x.run(20); if (x.v('a', 'vout') > 4.5) on = T; }
            const rail = x.v('mode', 'com');
            const sing = x.span(() => x.v('q2', 'collector'), 6).pp;
            for (let T = on - 1; T >= 10 && off === null; T--) { x.param('ptc', 'surroundC', T); x.run(20); if (x.v('a', 'vout') < 4.5) off = T; }
            return { startHigh, on, off, rail, sing, railCold: x.v('mode', 'com') };
        };
        const rise = sweep(0);
        assert.equal(rise.startHigh, false, '25 C: below the threshold');
        near(rise.on, 35, 1, 'switches on at (C)');
        near(rise.off, 32, 1, 'switches off at (C)');
        // MEASURED 2026-11-24: on - off >= 2 -> observed 3.
        assert.ok(seen('hysteresis (K)', rise.on - rise.off) >= 2, 'two separate thresholds');
        // MEASURED 2026-11-24: rising alarm: astable swing > 4 V -> observed 6.34.
        assert.ok(seen('rising: tone swing (V)', rise.sing) > 4, 'rising mode: the tone sounds when hot');
        const fall = sweep(1);
        // MEASURED 2026-11-24: falling mode, hot: astable rail < 1 V -> observed 0.17.
        assert.ok(seen('falling mode, hot: rail (V)', fall.rail) < 1, 'falling mode: silent when hot');
        // MEASURED 2026-11-24: falling mode, cooled: rail > 7 V -> observed 8.89.
        assert.ok(seen('falling mode, cooled: rail (V)', fall.railCold) > 7, 'falling mode: the tone sounds when it has cooled');
    });

    test('lab-ptc-fibre-alarm: above the limit the LED lights and the far end sounds', () => {
        const at = (T) => {
            const x = bench('lab-ptc-fibre-alarm', { ptc: { surroundC: T } });
            x.run(10);
            return { led: x.across('led', 'anode', 'cathode'), rail: x.v('qp', 'collector'), sing: x.span(() => x.v('q2', 'collector'), 5).pp };
        };
        const cool = at(25); const hot = at(45);
        // MEASURED 2026-11-24: 25 C: LED < 1.2 V, rail < 0.5 V, swing < 0.1 V -> observed 0.90, 8e-11, 3e-11.
        assert.ok(seen('25 C: LED (V)', cool.led) < 1.2 && seen('25 C: rail (V)', cool.rail) < 0.5 && seen('25 C: swing (V)', cool.sing) < 0.1, '25 C: dark and silent');
        near(hot.led, 1.815, 0.05, '45 C: transmitter LED (V)');
        near(hot.rail, 8.926, 0.05, '45 C: receiver tone supply (V)');
        // MEASURED 2026-11-24: 45 C: swing > 6 V -> observed 8.89.
        assert.ok(seen('45 C: tone swing (V)', hot.sing) > 6, '45 C: the far end sounds');
    });

    test('lab-abs-alarm: a held wheel turns green to red and sounds the tone', () => {
        const x = bench('lab-abs-alarm');
        const red = () => x.across('red', 'anode', 'cathode') > 1.5;
        x.run(300);
        near(x.state('wheel').omega, 450, 5, 'free wheel (rad/s)');
        assert.equal(red(), false, 'turning: green');
        // MEASURED 2026-11-24: turning: oscillator swing < 0.1 V -> observed 0.
        assert.ok(seen('turning: tone swing (V)', x.span(() => x.v('a', 'vout'), 4).pp) < 0.1, 'turning: silent');
        x.param('wheel', 'loadTorque', 0.05); x.run(60);
        assert.equal(x.state('wheel').omega, 0, 'held: the wheel stands still');
        assert.equal(red(), true, 'held: red');
        near(x.hz(() => x.v('a', 'vout'), 4.5, 12), 413, 25, 'held: warning tone (Hz)');
        x.param('wheel', 'loadTorque', 0); x.run(200);
        assert.equal(red(), false, 'released: green again');
    });

    test('lab-motor-throttle: the magnet is the throttle; the run switch ramps the motor softly', () => {
        const speed = (field) => { const x = bench('lab-motor-throttle', { hall: { field } }); x.run(800); return x.state('motor').omega; };
        const s0 = speed(0); const s3 = speed(0.3); const s6 = speed(0.6);
        // MEASURED 2026-11-24: no magnet: < 5 rad/s -> observed 0.
        assert.ok(seen('no magnet (rad/s)', s0) < 5, 'no magnet: the motor stands');
        near(s3, 85.2, 8, 'field 0.3 (rad/s)');
        near(s6, 240.6, 10, 'field 0.6 (rad/s)');
        const x = bench('lab-motor-throttle', { mode: { position: 1 } });
        x.set('run', 1);
        const ramp = [];
        for (let i = 0; i < 6; i++) { x.run(250); ramp.push(x.state('motor').omega); }
        near(ramp[0], 24.1, 6, 'soft start, 0.25 s (rad/s)');
        near(ramp[2], 225.7, 10, 'soft start, 0.75 s (rad/s)');
        near(ramp[5], 312.3, 8, 'soft start, 1.5 s (rad/s)');
        x.set('run', 0); x.run(500);
        near(x.state('motor').omega, 274.3, 15, 'soft stop, 0.5 s (rad/s)');
        x.run(1000);
        near(x.state('motor').omega, 55.2, 15, 'soft stop, 1.5 s (rad/s)');
    });

    test('lab-hall-tacho: the pulse rate becomes a voltage; the loop holds it at the set value', () => {
        // Regulated, no load: the tachometer voltage is held at the set
        // voltage and the speed stays put.
        const x = bench('lab-hall-tacho');
        x.run(400);
        const w = [];
        for (let i = 0; i < 6; i++) { x.run(100); w.push(x.state('motor').omega); }
        for (const v of w) near(v, 179, 10, 'regulated, no load (rad/s)');
        near(x.v('ch', 'pos'), x.v('set', 'wiper'), 0.05, 'tachometer voltage held at the set voltage (V)');
        // With a load the on/off loop hunts around the set speed; its average stays near it.
        const y = bench('lab-hall-tacho', { motor: { loadTorque: 0.004 } });
        y.run(400);
        let sum = 0; let n = 0;
        for (let i = 0; i < 16; i++) { y.run(50); sum += y.state('motor').omega; n++; }
        near(sum / n, 173, 30, 'regulated, load 0.004 N m: average speed (rad/s)');
    });

    test('lab-motor-stall-cutout: a held shaft trips the cut-out; only the main switch resets it', () => {
        const x = bench('lab-motor-stall-cutout');
        const tripped = () => x.v('qp', 'emitter') < 2;
        x.run(400);
        near(x.state('motor').omega, 342.7, 10, 'running with a light load (rad/s)');
        assert.equal(tripped(), false, 'running: not tripped');
        x.param('motor', 'loadTorque', 0.05); x.run(400);
        assert.equal(tripped(), true, 'held: tripped');
        // MEASURED 2026-11-24: drive after the trip < 1.5 V -> observed 0.88.
        assert.ok(seen('tripped: drive (V)', x.v('a', 'vout')) < 1.5, 'the drive is cut');
        // MEASURED 2026-11-24: TRIP LED > 1.6 V -> observed 1.71.
        assert.ok(seen('tripped: LED (V)', x.across('trip', 'anode', 'cathode')) > 1.6, 'TRIP LED on');
        x.param('motor', 'loadTorque', 0.002); x.run(300);
        assert.equal(tripped(), true, 'released: stays tripped');
        // MEASURED 2026-11-24: released but tripped < 5 rad/s -> observed 0.
        assert.ok(seen('tripped, released (rad/s)', x.state('motor').omega) < 5, 'the motor stays off');
        x.set('main', 0); x.run(50); x.set('main', 1); x.run(400);
        assert.equal(tripped(), false, 'main switch off and on: running again');
        near(x.state('motor').omega, 342.7, 10, 'running again (rad/s)');
    });

    test('lab-magnet-code-lock: three quick north passes open it; a south pass or slow passes do not', () => {
        const x = bench('lab-magnet-code-lock');
        const open = () => x.v('g', '2y') > 4.5;
        const pass = (field) => { x.param('hall', 'field', field); x.run(10); x.param('hall', 'field', 0); x.run(60); };
        const lock = () => { x.set('lock', 1); x.run(5); x.set('lock', 0); x.run(5); };
        x.run(20); lock();
        assert.equal(open(), false, 'start: locked');
        pass(0.8); pass(0.8);
        assert.equal(open(), false, 'two north passes: still locked');
        const two = x.v('cs', 'pos');
        pass(0.8);
        assert.equal(open(), true, 'third quick north pass: open');
        near(x.across('unl', 'anode', 'cathode'), 2.02, 0.1, 'open: green LED (V)');
        near(x.hz(() => x.v('a', 'vout'), 4.5, 12), 413, 25, 'open: tone (Hz)');
        lock(); x.run(3000);
        assert.equal(open(), false, 'LOCK pressed: locked again');
        pass(0.8); pass(0.8); pass(-0.8);
        // MEASURED 2026-11-24: after a south pass the count < 0.5 V -> observed 0.017.
        assert.ok(seen('south pass: count (V)', x.v('cs', 'pos')) < 0.5, 'a south pass empties the count');
        pass(0.8);
        assert.equal(open(), false, 'north, north, south, north: locked');
        x.run(3000);
        pass(0.8); x.run(1500); pass(0.8); x.run(1500); pass(0.8);
        assert.equal(open(), false, 'three slow passes: the count leaks away, locked');
        near(two, 2.25, 0.15, 'count after two quick passes (V)');
    });
});
