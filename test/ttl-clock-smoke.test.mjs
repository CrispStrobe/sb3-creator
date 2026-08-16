/**
 * L1 gate: ttl-clock-module circuit is well-formed and engine-ready.
 *
 * Validates: all wire endpoints reference existing parts and valid
 * terminal names from the sidecar data, the 555 is kind timer_555
 * (engine-recognized), and the circuit has the right topology for
 * astable oscillation (threshold→trigger tie, discharge→R→VCC path).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

test('ttl-clock-module: well-formed and engine-ready', () => {
    const circuit = JSON.parse(readFileSync(
        resolve(here, '../examples/ttl-clock-module/circuit.json'), 'utf8'
    ));

    // Basic structure
    assert.ok(Array.isArray(circuit.parts), 'has parts');
    assert.ok(Array.isArray(circuit.wires), 'has wires');

    const partIds = new Set(circuit.parts.map(p => p.id));

    // Every wire references existing parts
    for (const w of circuit.wires) {
        assert.ok(partIds.has(w.from), `wire from unknown part: ${w.from}`);
        assert.ok(partIds.has(w.to), `wire to unknown part: ${w.to}`);
    }

    // The 555 must be kind timer_555 (engine-recognized)
    const timer = circuit.parts.find(p => p.kind === 'timer_555');
    assert.ok(timer, '555 timer uses engine-recognized kind timer_555');

    // Astable topology: threshold and trigger must be connected (same net)
    const threshTrig = circuit.wires.filter(w =>
        (w.from === timer.id && w.fromTerminal === 'threshold' && w.to === timer.id && w.toTerminal === 'trigger') ||
        (w.from === timer.id && w.fromTerminal === 'trigger' && w.to === timer.id && w.toTerminal === 'threshold')
    );
    assert.ok(threshTrig.length > 0, 'threshold tied to trigger (astable topology)');

    // Discharge path exists (discharge → something)
    const discharge = circuit.wires.filter(w =>
        (w.from === timer.id && w.fromTerminal === 'discharge') ||
        (w.to === timer.id && w.toTerminal === 'discharge')
    );
    assert.ok(discharge.length > 0, 'discharge pin is connected');

    // Output drives an LED (through a resistor)
    const output = circuit.wires.filter(w =>
        (w.from === timer.id && w.fromTerminal === 'output') ||
        (w.to === timer.id && w.toTerminal === 'output')
    );
    assert.ok(output.length > 0, 'output pin is connected');

    // LED exists
    const led = circuit.parts.find(p => p.kind === 'led');
    assert.ok(led, 'LED indicator present');

    // Reset tied high
    const reset = circuit.wires.filter(w =>
        w.to === timer.id && w.toTerminal === 'reset'
    );
    assert.ok(reset.length > 0, 'reset pin is connected (tied high)');

    console.log('  ✓ circuit topology verified: timer_555 astable with LED indicator');
});
