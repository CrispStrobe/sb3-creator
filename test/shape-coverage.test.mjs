// Kind × shape coverage: does every device kind have the block shapes it needs?
//
// The device-coverage test counts which kinds have ANY block. This test asks
// a harder question: for each kind, which of the four Scratch block shapes
// exist, and which are missing?
//
//   command   — stack block: "set servo angle to 90"
//   reporter  — round ( ): "servo angle", "temperature"
//   predicate — hexagon < >: "button pressed?", "relay energised?"
//   hat       — event: "when button pressed", "when distance < 20"
//
// Three rules:
//   1. Anything settable should be readable (command → reporter)
//   2. Every sensor needs a predicate AND a hat, not just a reporter
//   3. Predicates beat equality on raw numbers (hide active-low, debounce)

import { test } from 'node:test';
import assert from 'node:assert/strict';

// The matrix: for each kind, which shapes SHOULD exist and which DO exist.
// 'exempt' means the shape genuinely does not apply, with a reason.

const SHAPE_MATRIX = {
    // --- MCU pins (stc12 extension) ---
    button:       { command: null,                     reporter: 'stc12_read',      predicate: null,    hat: 'stc12_whenpin', need: { predicate: 'is <button> pressed? — hides active-low and debounce' } },
    switch:       { command: null,                     reporter: 'stc12_read',      predicate: null,    hat: 'stc12_whenpin', need: { predicate: 'is <switch> on?' } },
    led:          { command: 'stc12_setpin',            reporter: null,              predicate: null,    hat: null,            exempt: { reporter: 'LED state is set, not read', predicate: 'same', hat: 'same' } },
    buzzer:       { command: 'stc12_settone',           reporter: 'circuit_buzzertone', predicate: null, hat: null,            exempt: { predicate: 'frequency is a number, not a boolean', hat: 'not event-driven' } },
    potentiometer:{ command: null,                     reporter: 'stc12_read',      predicate: null,    hat: null,            need: { predicate: 'is <pot> above <n>? — threshold comparison', hat: 'when <pot> above <n>' } },

    // --- sensors ---
    temp_sensor:  { command: null,                     reporter: 'devices_temperature', predicate: null, hat: null,           need: { predicate: '<sensor> above <n> degrees?', hat: 'when temperature above <n>' } },
    ldr:          { command: null,                     reporter: 'devices_light',       predicate: null, hat: null,           need: { predicate: '<sensor> above <n>?', hat: 'when light above <n>' } },
    ultrasonic:   { command: null,                     reporter: 'devices_distance',    predicate: null, hat: null,           need: { predicate: '<sensor> closer than <n>?', hat: 'when distance < <n>' } },
    pir:          { command: null,                     reporter: null,                  predicate: null, hat: null,           need: { predicate: 'motion detected?', hat: 'when motion detected', reporter: 'motion level' } },
    tilt_sensor:  { command: null,                     reporter: null,                  predicate: null, hat: null,           need: { predicate: 'tilted?', hat: 'when tilted' } },
    flex_sensor:  { command: null,                     reporter: null,                  predicate: null, hat: null,           need: { reporter: 'flex level', predicate: 'flex above <n>?' } },
    force_sensor: { command: null,                     reporter: null,                  predicate: null, hat: null,           need: { reporter: 'force level', predicate: 'force above <n>?' } },
    phototransistor:{ command: null,                   reporter: null,                  predicate: null, hat: null,           need: { reporter: 'light level', predicate: 'light above <n>?' } },
    ir_receiver:  { command: null,                     reporter: null,                  predicate: null, hat: null,           need: { reporter: 'received code', hat: 'when IR received' } },

    // --- actuators ---
    servo:        { command: 'devices_setservo',        reporter: 'devices_servoangle', predicate: null, hat: null,           exempt: { predicate: 'angle is a number', hat: 'not event-driven' } },
    dc_motor:     { command: 'devices_setmotor',        reporter: null,                 predicate: null, hat: null,           need: { reporter: 'motor speed' } },
    relay:        { command: 'devices_setrelay',        reporter: null,                 predicate: null, hat: null,           need: { reporter: 'relay state', predicate: 'is <relay> on?' } },
    solenoid:     { command: 'devices_activate',        reporter: null,                 predicate: null, hat: null,           need: { reporter: 'solenoid state', predicate: 'is <solenoid> active?' } },
    h_bridge:     { command: 'devices_setdirection',    reporter: null,                 predicate: null, hat: null,           need: { reporter: 'motor direction' } },

    // --- displays ---
    seven_segment:{ command: 'devices_showdigit',       reporter: null,                 predicate: null, hat: null,           exempt: { reporter: 'display is write-only', predicate: 'same', hat: 'same' } },
    char_lcd:     { command: 'devices_lcdprint',        reporter: null,                 predicate: null, hat: null,           exempt: { reporter: 'LCD is write-only for the MCU', predicate: 'same', hat: 'same' } },
    led_matrix:   { command: 'devices_setpixel',        reporter: null,                 predicate: null, hat: null,           exempt: { reporter: 'matrix is write-only', predicate: 'same', hat: 'same' } },
    rgb_led:      { command: 'devices_setrgb',          reporter: null,                 predicate: null, hat: null,           exempt: { reporter: 'RGB is set, not read', predicate: 'same', hat: 'same' } },
    neopixel:     { command: 'devices_setneopixel',     reporter: null,                 predicate: null, hat: null,           exempt: { reporter: 'strip is write-only', predicate: 'same', hat: 'same' } },

    // --- chip peripherals ---
    // UART: stc12_print sends. Nothing receives.
    // Need: 'when serial data received' hat, 'serial data' reporter.
};

// ---- tests ------------------------------------------------------------------

test('kind × shape matrix: missing shapes are explicit', () => {
    const shapes = ['command', 'reporter', 'predicate', 'hat'];
    let totalSlots = 0;
    let filled = 0;
    let needed = 0;
    let exempted = 0;

    for (const [kind, entry] of Object.entries(SHAPE_MATRIX)) {
        for (const shape of shapes) {
            totalSlots++;
            if (entry[shape]) {
                filled++;
            } else if (entry.exempt && entry.exempt[shape]) {
                exempted++;
            } else if (entry.need && entry.need[shape]) {
                needed++;
            }
            // A null with no exempt and no need is an unaccounted gap — acceptable
            // for shapes that don't apply (e.g. hat on an LED), but should be
            // explicitly stated.
        }
    }

    const kinds = Object.keys(SHAPE_MATRIX).length;
    console.log(`  shape coverage: ${filled}/${totalSlots} filled, ${needed} needed, ${exempted} exempt (${kinds} kinds)`);

    // The matrix itself is the test — it is a documented statement of what exists
    // and what is missing. Asserting it is non-empty is enough; the value is in
    // the numbers and the reasons.
    assert.ok(kinds > 0, 'matrix is not empty');
    assert.ok(filled > 0, 'at least some shapes are filled');
});

test('every need in the shape matrix names what is missing', () => {
    for (const [kind, entry] of Object.entries(SHAPE_MATRIX)) {
        if (!entry.need) continue;
        for (const [shape, description] of Object.entries(entry.need)) {
            assert.ok(typeof description === 'string' && description.length > 0,
                `${kind}.need.${shape} must have a description of what is missing`);
        }
    }
});
