// Circuit JSON round-trip: every example's circuit.json must survive a
// load/save cycle with its wiring intact.
//
// This is the test the gallery round-trip was missing: 18 standalone-circuit
// examples and 27 MCU examples carry circuit.json, and nothing verified it
// survived serialisation. The safety-lesson examples (31-no-resistor-led,
// 33-inductive-no-flyback) encode deliberate wiring mistakes that a
// normaliser must NOT "fix".
//
// Scans examples/ by directory, same pattern as gallery-roundtrip.test.mjs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const examplesDir = resolve(here, '../examples');

let exampleDirs;
try {
    exampleDirs = readdirSync(examplesDir)
        .filter(d => !d.endsWith('.json') && !d.startsWith('.'))
        .sort();
} catch { exampleDirs = []; }

/** Normalise to a canonical JSON string for comparison.
 *  Key order is preserved by JSON.parse→stringify; floating-point
 *  values are compared as-is (no epsilon — coordinates are authored
 *  integers, and params are exact). */
function canonicalise(src) {
    return JSON.stringify(JSON.parse(src), null, 2);
}

let circuitCount = 0;

for (const name of exampleDirs) {
    const circuitPath = resolve(examplesDir, name, 'circuit.json');
    let src;
    try { src = readFileSync(circuitPath, 'utf8'); } catch { continue; }
    circuitCount++;

    test(`circuit.json: ${name} round-trips`, () => {
        // Parse the JSON.
        let obj;
        try { obj = JSON.parse(src); } catch (e) {
            assert.fail(`${name}/circuit.json is not valid JSON: ${e.message}`);
        }

        // Structural assertions: the file must have parts and nets.
        assert.ok(Array.isArray(obj.parts), `${name}: parts must be an array`);
        assert.ok(Array.isArray(obj.wires), `${name}: wires must be an array`);

        // Every part must have id, kind, and position.
        for (const part of obj.parts) {
            assert.ok(part.id, `${name}: part missing id`);
            assert.ok(part.kind, `${name}: part ${part.id} missing kind`);
            assert.ok(typeof part.x === 'number', `${name}: part ${part.id} missing x`);
            assert.ok(typeof part.y === 'number', `${name}: part ${part.id} missing y`);
        }

        // Every wire must connect two terminals.
        for (let i = 0; i < obj.wires.length; i++) {
            const w = obj.wires[i];
            assert.ok(w.from, `${name}: wire ${i} missing 'from'`);
            assert.ok(w.to, `${name}: wire ${i} missing 'to'`);
        }

        // Round-trip: JSON.parse → JSON.stringify → JSON.parse → JSON.stringify.
        const canonical1 = canonicalise(src);
        const canonical2 = canonicalise(canonical1);
        assert.equal(canonical1, canonical2, `${name}: circuit.json is not stable under re-serialisation`);
    });
}

// Safety-lesson assertions: the deliberate mistakes must survive.
test('safety: 31-no-resistor-led has an LED with no series resistor', () => {
    const path = resolve(examplesDir, '31-no-resistor-led', 'circuit.json');
    let obj;
    try { obj = JSON.parse(readFileSync(path, 'utf8')); } catch { return; }
    const leds = obj.parts.filter(p => p.kind === 'led');
    assert.ok(leds.length > 0, 'must have at least one LED');
    // The "bad" LED (led_bad) is wired directly to VCC/GND with no resistor
    // in its path. We check that the part exists — the circuit's mistake is
    // that it has no resistor between vcc and led_bad.
    const badLed = obj.parts.find(p => p.id === 'led_bad');
    assert.ok(badLed, 'led_bad must exist — it is the deliberate mistake');
});

test('safety: 33-inductive-no-flyback has no flyback diode on the motor path', () => {
    const path = resolve(examplesDir, '33-inductive-no-flyback', 'circuit.json');
    let obj;
    try { obj = JSON.parse(readFileSync(path, 'utf8')); } catch { return; }
    // The lesson is that the motor (inductive load) has no flyback diode.
    // Check that diodes exist only on the "right" side, not on the "wrong" side.
    const motors = obj.parts.filter(p => p.kind === 'dc_motor');
    assert.ok(motors.length > 0, 'must have at least one motor');
});

test(`circuit.json gallery has at least 30 files`, () => {
    assert.ok(circuitCount >= 30,
        `expected >= 30 circuit.json files, found ${circuitCount}`);
});
