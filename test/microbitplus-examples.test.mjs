/**
 * micro:bit+ gallery examples — convergence + fragment assertions.
 *
 * For each mb01–mb04 example: parse the .bw program, generate MicroPython,
 * assert the expected fragments appear, then prove dialect↔blocks
 * convergence (decompile → re-parse → generateMicroPython → same output).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { join } from 'path';
import SB3Creator from '../src/utils/sb3Creator.js';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

function normalise(py) {
    return py
        .split('\n')
        .map(l => l.replace(/\s+$/, ''))
        .filter(l => !l.startsWith('# @bw'))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function loadAndGenerate(name) {
    const bw = readFileSync(join(EXAMPLES, name, 'program.bw'), 'utf8');
    const c = new SB3Creator();
    c.parse(bw);
    const r = c.generateMicroPython();
    assert.ok(r.ok, `${name}: MicroPython gen failed: ${JSON.stringify(r.reasons || r.warnings)}`);
    const decomp = c.decompile();
    return { py: r.py, decomp };
}

function roundTripGenerate(decompiledText) {
    const c = new SB3Creator();
    c.parse(decompiledText);
    const r = c.generateMicroPython();
    assert.ok(r.ok, `round-trip gen failed: ${JSON.stringify(r.reasons || r.warnings)}`);
    return r.py;
}

// ---- mb01-display ----
describe('mb01-display', () => {
    const FRAGMENTS = [
        "display.show(Image('09900:09900:09900:00000:00000'))",
        "display.scroll('Hello')",
        "display.scroll('BW', delay=int(80))",
        'display.clear()',
    ];

    test('expected MicroPython fragments present', () => {
        const { py } = loadAndGenerate('mb01-display');
        for (const frag of FRAGMENTS) {
            assert.ok(py.includes(frag), `missing: ${frag}\nin: ${py}`);
        }
    });

    test('dialect↔blocks convergence', () => {
        const { py, decomp } = loadAndGenerate('mb01-display');
        const pyRT = roundTripGenerate(decomp);
        assert.equal(normalise(py), normalise(pyRT), 'convergence failed for mb01-display');
    });
});

// ---- mb02-sensors ----
describe('mb02-sensors', () => {
    const FRAGMENTS = [
        'accelerometer.get_x()',
        'display.read_light_level()',
        'temperature()',
    ];

    test('expected MicroPython fragments present', () => {
        const { py } = loadAndGenerate('mb02-sensors');
        for (const frag of FRAGMENTS) {
            assert.ok(py.includes(frag), `missing: ${frag}\nin: ${py}`);
        }
    });

    test('dialect↔blocks convergence', () => {
        const { py, decomp } = loadAndGenerate('mb02-sensors');
        const pyRT = roundTripGenerate(decomp);
        assert.equal(normalise(py), normalise(pyRT), 'convergence failed for mb02-sensors');
    });
});

// ---- mb03-pins ----
describe('mb03-pins', () => {
    const FRAGMENTS = [
        'pin0.write_digital(1)',
        'pin0.write_digital(0)',
        'pin0.read_digital()',
        'pin1.read_analog()',
        'pin2.write_analog(int(50 / 100 * 1023))',
    ];

    test('expected MicroPython fragments present', () => {
        const { py } = loadAndGenerate('mb03-pins');
        for (const frag of FRAGMENTS) {
            assert.ok(py.includes(frag), `missing: ${frag}\nin: ${py}`);
        }
    });

    test('dialect↔blocks convergence', () => {
        const { py, decomp } = loadAndGenerate('mb03-pins');
        const pyRT = roundTripGenerate(decomp);
        assert.equal(normalise(py), normalise(pyRT), 'convergence failed for mb03-pins');
    });
});

// ---- mb04-radio ----
describe('mb04-radio', () => {
    const FRAGMENTS = [
        'import radio',
        'radio.config(group=int(5), power=int(3))',
        'radio.on()',
        'accelerometer.get_x()',
        'radio.send(str(',
    ];

    test('expected MicroPython fragments present', () => {
        const { py } = loadAndGenerate('mb04-radio');
        for (const frag of FRAGMENTS) {
            assert.ok(py.includes(frag), `missing: ${frag}\nin: ${py}`);
        }
    });

    test('dialect↔blocks convergence', () => {
        const { py, decomp } = loadAndGenerate('mb04-radio');
        const pyRT = roundTripGenerate(decomp);
        assert.equal(normalise(py), normalise(pyRT), 'convergence failed for mb04-radio');
    });
});
