#!/usr/bin/env node
/**
 * Electrical proof for the exact CP5-style gallery circuit. The short original
 * 8049 stimulus exercises the hardware path; it does not interpret CP1 cells.
 * No historical firmware or GPL emulator is read by this script.
 *
 * node scripts/verify-cp1-cp5.mjs --board /path/to/bw-board --circuit-ui /path/to/bw-circuit-ui
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {injectEngine, registerSidecars} from './lib/engine-surface.mjs';

const CIRCUIT_URL = new URL('../examples/cp1-cp5-binary/circuit.json', import.meta.url);

function sourceIdentity(path) {
    const git = args => execFileSync('git', ['-C', path, ...args], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
    return {commit: git(['rev-parse', 'HEAD']), tree: git(['rev-parse', 'HEAD^{tree}']), dirty: git(['status', '--porcelain']).length > 0};
}

/** Root integration checks can reuse the same canonical loader with a user ROM. */
export async function loadWorkbench({board, circuitUi}) {
    if (!board || !circuitUi) throw new Error('Both --board and --circuit-ui source paths are required.');
    const paths = {board: resolve(board), cui: resolve(circuitUi)};
    const identity = {board: sourceIdentity(paths.board), circuitUi: sourceIdentity(paths.cui)};
    const {Circuit} = await injectEngine(paths);
    await registerSidecars(paths.cui);
    const {createCp1Adapter} = await import(pathToFileURL(join(paths.board, 'src/cp1-adapter.js')).href);
    const json = JSON.parse(readFileSync(CIRCUIT_URL, 'utf8'));
    return {Circuit, createCp1Adapter, json, identity};
}

export function setInputByte(circuit, value) {
    assert.ok(Number.isInteger(value) && value >= 0 && value <= 255);
    for (let bit = 0; bit < 8; bit++) circuit.setControl(`switch${bit + 1}`, (value & (1 << bit)) ? 0 : 1);
}

function nodeFor(board, part, terminal) {
    const net = board.getNets().find(item => item.terminals.some(t => t.part === part && t.terminal === terminal));
    assert.ok(net, `${part}.${terminal} must be electrically connected`);
    return net.id;
}

export function observeChannels(circuit) {
    const board = circuit.board;
    return Array.from({length: 8}, (_, bit) => {
        const n = bit + 1;
        return {
            channel: n,
            inputVolts: board.nodeVoltage(nodeFor(board, 'cp1', `P1.${bit}`)),
            outputVolts: board.nodeVoltage(nodeFor(board, 'cp1', `P2.${bit}`)),
            // Board terminal currents are positive leaving a component. Report
            // forward branch current entering the resistor/LED as positive.
            ledAmps: -board.branchCurrent(`led${n}`, 'anode'),
            resistorAmps: -board.branchCurrent(`series${n}`, 'a'),
            brightness: board.ledBrightnessNow(`led${n}`),
        };
    });
}

export function assertOutputByte(circuit, value) {
    const channels = observeChannels(circuit);
    for (const row of channels) {
        const high = Boolean(value & (1 << (row.channel - 1)));
        if (high) {
            assert.ok(row.outputVolts > 4.5, `channel ${row.channel}: output high (${row.outputVolts} V)`);
            assert.ok(row.resistorAmps > 0.001 && row.resistorAmps < 0.004,
                `channel ${row.channel}: current-limited on branch (${row.resistorAmps} A)`);
            assert.ok(row.ledAmps > 0.001, `channel ${row.channel}: actual LED current must flow`);
            assert.ok(row.brightness > 0.01, `channel ${row.channel}: the engine LED must light`);
        } else {
            assert.ok(row.outputVolts < 0.01, `channel ${row.channel}: output low (${row.outputVolts} V)`);
            assert.ok(Math.abs(row.resistorAmps) < 1e-6, `channel ${row.channel}: off branch current (${row.resistorAmps} A)`);
            assert.ok(Math.abs(row.ledAmps) < 1e-6, `channel ${row.channel}: off LED current (${row.ledAmps} A)`);
            // The nonlinear diode solve can retain subnormal leakage. A dark
            // branch must stay far below one millionth of full brightness.
            assert.ok(row.brightness < 1e-6, `channel ${row.channel}: the engine LED must be dark (${row.brightness})`);
        }
        assert.ok(Math.abs(row.ledAmps - row.resistorAmps) < 1e-6,
            `channel ${row.channel}: series resistor and LED carry the same current`);
    }
    assert.equal(circuit.board.transientAnalysisStatus().failure, null, 'the solver reports no failure');
    return channels;
}

