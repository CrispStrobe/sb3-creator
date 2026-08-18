/**
 * microbitPlus dual-lowering oracle — Phase 2 convergence test.
 *
 * Proves that for every v1 oracle row, a program authored as DIALECT and
 * the same program authored as BLOCKS converge on the SAME MicroPython.
 *
 * The convergence invariant (DUAL-LOWERING-ORACLE.md §3):
 *
 *   normalise(generateMicroPython(parse(dialect)))
 *     ===
 *   normalise(generateMicroPython(parse(decompile(parse(dialect)))))
 *
 * The second path simulates a blocks-authored program: parse builds the
 * block tree, decompile turns it back into pseudocode (the same text a
 * user would see in the dialect tab after dragging blocks), and re-parse
 * proves it round-trips to identical MicroPython.
 *
 * See docs/microbitplus/DUAL-LOWERING-ORACLE.md for the full spec.
 *
 * Run: node --test test/microbit-oracle.test.mjs
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

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

// ---- helpers ----

/**
 * Parse dialect → generateMicroPython.
 * Returns { py, decomp } — the MicroPython text and the decompiled pseudocode.
 */
function dialectToMicroPython(body) {
    const c = new SB3Creator();
    c.parse(`DEVICE MICROBIT:\n  WHEN started:\n    ${body}\n`);
    const r = c.generateMicroPython();
    assert.ok(r.ok, `MicroPython gen failed: ${JSON.stringify(r.reasons || r.warnings)}`);
    const decomp = c.decompile();
    return { py: r.py, decomp };
}

/**
 * Decompiled pseudocode → parse → generateMicroPython.
 * Simulates the blocks-authored path.
 */
function blocksToMicroPython(decompiledText) {
    const c = new SB3Creator();
    c.parse(decompiledText);
    const r = c.generateMicroPython();
    assert.ok(r.ok, `MicroPython gen (round-trip) failed: ${JSON.stringify(r.reasons || r.warnings)}`);
    return r.py;
}

// ---- the v1 oracle table (DUAL-LOWERING-ORACLE.md §2) ----
// Each entry: [id, dialectBody, expectedPythonFragment]
//
// Commands are used directly. Reporters need a `set val to ...` wrapper
// to appear as a statement the emitter can walk.
//
// Rows P1/P2/P4/P7 require declared-pin syntax (PIN ... AT P0 ACTIVE LOW)
// which is not yet wired for DEVICE MICROBIT; they are tested separately
// via the stc12_setpin path in the per-group tests. This oracle covers
// the microbitPlus-native operations.

const ORACLE_TABLE = [
    // ---- Display & LEDs (D1–D6) ----
    ['D1', 'show pattern 09900:09900:09900:00000:00000', "display.show(Image('09900:09900:09900:00000:00000'))"],
    ['D2', 'show text "Hello"',            "display.scroll('Hello')"],
    ['D3', 'clear display',                 'display.clear()'],
    ['D4', 'scroll text "hi" delay 100 ms', "display.scroll('hi', delay=int(100))"],
    ['D5', 'plot x 2 y 3 on',              'display.set_pixel(int(2), int(3), 9)'],
    ['D6', 'plot x 0 y 4 off',             'display.set_pixel(int(0), int(4), 0)'],

    // ---- Buttons (B2) ----
    ['B2', 'set val to read button_a',      'button_a.is_pressed()'],

    // ---- Motion / orientation (M1–M11) ----
    ['M1',  'set val to read accel x',        'accelerometer.get_x()'],
    ['M2',  'set val to read accel y',        'accelerometer.get_y()'],
    ['M3',  'set val to read accel z',        'accelerometer.get_z()'],
    ['M4',  'set val to read accel strength',  'math.sqrt(accelerometer.get_x()**2 + accelerometer.get_y()**2 + accelerometer.get_z()**2)'],
    ['M5',  'set val to read pitch',           '_pitch()'],
    ['M6',  'set val to read roll',            '_roll()'],
    ['M7',  'set val to read compass',         'compass.heading()'],
    ['M8',  'set val to read magforce x',      'compass.get_x()'],
    ['M9',  'set val to read magforce y',      'compass.get_y()'],
    ['M10', 'set val to read magforce z',      'compass.get_z()'],
    ['M11', 'set val to read magforce absolute', 'math.sqrt(compass.get_x()**2 + compass.get_y()**2 + compass.get_z()**2)'],

    // ---- Environment (E1–E3) ----
    ['E1', 'set val to read light',           'display.read_light_level()'],
    ['E2', 'set val to read temperature',     'temperature()'],
    ['E3', 'set val to read sound',           'microphone.sound_level()'],

    // ---- Pins / GPIO (P3, P5, P6) ----
    ['P3', 'set pin P0 to 1',                'pin0.write_digital(1)'],
    ['P3b','set pin P0 to 0',                'pin0.write_digital(0)'],
    ['P5', 'set pin P2 analog 50 %',         'pin2.write_analog(int(50 / 100 * 1023))'],
    ['P6a','set pin P0 pull up',             'pin0.set_pull(pin0.PULL_UP)'],
    ['P6b','set pin P1 pull down',           'pin1.set_pull(pin1.PULL_DOWN)'],
    ['P6c','set pin P2 pull none',           'pin2.set_pull(pin2.NO_PULL)'],
    // Pin reporters
    ['Pr1','set val to pin P0 digital',      'pin0.read_digital()'],
    ['Pr2','set val to analog value of pin P1', 'pin1.read_analog()'],

    // ---- Actuators (A1–A4) ----
    ['A1', 'set buzzer to 440 hz',           'music.pitch(int(440), pin=pin0)'],
    ['A1b','play tone 880 hz for 200 ms',    'music.pitch(int(880), int(200), pin=pin0)'],
    ['A2', 'play note C4',                   'music.pitch(262, 500, pin=pin0)'],
    ['A3', 'stop buzzer',                    'music.stop()'],
    ['A4', 'set servo to 90',               'pin1.write_analog(int(90 / 180 * 1023))'],

    // ---- Radio (R1–R3, R5) ----
    ['R1', 'radio on group 5 power 3',      'radio.config(group=int(5), power=int(3))'],
    ['R2', 'radio send number 42',          'radio.send(str(42))'],
    ['R3', 'radio send text "hi"',          "radio.send('hi')"],
    ['R5', 'set val to read last radio number', '_radio_last_num'],
];

