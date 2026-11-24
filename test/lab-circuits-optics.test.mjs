/**
 * The optics benches from `scripts/gen-lab-circuits-4.mjs --set=optics` do
 * what their EXPECTED.md says: measured on the COMMITTED circuit.json with
 * the knob each light path carries (bw-board src/optics.js: light from the
 * emitter's simulated current, along a light guide, an optical bench, a lens,
 * a coloured surface, a prism, a glass of liquid or past a plucked string).
 *
 * Parameter edits a learner would make in the inspector (LED colour, cut
 * quality, surface colour) are applied to the loaded JSON. Every number was
 * measured on the headless engine (bw-board r4/optics-20261123) when the
 * bench was built; the tolerances are bands around those measurements. The
 * 100 kHz FM link costs real time per simulated millisecond, so its
 * scenarios stay well under one millisecond each.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-optics.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (optics)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

/** Load a committed bench, optionally with role params edited first. */
function bench (id, edits = {}) {
    const json = JSON.parse(readFileSync(join(EXAMPLES, id, 'circuit.json'), 'utf8'));
    const ids = benchIds(BENCHES[id]);
    for (const [role, kv] of Object.entries(edits)) {
        const p = json.parts.find(q => q.id === ids[role]);
        assert.ok(p, `${id}: no part ${role}`);
        if (kv.kind) p.kind = kv.kind;
        if (kv.params) p.params = { ...kv.params }; else Object.assign(p.params, kv);
    }
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
        tone (name) { return b.buzzerTone(ids[name]); },
        light (name) { return b.opticalReport()?.receivers[ids[name]]?.light ?? 0; },
        led (name) { return b.ledBrightness(ids[name]); },
        run (ms) {
            tMs += ms;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
        },
        set (name, value) { b.setControl(ids[name], value); },
        /** Put a light path's knob at a geometry value (inverse of its knob range). */
        at (name, value) {
            const p = BENCHES[id].parts[name][1];
            b.setControl(ids[name], (value - p.knobMin) / (p.knobMax - p.knobMin));
        },
    };
    return api;
}

const near = (got, want, tol, what) =>
    assert.ok(Math.abs(got - want) <= tol, `${what}: ${got.toFixed(4)}, expected ${want} +-${tol}`);

