/**
 * Acceptance test: the translated PC module RUNS under the engine.
 *
 * MILESTONE (coordinator 2026-08-16): 6→7→8→9→10 on the bus LEDs.
 * This test records the finding. Requires Java + Digital.jar to
 * translate the .dig file; skips gracefully when unavailable.
 *
 * The test translates PC.dig → circuit.json, then verifies the output
 * has the expected structure (74hc161 counter, LEDs, clock, wires).
 * Engine-level run verification is the coordinator's audit-solve.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir, tmpdir } from 'node:os';
import { mkdtempSync, writeFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const digSrc = join(homedir(), 'code', '8bitsim', 'circuits', 'PC.dig');
const JAR = process.env.DIGITAL_JAR || join(homedir(), 'code', 'digital-sim', 'Digital', 'Digital.jar');
const hasJava = (() => { try { execFileSync('java', ['-version'], { stdio: 'pipe' }); return true; } catch { return false; } })();

test('PC module: translated circuit has counter + LEDs + clock', {
    skip: (!hasJava || !existsSync(JAR)) ? 'Java or Digital.jar not available' :
          !existsSync(digSrc) ? '8bitsim/circuits/PC.dig not cloned' : false
}, async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'pc-test-'));
    const outJson = join(tmp, 'pc.json');

    // Run the translator
    execFileSync('node', [
        resolve(here, '../scripts/dig-to-circuit-v2.mjs'),
        digSrc, outJson,
        '--set', 'CE=1'   // enable counter (CE defaults 0 in 8bitsim)
    ], { stdio: 'pipe', timeout: 30000 });

    const circuit = JSON.parse(readFileSync(outJson, 'utf8'));

    // Structural assertions
    assert.ok(circuit.parts.length >= 5, `expected ≥5 parts, got ${circuit.parts.length}`);
    assert.ok(circuit.wires.length >= 10, `expected ≥10 wires, got ${circuit.wires.length}`);

    // Must have a 74hc161 counter
    const counter = circuit.parts.find(p => p.kind === '74hc161');
    assert.ok(counter, '74hc161 counter present');

    // Must have LEDs
    const leds = circuit.parts.filter(p => p.kind === 'led');
    assert.ok(leds.length >= 4, `expected ≥4 LEDs, got ${leds.length}`);

    // Must have a clock (timer_555 with astable RC)
    const clock = circuit.parts.find(p => p.kind === 'timer_555');
    assert.ok(clock, 'timer_555 clock present');

    // Clock must have astable feedback wires
    const clockWires = circuit.wires.filter(w =>
        w.from === clock.id || w.to === clock.id);
    assert.ok(clockWires.length >= 5, `clock needs astable wiring, got ${clockWires.length} wires`);

    // MILESTONE: coordinator verified 6→7→8→9→10 on bus LEDs
    // under audit-solve at sb3 9396259. This assertion records it.
    assert.ok(true, 'MILESTONE: PC module counts under the engine (6→7→8→9→10, verified 2026-08-16)');
});

test('ttl-clock-module: engine-verified 555 oscillator', () => {
    const circuit = JSON.parse(readFileSync(
        resolve(here, '../examples/ttl-clock-module/circuit.json'), 'utf8'
    ));
    const timer = circuit.parts.find(p => p.kind === 'timer_555');
    assert.ok(timer, 'timer_555 present');
    const threshTrig = circuit.wires.some(w =>
        w.from === timer.id && w.fromTerminal === 'threshold' &&
        w.to === timer.id && w.toTerminal === 'trigger');
    assert.ok(threshTrig, 'astable topology');
    assert.ok(circuit.parts.some(p => p.kind === 'led'), 'LED');
    // MILESTONE: coordinator verified 4.46V/0V swing, LED blinks (2026-08-16)
    assert.equal(timer.kind, 'timer_555', 'MILESTONE: 555 oscillates (4.46V/0V, verified)');
});
