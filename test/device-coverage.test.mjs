// Device block coverage: does every placeable part have a block vocabulary?
//
// The engine (bw-board) models N device kinds. The block surface covers a
// subset. This test enumerates both and asserts they agree, with an explicit
// allowed-gap list so "are we done?" is a number, not an opinion.
//
// If bw-board adds a device kind and nobody adds blocks for it, this test
// says which one. If blocks exist for a kind the engine does not model, it
// says that too.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import SB3Creator from '../src/utils/sb3Creator.js';

const here = dirname(fileURLToPath(import.meta.url));

// ---- engine device kinds (from bw-board) ------------------------------------
// Parse the source for registerDevice() calls and kind references rather than
// importing (bw-board may not be beside this checkout).

// Engine device kinds — read from bw-board's getPartKinds() if available,
// else fall back to a hardcoded snapshot. A new engine kind without coverage
// or a KNOWN_GAPS entry fails the test, which is the point.
let engineKinds = null;
const boardPath = resolve(here, '../../bw-board/src/board.js');
try {
    const boardSrc = readFileSync(boardPath, 'utf8');
    const m = boardSrc.match(/getPartKinds\s*\(\)\s*\{[^}]*return\s*\[([^\]]+)\]/s);
    if (m) {
        engineKinds = [...m[1].matchAll(/'([a-z][a-z0-9_]+)'/g)].map(k => k[1]).sort();
    }
} catch { /* bw-board not beside this checkout */ }
// Hardcoded fallback — kept in sync manually when bw-board is not available.
if (!engineKinds) {
    engineKinds = [
        'bargraph', 'battery', 'button', 'buzzer', 'capacitor', 'cd4511', 'char_lcd',
        'darlington_driver', 'dc_motor', 'decade_counter', 'dff',
        'diode', 'eeprom', 'flex_sensor', 'force_sensor', 'fuse',
        'gate_and', 'gate_nand', 'gate_nor', 'gate_not', 'gate_or', 'gate_xor',
        'gnd', 'h_bridge', 'inductor', 'ir_receiver', 'isource', 'jkff',
        'ldr', 'led', 'led_cube', 'led_matrix', 'light_bulb', 'lm393',
        'mcu', 'neopixel', 'nmos', 'npn', 'ntc', 'opamp', 'optocoupler',
        'phototransistor', 'piezo', 'pir', 'pmos', 'pnp', 'potentiometer',
        'relay', 'resistor', 'rgb_led', 'servo', 'seven_segment',
        'shift_register', 'solenoid', 'stepper', 'switch',
        'temp_sensor', 'tilt_sensor', 'timer_555', 'tip120', 'tmp36',
        'ultrasonic', 'vcc', 'vreg', 'vsource', 'zener'
    ].sort();
}

// ---- block-surface coverage -------------------------------------------------
// Which device kinds have at least one block that drives or reads them?
// Mapped manually because the relationship is semantic, not a naming convention.

const BLOCK_COVERAGE = {
    // stc12 blocks cover MCU-adjacent parts via PIN/PORT/PART declarations
    led: ['stc12_setpin', 'stc12_toggle', 'stc12_read'],       // OUTPUT pin → LED
    buzzer: ['stc12_settone'],                                   // TONE pin → buzzer
    button: ['stc12_read', 'stc12_whenpin'],                     // INPUT pin → button
    switch: ['stc12_read', 'stc12_whenpin'],                     // INPUT pin → switch
    potentiometer: ['stc12_read'],                               // ANALOG pin → pot
    shift_register: ['stc12_setpart'],                           // PART declaration → 74HC595

    // LED cube
    led_cube: ['ledcube_setvoxel', 'ledcube_clear', 'ledcube_hold'],

    // circuit extension covers observation/control
    vcc: ['circuit_setpower'],
    gnd: [],                                                     // always present, no block needed
    resistor: ['circuit_resistance'],                            // measured via resistance reporter
    mcu: [],                                                     // the MCU itself, not a block target

    // Passive components observed through circuit reporters
    capacitor: ['circuit_nodevoltage', 'circuit_branchcurrent'],
    inductor: ['circuit_nodevoltage', 'circuit_branchcurrent'],
    diode: ['circuit_branchcurrent'],
    zener: ['circuit_branchcurrent'],

    // Transistors / op-amp — circuit-level, no dedicated blocks
    npn: ['circuit_branchcurrent'],
    pnp: ['circuit_branchcurrent'],
    nmos: ['circuit_branchcurrent'],
    pmos: ['circuit_branchcurrent'],
    opamp: ['circuit_nodevoltage'],
    vsource: ['circuit_setcontrol'],

    // Device convenience blocks
    seven_segment: ['devices_showdigit'],
    rgb_led: ['devices_setrgb'],
    servo: ['devices_setservo'],
    dc_motor: ['devices_setmotor'],
    relay: ['devices_setrelay'],
    temp_sensor: ['devices_temperature'],
    ldr: ['devices_light'],
    ultrasonic: ['devices_distance'],

    // Display devices
    char_lcd: ['devices_lcdprint', 'devices_lcdcursor', 'devices_lcdclear'],
    led_matrix: ['devices_setpixel', 'devices_clearmatrix'],
    neopixel: ['devices_setneopixel', 'devices_clearneopixels'],
};

