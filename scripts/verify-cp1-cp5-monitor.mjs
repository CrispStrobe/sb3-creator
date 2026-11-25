#!/usr/bin/env node
/**
 * Run the original gallery program through an explicitly supplied historical
 * 2716 monitor and the real electrical circuit. Firmware stays an external
 * test input; this script neither downloads nor emits ROM bytes or emulator
 * reference code. The reusable loader and current checks are the same ones
 * used by the synthetic electrical proof.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {parseArgs} from 'node:util';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadWorkbench, setInputByte, assertOutputByte} from './verify-cp1-cp5.mjs';
import {assembleCp1Program} from '../src/utils/cp1Program.js';

const MONITOR_SHA1 = 'ff4befcf82a664950186d3af1843fdef70d2209f';
const SEGMENTS = [0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f];
const sha256 = value => createHash('sha256').update(value).digest('hex');

export async function verifyCp5Monitor({board, circuitUi, romPath}) {
    if (!romPath) throw new Error('An external --rom file is required.');
    const rom = new Uint8Array(readFileSync(romPath));
    assert.equal(rom.length, 2048, 'the monitor is exactly 2048 bytes');
    const romSha1 = createHash('sha1').update(rom).digest('hex');
    assert.equal(romSha1, MONITOR_SHA1, 'this observation gate is qualified for the identified 2716 monitor only');

    const {Circuit, createCp1Adapter, json, identity} = await loadWorkbench({board, circuitUi});
    const circuit = Circuit.fromJSON(json);
    const adapter = createCp1Adapter({rom, partId: 'cp1'});
    adapter.attachBoard(circuit.board);
    const machine = adapter.machine;
    const advance = ms => {
        for (let left = ms; left > 0; left -= 50) adapter.advanceNs(Math.min(left, 50) * 1e6);
    };
    const pressKey = name => {
        machine.setKey(name, true); advance(100);
        machine.setKey(name, false); advance(100);
    };
    const assertDisplay = value => {
        const decimal = String(value).padStart(3, '0');
        const expected = [0x77, 0x3f, 0xbf, ...[...decimal].map(digit => SEGMENTS[Number(digit)])];
        assert.deepEqual(machine.getDisplay().digits, expected, `the running firmware displays A00.${decimal}`);
        return expected;
    };

    advance(2000);
    assert.equal(machine.getPortState(2).latch, 255, 'monitor startup drives every output high');
    const startup = assertOutputByte(circuit, 255);
    const source = readFileSync(new URL('../examples/cp1-cp5-binary/program.cp1', import.meta.url), 'utf8');
    const assembly = assembleCp1Program(source);
    // All operations are explicitly advanced. Loading now represents the
    // documented paused-CPU load, after startup and without another reset.
    machine.loadProgram(assembly.words, {clear: true});

    // Leave the inputs high so the explicit initial zero and subsequent sample
    // are distinguishable output edges; a mere always-zero loop cannot pass.
    setInputByte(circuit, 255);
    const startupEdges = [];
    let lastLatch = 255;
    const removeListener = machine.addPortListener((port, state, tMs) => {
        if (port === 2 && state.latch !== lastLatch) {
            startupEdges.push({value: state.latch, tMs});
            lastLatch = state.latch;
        }
    });
    for (const key of ['0', '0', '0', 'PC', 'RUN']) pressKey(key);
    advance(300);
    removeListener();
    assert.deepEqual(startupEdges.map(edge => edge.value), [0, 255], 'the program clears the outputs before sampling the high inputs');
    const clearIntervalMs = startupEdges[1].tMs - startupEdges[0].tMs;
    assert.ok(clearIntervalMs >= 200, 'the initial output clear includes the requested 200 ms wait');
    assertOutputByte(circuit, 255);
    assertDisplay(255);

    const patterns = [];
    for (const value of [0, 255, 1, 2, 4, 8, 16, 32, 64, 128, 165, 90, 0]) {
        setInputByte(circuit, value);
        advance(200);
        assert.equal(machine.getPortState(1).value, value, 'firmware reads the real switch byte');
        assert.equal(machine.getPortState(2).latch, value, 'firmware writes the corresponding output byte');
        assert.deepEqual(machine.readCell(32), {opcode: 0, operand: value}, 'ABS records the same byte at cell 32');
        const channels = assertOutputByte(circuit, value);
        patterns.push({input: value, output: value, stored: machine.readCell(32),
            display: assertDisplay(value), tMs: machine.tMs, ledAmps: channels.map(row => row.ledAmps)});
    }

    setInputByte(circuit, 165); advance(200);
    const beforePause = machine.cycles;
    setInputByte(circuit, 164);
    assert.equal(machine.cycles, beforePause, 'a live input control does not execute CPU instructions');
    assert.equal(machine.getPortState(2).latch, 165);
    assertOutputByte(circuit, 165);
    advance(200);
    assert.equal(machine.getPortState(2).latch, 164);
    assert.deepEqual(machine.readCell(32), {opcode: 0, operand: 164});
    assertOutputByte(circuit, 164);
    assertDisplay(164);

    return {
        format: 'brickwright.cp1-cp5-monitor-observation', version: 1, ok: true,
        romSha1, identity,
        programSha256: sha256(source),
        circuitSha256: sha256(readFileSync(new URL('../examples/cp1-cp5-binary/circuit.json', import.meta.url))),
        checkerSha256: sha256(readFileSync(new URL(import.meta.url))),
        startup: {output: 255, allEightLedAmps: startup.map(row => row.ledAmps)},
        programInitialization: {edges: startupEdges, clearIntervalMs},
        patterns, pauseHoldsOutput: true,
        limits: [
            'Measured emulator/circuit behavior, not physical CP5 power characteristics',
            'Only the identified 2716 monitor is qualified by this gate',
            'No external emulator source or historical binary is included',
        ],
    };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    const {values} = parseArgs({options: {
        board: {type: 'string'}, 'circuit-ui': {type: 'string'}, rom: {type: 'string'}, report: {type: 'string'},
    }});
    const report = await verifyCp5Monitor({board: values.board, circuitUi: values['circuit-ui'], romPath: values.rom});
    if (values.report) writeFileSync(values.report, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
}
