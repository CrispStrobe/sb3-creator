import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import SB3Creator from '../src/utils/sb3Creator.js';
import {ARCADE_WORDS} from '../src/utils/arcadeDialect.js';

const make = value => {
    const creator = new SB3Creator();
    creator.parse(`DEVICE ARCADE\nSPRITE Game:\nWHEN arcade source starts:\n  set result to (arcade source type of (${value}))\n`);
    assert.deepEqual(creator.warnings, []);
    return creator;
};
test('source typeof is one connected reporter and preserves literals, expressions and actual fresh SB3', async () => {
    assert.equal(ARCADE_WORDS.filter(word => word.op === 'arcade_sourceTypeOf').length, 1);
    for (const value of ['42', '""', '"雪🙂"', '"[1,2]"', '"null"', 'undefined value', 'null value', 'calculate value (2) op "+" with (3)']) {
        const creator = make(value), target = creator.project.targets.find(target => !target.isStage);
        const block = Object.values(target.blocks).find(block => block.opcode === 'arcade_sourceTypeOf');
        assert.deepEqual(block.fields, {});
        assert.deepEqual(Object.keys(block.inputs), ['VALUE']);
        const code = creator.decompile(), replay = new SB3Creator();
        replay.parse(code);assert.deepEqual(replay.warnings, []);assert.equal(replay.decompile(), code);
        const zip = await JSZip.loadAsync(Buffer.from(await (await creator.generateSB3()).arrayBuffer()));
        const fresh = new SB3Creator();fresh.project = JSON.parse(await zip.file('project.json').async('text'));
        assert.equal(fresh.decompile(), code);
    }
});
test('source typeof keeps an edited connected input and introduces no callable blocks', () => {
    const creator = make('1'), target = creator.project.targets.find(target => !target.isStage);
    const block = Object.values(target.blocks).find(block => block.opcode === 'arcade_sourceTypeOf');
    block.inputs.VALUE = [1, [10, 'live-looking:SpriteID']];
    const code = creator.decompile();assert.match(code, /arcade source type of .*live-looking:SpriteID/);
    const replay = new SB3Creator();replay.parse(code);assert.deepEqual(replay.warnings, []);assert.equal(replay.decompile(), code);
    for (const project of [creator.project, replay.project])
        assert.equal(project.targets.some(target => Object.values(target.blocks).some(block => /Callable/.test(block.opcode))), false);
    for (const op of ['arcade_defineCallable', 'arcade_callableReference'])
        assert.equal(ARCADE_WORDS.some(word => word.op === op), false);
});
