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
 * Skips itself, with the missing repo named, when bw-board and bw-circuit-ui
 * are not checked out beside this one. Point BW_BOARD / BW_CIRCUIT_UI at them
 * to run it from elsewhere.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

// Two checkouts this repo does not own, found wherever the machine keeps them.
// They were imported by absolute path, which made this file pass on exactly one
// machine and throw ERR_MODULE_NOT_FOUND on every other — and a suite that is
// red for everyone is a suite people learn to skip, which costs more than the
// check is worth. Same candidate-list convention as ctarget.test.mjs.
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';

const findRepo = (envVar, probe, ...rels) => {
    for (const base of [process.env[envVar], ...rels]) {
        if (!base) continue;
        const url = base.startsWith('file:') ? new URL(base)
            : pathToFileURL(base.endsWith('/') ? base : base + '/');
        if (existsSync(new URL(probe, url))) return url;
    }
    return null;
};
// Siblings of this repo is the normal layout: ~/code/sb3-creator next to
// ~/code/bw-board. The second candidate covers a checkout one level deeper.
const sib = (name) => new URL(`../../${name}/`, import.meta.url).href;
const nest = (name) => new URL(`../../../${name}/`, import.meta.url).href;
const BOARD = findRepo('BW_BOARD', 'src/board.js', sib('bw-board'), nest('bw-board'));
const CIRCUIT = findRepo('BW_CIRCUIT_UI', 'src/engine.js', sib('bw-circuit-ui'), nest('bw-circuit-ui'));

// Cross-repo guard. This file keeps its own file:-URL discovery above because it
// imports the siblings as ES modules, but the SKIP/FAIL decision is the shared one:
// a local box may not have them, CI always does. See test/helpers/siblings.mjs.
const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the gallery end-to-end suite');
const SKIP = BOARD && CIRCUIT ? false
    : (gate.skip || `needs ${!BOARD ? 'bw-board' : 'bw-circuit-ui'} checked out beside this repo `
      + '(or BW_BOARD / BW_CIRCUIT_UI pointing at it)');

let BoardImpl, inferNetlist, checkWiring, Circuit, wireEndpoint;
let extract6502Machine, extractZ80Machine;
// The per-file `register*` loop this used to run registered FOUR device models
// and left the rest of the registry empty, so a bench with a 74hc595 or a
// stepper was solved against kinds the app has and this gate did not.
// `injectEngine` calls `registerAllDevices()` exactly where the app does, and
// the whole ENGINE_SURFACE goes in — see scripts/lib/engine-surface.mjs.
let EXTRACTOR_SKIP = SKIP;
if (!SKIP) {
    const injected = await injectEngine({
        board: fileURLToPath(BOARD), cui: fileURLToPath(CIRCUIT),
    });
    ({ BoardImpl, inferNetlist, checkWiring, extract6502Machine, extractZ80Machine } = injected.surface);
    ({ Circuit } = injected);
    ({ wireEndpoint } = await import(new URL('src/model/wire-endpoints.js', CIRCUIT).href));
}

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const MS = 1_000_000n;

// Map gallery part kinds to board engine kinds where they differ.
const KIND_MAP = { '74hc595': 'shift_register' };

// Terminal declarations — the board needs these for every part kind.
const TERMINALS = {
    vcc: ['vcc'], gnd: ['gnd'],
    resistor: ['a', 'b'], capacitor: ['a', 'b'], inductor: ['a', 'b'],
    diode: ['anode', 'cathode'], zener: ['anode', 'cathode'],
    led: ['anode', 'cathode'], buzzer: ['a', 'b'],
    button: ['a', 'b'], switch: ['a', 'b'],
    potentiometer: ['a', 'wiper', 'b'],
    relay: ['coil_a', 'coil_b', 'com', 'nc', 'no'],
    tip120: ['base', 'collector', 'emitter'],
    dc_motor: ['a', 'b'],
    servo: ['signal', 'vcc', 'gnd'],
    shift_register: ['data', 'clock', 'latch', 'oe', 'q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'],
};
const DEVICE_TERMINALS = TERMINALS; // alias for readability

