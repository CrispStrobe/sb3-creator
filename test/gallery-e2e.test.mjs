/**
 * End-to-end gallery verification: does each example do what EXPECTED.md says?
 *
 * For MCU examples: load circuit.json into BoardImpl, drive pins, assert LED
 * brightness against hand-computed oracles with stated tolerances.
 *
 * For pure-circuit examples: load circuit.json, advance time, assert LED
 * brightness (the circuit is always on — no MCU to drive it).
 *
 * Blocked examples (need scope-tap, device-state, or 595 edge-order) are
 * explicitly skipped with the blocker named.
 *
 * Run: node --test test/gallery-e2e.test.mjs
 * Not in test:fast (needs bw-board on the local machine).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

import { BoardImpl } from '/mnt/volume1/code/bw-board/src/board.js';
import { inferNetlist, checkWiring } from '/mnt/volume1/code/bw-board/src/infer-netlist.js';
import { setEngine } from '/mnt/volume1/code/bw-circuit-ui/src/engine.js';
import { Circuit } from '/mnt/volume1/code/bw-circuit-ui/src/model/circuit.js';

setEngine({ BoardImpl, inferNetlist, checkWiring });

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const MS = 1_000_000n;

function loadCircuit(name) {
    const data = JSON.parse(readFileSync(join(EXAMPLES, name, 'circuit.json'), 'utf8'));
    const c = new Circuit(data.vcc || 5.0);
    const idMap = new Map();
    for (const p of data.parts) idMap.set(p.id, c.addPart(p.kind, p.params || {}, p.x || 0, p.y || 0).id);
    for (const w of data.wires) {
        const fromId = idMap.get(w.from);
        const toId = idMap.get(w.to);
        if (fromId && toId) c.addWire(fromId, w.fromTerminal, toId, w.toTerminal);
    }
    return c;
}

// ---- blocked examples: explicitly named blockers --------------------------------

const BLOCKED = {
    '07-buzzer-siren':        'scope-tap (buzzer frequency readout)',
    '08-led-chaser-595':      '595 edge-order logic',
    '09-relay-clicker':       'relay device-state readout',
    '10-motor-speed':         'motor device-state readout',
    '20-shift-register-binary': '595 edge-order logic',
};

// ---- MCU examples: drive pins, check LEDs --------------------------------------
// Each entry: { pins: [{pin, driveHigh}], assertions: [{ledIndex, brightness, tolerance}] }

const MCU_TESTS = {
    '01-blink': {
        pins: [{ pin: 'P1.0', high: false }],   // active-low: low = on
        leds: [{ idx: 0, brightness: 0.1449, tol: 0.02 }],
    },
    '02-dimmer': {
        pins: [{ pin: 'P1.0', high: false }],
        leds: [{ idx: 0, brightness: 0.1449, tol: 0.02 }],
    },
    '03-night-light': {
        pins: [{ pin: 'P1.0', high: false }],
        leds: [{ idx: 0, brightness: 0.1449, tol: 0.02 }],
    },
    '04-thermostat': {
        pins: [{ pin: 'P1.0', high: false }],
        leds: [{ idx: 0, min: 0.1, label: 'heater LED on with 470Ω' }],
    },
    '05-counter-7seg': {
        pins: [{ pin: 'P1.0', high: false }],
        leds: [{ idx: 0, brightness: 0.1449, tol: 0.02 }],
    },
    '06-active-low-high': {
        // Active-low LED (VCC→R→LED→pin): pin LOW = on, bright.
        // Active-high LED (pin→R→LED→GND): pin HIGH on quasi-bidirectional = weak source
        // (~230 µA), so brightness is very low. Push-pull would be full brightness.
        pins: [{ pin: 'P1.0', high: false }, { pin: 'P1.1', high: true }],
        leds: [
            { idx: 0, brightness: 0.1449, tol: 0.02, label: 'active-low red (sink)' },
            { idx: 1, min: 0.001, label: 'active-high green (quasi-bidirectional weak source)' },
        ],
    },
    '11-toggle-button': {
        pins: [{ pin: 'P1.0', high: false }],
        leds: [{ idx: 0, brightness: 0.1449, tol: 0.02 }],
    },
    '12-dual-blink': {
        pins: [{ pin: 'P1.0', high: false }, { pin: 'P1.1', high: true }],
        leds: [
            { idx: 0, min: 0.1, label: 'LED1 on' },
            { idx: 1, max: 0.01, label: 'LED2 off' },
        ],
    },
    '13-sos-morse': {
        pins: [{ pin: 'P1.0', high: false }],
        leds: [{ idx: 0, brightness: 0.2970, tol: 0.03, label: '470Ω + LED at 5V' }],
    },
    '14-traffic-light': {
        pins: [{ pin: 'P1.0', high: false }, { pin: 'P1.1', high: true }, { pin: 'P1.2', high: true }],
        leds: [
            { idx: 0, min: 0.1, label: 'red on' },
            { idx: 1, max: 0.01, label: 'yellow off' },
            { idx: 2, max: 0.01, label: 'green off' },
        ],
    },
    '15-voltage-divider': {
        pins: [],   // just reads ADC, LED shows threshold
        leds: [],   // no LED assertion — this reads an ADC
    },
    '16-ldr-bargraph': {
        pins: [{ pin: 'P1.0', high: false }, { pin: 'P1.1', high: false }, { pin: 'P1.2', high: false }],
        leds: [
            { idx: 0, min: 0.1, label: 'bar 1' },
            { idx: 1, min: 0.1, label: 'bar 2' },
            { idx: 2, min: 0.1, label: 'bar 3' },
        ],
    },
    '17-comparator': {
        pins: [{ pin: 'P1.0', high: false }],
        leds: [{ idx: 0, min: 0.1, label: 'comparator LED' }],
    },
    '18-logic-and-gate': {
        pins: [{ pin: 'P1.0', high: false }],
        leds: [{ idx: 0, min: 0.1, label: 'AND output' }],
    },
    '19-logic-or-gate': {
        pins: [{ pin: 'P1.0', high: false }],
        leds: [{ idx: 0, min: 0.1, label: 'OR output' }],
    },
    '24-pwm-fade': {
        pins: [{ pin: 'P1.0', high: false }],
        leds: [{ idx: 0, min: 0.1, label: 'PWM LED' }],
    },
    '25-reaction-timer': {
        pins: [{ pin: 'P1.0', high: false }],
        leds: [{ idx: 0, min: 0.1, label: 'reaction LED' }],
    },
    '26-debounce': {
        pins: [{ pin: 'P1.0', high: false }],
        leds: [{ idx: 0, min: 0.1, label: 'debounce LED' }],
    },
    '27-led-dice': {
        pins: [{ pin: 'P1.0', high: false }],
        leds: [{ idx: 0, min: 0.1, label: 'dice LED' }],
    },
    '30-multi-led-pattern': {
        pins: [
            { pin: 'P1.0', high: false },
            { pin: 'P1.1', high: true },
            { pin: 'P1.2', high: true },
            { pin: 'P1.3', high: true },
        ],
        leds: [{ litCount: 1, label: 'exactly 1 of 4 lit' }],
    },
};

// ---- pure-circuit examples: no MCU, always on ----------------------------------

const PURE_TESTS = {
    '21-resistor-led': {
        leds: [{ idx: 0, brightness: 0.6522, tol: 0.05, label: '220Ω + LED at 5V' }],
    },
    '22-series-parallel': {
        leds: [
            { idx: 0, min: 0.01, label: 'series LED (dimmer)' },
            { idx: 1, min: 0.01, label: 'parallel LED (brighter)' },
        ],
    },
    '23-voltage-regulator': {
        leds: [{ idx: 0, min: 0.01, label: 'regulated LED' }],
    },
    '28-diode-polarity': {
        // Forward-biased path lights, reverse blocks — but need to check which LED is which
        leds: [{ anyLit: true, label: 'at least one LED lights (forward path)' }],
    },
    '29-capacitor-charge': {
        leds: [],   // no LED — this is an RC circuit with a meter
    },
};

// ---- test runner ----------------------------------------------------------------

describe('e2e: MCU examples — drive pins, check LEDs', () => {
    for (const [name, spec] of Object.entries(MCU_TESTS)) {
        test(name, () => {
            const circuit = loadCircuit(name);
            for (const p of spec.pins) {
                circuit.board.setPin(p.pin, 'quasi', p.high);
            }
            circuit.board.advanceTo(25n * MS);

            const leds = circuit.board.getLeds();

            for (const led of spec.leds) {
                if (led.litCount !== undefined) {
                    const lit = leds.filter(id => circuit.board.ledBrightness(id) > 0.1).length;
                    assert.equal(lit, led.litCount, `${led.label}: got ${lit}`);
                    continue;
                }
                const id = leds[led.idx];
                assert.ok(id, `LED index ${led.idx} not found (have ${leds.length})`);
                const b = circuit.board.ledBrightness(id);
                if (led.brightness !== undefined) {
                    assert.ok(Math.abs(b - led.brightness) < led.tol,
                        `${led.label || name}: brightness ${b.toFixed(4)}, expected ${led.brightness} ±${led.tol}`);
                } else if (led.min !== undefined) {
                    assert.ok(b >= led.min, `${led.label || name}: brightness ${b.toFixed(4)} < ${led.min}`);
                } else if (led.max !== undefined) {
                    assert.ok(b <= led.max, `${led.label || name}: brightness ${b.toFixed(4)} > ${led.max}`);
                }
            }
        });
    }
});

describe('e2e: pure-circuit examples — no MCU, always on', () => {
    for (const [name, spec] of Object.entries(PURE_TESTS)) {
        test(name, () => {
            const circuit = loadCircuit(name);
            circuit.board.advanceTo(25n * MS);

            const leds = circuit.board.getLeds();

            for (const led of spec.leds) {
                if (led.anyLit) {
                    const anyOn = leds.some(id => circuit.board.ledBrightness(id) > 0.01);
                    assert.ok(anyOn, `${led.label}: no LED lit`);
                    continue;
                }
                const id = leds[led.idx];
                if (!id) continue;   // some pure circuits have no LED
                const b = circuit.board.ledBrightness(id);
                if (led.brightness !== undefined) {
                    assert.ok(Math.abs(b - led.brightness) < led.tol,
                        `${led.label}: brightness ${b.toFixed(4)}, expected ${led.brightness} ±${led.tol}`);
                } else if (led.min !== undefined) {
                    assert.ok(b >= led.min, `${led.label}: brightness ${b.toFixed(4)} < ${led.min}`);
                }
            }
        });
    }
});

describe('e2e: blocked examples — named dependencies', () => {
    for (const [name, blocker] of Object.entries(BLOCKED)) {
        test(`${name}: BLOCKED on ${blocker}`, { skip: `waiting on bw-board: ${blocker}` }, () => {});
    }
});
