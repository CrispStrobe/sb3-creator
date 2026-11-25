// SPDX-License-Identifier: MIT
// Run the original curriculum's cases through the qualified machine-code monitor.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {assembleCp1Program} from '../src/utils/cp1Program.js';
import {loadWorkbench} from './verify-cp1-cp5.mjs';

const {values: options, positionals} = parseArgs({allowPositionals: true, options: {
    board: {type: 'string'}, 'circuit-ui': {type: 'string'}, report: {type: 'string'},
    only: {type: 'string', multiple: true}, extended: {type: 'boolean'},
}});
if (!options.board || !positionals.length) throw new Error(
    'Usage: node scripts/verify-cp1-curriculum.mjs --board BW_BOARD ROM.bin [ROM.bin ...] [--circuit-ui CUI] [--extended] [--report FILE]');

const importBoard = path => import(pathToFileURL(resolve(options.board, path)));
const {createCp1Adapter} = await importBoard('src/cp1-adapter.js');
const {createCp1DebugTarget} = await importBoard('src/cp1-debug.js');
const {Cp1Machine} = await importBoard('src/cp1-machine.js');
const {decodeCp2Memory, recordCp2Signal} = await importBoard('src/cp2-tape.js');
const {decodeCp2Wave, encodeCp2Wave} = await importBoard('src/cp2-wave.js');
const workbench = options['circuit-ui'] && await loadWorkbench({board: options.board, circuitUi: options['circuit-ui']});
const read = path => readFileSync(new URL(`../${path}`, import.meta.url));
const {programs, authorRevision} = JSON.parse(read('reference/cp1-curriculum-programs.json'));
const selected = options.only ? programs.filter(program => options.only.includes(program.id)) : programs;
assert.ok(selected.length, 'No curriculum programs selected');

const digest = (bytes, algorithm = 'sha256') => createHash(algorithm).update(bytes).digest('hex');
const toWord = ({opcode, operand}) => [opcode, operand];
const readProgram = (id, expansion) => assembleCp1Program(
    read(`examples/cp1-${id}/program.cp1`).toString('utf8'), {expansion});
const readRam = machine => Uint8Array.from({length: 512}, (_, index) =>
    toWord(machine.readCell(index >>> 1))[index & 1]);
const advance = (machine, milliseconds) => {
    for (let remaining = milliseconds; remaining > 0; remaining -= 500) {
        assert.ok(machine.advanceCycles(Math.ceil(Math.min(remaining, 500) * 400)).reached);
    }
};
function keypad(machine, name) {
    machine.setKey(name, true);
    advance(machine, 60);
    machine.setKey(name, false);
    advance(machine, 90);
}

const outputPorts = {17: 'P1', 18: 'P2', 23: 'P4', 24: 'P5'};

