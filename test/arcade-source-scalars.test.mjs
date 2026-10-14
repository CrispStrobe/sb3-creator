import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import SB3Creator from '../src/utils/sb3Creator.js';
const source = `DEVICE ARCADE
GLOBAL before
SPRITE Game:
WHEN arcade source starts:
  declare arcade source scalar before as Boolean
  set before to (undefined value)`;
const inspect = creator => {
    assert.deepEqual(creator.warnings, []);
    const target = creator.project.targets.find(target => target.name === 'Game');
    const block = Object.values(target.blocks).find(block => block.opcode === 'arcade_declareSourceScalar');
    assert.equal(block.fields.TYPE[0], 'Boolean');
    assert.equal(block.inputs.TYPE, undefined);
    const input = block.inputs.VARIABLE[1];
    const reporter = typeof input === 'string' ? target.blocks[input] : null;
    const id = reporter ? reporter.fields.VARIABLE[1] : input[2];
    assert.equal(reporter?.opcode || (input[0] === 12 && 'data_variable'), 'data_variable');
    const stage = creator.project.targets.find(target => target.isStage);
    assert.ok(stage.variables[id]);
    return {block, id, stage, target};
};
test('source declaration keeps direct type and actual global variable ID through Code and fresh SB3', async () => {
    const creator = new SB3Creator(); creator.parse(source); const original = inspect(creator);
    const code = creator.decompile(), again = new SB3Creator(); again.parse(code); inspect(again);
    assert.equal(again.decompile(), code);
    const zip = await JSZip.loadAsync(await (await creator.generateSB3()).arrayBuffer());
    const fresh = new SB3Creator(); fresh.project = JSON.parse(await zip.file('project.json').async('text'));
    assert.equal(inspect(fresh).id, original.id); assert.equal(fresh.decompile(), code);
});
test('declaration does not accept literal names or computed values as variable bindings', () => {
    for (const variable of ['"before"', '(before + 1)', '(undefined value)', '5']) {
        const creator = new SB3Creator();
        assert.throws(() => creator.parse(source.replace('scalar before as', `scalar ${variable} as`)), /variable reporter/);
    }
});
