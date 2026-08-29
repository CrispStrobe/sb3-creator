/**
 * A declared input polarity means the same thing in the referee, in the emitted
 * C, and after a retarget.
 *
 * FOUND 2026-08-29 while repairing D36, and both halves were real.
 *
 * `read <pin>` is the LOGICAL level everywhere this project states a rule:
 * `cPinRead` emits `!P3_2` for an ACTIVE LOW pin, the simulator driver emits
 * `p.low ? (readPin ? 0 : 1) : readPin`, and the C scheduler's hat-edge comment
 * says "the level read is the LOGICAL one, so an ACTIVE LOW button reads as
 * pressed when the pin is low". Two places disagreed:
 *
 *   1. THE REFEREE returned the RAW stimulus level for a digital pin and never
 *      consulted the declaration, so an ACTIVE LOW input meant the opposite
 *      there to what it means on the chip. It could not be seen from the corpus
 *      because until D36 no bench that a test STIMULATES declared one.
 *
 *   2. THE RETARGET dropped it. `retargetPseudocode` set `activeLow = false`
 *      for every input and only ever assigned a polarity to outputs (from the
 *      target's LED convention). So `05-counter`, whose source says
 *      `PIN button = P3.2 INPUT ACTIVE LOW`, kept it on its own device and lost
 *      it on the other TEN — `wait until read button` was satisfied at rest and
 *      the counter ran free with nobody touching it.
 *
 * An OUTPUT's polarity legitimately DOES follow the target (an 8051 board sinks
 * its LED from the rail, an Arduino board sources it), which is why the retarget
 * had a rule for outputs at all. An INPUT has no such per-device convention in
 * this corpus: every generated bench wires a button the same way on every
 * device — pull-up to the rail, button to ground — and the `R_PU_<name>`
 * resistor in the shipped `circuit.<device>.json` files is that wiring, checked
 * below rather than asserted.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import SB3Creator from '../src/utils/sb3Creator.js';
import { interpretTrace } from '../src/utils/traceOracle.js';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

const readerProgram = (decl) => [
    'DEVICE STC12C5A60S2', 'CLOCK 11059200', `PIN btn = P3.2 INPUT${decl}`,
    'PIN led = P1.0 OUTPUT', '',
    'WHEN flag clicked:', '  IF read btn = 1 THEN:', '    turn on led',
    '  ELSE:', '    turn off led', '  wait 1 seconds',
].join('\n');

/** Did the LED come on, for a pin held at this RAW level? */
function litAt (decl, rawLevel) {
    const c = new SB3Creator();
    const project = c.parse(readerProgram(decl));
    const trace = interpretTrace(project, {
        horizonMs: 100, stimulus: [{ tMs: 0, pin: 'btn', level: rawLevel }],
    });
    assert.deepEqual(trace.unsupported, []);
    const last = trace.events.filter((e) => e.pin === 'led').at(-1);
    return last ? last.level === 1 : false;
}

describe('the referee reads an input the way the chip does', () => {
    test('ACTIVE LOW inverts the raw level, plain INPUT does not', () => {
        assert.equal(litAt('', 1), true, 'plain INPUT: a high pin reads 1');
        assert.equal(litAt('', 0), false, 'plain INPUT: a low pin reads 0');
        assert.equal(litAt(' ACTIVE LOW', 0), true, 'ACTIVE LOW: a LOW pin is pressed, so it reads 1');
        assert.equal(litAt(' ACTIVE LOW', 1), false, 'ACTIVE LOW: a high pin is released, so it reads 0');
    });

    test('and the emitted C says the same thing about the same declaration', () => {
        const plain = new SB3Creator(); plain.parse(readerProgram(''));
        const low = new SB3Creator(); low.parse(readerProgram(' ACTIVE LOW'));
        assert.match(plain.generateC(), /if \(\(P3_2 == 1\)\)/, 'plain INPUT reads the pin');
        assert.match(low.generateC(), /if \(\(!P3_2 == 1\)\)/, 'ACTIVE LOW inverts it');
    });

    test('an UNSTIMULATED input reads 0 under either polarity', () => {
        // An idle input sits at its INACTIVE rail — the high one when the pull
        // is up — so "nothing is pressed" is 0 either way. This is also what the
        // referee did before it learned polarity at all, so no existing trace
        // moved on account of a default.
        for (const decl of ['', ' ACTIVE LOW']) {
            const c = new SB3Creator();
            const project = c.parse(readerProgram(decl));
            const trace = interpretTrace(project, { horizonMs: 100 });
            assert.equal(trace.events.filter((e) => e.pin === 'led').length, 0,
                `\`${decl.trim() || 'INPUT'}\`: with no stimulus the LED must stay off`);
        }
    });
});

