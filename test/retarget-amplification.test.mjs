// Retarget amplification harness: every gallery example × every device
// in its computed devices list, retargeted, parsed, and run through the
// referee (traceOracle).  ~150+ program-runs of coverage, no emulator.
//
// Three tiers:
//   1. No unsupported opcodes (referee speaks the whole program)
//   2. Non-degenerate trace (at least one event or serial line for
//      programs that should produce them)
//   3. Cross-device identity: the same example's traces must be IDENTICAL
//      except ADC-derived serial values (differing bits/vref)
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { join } from 'path';
import SB3Creator from '../src/utils/sb3Creator.js';
import { interpretTrace } from '../src/utils/traceOracle.js';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const index = JSON.parse(readFileSync(join(EXAMPLES, 'index.json'), 'utf8'));
const generic = index.filter(e => e.kind === 'program' && Array.isArray(e.devices));

/** ADC config per device: bits and reference voltage. */
const ADC_CFG = {
    stc12c5a60s2: { bits: 10, vref: 5 },
    stc89c52rc:   { bits: 10, vref: 5 },
    stc15f2k60s2: { bits: 10, vref: 5 },
    'arduino-uno':  { bits: 10, vref: 5 },
    'arduino-nano': { bits: 10, vref: 5 },
    pico:           { bits: 12, vref: 3.3 },
};

/** Build a default stimulus: analog pins at mid-range, digital inputs low. */
function defaultStimulus(pins, adc) {
    // The stimulus SWEEPS: a threshold program (night light, thermostat,
    // comparator) sitting at a constant midpoint may legitimately never
    // act — and since the referee seeds pins at intent 0, "reacting by
    // staying off" records nothing at all. Low → high → low crossings
    // make every threshold fire in both directions, so the
    // non-degeneracy assertion below tests the PROGRAM, not the noise
    // floor the referee used to emit for baseline OFF writes.
    const stim = [];
    let ai = 0;
    for (const p of pins || []) {
        if (p.direction === 'analog') {
            // 3%/85% clears RAW thresholds (the night light compares to 200, on every resolution (a literal
            // which is 4.9% of a 12-bit range — a 5% floor missed it by five counts), and
            // pins alternate phase so two-pot comparators see their inputs
            // CROSS instead of sweeping in lockstep.
            const lo = adc.vref * 0.03, hi = adc.vref * 0.85;
            const first = (ai % 2 === 0) ? lo : hi;
            const second = (ai % 2 === 0) ? hi : lo;
            const off = ai * 250;
            stim.push({ tMs: 0, pin: p.name, volts: first });
            stim.push({ tMs: 900 + off, pin: p.name, volts: second });
            stim.push({ tMs: 1900 + off, pin: p.name, volts: first });
            ai++;
        }
        if (p.direction === 'input') {
            stim.push({ tMs: 0, pin: p.name, level: 0 });
            stim.push({ tMs: 700, pin: p.name, level: 1 });
            stim.push({ tMs: 1600, pin: p.name, level: 0 });
        }
    }
    return stim;
}

/**
 * Opcodes the referee does not speak yet. These are genuine gaps in the
 * referee's vocabulary, not bugs — a program that uses them is recorded
 * as "expected unsupported" rather than a test failure.
 */
const EXPECTED_UNSUPPORTED = new Set([
    // A loop with no wait inside spins at CPU speed on the chip while real
    // time passes (the LED dice's randomness IS that) — virtual time cannot
    // model it, and the referee refuses by name.
    'busy-loop:zero-time-spin',
    // control_wait_until / control_repeat_until joined the referee's
    // vocabulary 2026-08-13 (1 ms re-poll, matching the C scheduler's
    // per-pass re-check within tolerance) and left this list.
    'stc12_setpart',     // shift register
    'devices_setservo', 'devices_setmotor', 'devices_setdirection',
]);

/**
 * Examples whose cross-device event traces legitimately differ because an
 * ADC-derived value flows through a polarity-aware physical write (writepin).
 * The STC12 ACTIVE LOW inverts intent for the same raw value. These are
 * correct per-device; asserting identity would be wrong.
 */
