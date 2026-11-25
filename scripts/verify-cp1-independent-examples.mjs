// SPDX-License-Identifier: MIT
// Execute canonical original examples with physical CP1 monitor controls.
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
}});
if (!options.board || !positionals.length) {
    throw new Error('Usage: node scripts/verify-cp1-independent-examples.mjs --board BW_BOARD ROM.bin [ROM.bin ...] [--circuit-ui CUI] [--report report.json]');
}
const {Cp1Machine} = await import(pathToFileURL(resolve(options.board, 'src/cp1-machine.js')));
const read = (path, encoding) => readFileSync(new URL(`../${path}`, import.meta.url), encoding);
const fixtures = JSON.parse(read('reference/cp1-independent-examples.json', 'utf8'));
const glyphs = [0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x27, 0x7f, 0x6f];
const workbench = options['circuit-ui'] && await loadWorkbench({board: options.board, circuitUi: options['circuit-ui']});

function displayNumber(digits) {
    const numbers = digits.map(mask => glyphs.indexOf(mask & 0x7f));
    assert.ok(numbers.every(digit => digit >= 0), `Expected decimal display: ${digits}`);
    return Number(numbers.join(''));
}

function verifyCase(rom, program, config, expected, circuitConfig) {
    const machineOptions = {rom, expansion: config.requiresCp3};
    const circuit = workbench && workbench.Circuit.fromJSON(circuitConfig);
    const adapter = circuit && workbench.createCp1Adapter({...machineOptions, partId: 'cp1'});
    adapter?.attachBoard(circuit.board);
    const machine = adapter ? adapter.machine : new Cp1Machine(machineOptions);
    const advance = ms => {
        if (!adapter) {
            assert.equal(machine.advanceCycles(ms * 400).reached, true);
            return;
        }
        for (let remaining = ms; remaining > 0; remaining -= 50) {
            adapter.advanceNs(Math.min(50, remaining) * 1e6);
        }
    };
    const setInput = (port, value) => {
        if (!circuit) {
            machine.setPortInput(port, value, 255);
            return;
        }
        const switches = circuitConfig.parts.filter(part => part.id.startsWith('switch'));
        assert.ok(switches.length, `the P${port} input exercise requires circuit switches`);
        for (const {id} of switches) {
            const terminal = Number(id.slice('switch'.length));
            assert.ok(circuitConfig.wires.some(wire => wire.from.part === 'cp1' &&
                wire.from.terminal === `P${port}.${terminal - 1}` && wire.to.part === id));
            circuit.setControl(id, Number(!(value & (1 << (terminal - 1)))));
        }
    };
    const keypad = key => {
        machine.setKey(key, true);
        advance(100);
        machine.setKey(key, false);
        advance(100);
    };
    const digits = () => machine.getDisplay().digits;
    const pc = () => {
        const frame = digits();
        assert.equal(frame[0], 0x73, `Expected a P frame: ${frame}`);
        return displayNumber(frame.slice(3));
    };
    const verify = expectedState => {
        if (expectedState.pc !== undefined) assert.equal(pc(), expectedState.pc);
        for (const port of [2, 4, 5]) {
            const value = expectedState[`p${port}`];
            if (value !== undefined) assert.equal(machine.getPortState(port).latch, value, `P${port}`);
        }
        for (const [address, word] of Object.entries(expectedState.words ?? {})) {
            const {opcode, operand} = machine.readCell(Number(address));
            assert.deepEqual([opcode, operand], word, `cell ${address}`);
        }
        if (expectedState.accumulator) {
            keypad('ACC');
            const frame = digits();
            assert.equal(frame[0], 0x77, `Expected an A frame: ${frame}`);
            assert.deepEqual([displayNumber(frame.slice(1, 3)), displayNumber(frame.slice(3))], expectedState.accumulator);
            keypad('PC');
        }
    };

    advance(150);
    assert.equal(pc(), 0);
    for (const {address, opcode, operand} of program.words) machine.writeCell(address, opcode, operand);
    if (expected.p1 !== undefined) setInput(1, expected.p1);
    if (expected.p3 !== undefined) setInput(3, expected.p3);
    for (const key of [...String(config.entry).padStart(3, '0'), 'PC']) keypad(key);
    assert.equal(pc(), config.entry);

    let portChangeIntervalsMs;
    if (expected.mode === 'step') {
        const inputs = (expected.p1Reads ?? []).slice();
        for (let index = 0; index < expected.instructions; index++) {
            if (inputs.length && pc() === inputs[0].pc) setInput(1, inputs.shift().value);
            keypad('STEP');
            if (expected.checkpoints?.[index]) verify(expected.checkpoints[index]);
        }
        assert.equal(inputs.length, 0, 'all input samples must be exercised');
    } else if (expected.p2Writes) {
        const writes = [];
        const unsub = machine.addPortListener((port, state, tMs) => {
            if (port === 2 && state.latch !== (writes.at(-1)?.value ?? 255)) writes.push({value: state.latch, tMs});
        });
        keypad('RUN');
        const finalPc = [0x73, 0, 0x80, ...[...String(expected.pc).padStart(3, '0')].map(digit => glyphs[Number(digit)])];
        const deadline = (writes[0]?.tMs ?? machine.tMs) + expected.haltWithinMillisecondsOfFirstWrite;
        while (!digits().every((mask, index) => mask === finalPc[index]) && machine.tMs < deadline) advance(10);
        unsub();
        assert.deepEqual(writes.map(write => write.value), expected.p2Writes);
        portChangeIntervalsMs = writes.slice(1).map((write, index) => write.tMs - writes[index].tMs);
        const [lower, upper] = expected.edgeIntervalMilliseconds;
        for (const interval of portChangeIntervalsMs) {
            assert.ok(interval >= lower && interval <= upper, `port edge spacing ${interval} ms`);
        }
        assert.ok(machine.tMs - writes[0].tMs <= expected.haltWithinMillisecondsOfFirstWrite);
    } else {
        keypad('RUN');
        advance(350);
    }
    verify(expected);
    const ledAmps = circuit ? Object.fromEntries(circuitConfig.parts.filter(part => part.kind === 'led').map(({id}) => {
        const bit = Number(id.slice('led'.length));
        const current = -circuit.board.branchCurrent(id, 'anode');
        const high = Boolean(expected.p2 & (1 << bit));
        assert.ok(high ? current > 0.001 && current < 0.004 : Math.abs(current) < 1e-6, `${id} current ${current}`);
        return [id, current];
    })) : undefined;
    return {pc: expected.pc, portChangeIntervalsMs, ledAmps};
}