describe('a retarget keeps the button it was given', () => {
    const src = readFileSync(join(EXAMPLES, '05-counter', 'program.bw'), 'utf8');
    const index = JSON.parse(readFileSync(join(EXAMPLES, 'index.json'), 'utf8'));
    const entry = (Array.isArray(index) ? index : index.examples).find((e) => e.id === '05-counter');

    test('the subject really is an ACTIVE LOW input on a multi-device example', () => {
        assert.match(src, /^PIN button = P3\.2 INPUT ACTIVE LOW$/m);
        assert.ok(entry.devices.length >= 11,
            `05-counter must still carry its device list (${entry.devices.length})`);
    });

    test('every device keeps ACTIVE LOW on the input', () => {
        const lost = [];
        for (const device of entry.devices) {
            const r = SB3Creator.retargetPseudocode(src, device);
            if (!r.ok) continue;
            const line = r.pseudocode.split('\n').find((l) => /^PIN button = /.test(l));
            if (!/ ACTIVE LOW$/.test(line || '')) lost.push(`${device}: ${line}`);
        }
        assert.deepEqual(lost, [],
            'the retarget dropped the input polarity on these devices, so the retargeted '
            + 'program reads its own button inverted:\n  ' + lost.join('\n  '));
    });

    test("but the LED's polarity still follows the target's own convention", () => {
        // The contrast is the point: an output's polarity is a property of the
        // board it lands on, an input's is a property of the button it reads.
        const seen = new Map();
        for (const device of entry.devices) {
            const r = SB3Creator.retargetPseudocode(src, device);
            if (!r.ok) continue;
            const line = r.pseudocode.split('\n').find((l) => /^PIN led1 = /.test(l));
            seen.set(device, / ACTIVE LOW$/.test(line || ''));
        }
        assert.equal(seen.get('stc12c5a60s2'), true, '8051 boards sink the LED from the rail');
        assert.equal(seen.get('arduino-uno'), false, 'Arduino boards source it');
        assert.ok([...seen.values()].some(Boolean) && [...seen.values()].some((v) => !v),
            'if every device agreed, this contrast would have stopped being tested');
    });

    test('the counter needs a press on every device, and counts exactly one per press', () => {
        for (const device of entry.devices) {
            const r = SB3Creator.retargetPseudocode(src, device);
            if (!r.ok) continue;
            const c = new SB3Creator();
            c.parse(r.pseudocode);
            const run = (stim) => Number(interpretTrace(c.project,
                { horizonMs: 3000, stimulus: stim, maxSteps: 4000000 }).vars.count);
            // Held at the pull-up's rail: released. Nothing must happen.
            assert.equal(run([{ tMs: 0, pin: 'button', level: 1 }]), 0,
                `${device}: the counter advanced with the button RELEASED — the polarity was lost`);
            // One press to ground and back.
            assert.equal(run([{ tMs: 0, pin: 'button', level: 1 },
                { tMs: 500, pin: 'button', level: 0 },
                { tMs: 700, pin: 'button', level: 1 }]), 1,
            `${device}: one press must count exactly once`);
        }
    });

    test('the shipped benches back the claim: the button is pulled up and grounded', () => {
        let checked = 0;
        for (const device of entry.devices) {
            const file = join(EXAMPLES, '05-counter', `circuit.${device}.json`);
            if (!existsSync(file)) continue;
            const data = JSON.parse(readFileSync(file, 'utf8'));
            const button = data.parts.find((p) => p.kind === 'button' || p.kind === 'switch');
            assert.ok(button, `${device}: no button on the bench`);
            const wires = data.wires.filter((w) => w.from === button.id || w.to === button.id);
            assert.ok(wires.some((w) => /^R_PU_/.test(String(w.from)) || /^R_PU_/.test(String(w.to))),
                `${device}: the button is not tied to a pull-up resistor`);
            assert.ok(wires.some((w) => String(w.from) === 'GND' || String(w.to) === 'GND'),
                `${device}: the button does not go to ground`);
            checked++;
        }
        assert.ok(checked >= 10,
            `only ${checked} per-device benches were read (expected at least 10) — an empty `
            + 'sweep would make the two assertions above say nothing');
    });
});