const CROSS_DEVICE_ADC_PIN_EXCEPTIONS = new Set([
    '02-dimmer', '10-motor-speed', '15-voltage-divider', '16-ldr-bargraph',
    // RAW ADC thresholds are resolution-relative: a literal 512 is half of
    // a 10-bit range but an eighth of a 12-bit one, so the same volts
    // legally produce different behaviour per device. Genuine divergence.
    '03-night-light', '04-thermostat', '17-comparator',
]);

// ---- Tier 1: retarget + referee, no unsupported opcodes --------------------
describe('amplification: retarget + referee traces', () => {
    for (const entry of generic) {
        const src = readFileSync(join(EXAMPLES, entry.files.program), 'utf8');
        for (const dev of entry.devices) {
            test(`${entry.id} -> ${dev}: referee trace`, () => {
                const r = SB3Creator.retargetPseudocode(src, dev);
                assert.equal(r.ok, true, `retarget failed: ${r.reasons.join('; ')}`);

                const c = new SB3Creator();
                c.parse(r.pseudocode);
                assert.deepEqual(c.warnings, [], 're-parse warnings');

                const adc = ADC_CFG[dev];
                const stim = defaultStimulus(c.project.stc.pins, adc);
                const trace = interpretTrace(c.project, {
                    horizonMs: 3000, adc, stimulus: stim,
                });

                // Unsupported opcodes: expected ones are recorded, not failures.
                const unexpected = trace.unsupported.filter(op => !EXPECTED_UNSUPPORTED.has(op));
                assert.deepEqual(unexpected, [],
                    `unexpected unsupported opcodes: ${unexpected.join(', ')}`);

                // Non-degenerate: programs with output/pwm pins should produce events.
                const hasOutputPins = (c.project.stc.pins || []).some(
                    p => p.direction === 'output' || p.direction === 'pwm');
                if (hasOutputPins && !trace.unsupported.length) {
                    assert.ok(trace.events.length > 0 || trace.pwm.length > 0,
                        'output pins present but trace has no events or PWM');
                }
            });
        }
    }
});

// ---- Tier 2: cross-device identity -----------------------------------------
describe('amplification: cross-device trace identity', () => {
    for (const entry of generic) {
        if (entry.devices.length < 2) continue;
        if (CROSS_DEVICE_ADC_PIN_EXCEPTIONS.has(entry.id)) continue;

        test(`${entry.id}: traces identical across ${entry.devices.length} devices`, () => {
            const src = readFileSync(join(EXAMPLES, entry.files.program), 'utf8');
            const traces = {};
            let skipAll = false;

            for (const dev of entry.devices) {
                const r = SB3Creator.retargetPseudocode(src, dev);
                if (!r.ok) { skipAll = true; break; }
                const c = new SB3Creator();
                c.parse(r.pseudocode);
                const adc = ADC_CFG[dev];
                const stim = defaultStimulus(c.project.stc.pins, adc);
                const trace = interpretTrace(c.project, {
                    horizonMs: 3000, adc, stimulus: stim,
                });
                if (trace.unsupported.length) { skipAll = true; break; }
                traces[dev] = trace;
            }
            if (skipAll) return; // skip examples with unsupported opcodes

            const devs = Object.keys(traces);
            const ref = traces[devs[0]];
            for (let i = 1; i < devs.length; i++) {
                const act = traces[devs[i]];

                // Events: exact match (same pin, level, time)
                const refEv = ref.events.map(e => `${e.tMs}:${e.pin}:${e.level}`);
                const actEv = act.events.map(e => `${e.tMs}:${e.pin}:${e.level}`);
                assert.deepEqual(actEv, refEv,
                    `${devs[0]} vs ${devs[i]}: event traces differ`);

                // PWM: exact match
                const refPwm = ref.pwm.map(p => `${p.tMs}:${p.pin}:${p.percent}`);
                const actPwm = act.pwm.map(p => `${p.tMs}:${p.pin}:${p.percent}`);
                assert.deepEqual(actPwm, refPwm,
                    `${devs[0]} vs ${devs[i]}: PWM traces differ`);

                // Serial: same count and times (values may differ due to ADC)
                assert.equal(ref.serial.length, act.serial.length,
                    `${devs[0]} vs ${devs[i]}: serial count differs`);
                for (let j = 0; j < ref.serial.length; j++) {
                    assert.equal(ref.serial[j].tMs, act.serial[j].tMs,
                        `${devs[0]} vs ${devs[i]}: serial[${j}] time differs`);
                }
            }
        });
    }
});
