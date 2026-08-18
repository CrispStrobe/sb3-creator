/**
 * microbitPlus dual-lowering oracle — skeleton acceptance test.
 *
 * Asserts that a program authored as blocks and the same program authored
 * in BrickWright dialect converge on identical MicroPython output.
 *
 * Skip-gated until the microbitPlus extension scaffold lands.
 * See docs/microbitplus/DUAL-LOWERING-ORACLE.md for the full spec.
 *
 * Run: node --test test/microbit-oracle.test.mjs
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'fs';
import { join } from 'path';

// ---- gate: skip everything until the scaffold exists ----
const ROOT = join(import.meta.dirname, '..');
const SCAFFOLD_PATH = join(ROOT, 'src', 'extensions', 'microbitPlus', 'index.js');
const GATE = existsSync(SCAFFOLD_PATH)
    ? false
    : 'microbitPlus extension scaffold not yet landed (src/extensions/microbitPlus/index.js)';

// ---- the mapping table (§2 of DUAL-LOWERING-ORACLE.md) ----
// Each entry: [id, dialect, expectedPythonFragment]
// The full convergence test (dialect→blocks→py vs blocks→py) requires the
// scaffold; for now we encode the table as data so it's ready to wire up.

const ORACLE_TABLE = [
    // Display & LEDs
    ['D1', 'show pattern 09900:09900:09900:00000:00000', "display.show(Image('09900:09900:09900:00000:00000'))"],
    ['D2', 'show text "Hello"', "display.scroll('Hello')"],
    ['D3', 'clear display', 'display.clear()'],

    // Buttons
    ['B2', 'read button_a', 'button_a.is_pressed()'],

    // Motion / orientation — sensor reporters
    ['M1', 'read accel x', 'accelerometer.get_x()'],
    ['M2', 'read accel y', 'accelerometer.get_y()'],
    ['M3', 'read accel z', 'accelerometer.get_z()'],
    ['M7', 'read compass', 'compass.heading()'],
    ['M8', 'read magforce x', 'compass.get_x()'],
    ['M9', 'read magforce y', 'compass.get_y()'],
    ['M10', 'read magforce z', 'compass.get_z()'],

    // Environment — sensor reporters
    ['E1', 'read light', 'display.read_light_level()'],
    ['E2', 'read temperature', 'temperature()'],
    ['E3', 'read sound', 'microphone.sound_level()'],

    // Pins / GPIO
    ['P1', 'turn on led1', 'pin0.write_digital(0)'],  // active-low
    ['P3', 'set pin P0 to 1', 'pin0.write_digital(1)'],
    ['P4', 'read pot', 'pin1.read_analog()'],

    // Actuators
    ['A1', 'set buzzer to 440 hz', 'music.pitch(440, pin=pin0)'],
    ['A3', 'stop buzzer', 'music.stop()'],
];

// ---- normalise MicroPython output for comparison ----
function normalise(py) {
    return py
        .split('\n')
        .map(l => l.replace(/\s+$/, ''))         // trailing whitespace
        .filter(l => !l.startsWith('# @bw'))      // strip @bw line markers
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')               // collapse blank-line runs
        .trim();
}

// ---- tests ----

// normalise() is testable now regardless of the gate
test('normalise() strips @bw markers and collapses blanks', () => {
    const input = [
        'from microbit import *',
        '# @bw line 3',
        '',
        '',
        'display.clear()  ',
        '# @bw line 5',
    ].join('\n');
    const expected = 'from microbit import *\n\ndisplay.clear()';
    assert.equal(normalise(input), expected);
});

describe('microbitPlus dual-lowering oracle', { skip: GATE }, () => {
    // Phase 1: the table is data only; each row becomes a convergence sub-test
    // that will be un-gated when the scaffold lands.

    for (const [id, dialect, expectedFragment] of ORACLE_TABLE) {
        test(`${id}: dialect "${dialect}" → MicroPython contains "${expectedFragment}"`, () => {
            // Phase 2 implementation (after scaffold):
            //
            // 1. Build a minimal project with one green-flag script containing
            //    the operation expressed as blocks (via the microbitPlus block
            //    surface).
            // 2. Parse the dialect form through parse() to get the same project
            //    from .bw text.
            // 3. Run generateMicroPython() on both.
            // 4. Assert normalise(pyFromBlocks) === normalise(pyFromDialect).
            // 5. Assert both outputs contain expectedFragment.
            //
            // For now, just assert the table is well-formed.
            assert.ok(id, 'has an ID');
            assert.ok(dialect, 'has a dialect form');
            assert.ok(expectedFragment, 'has an expected MicroPython fragment');
        });
    }

});
