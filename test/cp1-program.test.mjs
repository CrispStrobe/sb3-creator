import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCp1Program, assembleCp1Program, exportCp1Program, CP1_MNEMONICS} from '../src/utils/cp1Program.js';
import {CP1_EXAMPLES} from '../src/utils/examples.js';

const bytesAt = (result, start, count) => [...result.bytes.slice(start * 2, (start + count) * 2)];
const errors = (source, options) => {
    const result = parseCp1Program(source, options);
    assert.equal(result.ok, false, source);
    assert.equal(result.bytes, null, 'a rejected program must never expose a runnable partial image');
    assert.ok(result.diagnostics.every(d => d.line > 0 && d.column > 0 && d.message));
    return result.diagnostics;
};

test('decimal cells are opcode-first bytes, never floats or packed decimal values', () => {
    const result = assembleCp1Program('000: 04.001\n001 02.000\n002: 01.000\n');
    assert.equal(result.capacity, 128);
    assert.equal(result.bytes.length, 256);
    assert.deepEqual(bytesAt(result, 0, 4), [4, 1, 2, 0, 1, 0, 0, 0]);
    assert.deepEqual(result.words.map(w => w.address), [0, 1, 2]);
    assert.equal(result.sourceMap[1].line, 2);
    assert.equal(result.sourceMap[3], null);
});

test('labels, forward EQU, ORG, comma DATA and decimal expressions share cell addressing', () => {
    const result = assembleCp1Program(`
        DELAY EQU LATER + 1
        ORG 10
    start: AKO DELAY
        ABS slot
        SPU start
        ORG 20
    slot: DB 0, 17, DELAY - 1
        LATER EQU 24
    `);
    assert.deepEqual(bytesAt(result, 10, 3), [4, 25, 6, 20, 9, 10]);
    assert.deepEqual(bytesAt(result, 20, 3), [0, 0, 0, 17, 0, 24]);
    assert.equal(result.symbols.START, 10);
    assert.equal(result.symbols.SLOT, 20);
    assert.equal(result.symbols.DELAY, 25);
    assert.equal(result.sourceMap[11].line, 5);
    assert.equal(result.entry, 10);
});

test('base and CP3 bounds apply to cell allocation, memory references and extra ports', () => {
    const base = assembleCp1Program('ORG 127\nDATA 255');
    assert.deepEqual(bytesAt(base, 127, 1), [0, 255]);
    for (const source of ['ORG 128\nDATA 0', 'ORG 127\nDB 1,2', 'LDA 128', 'P3E 1']) {
        errors(source);
    }
    const expanded = assembleCp1Program('LDA 255\nP3E 8\nP4A 8\nP5A 6\nORG 255\nDATA 255', {expansion: true});
    assert.equal(expanded.bytes.length, 512);
    assert.deepEqual(bytesAt(expanded, 0, 4), [5, 255, 22, 8, 23, 8, 24, 6]);
    assert.deepEqual(bytesAt(expanded, 255, 1), [0, 255]);
    errors('ORG 256\nDATA 0', {expansion: true});
});

test('all documented command numbers have a stable assembly spelling', () => {
    assert.deepEqual(CP1_MNEMONICS, ['DATA', 'HLT', 'ANZ', 'VZG', 'AKO', 'LDA', 'ABS', 'ADD', 'SUB',
        'SPU', 'VGL', 'SPB', 'VGR', 'VKL', 'NEG', 'UND', 'P1E', 'P1A', 'P2A', 'LIA', 'AIS', 'SIU', 'P3E', 'P4A', 'P5A']);
    const result = assembleCp1Program(CP1_MNEMONICS.map(name => `${name} 0`).join('\n'), {expansion: true});
    assert.deepEqual(result.words.map(w => w.opcode), Array.from({length: 25}, (_, i) => i));
});

test('bad ranges, missing values and unknown input produce located diagnostics', () => {
    for (const source of ['AKO 256', 'VZG -1', 'DATA 256', 'DATA', 'AKO', 'P1E 9', 'P2A -1', 'P5A 7',
        'HLT 1', '25.000', 'ADD absent', 'dance 3', 'AKO 4.001', 'AKO 1 2', 'DATA 1,', 'AKO NaN',
        'AKO Infinity', 'ORG 0;\nAKO 999999999999999999999999999999999']) {
        errors(source, {expansion: true});
    }
    const issue = errors('; comment\n\n  AKO 256')[0];
    assert.equal(issue.line, 3);
    assert.equal(issue.column, 3);
    assert.equal(issue.code, 'operand-range');
});

