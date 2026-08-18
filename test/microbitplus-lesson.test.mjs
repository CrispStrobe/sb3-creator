/**
 * micro:bit+ curriculum lesson — convergence + fragment assertions.
 *
 * mb05-lesson: display + buttons + sensors in one guided program.
 * Proves the dialect→blocks→MicroPython round-trip converges and
 * all oracle fragments appear.
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

describe('mb05-lesson', () => {
    const bw = readFileSync(join(EXAMPLES, 'mb05-lesson', 'program.bw'), 'utf8');

    function generate(src) {
        const c = new SB3Creator();
        c.parse(src);
        const r = c.generateMicroPython();
        assert.ok(r.ok, `gen failed: ${JSON.stringify(r.reasons || r.warnings)}`);
        return { py: r.py, decomp: c.decompile() };
    }

    const FRAGMENTS = [
        // Display
        "display.show(Image('09090:99999:99999:09990:00900'))",
        // Buttons in condition context
        'button_a.is_pressed()',
        'button_b.is_pressed()',
        // Sensors
        'temperature()',
        'display.read_light_level()',
        // Text display
        "display.scroll('T:')",
        "display.scroll('L:')",
    ];

    test('expected MicroPython fragments present', () => {
        const { py } = generate(bw);
        for (const frag of FRAGMENTS) {
            assert.ok(py.includes(frag), `missing: ${frag}`);
        }
    });

    test('dialect↔blocks convergence', () => {
        const { py, decomp } = generate(bw);
        const { py: pyRT } = generate(decomp);
        assert.equal(normalise(py), normalise(pyRT),
            'convergence failed: dialect and blocks produce different MicroPython');
    });

    test('button reporter works inside IF condition (not None)', () => {
        const { py } = generate(bw);
        assert.ok(!py.includes('None >'), 'button reporter should not produce None in condition');
        assert.ok(py.includes('button_a.is_pressed() > 0'), 'button_a in IF condition');
    });
});
