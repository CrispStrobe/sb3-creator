/**
 * The Calliope mini motor word: `calliope motor A power 50 %`.
 * MakeCode's `motors.dualMotorPower(Motor.A, 50)`; the micro:bit has no motor.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const SRC = `DEVICE CALLIOPEMINI
WHEN radio receives number:
  calliope motor A power 50 %
  calliope motor b power speed
`;
const motors = (project) => project.targets.flatMap((t) => Object.values(t.blocks))
    .filter((b) => b.opcode === 'microbitplus_motorpower');

test('the word builds a motor block with the motor as a field and the power as a value', () => {
    const c = new SB3Creator();
    c.parse(SRC);
    const [a, b] = motors(c.project);
    assert.deepEqual(a.fields.MOTOR, ['A', null]);
    assert.deepEqual(b.fields.MOTOR, ['B', null], 'the motor letter is normalised');
    assert.ok(a.inputs.POWER && b.inputs.POWER);
});

test('it round-trips', () => {
    const c = new SB3Creator();
    c.parse(SRC);
    const text = c.decompile();
    assert.match(text, /^\s+calliope motor A power 50 %$/m);
    assert.match(text, /^\s+calliope motor B power speed %$/m);
    const again = new SB3Creator();
    again.parse(text);
    assert.equal(again.decompile(), text);
});

test('a motor that does not exist is not read as one', () => {
    const c = new SB3Creator();
    assert.throws(() => c.parse('DEVICE CALLIOPEMINI\nWHEN flag clicked:\n  calliope motor C power 50 %\n'));
});

test('MicroPython, which has no form for it, says so instead of dropping it', () => {
    const c = new SB3Creator();
    c.parse('DEVICE CALLIOPEMINI\nWHEN flag clicked:\n  calliope motor A power 50 %\n');
    const r = c.generateMicroPython();
    const said = JSON.stringify([r.reasons, r.warnings, r.degraded, r.notes]);
    assert.match(said, /microbitplus_motorpower/);
});
