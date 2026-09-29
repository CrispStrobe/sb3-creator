/**
 * The SPIKE dialect words added for SPIKE App 3 Python (2026-09-28), and the
 * motor UNIT field fix that came with them.
 *
 * Each word is held three ways: it compiles to the named spikeprime opcode, its
 * fields/inputs carry the values the extension's getInfo() menus define, and the
 * decompile gives back the exact line (so .bw -> blocks -> .bw is a fixed point
 * on the word itself, not merely on some spelling of it).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const wrap = (line) => `DEVICE SPIKE\n\nWHEN flag clicked:\n  ${line}\n`;

function compile (line) {
    const c = new SB3Creator();
    const project = c.parse(wrap(line));
    const blocks = project.targets.flatMap((t) => Object.values(t.blocks || {}));
    return { c, project, blocks, decompiled: c.decompile(project) };
}

const spikeBlocks = (blocks) => blocks.filter((b) => b && typeof b.opcode === 'string' && b.opcode.startsWith('spikeprime_'));

/** A literal number/text input's value, or null for a reporter. */
const literal = (input) => (Array.isArray(input) && Array.isArray(input[1]) ? String(input[1][1]) : null);

// [line, opcode, fields, literal inputs]
const WORDS = [
    ['run motor C to position 90', 'motorRunToPosition', { PORT: 'C' }, { POSITION: '90' }],
    ['reset motor position B to 0', 'resetMotorPosition', { PORT: 'B' }, { POSITION: '0' }],
    ['set motor stop action D hold', 'motorSetStopAction', { PORT: 'D', ACTION: 'hold' }, {}],
    ['preset yaw to 45', 'presetYaw', {}, { ANGLE: '45' }],
    ['display image 3', 'displayShowImage', {}, { IMAGE: '3' }],
    // 2026-09-29 (task D1). COLOR is a CENTER_LED_COLOR menu value (upper case).
    ['set center button light to lime', 'setCenterButtonColor', { COLOR: 'LIME' }, {}],
    ['set spike volume to 40', 'setVolume', {}, { VOLUME: '40' }],
    ['set distance lights D 9 0 5 1', 'setDistanceLights', { PORT: 'D' }, { TL: '9', TR: '0', BL: '5', BR: '1' }]
];

describe('SPIKE 3 dialect words: command lines', () => {
    for (const [line, opcode, fields, inputs] of WORDS) {
        test(`${line} -> spikeprime_${opcode}, and back`, () => {
            const { c, blocks, decompiled } = compile(line);
            assert.deepEqual(c.warnings, []);
            const spike = spikeBlocks(blocks);
            assert.deepEqual(spike.map((b) => b.opcode), [`spikeprime_${opcode}`]);
            for (const [k, v] of Object.entries(fields)) assert.equal(spike[0].fields[k][0], v, k);
            for (const [k, v] of Object.entries(inputs)) assert.equal(literal(spike[0].inputs[k]), v, k);
            assert.ok(decompiled.split('\n').map((l) => l.trim()).includes(line), `decompiled:\n${decompiled}`);
        });
    }
});

// [line, opcode, fields]
const REPORTERS = [
    ['spike motor relative position F', 'getRelativePosition', { PORT: 'F' }],
    ['spike distance B in mm', 'getDistanceIn', { PORT: 'B', UNIT: 'mm' }],
    ['spike distance B in inches', 'getDistanceIn', { PORT: 'B', UNIT: 'in' }],
    ['spike distance B in percent', 'getDistanceIn', { PORT: 'B', UNIT: '%' }],
    ['spike face up', 'getFaceUp', {}],
    // 2026-09-29 (task D1): AXIS is the extension's AXIS menu, CHANNEL its RGB_CHANNEL.
    ['spike gyro rate yaw', 'getGyroRate', { AXIS: 'yaw' }],
    ['spike gyro rate roll', 'getGyroRate', { AXIS: 'roll' }],
    ['spike color C raw blue', 'getColorRGB', { PORT: 'C', CHANNEL: 'blue' }]
];