function verifyCase(rom, meta, program, config, scenario) {
    const address = label => {
        const value = typeof label === 'number' ? label : program.symbols[label.toUpperCase()];
        assert.ok(Number.isSafeInteger(value) && value >= 0 && value < program.capacity, `Unknown CP1 cell ${label}`);
        return value;
    };
    const circuit = workbench ? workbench.Circuit.fromJSON(config) : null;
    if (circuit) assert.equal(circuit.netlistError ?? null, null);
    const adapter = createCp1Adapter({rom, expansion: meta.hardware.cp3, partId: 'cp1'});
    if (circuit) adapter.attachBoard(circuit.board);
    const {machine} = adapter;
    const target = createCp1DebugTarget(adapter);
    function pump() {
        for (let slice = 0; slice < 15 && target.state() === 'running'; slice++) target.runFor(100e6);
        assert.equal(target.state(), 'halted', 'debugger did not stop within the simulated-time budget');
    }
    function key(name) {
        machine.setKey(name, true);
        adapter.advanceNs(50e6);
        machine.setKey(name, false);
        adapter.advanceNs(50e6);
    }
    const switches = new Map();
    for (const {id} of config.parts) {
        const match = /^switch-p([13])-(\d)$/.exec(id);
        if (match) switches.set(id, match.slice(1).map(Number));
    }
    function applyInput(port, byte) {
        if (!circuit) {
            machine.setPortInput(port, byte, 255);
            return;
        }
        let mask = 0;
        for (const [id, [number, bit]] of switches) {
            if (`P${number}` !== port) continue;
            mask |= 1 << bit;
            circuit.setControl(id, Number(!(byte & (1 << bit))));
        }
        assert.ok(mask, `The circuit needs a switch for ${port}`);
    }
    try {
        adapter.advanceNs(150e6);
        for (const {address: cell, opcode, operand} of program.words) machine.writeCell(cell, opcode, operand);
        for (const [label, [opcode, operand]] of Object.entries(scenario.initialMemory ?? {})) {
            machine.writeCell(address(label), opcode, operand);
        }
        const entry = address(scenario.entry ?? meta.entry);
        for (const name of [...String(entry).padStart(3, '0'), 'PC']) key(name);
        const breakpoint = target.setBreakpoint({kind: 'cp1', space: 'program', addr: entry});
        assert.equal(typeof breakpoint, 'number');
        target.run();
        machine.setKey('RUN', true);
        pump();
        machine.setKey('RUN', false);
        target.clearBreakpoint(breakpoint);
        assert.equal(target.semanticState().pc, entry);
        assert.ok(target.semanticState().atCommandBoundary);

        const inputs = (scenario.inputs ?? []).slice();
        const display = [], writes = [], delays = [];
        const expected = scenario.expect;
        const limit = scenario.stopAfterInstructions ?? scenario.maxInstructions;
        let instructions = 0;
        while (instructions < limit && target.semanticState().atCommandBoundary) {
            const pc = target.semanticState().pc;
            if (inputs.length && address(inputs[0].at) === pc) {
                const {port, value} = inputs.shift();
                applyInput(port, value);
            }
            const {opcode, operand} = machine.readCell(pc);
            if (opcode === 2) display.push(toWord(target.semanticState().accumulator));
            if (opcode === 3) delays.push(operand);
            assert.equal(target.step('cp1'), undefined);
            pump();
            const after = target.semanticState();
            assert.ok(['complete', 'halt'].includes(after.step.reason), `CP1 failed at cell ${pc}: ${after.step.reason}`);
            if (outputPorts[opcode]) writes.push([outputPorts[opcode], machine.getPortState(outputPorts[opcode]).latch]);
            instructions++;
        }
        assert.equal(inputs.length, 0, 'all planned input events must be consumed');
        const state = target.semanticState();
        if (scenario.stopAfterInstructions) assert.equal(instructions, scenario.stopAfterInstructions);
        else assert.equal(state.execution, 'halted');
        if (expected.instructions !== undefined) assert.equal(instructions, expected.instructions);
        if (expected.pc !== undefined) assert.equal(state.pc, address(expected.pc));
        if (expected.accumulator) assert.deepEqual(toWord(state.accumulator), expected.accumulator);
        if (expected.display) assert.deepEqual(display, expected.display);
        if (expected.writes) assert.deepEqual(writes, expected.writes);
        if (expected.delays) assert.deepEqual(delays, expected.delays);
        for (const [label, value] of Object.entries(expected.memory ?? {})) {
            assert.deepEqual(toWord(machine.readCell(address(label))), value, label);
        }
        for (const label of ['p1','p2','p4','p5']) {
            if (expected[label] !== undefined) assert.equal(machine.getPortState(label).latch, expected[label], label);
        }
        const result = {instructions, pc: state.pc, accumulator: toWord(state.accumulator), display, writes, delays};
        if (options.extended && meta.id === 'cp2-sample-logger') result.cassette = verifyLogger(rom, machine);
        return result;
    } finally {
        target.destroy();
    }
}