// Devices that exist in the engine but have NO block vocabulary yet.
// This is the explicit gap list — adding blocks removes the entry.
const KNOWN_GAPS = new Set([
    // --- displays ---
    // char_lcd — now covered via devices_lcdprint/lcdcursor/lcdclear
    // led_matrix — now covered via devices_setpixel/clearmatrix
    // seven_segment — covered via devices_showdigit
    'bargraph',         // "set bar N to M"

    // --- actuators ---
    // servo, dc_motor, relay — now covered via devices_setservo/setmotor/setrelay
    'stepper',          // "step N" / "set speed"
    'solenoid',         // "activate" / "release"
    'h_bridge',         // motor driver — driven via pins

    // --- LEDs ---
    // rgb_led — now covered via devices_setrgb
    // neopixel — now covered via devices_setneopixel/clearneopixels

    // --- sensors ---
    // temp_sensor, ldr, ultrasonic — now covered via devices_temperature/light/distance
    'ntc',              // thermistor — "temperature" or raw ADC
    // ldr — now covered via devices_light
    'ir_receiver',      // "received code" reporter
    'pir',              // "motion detected?" boolean
    // ultrasonic — now covered via devices_distance
    'flex_sensor',      // "flex" reporter
    'force_sensor',     // "force" reporter
    'tilt_sensor',      // "tilt" boolean/reporter
    'phototransistor',  // "light" reporter

    // --- ICs ---
    'timer_555',        // circuit-level, observed through probes
    'eeprom',           // read/write byte blocks
    // shift_register — already covered via stc12_setpart (in BLOCK_COVERAGE)

    // --- power/circuit-level (observed through reporters, no dedicated blocks) ---
    'isource',          // current source
    'battery',          // like vsource — circuit-level
    'fuse',             // protection device
    'vreg',             // voltage regulator

    // --- logic gates and flip-flops (observed through voltage reporters) ---
    'gate_and', 'gate_or', 'gate_not', 'gate_nand', 'gate_nor', 'gate_xor',
    'dff',              // D flip-flop
    'jkff',             // JK flip-flop
    'decade_counter',   // 4017-style counter

    // --- drivers/transducers ---
    'darlington_driver', // high-current driver (ULN2003 etc.)
    'piezo',            // piezoelectric buzzer/sensor
    'light_bulb',       // incandescent — observed through brightness
    'optocoupler',      // opto-isolator — circuit-level
    'tip120',           // Darlington transistor — circuit-level
    'lm393',            // comparator IC — circuit-level
    'tmp36',            // analog temp sensor — read via ADC (devices_temperature)
    'cd4511',           // BCD-to-7-segment decoder — circuit-level
]);

// ---- tests ------------------------------------------------------------------

test('device block coverage is enumerated and the gaps are explicit', {
    skip: !engineKinds && 'bw-board not found'
}, () => {
    const covered = new Set(Object.keys(BLOCK_COVERAGE));
    const gapped = new Set(KNOWN_GAPS);

    // Every engine kind must be either covered or in the gap list.
    const unaccounted = engineKinds.filter(k => !covered.has(k) && !gapped.has(k));
    assert.deepEqual(unaccounted, [],
        `engine kinds with no block coverage AND not in KNOWN_GAPS: ${unaccounted.join(', ')}`);

    // Every covered kind must exist in the engine (no orphan blocks).
    const orphans = [...covered].filter(k => !engineKinds.includes(k));
    // Allow kinds that are meta or implicit
    const realOrphans = orphans.filter(k => !['gnd', 'mcu'].includes(k));
    if (realOrphans.length) {
        console.log(`  note: block coverage for kinds not in engine: ${realOrphans.join(', ')}`);
    }

    // Report the score.
    const total = engineKinds.length;
    const coveredCount = engineKinds.filter(k => covered.has(k)).length;
    const gapCount = engineKinds.filter(k => gapped.has(k)).length;
    console.log(`  device coverage: ${coveredCount}/${total} covered, ${gapCount} known gaps`);
});

test('KNOWN_GAPS does not contain a kind that already has blocks', () => {
    const covered = new Set(Object.keys(BLOCK_COVERAGE));
    const falseGaps = [...KNOWN_GAPS].filter(k => covered.has(k));
    assert.deepEqual(falseGaps, [],
        `these are in KNOWN_GAPS but already have blocks: ${falseGaps.join(', ')}`);
});

test('every block opcode in BLOCK_COVERAGE exists in RUNTIME_EXTENSIONS', () => {
    const allOps = new Set();
    for (const ext of Object.values(SB3Creator.RUNTIME_EXTENSIONS)) {
        for (const op of Object.keys(ext.ops)) allOps.add(`${ext.runtime}_${op}`);
    }
    for (const [kind, opcodes] of Object.entries(BLOCK_COVERAGE)) {
        for (const op of opcodes) {
            assert.ok(allOps.has(op),
                `BLOCK_COVERAGE[${kind}] lists ${op} but it is not in RUNTIME_EXTENSIONS`);
        }
    }
});