describe('lab optics benches behave as documented', { skip: SKIP }, () => {
    test('lab-light-guide: bends, a rough cut, length and colour cost light; a sleeve shuts out the room', () => {
        const x = bench('lab-light-guide');
        x.run(1);
        near(x.v('vm', 'a'), 2.11, 0.05, 'authored 3 cm bend');
        x.at('guide', 0.4);
        near(x.v('vm', 'a'), 1.13, 0.05, '4 mm bend: half the light lost');
        x.at('guide', 5);
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): x.v('vm', 'a') > 2.1 -> observed
        // 2.1705927612932028.
        assert.ok(x.v('vm', 'a') > 2.1, 'gentle bend');
        const rough = bench('lab-light-guide', { guide: { cutQuality: 0 } }); rough.run(1);
        near(rough.v('vm', 'a'), 0.26, 0.05, 'rough cut ends');
        const green = bench('lab-light-guide', { led: { color: 'green' } }); green.run(1);
        near(green.v('vm', 'a'), 0.58, 0.05, 'green LED');
        // Plastic fibre: IR beats red over half a metre and loses to it over three.
        const reading = (color, lengthM) => {
            const y = bench('lab-light-guide', { led: { color }, guide: { lengthM } }); y.run(1);
            return y.v('vm', 'a');
        };
        assert.ok(reading('ir', 0.5) > 1.5 * reading('red', 0.5), 'IR, 0.5 m');
        assert.ok(reading('ir', 3) < 0.25 * reading('red', 3), 'IR, 3 m');
        // Room light on the receiver adds to the reading unless the end is sleeved.
        const room = bench('lab-light-guide', { pt: { light: 0.3 } }); room.run(1);
        const sleeved = bench('lab-light-guide', { pt: { light: 0.3 }, guide: { shield: 0.95 } }); sleeved.run(1);
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): room.v('vm', 'a') > 2.6 ->
        // observed 2.8152653844812185.
        assert.ok(room.v('vm', 'a') > 2.6, `room light ${room.v('vm', 'a')}`);
        near(sleeved.v('vm', 'a'), 2.15, 0.05, 'sleeved receiver');
    });

    test('lab-fibre-lens: a lens focuses the LED onto the fibre core where 1/f = 1/u + 1/v puts the image', () => {
        const x = bench('lab-fibre-lens');
        x.run(1);
        near(x.v('vm', 'a'), 4.12, 0.1, 'fibre entrance at the image, 9 cm');
        let best = 0, bestAt = 0;
        for (let at = 7.5; at <= 10.501; at += 0.25) {
            x.at('guide', at);
            if (x.v('vm', 'a') > best) { best = x.v('vm', 'a'); bestAt = at; }
        }
        assert.equal(bestAt, 9);
        x.at('guide', 8.75); near(x.v('vm', 'a'), 1.09, 0.08, 'a quarter centimetre short');
        const bare = bench('lab-fibre-lens', { guide: { lensFocalCm: 0, inGapMm: 90 } }); bare.run(1);
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): bare.v('vm', 'a') < 0.01 ->
        // observed 0.007753297080361285.
        assert.ok(bare.v('vm', 'a') < 0.01, `no lens: ${bare.v('vm', 'a')}`);
    });

    test('lab-fibre-tone: the closer the fibre end, the higher the pitch', () => {
        const x = bench('lab-fibre-tone');
        x.run(15);
        near(x.tone('spk').hz, 1960, 120, 'authored 2 mm gap');
        x.at('guide', 0); x.run(15);
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): x.tone('spk').hz > 3500 ->
        // observed 4131.744815176725.
        assert.ok(x.tone('spk').hz > 3500, `touching: ${x.tone('spk').hz}`);
        x.at('guide', 10); x.run(15);
        near(x.tone('spk').hz, 725, 60, '10 mm gap');
    });

    test('lab-fibre-audio: the earphone plays the transmitter\'s tone; a gap makes it quieter, not lower', () => {
        // Two benches from rest: a knob move mid-run re-charges the coupling
        // capacitor, and that settling transient is not the tone.
        const x = bench('lab-fibre-audio');
        x.run(16);
        const near1 = x.tone('ear');
        near(near1.hz, 679, 20, 'tone at 1 mm');
        const y = bench('lab-fibre-audio', { guide: { outGapMm: 10 } });
        y.run(16);
        const far = y.tone('ear');
        near(far.hz, 679, 20, 'tone at 10 mm');
        assert.ok(far.amps < 0.1 * near1.amps, `quieter: ${far.amps} vs ${near1.amps}`);
    });

    test('lab-fibre-fm: the meter follows the flash frequency, set by the control voltage', () => {
        const x = bench('lab-fibre-fm');
        x.set('pot', 0.2); x.run(0.3);
        const low = x.v('vm', 'a');
        x.set('pot', 0.8); x.run(0.3);
        const high = x.v('vm', 'a');
        // Lower control voltage = higher frequency = more pump charge.
        assert.ok(low > high + 0.15, `cv low ${low} vs cv high ${high}`);
        near(low, 1.5, 0.15, 'pot 0.2');
        near(high, 1.25, 0.15, 'pot 0.8');
    });

    test('lab-fibre-gap-gauge: hundredths of a millimetre move the meter', () => {
        const x = bench('lab-fibre-gap-gauge');
        x.run(1);
        near(x.v('vm', 'a'), 6.36, 0.1, 'authored 0.10 mm');
        x.at('guide', 0); const closed = x.v('vm', 'a');
        x.at('guide', 0.05); const g05 = x.v('vm', 'a');
        x.at('guide', 0.5); const open = x.v('vm', 'a');
        near(closed, 7.93, 0.1, 'closed joint');
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): closed - g05 > 0.5 -> observed
        // 0.7704452942886402.
        assert.ok(closed - g05 > 0.5, `0.05 mm: ${closed} -> ${g05}`);
        near(open, 2.83, 0.15, '0.5 mm');
    });

    test('lab-optical-bench: twice the distance, a quarter of the reading; the half angle halves it', () => {
        const x = bench('lab-optical-bench');
        x.run(1);
        near(x.v('vm', 'a'), 0.1239, 0.003, '10 cm');
        x.at('bench', 5); const v5 = x.v('vm', 'a');
        x.at('bench', 20); const v20 = x.v('vm', 'a');
        near(v5 / 0.1239, 4, 0.1, '5 cm vs 10 cm');
        near(0.1239 / v20, 4, 0.1, '10 cm vs 20 cm');
        const off = bench('lab-optical-bench', { bench: { angleDeg: 15 } }); off.run(1);
        near(off.v('vm', 'a') / 0.1239, 0.5, 0.02, '15° off axis');
    });

    test('lab-led-heat-light: a hot LED gives less light, a hot phototransistor reads more', () => {
        const x = bench('lab-led-heat-light');
        x.run(1);
        near(x.v('vm1', 'a'), 1.499, 0.02, 'cold link A');
        near(x.v('vm2', 'a'), 1.499, 0.02, 'cold link B');
        x.set('sw', 1);
        x.run(5000);
        near(x.v('vm1', 'a'), 0.84, 0.08, 'link A after 5 s of heat');
        near(x.v('vm2', 'a'), 1.83, 0.06, 'link B after 5 s of heat');
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): x.b.partTemperature(x.ids.led1)
        // > 60 -> observed 69.7752685321766.
        assert.ok(x.b.partTemperature(x.ids.led1) > 60, 'LED 1 is hot');
    });

    test('lab-light-guitar: the earphone plays the string, and the knob tunes it', () => {
        const x = bench('lab-light-guitar');
        x.run(60);
        near(x.tone('ear').hz, 110, 3, 'authored string');
        x.at('string', 330); x.run(60);
        near(x.tone('ear').hz, 330, 5, 'tuned up');
    });

    test('lab-colour-sensor: red light finds red, not green; infrared cannot tell them apart', () => {
        const x = bench('lab-colour-sensor');
        x.run(1);
        near(x.v('vm', 'a'), 1.858, 0.05, 'red surface');
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): x.led('ind') > 0.2 -> observed
        // 0.3491286677330537.
        assert.ok(x.led('ind') > 0.2, 'indicator on over red');
        const green = bench('lab-colour-sensor', { surface: { surface: 'green' } }); green.run(1);
        near(green.v('vm', 'a'), 0.38, 0.05, 'green surface');
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): green.led('ind') < 0.01 ->
        // observed 0.0000018977779357369495.
        assert.ok(green.led('ind') < 0.01, 'indicator off over green');
        const irRed = bench('lab-colour-sensor', { led: { color: 'ir' } }); irRed.run(1);
        const irGreen = bench('lab-colour-sensor', { led: { color: 'ir' }, surface: { surface: 'green' } }); irGreen.run(1);
        near(irGreen.v('vm', 'a') / irRed.v('vm', 'a'), 1, 0.1, 'IR: red and green alike');
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): irGreen.led('ind') > 0.2 ->
        // observed 0.3508921663616739.
        assert.ok(irGreen.led('ind') > 0.2, 'IR: indicator on over green too');
    });

    test('lab-lens-focus: the reading peaks where 1/f = 1/u + 1/v puts the image', () => {
        const x = bench('lab-lens-focus');
        x.run(1);
        near(x.v('vm', 'a'), 5.61, 0.1, 'at the image, 45 cm');
        let best = 0, bestD = 0;
        for (let d = 20; d <= 70; d += 2.5) {
            x.at('lens', d);
            if (x.v('vm', 'a') > best) { best = x.v('vm', 'a'); bestD = d; }
        }
        assert.equal(bestD, 45);
        x.at('lens', 35); near(x.v('vm', 'a'), 1.49, 0.1, '10 cm short');
        x.at('lens', 55); near(x.v('vm', 'a'), 1.49, 0.1, '10 cm long');
    });

    test('lab-liquid-level: once the liquid covers the beam, the "full" LED lights', () => {
        const x = bench('lab-liquid-level');
        x.run(1);
        near(x.v('q', 'base'), 0.43, 0.05, 'empty');
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): x.led('full') < 0.01 -> observed
        // 0.0000021472249668109516.
        assert.ok(x.led('full') < 0.01, 'empty: off');
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): x.led('full') < 0.01 -> observed
        // 0.0000021472249668109516.
        x.at('glass', 0.3); assert.ok(x.led('full') < 0.01, 'below the beam: off');
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): x.led('full') > 0.25 -> observed
        // 0.29726566464697873.
        x.at('glass', 0.7); assert.ok(x.led('full') > 0.25, `above the beam: ${x.led('full')}`);
    });

    test('lab-prism-spectrum: white shows two bands, red one, the laser one sharp line', () => {
        const sweep = (edits) => {
            const y = bench('lab-prism-spectrum', edits); y.run(1);
            const out = [];
            for (let a = 36.0; a <= 37.601; a += 0.1) { y.at('prism', a); out.push([a, y.v('vm', 'a')]); }
            return out;
        };
        const peaks = (tr, min) => tr.filter(([, v], i) => v > min
            && v >= (tr[i - 1]?.[1] ?? 0) && v >= (tr[i + 1]?.[1] ?? 0)).map(([a]) => +a.toFixed(1));
        const x = bench('lab-prism-spectrum'); x.run(1);
        near(x.v('vm', 'a'), 0.45, 0.05, 'authored slit 37.2°: the blue band');
        assert.deepEqual(peaks(sweep({}), 0.3), [36.6, 37.2], 'white: yellow-green and blue');
        assert.deepEqual(peaks(sweep({ led: { color: 'red' } }), 0.3), [36.3], 'red');
        const laser = sweep({ led: { kind: 'laser_diode', params: {} } });
        assert.deepEqual(peaks(laser, 1), [36.3], 'laser: one line');
        // MEASURED 2026-11-24 (scripts/threshold-observe.mjs): v > 0.3 -> observed
        // 4.697792037742281e-7…2.3057854013308825 over 17 reaches; v > 0.3 -> observed
        // 4.697792037742261e-7…9.460266355372827 over 17 reaches.
        assert.ok(laser.filter(([, v]) => v > 0.3).length < sweep({ led: { color: 'red' } }).filter(([, v]) => v > 0.3).length,
            'laser line narrower than the red LED band');
    });
});