function echoFirmware() {
    const rom = new Uint8Array(2048);
    rom.set([
        0x23, 0xaf, // MOV A,#AF: select base 8155 I/O, reset released
        0x3a,       // OUTL P2,A
        0xb8, 0x00, // MOV R0,#00: command register
        0x23, 0x0f, // MOV A,#0F: simple output mode on PA/PB/PC
        0x90,       // MOVX @R0,A
        0xb8, 0x02, // MOV R0,#02: external P2 is the base chip's PB
        0x23, 0xff, // MOV A,#FF
        0x90,       // MOVX @R0,A: deliberately light all eight branches
        0x39,       // OUTL P1,A: release all eight quasi-bidirectional inputs
        0x09,       // IN A,P1: obtain the actual solved switch byte
        0x90,       // MOVX @R0,A: copy it to the output peripheral
        0x04, 0x0e, // JMP 00E: repeat the input/output pair
    ]);
    return rom;
}

export async function verifyElectricalWorkbench(paths) {
    const {Circuit, createCp1Adapter, json, identity} = await loadWorkbench(paths);
    const circuit = Circuit.fromJSON(json);
    assert.equal(circuit.netlistError, null);
    assert.equal(circuit.wires.length, json.wires.length, 'canonical loading retains every authored wire');
    const adapter = createCp1Adapter({rom: echoFirmware(), partId: 'cp1'});
    adapter.attachBoard(circuit.board);

    // Stop exactly after the test program drives all outputs high. This tests
    // the electrical startup polarity, not a historical monitor's startup.
    let initSteps = 0;
    while (adapter.machine.getPortState(2).direction !== 'output' || adapter.machine.getPortState(2).latch !== 255) {
        assert.ok(initSteps++ < 32, 'synthetic initialization is bounded');
        adapter.step();
    }
    const highAtNs = adapter.timeNs().toString();
    const allHigh = assertOutputByte(circuit, 255);

    const patterns = [0, 255, 1, 2, 4, 8, 16, 32, 64, 128, 165, 90, 0, 255];
    const observations = [];
    for (const value of patterns) {
        setInputByte(circuit, value);
        adapter.advanceNs(100000);
        assert.equal(adapter.machine.getPortState(1).value, value, 'the CPU samples the real eight-bit circuit input');
        assert.equal(adapter.machine.getPortState(2).latch, value, 'the 8155 output was written by the CPU');
        const channels = assertOutputByte(circuit, value);
        for (const row of channels) {
            const high = Boolean(value & (1 << (row.channel - 1)));
            assert.ok(high ? row.inputVolts > 4.5 : row.inputVolts < 0.01,
                `channel ${row.channel}: ${high ? 'open switch is high' : 'closed switch is low'}`);
        }
        assert.equal(circuit.board.timeNs, adapter.timeNs(), 'one clock owns the electrical path');
        observations.push({input: value, output: adapter.machine.getPortState(2).latch, atNs: adapter.timeNs().toString()});
    }

    setInputByte(circuit, 165);
    adapter.advanceNs(100000);
    const pausedCycles = adapter.machine.cycles;
    const pausedTime = adapter.timeNs();
    setInputByte(circuit, 164);
    assert.ok(observeChannels(circuit)[0].inputVolts < 0.01, 'a changed switch changes its real input while paused');
    assert.equal(adapter.machine.cycles, pausedCycles, 'switch control does not execute firmware');
    assert.equal(adapter.timeNs(), pausedTime);
    assert.equal(adapter.machine.getPortState(2).latch, 165);
    assertOutputByte(circuit, 165);
    adapter.advanceNs(100000);
    assert.equal(adapter.machine.getPortState(2).latch, 164);
    assertOutputByte(circuit, 164);

    // The saved circuit starts with closed switches; its connectivity and
    // authored parameter state must survive the same round trip as the GUI.
    const restored = Circuit.fromJSON(JSON.parse(JSON.stringify(Circuit.fromJSON(json).toJSON())));
    assert.equal(restored.wires.length, json.wires.length);
    assert.equal(restored.parts.filter(part => part.kind === 'switch' && part.params.closed === 1).length, 8);
    const restoredAdapter = createCp1Adapter({rom: echoFirmware(), partId: 'cp1'});
    restoredAdapter.attachBoard(restored.board);
    setInputByte(restored, 165);
    restoredAdapter.advanceNs(100000);
    assert.equal(restoredAdapter.machine.getPortState(2).latch, 165);
    assertOutputByte(restored, 165);

    return {
        ok: true, scope: 'original synthetic 8049 firmware and actual CP5-style circuit; no historical-ROM qualification',
        identity, parts: json.parts.length, wires: json.wires.length,
        syntheticAllHighAtNs: highAtNs,
        allHighCurrentsAmps: allHigh.map(row => row.ledAmps),
        patterns: observations,
        pauseHoldsOutput: true, editableCircuitRoundTrip: true,
    };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    const args = process.argv.slice(2), options = {};
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i] === '--board' ? 'board' : args[i] === '--circuit-ui' ? 'circuitUi' : null;
        if (!key || !args[i + 1] || options[key]) throw new Error('Usage: verify-cp1-cp5.mjs --board PATH --circuit-ui PATH');
        options[key] = args[i + 1];
    }
    console.log(JSON.stringify(await verifyElectricalWorkbench(options), null, 2));
}
