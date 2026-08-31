import {describe, test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import SB3Creator from '../src/utils/sb3Creator.js';

const PROGRAM = `DEVICE SPIKE

GLOBAL dist = 0

WHEN flag clicked:
  start motor A forward
  wait 250 ms
  set dist to spike distance B
  display text "GO"
  stop motor A
`;

const unzipProject = async bytes =>
    JSON.parse(await (await JSZip.loadAsync(bytes)).file('project.json').async('string'));

const scriptOpcodes = (target, hat) => {
    const result = [];
    for (let id = hat; id; id = target.blocks[id].next) result.push(target.blocks[id].opcode);
    return result;
};

describe('serialized SPIKE artifact contract', () => {
    test('generateSB3 preserves extension metadata, topology, values and nested reporter', async () => {
        const creator = new SB3Creator();
        creator.parse(PROGRAM);
        const bytes = Buffer.from(await (await creator.generateSB3()).arrayBuffer());
        const project = await unzipProject(bytes);
        assert.deepEqual(project.extensions, ['spikeprime']);
        assert.equal(project.extensionURLs.spikeprime,
            'https://crispstrobe.github.io/extensions/CrispStrobe/legospike_turbowarp_transpile.js');

        const target = project.targets.find(item =>
            Object.values(item.blocks).some(block => block.opcode === 'event_whenflagclicked'));
        const [hatId] = Object.entries(target.blocks)
            .find(([, block]) => block.opcode === 'event_whenflagclicked');
        assert.deepEqual(scriptOpcodes(target, hatId), [
            'event_whenflagclicked',
            'spikeprime_motorStart',
            'control_wait',
            'data_setvariableto',
            'spikeprime_displayText',
            'spikeprime_motorStop'
        ]);

        const blocks = Object.values(target.blocks);
        const motor = blocks.find(block => block.opcode === 'spikeprime_motorStart');
        assert.deepEqual(motor.fields.PORT, ['A', null]);
        assert.deepEqual(motor.fields.DIRECTION, ['1', null],
            'the extension runtime multiplies by canonical direction 1/-1, not its localized label');
        const wait = blocks.find(block => block.opcode === 'control_wait');
        assert.equal(wait.inputs.DURATION[1][1], '0.25');
        const assignment = blocks.find(block => block.opcode === 'data_setvariableto');
        const reporter = target.blocks[assignment.inputs.VALUE[1]];
        assert.equal(reporter.opcode, 'spikeprime_getDistance');
        assert.deepEqual(reporter.fields.PORT, ['B', null]);
        const display = blocks.find(block => block.opcode === 'spikeprime_displayText');
        assert.equal(display.inputs.TEXT[1][1], 'GO');
    });

    test('the bw CLI writes the same real archive from outside its repository', async () => {
        const scratch = mkdtempSync(path.join(tmpdir(), 'bw-spike-cli-'));
        const input = path.join(scratch, 'input.bw');
        const output = path.join(scratch, 'output.sb3');
        writeFileSync(input, PROGRAM);
        execFileSync(process.execPath, [path.resolve('bin/bw.mjs'), 'transpile', input,
            '--to', 'sb3', '--device', 'spikeprime', '-o', output], {cwd: scratch});
        const project = await unzipProject(readFileSync(output));
        assert.deepEqual(project.extensions, ['spikeprime']);
        assert.ok(project.targets.some(target =>
            Object.values(target.blocks).some(block => block.opcode === 'spikeprime_getDistance')));
    });
});
