import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import SB3Creator from '../src/utils/sb3Creator.js';
import {ARCADE_WORDS} from '../src/utils/arcadeDialect.js';

const make = (value, limit) => {
    const creator = new SB3Creator();
    creator.parse(`DEVICE ARCADE\nSPRITE Game:\nWHEN arcade source starts:\n  set result to (arcade inspect value ${value} limit ${limit})\n`);
    assert.deepEqual(creator.warnings, []);
    return creator;
};

test('inspection has two connected inputs through Code and actual fresh SB3', async () => {
    assert.equal(ARCADE_WORDS.filter(word => word.op === 'arcade_inspectValue').length, 1);
    for (const [value, limit] of [['("猫☃")', '(20)'], ['(-1.25)', '(-2)'],
        ['(undefined value)', '(0)'], ['(null value)', '(1.2)'],
        ['(calculate value (2) op "+" with (3))', '(arcade local maximum)']]) {
        const creator = make(value, limit);
        const target = creator.project.targets.find(target => !target.isStage);
        const block = Object.values(target.blocks).find(block => block.opcode === 'arcade_inspectValue');
        assert.deepEqual(block.fields, {});
        assert.deepEqual(Object.keys(block.inputs), ['VALUE', 'LIMIT']);
        const code = creator.decompile(), replay = new SB3Creator();
        replay.parse(code);assert.deepEqual(replay.warnings, []);assert.equal(replay.decompile(), code);
        const zip = await JSZip.loadAsync(Buffer.from(await (await creator.generateSB3()).arrayBuffer()));
        const fresh = new SB3Creator();fresh.project = JSON.parse(await zip.file('project.json').async('text'));
        assert.equal(fresh.decompile(), code);
    }
});

test('inspection retains both edited operands without baking its runtime result', () => {
    const creator = make('("first")', '(20)');
    const target = creator.project.targets.find(target => !target.isStage);
    const block = Object.values(target.blocks).find(block => block.opcode === 'arcade_inspectValue');
    block.inputs.VALUE = [1, [10, 'changed:Sprite-like-text']];
    block.inputs.LIMIT = [1, [4, '3']];
    const code = creator.decompile();
    assert.match(code, /arcade inspect value .*changed:Sprite-like-text.* limit .*3/);
    const replay = new SB3Creator();replay.parse(code);
    assert.deepEqual(replay.warnings, []);assert.equal(replay.decompile(), code);
    assert.equal(Object.values(target.blocks).some(node => node.opcode === 'arcade_log'), false);
});