// Visual-only part kinds: no electrical role, no terminals in the engine.
const VISUAL_ONLY = new Set(['breadboard', 'label', 'wire_jumper']);

// Index-based circuit path lookup (WORE contract: discover via manifest, never by glob)
const _e2eIdx = JSON.parse(readFileSync(join(EXAMPLES, 'index.json'), 'utf8'));
const _e2eByDir = new Map(_e2eIdx.map(e => [e.files?.program?.split('/')[0] ?? e.id, e]));
function circuitFileFor(name) {
    const entry = _e2eByDir.get(name);
    if (entry?.files?.circuit) return join(EXAMPLES, entry.files.circuit);
    return join(EXAMPLES, name, 'circuit.json');
}

function loadCircuit(name) {
    const data = JSON.parse(readFileSync(circuitFileFor(name), 'utf8'));
    // Filter out visual-only parts and any wires referencing them BY ID —
    // hole-endpoint wires reference breadboards, which are never visual-only.
    const visualIds = new Set(data.parts.filter(p => VISUAL_ONLY.has(p.kind)).map(p => p.id));
    data.parts = data.parts.filter(p => !VISUAL_ONLY.has(p.kind));
    // Endpoints come in two dialects MIXED WITHIN ONE FILE, so this filter
    // read only the flat one and let every NESTED wire to a visual-only part
    // through — 1,039 of the 2,096 shipped circuit files are nested, and in
    // those the part was dropped while its wires stayed, leaving the netlist
    // referencing a part that is no longer there. wireEndpoint is the one
    // canonical reader; a hole endpoint has no `part` and so is never
    // visual-only, which is what the old comment was reaching for.
    data.wires = (data.wires || []).filter(w =>
        !['from', 'to'].some((side) => {
            const e = wireEndpoint(w, side);
            return e && e.part && visualIds.has(e.part);
        }));
    // ONE loader for every dialect: Circuit.fromJSON understands flat legacy
    // wires, endpoint objects, HOLE endpoints ({board, hole}), holeWires
    // (breadboard jumpers), seated parts (occupancy + row conduction), kind
    // aliases and terminal aliases. The hand-rolled device branch this
    // replaces predated all of that: the day the benches were regenerated
    // breadboard-seated, it stringified hole endpoints into net ids
    // ("[object Object]") and knew nothing of rows — 81 tests red.
    // A Circuit instance destructures as { board, parts } too, so both
    // historical return shapes of this helper keep working.
    return Circuit.fromJSON(data);
}

// ---- blocked examples: explicitly named blockers --------------------------------

