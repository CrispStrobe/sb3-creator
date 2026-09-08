import {test} from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import examples from '../src/utils/examples.js';

test('the shipped i8086 counter example parses to the intended device, display, and loop', () => {
    assert.equal(typeof examples.i8086_counter, 'string',
        'the Code-tab catalogue must keep the i8086 counter example');

    const creator = new SB3Creator();
    creator.parse(examples.i8086_counter);
    assert.deepEqual(creator.warnings, [], 'the shipped example parses without warnings');

    assert.equal(creator.project.stc.device, 'i8086');
    assert.deepEqual(creator.project.stc.parts, [{
        name: 'disp',
        type: 'sevenseg8',
        segPort: 1,
        selPins: [{port: 2, bit: 0}, {port: 2, bit: 1}, {port: 2, bit: 2}],
        claims: [[2, 0], [2, 1], [2, 2]],
        commonAnode: false
    }]);

    const opcodes = Object.values(creator.project.targets[0].blocks)
        .filter(block => block && typeof block === 'object' && !Array.isArray(block))
        .map(block => block.opcode);
    assert.deepEqual(opcodes, [
        'event_whenflagclicked',
        'data_setvariableto',
        'stc12_seg_shownum',
        'data_changevariableby',
        'control_wait',
        'control_forever'
    ]);
});
