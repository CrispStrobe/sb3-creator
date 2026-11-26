#!/usr/bin/env node
// SPDX-License-Identifier: BSD-3-Clause
// Explicit integration proof against a caller-supplied owning machine source.
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {assembleCardiac} from '../src/utils/cardiacProgram.js';
import {CARDIAC_EXAMPLES} from '../src/utils/cardiacExamples.js';

const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--board') {
    throw new Error('Usage: node scripts/verify-cardiac-examples.mjs --board /path/to/bw-board');
}
const {createCardiacMachine, controlCardiacMachine, runCardiacMachine} =
    await import(pathToFileURL(path.resolve(args[1], 'src/cardiac-machine.js')).href);
const results = [];
const execute = (id, input, expectedOutput, terminal) => {
    const example = CARDIAC_EXAMPLES[id];
    const assembly = assembleCardiac(example.source);
    assert.equal(assembly.ok, true, `${id}: source assembles`);
    const machine = createCardiacMachine({words: assembly.words, entry: assembly.entry});
    controlCardiacMachine(machine, 'enqueueInput', input);
    const result = runCardiacMachine(machine, {maxSteps: 1000});
    assert.deepEqual(machine.output, expectedOutput, `${id}: actual execution output`);
    assert.equal(terminal === 'halted' ? machine.halted : machine.waiting, true, `${id}: terminal state`);
    results.push({id, input, output: [...machine.output], reason: result.reason,
        steps: machine.steps, pc: machine.pc, accumulator: machine.acc});
    return machine;
};
for (const example of Object.values(CARDIAC_EXAMPLES)) {
    const machine = execute(example.id, example.input, example.expectedOutput, example.terminal);
    if (example.id === 'cardiac-self-modify') {
        assert.equal(machine.memory[10], 583, 'the final patched instruction is present but never printed a fourth cell');
    }
    if (example.id === 'cardiac-bootstrap') {
        assert.deepEqual([...machine.memory.slice(20, 26)], [80, 180, 281, 680, 580, 900], 'the bootstrap really wrote its payload');
        assert.equal(machine.memory[81], 7, 'the bootstrap really wrote its addend');
    }
}
execute('cardiac-echo', [-42], [-42], 'halted');
execute('cardiac-add', [-5, 12], [7], 'halted');
execute('cardiac-add', [0, 0], [0], 'halted');
execute('cardiac-countdown', [0], [0], 'halted');
execute('cardiac-countdown', [-1], [], 'halted');
execute('cardiac-night-light', [499, 500, 501], [1, 0, 0], 'waiting');
console.log(JSON.stringify({ok: true, scope: 'actual CARDIAC source assembly and machine execution; no GUI or electrical claim', results}, null, 2));