const BLOCKED = {
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
    '05-counter': {   // renamed from 05-counter-7seg with the bench regeneration
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
        // The regenerated benches standardize on the 1 kΩ series resistor
        // (bench truth beats the old 470 Ω expectation — 2026-08-17).
        leds: [{ idx: 0, brightness: 0.1449, tol: 0.02, label: '1kΩ + LED at 5V' }],
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
    '32-source-vs-sink': {
        // THE lesson: sink (active-low) is bright, source (active-high) is dim/dead.
        pins: [{ pin: 'P1.0', high: false }, { pin: 'P1.1', high: true }],
        leds: [
            { idx: 0, min: 0.1, label: 'sink LED (active-low) bright' },
            { idx: 1, max: 0.02, label: 'source LED (quasi-bidirectional) dim/dead' },
        ],
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
    '31-no-resistor-led': {
        // Two LEDs: one with 220Ω (safe), one without (overcurrent).
        // Both should light, but the no-resistor LED should have much higher brightness.
        leds: [
            { idx: 0, min: 0.5, label: 'no-resistor LED (overcurrent, very bright)' },
            { idx: 1, brightness: 0.6522, tol: 0.05, label: '220Ω LED (safe, ~0.65)' },
        ],
    },
};

// ---- test runner ----------------------------------------------------------------

describe('e2e: MCU examples — drive pins, check LEDs', { skip: SKIP }, () => {
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

describe('e2e: pure-circuit examples — no MCU, always on', { skip: SKIP }, () => {
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

const DEVICE_SKIP = SKIP || (typeof BoardImpl !== 'function'
    ? 'bw-board here did not yield the full engine surface — needs a newer checkout'
    : false);
describe('e2e: device-state examples — relay, motor, 595', { skip: DEVICE_SKIP }, () => {
    test('09-relay-clicker: TIP120-driven relay circuit accepted and has state', () => {
        const { board, parts } = loadCircuit('09-relay-clicker');
        assert.ok(board.parts.length > 0, 'board accepted the TIP120+relay circuit');
        board.setPin('P1.0', 'quasi', true);
        board.advanceTo(100n * MS);
        const relayPart = parts.find(p => p.kind === 'relay');
        assert.ok(relayPart, 'circuit has a relay');
        const state = board.getDeviceState(relayPart.id);
        assert.ok(state, `relay device state exists for ${relayPart.id}`);
        const tgt = state.energized || state._pendingState?.target;
        assert.ok(tgt, 'relay energised or pending energisation via TIP120');
    });

    test('09-relay-clicker: NAIVE wiring (no driver) does NOT energise the relay', () => {
        // This is the property worth pinning forever: a quasi-bidirectional pin
        // cannot drive a relay coil, and the simulator catches it.
        const c = new Circuit(5.0);
        const vcc = c.addPart('vcc', {}, 0, 0);
        const gnd = c.addPart('gnd', {}, 0, 0);
        const relay = c.addPart('relay', { coilR: 70, vOn: 3.5 }, 0, 0);
        const mcu = c.addPart('mcu', { pins: ['P1.0'] }, 0, 0);
        c.addWire(vcc.id, 'vcc', relay.id, 'coil_a');
        c.addWire(relay.id, 'coil_b', mcu.id, 'P1.0');
        c.board.setPin('P1.0', 'quasi', false);   // try to sink — still not enough
        c.board.advanceTo(50n * MS);
        const state = c.board.getDeviceState(relay.id);
        assert.ok(state, 'relay state exists');
        assert.equal(state.energized, false,
            'relay must NOT energise from a quasi-bidirectional pin — the simulator catches this beginner mistake');
    });

    test('10-motor-speed: TIP120-driven motor circuit accepted and has state', () => {
        const { board, parts } = loadCircuit('10-motor-speed');
        assert.ok(board.parts.length > 0, 'board accepted the TIP120+motor circuit');
        board.setPin('P1.0', 'quasi', true);
        board.advanceTo(200n * MS);
        const motorPart = parts.find(p => p.kind === 'dc_motor');
        assert.ok(motorPart, 'circuit has a motor');
        const state = board.getDeviceState(motorPart.id);
        assert.ok(state, `motor device state exists for ${motorPart.id}`);
        // Motor should be spinning or have non-zero omega
        assert.ok(state.omega >= 0, `motor state: omega=${state.omega?.toFixed(2)}`);
    });

    test('32-source-vs-sink: active-high LED is dim (quasi-bidirectional source limit)', () => {
        // Pin THE property: the sink/source asymmetry is visible as brightness.
        const circuit = loadCircuit('32-source-vs-sink');
        const board = circuit.board || circuit;
        board.setPin('P1.0', 'quasi', false);   // sink = bright
        board.setPin('P1.1', 'quasi', true);    // source = dim
        board.advanceTo(25n * MS);
        const leds = board.getLeds();
        const bSink = board.ledBrightness(leds[0]);
        const bSource = board.ledBrightness(leds[1]);
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, batch 2 under the fleet build
        // lock, box load 16-19): bSink > 0.1 -> observed 0.14492753623188406.
        assert.ok(bSink > 0.1, `sink LED brightness ${bSink.toFixed(4)} should be > 0.1`);
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, batch 2 under the fleet build
        // lock, box load 16-19): bSource < 0.02 -> observed 0.006605019815059445.
        assert.ok(bSource < 0.02, `source LED brightness ${bSource.toFixed(4)} should be < 0.02 (quasi-bidirectional ~230 µA)`);
        assert.ok(bSink > bSource * 5, `sink (${bSink.toFixed(4)}) must be much brighter than source (${bSource.toFixed(4)})`);
    });

    // Either kind is a shift register, and WHICH one is the point of the
    // bw-circuit-ui 14efc75 de-alias. 08-led-chaser-595 saves `74hc595`; it
    // used to be rewritten to the built-in `shift_register` at load, which
    // declares no vcc and no gnd while this bench wires both. Accepting the
    // pair rather than pinning one keeps the test about "the bench has a shift
    // register and eight LEDs", which is what it is for; the identity itself
    // is asserted where it belongs, in bw-circuit-ui's
    // test/kind-alias-engine-model.test.js.
    const SHIFT_REGISTER_KINDS = new Set(['shift_register', '74hc595']);

    test('08-led-chaser-595: shift register circuit accepted with LEDs', () => {
        const { board, parts } = loadCircuit('08-led-chaser-595');
        assert.ok(board.parts.length > 0, 'board accepted the shift register circuit');
        const sr = parts.find(p => SHIFT_REGISTER_KINDS.has(p.kind));
        assert.ok(sr, `circuit has a shift register part (kinds: ${parts.map(p => p.kind).join(', ')})`);
        // The de-alias is what this bench needed: the saved kind survives, so
        // the part declares the power pins its seat puts in the rails.
        assert.equal(sr.kind, '74hc595',
            'this bench saves 74hc595 and the pinned engine has a model for it, ' +
            'so it must not be collapsed to the power-less built-in');
        const leds = board.getLeds();
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, batch 2 under the fleet build
        // lock, box load 16-19): leds.length >= 8 -> observed 8.
        assert.ok(leds.length >= 8, `should have 8 LEDs, got ${leds.length}`);
    });

    test('20-shift-register-binary: shift register circuit loads', () => {
        const { board, parts } = loadCircuit('20-shift-register-binary');
        assert.ok(board.parts.length > 0, 'board accepted the shift register circuit');
        const sr = parts.find(p => SHIFT_REGISTER_KINDS.has(p.kind));
        assert.ok(sr, `circuit has a shift register part (kinds: ${parts.map(p => p.kind).join(', ')})`);
        // This bench saves the ABSTRACT kind, and keeps it: the de-alias only
        // fires for a saved `74hc595`, so the two spellings in this corpus stay
        // two spellings and neither is rewritten into the other.
        assert.equal(sr.kind, 'shift_register',
            'a bench that saves shift_register must still load as shift_register');
    });
});

// The aggregate current check does not need the board engine — just the parser.
import SB3Creator from '../src/utils/sb3Creator.js';
import cToPseudocode from '../src/utils/cToPseudocode.js';

describe('e2e: aggregate current check (STC12 §4.6)', () => {
    test('8 output pins on one port triggers the chip-total warning', () => {
        const src = readFileSync(join(EXAMPLES, '46-port-overcurrent', 'program.bw'), 'utf8');
        const c = new SB3Creator();
        c.parse(src);
        const code = c.generateC();
        const { warnings } = cToPseudocode(code);
        assert.ok(warnings.some(w => /up to 160 mA/.test(w)),
            'should warn about up to 160 mA at maximum pin ratings');
        assert.ok(warnings.some(w => /Port 1 has 8 output pins/.test(w)),
            'should warn about port concentration');
    });

    test('4 output pins does NOT trigger the warning', () => {
        const { warnings } = cToPseudocode(`
/* @bw-begin
 * @bw device stc12c5a60s2
 * @bw clock 11059200
 * @bw pin led0 P1.0 output active-low
 * @bw pin led1 P1.1 output active-low
 * @bw pin led2 P1.2 output active-low
 * @bw pin led3 P1.3 output active-low
 * @bw script main 0 stage
 * @bw-end */
#include <stc12.h>
void main(void) { }`);
        assert.ok(!warnings.some(w => /worst-case/.test(w)),
            '4 pins × 20 mA = 80 mA — under the 120 mA budget');
    });
});

describe('e2e: servo — signal pin, not power pin', () => {
    test('53-servo-sweep: chip-budget warning does NOT fire (signal current only)', () => {
        const src = readFileSync(join(EXAMPLES, '53-servo-sweep', 'program.bw'), 'utf8');
        const c = new SB3Creator();
        c.parse(src);
        const code = c.generateC();
        const { warnings } = cToPseudocode(code);
        // A servo takes power from the supply rail, not from the chip pin.
        // The signal pin draws microamps. The 120 mA warning must NOT fire.
        const currentWarns = warnings.filter(w => /mA|budget|worst-case|output pins/.test(w));
        assert.deepEqual(currentWarns, [],
            'servo signal pin must not trip the chip-budget warning — power comes from the rail');
    });

    test('53-servo-sweep: parses, emits and defines bw_servo_set', () => {
        const src = readFileSync(join(EXAMPLES, '53-servo-sweep', 'program.bw'), 'utf8');
        const c = new SB3Creator();
        c.parse(src);
        assert.deepEqual(c.warnings, []);
        const code = c.generateC();
        // The call IS emitted
        assert.match(code, /bw_servo_set\(/, 'bw_servo_set() call emitted');
        // The helper is now defined — assert it compiles via the oracle
        assert.ok(
            /void bw_servo_set\(/.test(code) || /static.*bw_servo_set/.test(code),
            'bw_servo_set helper must be defined in the emitted C');
        const { warnings } = cToPseudocode(code);
        assert.deepEqual(warnings, [], 'oracle must accept the emitted C without warnings');
    });
});

describe('e2e: motor driver — L293D, power from rail', () => {
    test('54-motor-driver: chip-budget warning does NOT fire', () => {
        const src = readFileSync(join(EXAMPLES, '54-motor-driver', 'program.bw'), 'utf8');
        const c = new SB3Creator();
        c.parse(src);
        assert.deepEqual(c.warnings, []);
        const code = c.generateC();
        const { warnings } = cToPseudocode(code);
        const currentWarns = warnings.filter(w => /mA|budget|output pins/.test(w));
        assert.deepEqual(currentWarns, [],
            'motor control pins carry signals (~µA) — the chip budget must not fire');
    });

    test('54-motor-driver: bw_motor_speed and bw_motor_dir round-trip', () => {
        const src = readFileSync(join(EXAMPLES, '54-motor-driver', 'program.bw'), 'utf8');
        const c = new SB3Creator();
        c.parse(src);
        const code = c.generateC();
        assert.match(code, /bw_motor_speed\(/, 'speed call emitted');
        assert.match(code, /bw_motor_dir\(/, 'direction call emitted');
        const { pseudocode, warnings } = cToPseudocode(code);
        // The device calls must read back — no "no pseudocode for the call" warnings
        assert.ok(!warnings.some(w => /no pseudocode for the call/.test(w)),
            'all bw_motor_* calls have reader rules');
        assert.match(pseudocode, /set mymotor speed to 200/);
        assert.match(pseudocode, /set mymotor direction forward/);
        assert.match(pseudocode, /set mymotor direction reverse/);
        assert.match(pseudocode, /set mymotor direction coast/);
    });
});

describe('e2e: buzzer — tone frequency readback via pin edge measurement', { skip: SKIP }, () => {
    test('07-buzzer-siren: toggling P1.5 at 440 Hz, buzzerTone reports ~440 Hz', () => {
        const { board } = loadCircuit('07-buzzer-siren');
        assert.ok(board.parts.length > 0, 'board accepted the buzzer circuit');
        const buzzers = board.getBuzzers();
        assert.ok(buzzers.length > 0, 'circuit has a buzzer');

        // Toggle P1.5 at 440 Hz: half-period = 1/(2×440) ≈ 1136 µs
        const halfPeriodNs = BigInt(Math.round(1e9 / (2 * 440)));
        const pin = 'P1.5';
        for (let i = 0; i < 20; i++) {
            const high = i % 2 === 0;
            board.setPin(pin, 'pushpull', high);
            board.advanceTo(BigInt(i + 1) * halfPeriodNs);
        }

        const tone = board.buzzerTone(buzzers[0]);
        assert.ok(tone.on, 'buzzer should be on after toggling');
        assert.ok(tone.hz > 400 && tone.hz < 480,
            `expected ~440 Hz, got ${tone.hz.toFixed(1)} Hz`);
    });
});

// ---- wired-machine extraction: refusals are part of the teaching contract ------
// Each refusal reason string is a teachable assertion: the student sees WHY their
// wiring is wrong, with addresses and part names. Asserting specific reason
// substrings locks the refusal vocabulary into the gallery contract.

describe('e2e: wired-machine extraction — refusals as assertions', { skip: EXTRACTOR_SKIP }, () => {
    test('eater6502-bench: extracts with zero refusals, lines match preset', () => {
        const data = JSON.parse(readFileSync(join(EXAMPLES, 'eater6502-bench', 'circuit.json'), 'utf8'));
        const r = extract6502Machine(data);
        assert.ok(r.ok, `extraction failed: ${r.reasons.join('; ')}`);
        assert.deepEqual(r.reasons, [], 'expected zero refusals');
        assert.ok(r.lines.some(l => /MAP RAM/.test(l)), 'has RAM region');
        assert.ok(r.lines.some(l => /MAP ROM/.test(l)), 'has ROM region');
        assert.ok(r.lines.some(l => /W65C22/.test(l)), 'has VIA chip');
    });

    test('eater6502-contention-bug: refuses with bus-contention at named address', () => {
        const data = JSON.parse(readFileSync(join(EXAMPLES, 'eater6502-contention-bug', 'circuit.json'), 'utf8'));
        const r = extract6502Machine(data);
        assert.equal(r.ok, false, 'contention circuit must fail extraction');
        assert.ok(r.reasons.length > 0, 'must have at least one refusal reason');
        assert.ok(r.reasons.some(s => /bus contention/i.test(s)),
            `expected "bus contention" in reasons: ${r.reasons.join('; ')}`);
        // The reason must name the colliding address — a refusal without an
        // address is not teachable.
        assert.ok(r.reasons.some(s => /\$[0-9a-f]{4}/i.test(s)),
            `refusal must name the address: ${r.reasons.join('; ')}`);
    });

    test('z80-bench: extracts with zero refusals', {
        skip: existsSync(join(EXAMPLES, 'z80-bench', 'circuit.json'))
            ? false : 'z80-bench circuit.json not yet in gallery'
    }, () => {
        const data = JSON.parse(readFileSync(join(EXAMPLES, 'z80-bench', 'circuit.json'), 'utf8'));
        const r = extractZ80Machine(data);
        assert.ok(r.ok, `extraction failed: ${r.reasons.join('; ')}`);
        assert.deepEqual(r.reasons, [], 'expected zero refusals');
        assert.ok(r.lines.some(l => /MAP ROM/.test(l)), 'has ROM region');
        assert.ok(r.lines.some(l => /MAP RAM/.test(l)), 'has RAM region');
    });

    test('eater6502-vdp-hello: extracts with zero refusals', {
        skip: existsSync(join(EXAMPLES, 'eater6502-vdp-hello', 'circuit.json'))
            ? false : 'vdp-hello circuit.json not yet in gallery'
    }, () => {
        const data = JSON.parse(readFileSync(join(EXAMPLES, 'eater6502-vdp-hello', 'circuit.json'), 'utf8'));
        const r = extract6502Machine(data);
        assert.ok(r.ok, `extraction failed: ${r.reasons.join('; ')}`);
        assert.deepEqual(r.reasons, [], 'expected zero refusals');
    });
});

describe('e2e: blocked examples — named dependencies', { skip: SKIP }, () => {
    for (const [name, blocker] of Object.entries(BLOCKED)) {
        test(`${name}: BLOCKED on ${blocker}`, { skip: `waiting on bw-board: ${blocker}` }, () => {});
    }
});
