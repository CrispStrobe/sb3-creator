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
// Read engine kinds from bw-board's getPartKinds(). If bw-board is not
// beside this checkout, fall back to a snapshot — but say so in the test
// name so a green run is never mistaken for a real check.
let engineKinds = null;
let engineSource = 'live';  // or 'snapshot'
const boardPath = resolve(here, '../../bw-board/src/board.js');
let boardExists = false;
try { readFileSync(boardPath); boardExists = true; } catch { /* not found */ }

if (boardExists) {
    const boardSrc = readFileSync(boardPath, 'utf8');
    const m = boardSrc.match(/getPartKinds\s*\(\)\s*\{[^}]*return\s*\[([^\]]+)\]/s);
    // [a-z0-9] first char — 74hc00 starts with a digit.
    if (m) {
        engineKinds = [...m[1].matchAll(/'([a-z0-9][a-z0-9_]+)'/g)].map(k => k[1]).sort();
    }
    // If the file exists but the parse yielded nothing, FAIL rather than fall back.
    // A silent fallback to a stale snapshot is worse than no gate.
    if (!engineKinds || engineKinds.length === 0) {
        throw new Error('bw-board/src/board.js exists but getPartKinds() parse yielded nothing — the gate cannot see the engine');
    }
    // Assert a floor — a count that drops is a parse regression, not a smaller engine.
    if (engineKinds.length < 80) {
        throw new Error(`getPartKinds() returned only ${engineKinds.length} kinds (expected >= 80) — parse regression?`);
    }
} else {
    engineSource = 'snapshot';
    engineKinds = [
        '74hc00', '74hc02', '74hc04', '74hc08', '74hc10', '74hc11', '74hc14', '74hc20',
        '74hc21', '74hc27', '74hc32', '74hc73', '74hc74', '74hc86', '74hc93', '74hc132',
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

    // Transistors / op-amp / drivers — circuit-level, driven through pin blocks,
    // observed through circuit reporters. No dedicated blocks needed: the driver
    // is in the wiring, not the code. The MCU pin drives the base/gate.
    npn: ['circuit_branchcurrent'],
    pnp: ['circuit_branchcurrent'],
    nmos: ['circuit_branchcurrent'],
    pmos: ['circuit_branchcurrent'],
    opamp: ['circuit_nodevoltage'],
    vsource: ['circuit_setcontrol'],
    tip120: ['circuit_branchcurrent'],         // Darlington — pin drives base through R
    darlington_driver: ['circuit_branchcurrent'], // same pattern as tip120
    solenoid: ['devices_activate', 'devices_deactivate'],
    h_bridge: ['devices_setdirection', 'devices_setmotor'],

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
    // solenoid — now covered via devices_activate/deactivate
    // h_bridge — now covered via devices_setdirection/setmotor
    'stepper',          // "step N" / "set speed"

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
    // darlington_driver — now covered via circuit_branchcurrent
    'piezo',            // piezoelectric buzzer/sensor
    'light_bulb',       // incandescent — observed through brightness
    'optocoupler',      // opto-isolator — circuit-level
    // tip120 — now covered via circuit_branchcurrent (in BLOCK_COVERAGE)
    // darlington_driver — now covered via circuit_branchcurrent
    'lm393',            // comparator IC — circuit-level
    'tmp36',            // analog temp sensor — read via ADC (devices_temperature)
    'cd4511',           // BCD-to-7-segment decoder — circuit-level

    // --- new kinds from engine expansion ---
    'ambient_light',    // ambient light sensor
    'battery_9v',       // 9V battery — circuit-level power source
    'battery_aa',       // AA battery — circuit-level
    'battery_coin',     // coin cell — circuit-level
    'dc_motor_encoder', // motor with encoder — needs "read encoder" blocks
    'dip_switch',       // multi-position switch — needs individual switch reads
    'gas_sensor',       // MQ-series — needs "read gas level" reporter
    'ir_transmitter',   // IR LED — needs "send IR code" block
    'keypad_4x4',       // matrix keypad — needs "key pressed" reporter/hat
    'ld1117v33',        // 3.3V LDO regulator — circuit-level
    'lm7805',           // 5V regulator — circuit-level
    'polarized_cap',    // electrolytic capacitor — observed through reporters
    'vibration_motor',  // eccentric mass motor — on/off via pin

    // --- 74HC logic family (chip-composer parts, observed through voltage reporters) ---
    '74hc00', '74hc02', '74hc04', '74hc08', '74hc10', '74hc11', '74hc14', '74hc20',
    '74hc21', '74hc27', '74hc32', '74hc73', '74hc74', '74hc86', '74hc93', '74hc95', '74hc132',
    'lm339',            // quad comparator — circuit-level
    'timer_556',        // dual 555 — circuit-level
]);

// ---- tests ------------------------------------------------------------------

test(`device block coverage (${engineSource} — ${engineKinds ? engineKinds.length : 0} kinds)`, () => {
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
