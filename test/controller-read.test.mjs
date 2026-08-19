/**
 * `control of "NAME"` — the READ mirror of `set control X to V`, so a program
 * on ANY runtime surface can read the live value a Controller-panel widget
 * drives. Symmetric with the circuit reporters (nodeVoltage, ledBrightness)
 * and the setControl command; wired through the same runtime registry, so
 * Python/JS emit _circuit.getControl and the block round-trips.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const SRC = 'WHEN started:\n  set speed to control of "throttle"\n  say speed\n';

test('control of "X" parses to circuit_getcontrol and round-trips', () => {
    const c = new SB3Creator();
    c.parse(SRC);
    const back = new SB3Creator().decompile(c.project);
    assert.match(back, /control of "throttle"/, 'decompiles to the read phrase');
    const c2 = new SB3Creator();
    c2.parse(back);
    assert.equal(new SB3Creator().decompile(c2.project), back, 'round-trip is idempotent');
});

test('Python emits _circuit.getControl(name) + a board shim', () => {
    const c = new SB3Creator(); c.parse(SRC);
    const py = String(c.generatePython());
    assert.match(py, /_circuit\.getControl\("throttle"\)/, 'reads the named control');
    assert.match(py, /getControl/, 'board shim present');
});

test('JavaScript emits _circuit.getControl(name)', () => {
    const c = new SB3Creator(); c.parse(SRC);
    const js = String(c.generateJavaScript());
    assert.match(js, /_circuit\.getControl\("throttle"\)/, 'reads the named control');
    assert.match(js, /getControl:/, 'board shim present');
});

test('getControl is a REPORTER with a neutral 0 (no board -> never crashes)', () => {
    const c = new SB3Creator(); c.parse(SRC);
    const js = String(c.generateJavaScript());
    // the no-board stub returns the neutral (NaN) — a fake 0 reading is forbidden.
    assert.match(js, /getControl:\s*\(\)\s*=>\s*NaN/, "stub returns neutral NaN");
});