function verifyLogger(rom, source) {
    const expected = readRam(source);
    const recording = recordCp2Signal(source);
    keypad(source, 'CAS');
    const timeout = source.tMs + 470_000;
    while (!recording.finished && source.tMs < timeout) advance(source, 1000);
    assert.ok(recording.finished, 'logger CAS must finish');
    const wave = encodeCp2Wave(recording.stop());
    const tape = decodeCp2Wave(wave);
    assert.deepEqual(decodeCp2Memory(tape), expected);
    const restored = new Cp1Machine({rom, expansion: true});
    advance(restored, 150);
    assert.ok(readRam(restored).every(byte => byte === 0), 'a fresh CP3 monitor starts with empty RAM');
    restored.playCassette(tape);
    keypad(restored, 'CAL');
    advance(restored, tape.at(-1) / 1000 + 1200);
    assert.deepEqual(readRam(restored), expected, 'CAL restores the full program and measured samples');
    return {wavBytes: wave.length, restoredCells: 256};
}

function verifySerial(rom) {
    const senderProgram = readProgram('serial-transmit', false);
    const receiverProgram = readProgram('serial-receive', false);
    const samples = [0, 1, 85, 127, 128, 170, 173, 255];
    for (const sample of samples) {
        const sender = new Cp1Machine({rom});
        const receiver = new Cp1Machine({rom});
        for (const [machine, program] of [[sender, senderProgram], [receiver, receiverProgram]]) {
            advance(machine, 150);
            for (const {address, opcode, operand} of program.words) machine.writeCell(address, opcode, operand);
        }
        sender.writeCell(senderProgram.symbols.PAYLOAD, 0, sample);
        receiver.setPortInput(1, 255, 3);
        keypad(receiver, 'RUN');
        sender.setKey('RUN', true);
        // Both CPUs advance on the same timeline. P1 has pull-ups while the
        // peer's 8155 output is still configured as an input.
        const bus = (machine, mask) => machine.getPortState(2).direction === 'output'
            ? machine.getPortState(2).latch & mask : mask;
        for (let elapsed = 0; elapsed < 500; elapsed += 0.25) {
            if (elapsed === 60) sender.setKey('RUN', false);
            sender.setPortInput(1, bus(receiver, 4), 4);
            receiver.setPortInput(1, bus(sender, 3), 3);
            advance(sender, 0.25);
            advance(receiver, 0.25);
        }
        assert.deepEqual(toWord(receiver.readCell(receiverProgram.symbols.VALID)), [0, 1], `parity for byte ${sample}`);
        assert.deepEqual(toWord(receiver.readCell(receiverProgram.symbols.RECEIVED)), [0, sample]);
        assert.equal(sender.getPortState(2).latch & 2, 2, 'strobe released');
        assert.equal(receiver.getPortState(2).latch & 4, 4, 'acknowledgment released');
    }
    return samples;
}

const report = {format: 'brickwright.cp1-curriculum-verification', authorRevision, electrical: workbench?.identity, runs: []};
const failures = [];
for (const romPath of positionals) {
    const rom = new Uint8Array(readFileSync(romPath));
    const run = {romSha1: digest(rom, 'sha1'), exercises: []};
    for (const meta of selected) {
        const folder = `examples/cp1-${meta.id}`;
        const bytes = read(`${folder}/program.cp1`);
        const program = assembleCp1Program(bytes.toString('utf8'), {expansion: meta.hardware.cp3});
        const config = JSON.parse(read(`${folder}/circuit.json`));
        const cases = meta.cases.map((scenario, index) => {
            try {
                return verifyCase(rom, meta, program, config, scenario);
            } catch (error) {
                const description = `${run.romSha1} ${meta.id} case ${index + 1}: ${error.message}`;
                failures.push(description);
                console.error(description);
                return {failure: error.message};
            }
        });
        run.exercises.push({id:meta.id, programSha256: digest(bytes), cases});
        console.log(run.romSha1.slice(0, 8), meta.id, `${cases.filter(item => !item.failure).length}/${cases.length}`);
    }
    if (options.extended && (!options.only || selected.some(meta => meta.id === 'serial-transmit'))) {
        try {
            run.serialSamples = verifySerial(rom);
            console.log(run.romSha1.slice(0, 8), 'linked serial pair', `${run.serialSamples.length} bytes`);
        } catch (error) {
            failures.push(error.message);
            console.error(run.romSha1, 'linked serial pair', error);
        }
    }
    report.runs.push(run);
}
if (options.report) writeFileSync(options.report, JSON.stringify(report, null, 2) + '\n');
if (failures.length) process.exitCode = 1;