test('case-insensitive symbols, duplicate addresses and circular definitions cannot silently overwrite', () => {
    assert.equal(errors('foo: DATA 1\nFOO: DATA 2')[0].code, 'duplicate-symbol');
    assert.equal(errors('a EQU 1\na EQU 2')[0].code, 'duplicate-symbol');
    assert.equal(errors('AKO EQU 1')[0].code, 'reserved-symbol');
    assert.ok(errors('ORG 1\nDATA 1\nORG 1\nDATA 2').some(d => d.code === 'duplicate-address'));
    assert.ok(errors('a EQU b\nb EQU a\nAKO a').some(d => d.code === 'cyclic-symbol'));
    assert.ok(errors('ORG later\nlater: DATA 1').some(d => d.code === 'unresolved-origin'));
});

test('comments, CRLF, BOM and labels do not change source locations or output', () => {
    const result = assembleCp1Program('\uFEFF; note\r\n x: ako 7 // comment\r\n anz # comment\r\n hlt\r\n');
    assert.deepEqual(bytesAt(result, 0, 3), [4, 7, 2, 0, 1, 0]);
    assert.equal(result.sourceMap[0].line, 2);
    assert.equal(result.symbols.X, 0);
});

test('listing round trips preserve sparse addresses and byte images exactly', () => {
    const original = assembleCp1Program('ORG 6\nAKO 1\nANZ\nHLT\nORG 77\nDATA 123');
    const listed = exportCp1Program(original);
    assert.match(listed, /^006: 04\.001\n/);
    const restored = assembleCp1Program(listed);
    assert.deepEqual(restored.bytes, original.bytes);
    assert.deepEqual(restored.words.map(w => w.address), [6, 7, 8, 77]);
    assert.deepEqual(assembleCp1Program(exportCp1Program(original.bytes)).bytes, original.bytes);
    assert.equal(exportCp1Program(assembleCp1Program('')), '');
});

test('source size, expression depth and non-text inputs are bounded without executing input', () => {
    errors('x'.repeat(256 * 1024 + 1));
    errors('\n'.repeat(8192));
    errors(null);
    errors('AKO globalThis.process.exit(1)');
    const chain = Array.from({length: 150}, (_, i) => `v${i} EQU ${i === 149 ? '1' : `v${i + 1}`}`).join('\n');
    assert.ok(errors(`${chain}\nAKO v0`).some(d => d.code === 'symbol-depth'));
    assert.throws(() => parseCp1Program('', {expansion: 'false'}), TypeError);
    assert.throws(() => assembleCp1Program('AKO 256'), error => error instanceof SyntaxError && error.diagnostics.length === 1);
    assert.throws(() => exportCp1Program(new Uint8Array(3)), RangeError);
});

test('three original examples assemble and retain the documented blink cell sequence', () => {
    for (const name of ['cp1-first-display', 'cp1-switch-input', 'cp1-blink']) {
        const source = readFileSync(new URL(`../examples/${name}/program.cp1`, import.meta.url), 'utf8');
        assert.equal(assembleCp1Program(source).ok, true, name);
        assert.equal(CP1_EXAMPLES[name], source, 'named CP1 examples retain the canonical source');
    }
    const blink = assembleCp1Program(readFileSync(new URL('../examples/cp1-blink/program.cp1', import.meta.url), 'utf8'));
    assert.deepEqual(bytesAt(blink, 0, 7), [4, 1, 18, 1, 3, 200, 4, 0, 18, 1, 3, 200, 9, 0]);
    const display = assembleCp1Program(CP1_EXAMPLES['cp1-first-display']);
    assert.deepEqual(bytesAt(display, 0, 3), [4, 42, 2, 0, 9, 1], 'repeat ANZ so the monitor halt message does not replace the value');
});

test('CP1 gallery entries link the actual sources and declared machine terminals without a ROM', () => {
    const index = JSON.parse(readFileSync(new URL('../examples/index.json', import.meta.url), 'utf8'));
    for (const name of Object.keys(CP1_EXAMPLES)) {
        const entry = index.find(item => item.id === name);
        assert.ok(entry, `${name} is reachable from the gallery`);
        assert.equal(entry.kind, 'circuit');
        assert.equal(entry.target, 'kosmos-cp1');
        assert.equal(entry.files.cp1, `${name}/program.cp1`);
        assert.equal(entry.files.rom, undefined, 'ROM remains a user import');
        for (const file of Object.values(entry.files)) readFileSync(new URL(`../examples/${file}`, import.meta.url));
        const circuit = JSON.parse(readFileSync(new URL(`../examples/${entry.files.circuit}`, import.meta.url), 'utf8'));
        const machine = circuit.parts.find(part => part.kind === 'kosmos-cp1');
        assert.ok(machine);
        assert.equal(machine.params.expansion, false);
        assert.equal(machine.params.clockHz, 6000000);
        assert.equal(circuit.parts.some(part => part.kind === 'vsource'), false, 'examples use the CP1 connector supply');
        if (name === 'cp1-blink') assert.ok(circuit.wires.some(wire => wire.from.part === 'cp1' && wire.from.terminal === 'P2.0'));
        if (name === 'cp1-switch-input') assert.ok(circuit.wires.some(wire => wire.to.part === 'cp1' && wire.to.terminal === 'P1.0'));
    }
});