// ---- tests ----

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

describe('Phase 2: dialect→MicroPython contains expected fragment', () => {
    for (const [id, dialect, expected] of ORACLE_TABLE) {
        test(`${id}: "${dialect}" → contains "${expected}"`, () => {
            const { py } = dialectToMicroPython(dialect);
            assert.ok(py.includes(expected),
                `expected \`${expected}\` in:\n${py}`);
        });
    }
});

describe('Phase 2: dialect↔blocks convergence (round-trip)', () => {
    for (const [id, dialect, expected] of ORACLE_TABLE) {
        test(`${id}: "${dialect}" round-trips to identical MicroPython`, () => {
            const { py: pyDialect, decomp } = dialectToMicroPython(dialect);
            const pyBlocks = blocksToMicroPython(decomp);

            const normDialect = normalise(pyDialect);
            const normBlocks = normalise(pyBlocks);

            assert.equal(normDialect, normBlocks,
                `convergence failed for ${id}.\n` +
                `Dialect: ${dialect}\n` +
                `Decompiled: ${decomp.trim().split('\n').slice(-3).join(' | ')}\n`);

            // Both must still contain the expected fragment
            assert.ok(normDialect.includes(expected),
                `dialect path missing \`${expected}\``);
            assert.ok(normBlocks.includes(expected),
                `blocks path missing \`${expected}\``);
        });
    }
});

describe('Phase 2: header imports converge', () => {
    test('math import present in both paths for accel strength', () => {
        const { py, decomp } = dialectToMicroPython('set val to read accel strength');
        const pyBlocks = blocksToMicroPython(decomp);
        assert.match(py, /import math/);
        assert.match(pyBlocks, /import math/);
    });

    test('music import present in both paths for playtone', () => {
        const { py, decomp } = dialectToMicroPython('set buzzer to 440 hz');
        const pyBlocks = blocksToMicroPython(decomp);
        assert.match(py, /import music/);
        assert.match(pyBlocks, /import music/);
    });

    test('radio import present in both paths for radio on', () => {
        const { py, decomp } = dialectToMicroPython('radio on group 1 power 7');
        const pyBlocks = blocksToMicroPython(decomp);
        assert.match(py, /import radio/);
        assert.match(pyBlocks, /import radio/);
    });

    test('_pitch helper present in both paths', () => {
        const { py, decomp } = dialectToMicroPython('set val to read pitch');
        const pyBlocks = blocksToMicroPython(decomp);
        assert.match(py, /def _pitch\(\)/);
        assert.match(pyBlocks, /def _pitch\(\)/);
    });

    test('_roll helper present in both paths', () => {
        const { py, decomp } = dialectToMicroPython('set val to read roll');
        const pyBlocks = blocksToMicroPython(decomp);
        assert.match(py, /def _roll\(\)/);
        assert.match(pyBlocks, /def _roll\(\)/);
    });
});