const runs = [];
for (const path of positionals) {
    const rom = new Uint8Array(readFileSync(path));
    const sha1 = createHash('sha1').update(rom).digest('hex');
    const exercises = [];
    for (const [name, config] of Object.entries(fixtures)) {
        const source = read(`examples/cp1-${name}/program.cp1`, 'utf8');
        const circuitConfig = workbench && JSON.parse(read(`examples/cp1-${name}/circuit.json`, 'utf8'));
        const program = assembleCp1Program(source, {expansion: config.requiresCp3});
        assert.equal(program.entry, config.entry, name);
        const cases = config.cases.map((expected, index) => {
            try {
                return verifyCase(rom, program, config, expected, circuitConfig);
            } catch (error) {
                throw new Error(`${sha1} ${name} case ${index + 1}: ${error.message}`, {cause: error});
            }
        });
        exercises.push({name, sourceSha256: createHash('sha256').update(source).digest('hex'), cases});
    }
    runs.push({romSha1: sha1, exercises});
}
const report = {format: 'brickwright.cp1-independent-examples', version: 1, electrical: workbench?.identity, runs};
if (options.report) writeFileSync(options.report, JSON.stringify(report, null, 2) + '\n');
for (const {romSha1, exercises} of runs) {
    console.log(`${romSha1}: ${exercises.length} examples, ${exercises.reduce((total, item) => total + item.cases.length, 0)} cases`);
}