describe('SPIKE 3 dialect words: reporters', () => {
    for (const [expr, opcode, fields] of REPORTERS) {
        test(`${expr} -> spikeprime_${opcode}, and back`, () => {
            const line = `set v to ${expr}`;
            const { c, blocks, decompiled } = compile(line);
            assert.deepEqual(c.warnings, []);
            const spike = spikeBlocks(blocks);
            assert.deepEqual(spike.map((b) => b.opcode), [`spikeprime_${opcode}`]);
            for (const [k, v] of Object.entries(fields)) assert.equal(spike[0].fields[k][0], v, k);
            assert.ok(decompiled.includes(`set v to (${expr})`), `decompiled:\n${decompiled}`);
        });
    }
});

describe('display text takes an expression as well as a literal', () => {
    test('a literal keeps its quotes and stays a literal input', () => {
        const { blocks, decompiled } = compile('display text "Hi"');
        const [b] = spikeBlocks(blocks);
        assert.equal(literal(b.inputs.TEXT), 'Hi');
        assert.ok(decompiled.includes('display text "Hi"'));
    });
    test('a reporter becomes a reporter input and decompiles unquoted', () => {
        const { c, blocks, decompiled } = compile('display text (spike distance A)');
        assert.deepEqual(c.warnings, []);
        const ops = spikeBlocks(blocks).map((b) => b.opcode).sort();
        assert.deepEqual(ops, ['spikeprime_displayText', 'spikeprime_getDistance']);
        const shown = spikeBlocks(blocks).find((b) => b.opcode === 'spikeprime_displayText');
        assert.equal(literal(shown.inputs.TEXT), null, 'TEXT must hold the reporter, not its words');
        assert.ok(decompiled.includes('display text (spike distance A)'), decompiled);
        const again = new SB3Creator();
        assert.equal(again.decompile(again.parse(decompiled)), decompiled, 'fixed point');
    });
});

describe('motor UNIT fields carry the extension menu values', () => {
    // The spikeprime extension's getInfo() menus (CrispStrobe/extensions,
    // legospike_turbowarp_transpile.js): MOTOR_UNIT = rotations|degrees|seconds,
    // MOVE_UNIT = cm|in|rotations|degrees|seconds. motorRunFor compares UNIT to
    // "rotations"/"degrees"/"seconds" literally; a singular "degree" turned the
    // motor by 0 degrees.
    const MOTOR_UNIT = ['rotations', 'degrees', 'seconds'];
    const MOVE_UNIT = ['cm', 'in', 'rotations', 'degrees', 'seconds'];
    const cases = [
        ['run motor A forward 90 degrees', 'motorRunFor', 'degrees', MOTOR_UNIT],
        ['run motor A forward 1 degree', 'motorRunFor', 'degrees', MOTOR_UNIT],
        ['run motor A backward 2 rotations', 'motorRunFor', 'rotations', MOTOR_UNIT],
        ['run motor A forward 1.5 seconds', 'motorRunFor', 'seconds', MOTOR_UNIT],
        ['move forward 360 degrees', 'moveForward', 'degrees', MOVE_UNIT],
        ['move backward 2 seconds', 'moveForward', 'seconds', MOVE_UNIT],
        ['move forward 10 cm', 'moveForward', 'cm', MOVE_UNIT],
        ['move forward 4 inches', 'moveForward', 'in', MOVE_UNIT]
    ];
    for (const [line, opcode, unit, menu] of cases) {
        test(`${line}: UNIT "${unit}" is a ${opcode} menu value`, () => {
            const { blocks, decompiled } = compile(line);
            const [b] = spikeBlocks(blocks);
            assert.equal(b.opcode, `spikeprime_${opcode}`);
            assert.equal(b.fields.UNIT[0], unit);
            assert.ok(menu.includes(b.fields.UNIT[0]));
            const again = new SB3Creator();
            assert.equal(again.decompile(again.parse(decompiled)), decompiled, 'fixed point');
        });
    }
    test('a project saved with the old singular field still reads back as the word', () => {
        const { project, c } = compile('run motor A forward 90 degrees');
        for (const t of project.targets) {
            for (const b of Object.values(t.blocks || {})) if (b.opcode === 'spikeprime_motorRunFor') b.fields.UNIT = ['degree', null];
        }
        assert.ok(c.decompile(project).includes('run motor A forward 90 degrees'));
    });
});
