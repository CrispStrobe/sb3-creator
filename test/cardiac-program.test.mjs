import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assembleCardiac, exportCardiacListing, parseCardiacDeck, formatCardiacDeck,
    formatCardiacWord, CARDIAC_MNEMONICS, CARDIAC_SOURCE_LIMITS} from '../src/utils/cardiacProgram.js';
import {CARDIAC_EXAMPLES} from '../src/utils/cardiacExamples.js';
import {isRetargetableExample} from '../scripts/lib/authored-transform.mjs';

const cells = result => result.words.map(({address, value}) => ({address, value}));
const reject = source => {
    const result = assembleCardiac(source);
    assert.equal(result.ok, false, String(source));
    assert.deepEqual(result.words, [], 'invalid source never supplies a runnable partial program');
    assert.deepEqual(result.listing, [], 'invalid source never supplies a partially accepted listing');
    assert.equal(result.entry, null);
    assert.ok(result.diagnostics.some(item => item.severity === 'error'));
    assert.ok(result.diagnostics.every(item => item.line > 0 && item.column > 0 && item.message));
    return result.diagnostics;
};

test('all ten mnemonics encode decimal words and preserve source locations', () => {
    assert.deepEqual(CARDIAC_MNEMONICS, ['INP', 'CLA', 'ADD', 'TAC', 'SFT', 'OUT', 'STO', 'SUB', 'JMP', 'HRS']);
    const result = assembleCardiac(CARDIAC_MNEMONICS.map(name => `  ${name.toLowerCase()} 42`).join('\n'));
    assert.equal(result.ok, true);
    assert.equal(result.entry, 1, 'default origin leaves fixed word 00 alone');
    assert.deepEqual(result.words.map(word => word.value), [42, 142, 242, 342, 442, 542, 642, 742, 842, 942]);
    assert.deepEqual(result.words[3], {address: 4, value: 342, line: 4, column: 3});
    assert.equal(result.listing[0].word, '042');
    assert.equal(result.listing[0].source, '  inp 42');
    assert.equal(assembleCardiac('HRS').words[0].value, 900);
});

test('forward labels, sparse origins and ENTRY resolve independently of sorted memory', () => {
    const result = assembleCardiac(`ENTRY start
ORG 80
numbers: DAT -12, 42
ORG 10
start: INP numbers
       CLA numbers + 1
       TAC finish
       JMP start
finish: HRS start
`);
    assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
    assert.equal(result.entry, 10);
    assert.deepEqual(result.symbols, {NUMBERS: 80, START: 10, FINISH: 14});
    assert.deepEqual(cells(result), [{address: 10, value: 80}, {address: 11, value: 181},
        {address: 12, value: 314}, {address: 13, value: 810}, {address: 14, value: 910},
        {address: 80, value: -12}, {address: 81, value: 42}]);
    const withoutEntry = assembleCardiac('ORG 30\nHRS\nORG 10\nHRS');
    assert.equal(withoutEntry.entry, 30, 'default entry follows first source instruction, not lowest sorted address');
});

test('numeric listings accept signed words, explicit addresses and comment styles', () => {
    const result = assembleCardiac('\uFEFF; original\r\n ENTRY 10\r\n10: 080 // input\r\n11 580 # output\r\n12: 900\r\n80: -007\r\n');
    assert.equal(result.ok, true);
    assert.deepEqual(cells(result), [{address: 10, value: 80}, {address: 11, value: 580},
        {address: 12, value: 900}, {address: 80, value: -7}]);
    assert.equal(result.listing[0].line, 3);
    assert.equal(result.listing[3].word, '-007');
    assert.equal(result.listing[3].mnemonic, 'DAT');
});

test('fixed cell 00 is enforced and return cell 99 is a non-blocking warning', () => {
    const allowed = assembleCardiac('ENTRY 00\n00: 001\n99: DAT -7');
    assert.equal(allowed.ok, true);
    assert.equal(allowed.entry, 0);
    assert.equal(allowed.diagnostics[0].severity, 'warning');
    assert.equal(allowed.diagnostics[0].code, 'jump-return-cell');
    assert.ok(reject('00: 002').some(item => item.code === 'fixed-zero-cell'));
    const fixedWrite = assembleCardiac('INP 00\nSTO 00');
    assert.equal(fixedWrite.ok, true);
    assert.deepEqual(fixedWrite.diagnostics.map(item => item.code), ['fixed-zero-target', 'fixed-zero-target']);
});

test('labels and allocations cannot silently overwrite one another', () => {
    for (const source of ['x: DAT 1\nX: DAT 2', 'INP: DAT 1', 'ORG: DAT 1',
        'ORG 10\nDAT 1,2\n11: 003', 'ORG 99\nDAT 1,2']) reject(source);
    assert.ok(reject('ORG 20\nDAT 1\nORG 20\nDAT 2').some(item => item.code === 'duplicate-address'));
    assert.ok(reject('ORG later\nlater: HRS').some(item => item.code === 'unresolved-origin'));
});

test('incomplete edits and invalid operands are located and rejected atomically', () => {
    for (const source of ['INP', 'CLA', 'TAC -1', 'STO 100', 'SFT 100', 'HRS 100',
        'DAT', 'DAT 1,', 'DAT -1000', '1000', 'ORG 100', 'ORG -1', 'ENTRY 100',
        'ENTRY absent', 'ENTRY 1\nENTRY 2', 'ADD missing', 'Dance 1', 'CLA 1.5',
        'CLA 0x10', 'CLA globalThis.process.exit(1)', 'CLA 1 2']) reject(source);
    const diagnostic = reject('; note\n\n  INP 100')[0];
    assert.equal(diagnostic.line, 3);
    assert.equal(diagnostic.column, 3);
    assert.equal(diagnostic.code, 'operand-range');
    reject('INP 80\nOUT 80\nHRS\nORG 80\nDAT 1000');
});

test('integer and source bounds reject unrepresentable input without coercion', () => {
    reject(null);
    reject({toString: () => 'HRS'});
    reject('DAT 99999999999999999999999999999999');
    reject('x'.repeat(CARDIAC_SOURCE_LIMITS.characters + 1));
    reject('\n'.repeat(CARDIAC_SOURCE_LIMITS.lines));
    assert.equal(assembleCardiac('DAT -999,999,-0').ok, true);
    assert.equal(Object.is(assembleCardiac('DAT -0').words[0].value, -0), false);
});

test('data-only and empty sources do not invent an instruction entry', () => {
    for (const source of ['', '; unfinished work\n', 'ORG 80\nDAT 7,-8']) {
        const result = assembleCardiac(source);
        assert.equal(result.ok, true);
        assert.equal(result.entry, null);
    }
    const manualEntry = assembleCardiac('ENTRY 80\nORG 80\nDAT 900');
    assert.equal(manualEntry.ok, true);
    assert.equal(manualEntry.entry, 80);
});

test('addressed export restores exact cells and entry, including data-only sources', () => {
    for (const source of ['ORG 20\nHRS\nORG 5\nDAT -123', 'ORG 90\nDAT 123,-999',
        'ENTRY 00\n00: 001', '', 'ENTRY 99']) {
        const original = assembleCardiac(source);
        const restored = assembleCardiac(exportCardiacListing(original));
        assert.equal(restored.ok, true);
        assert.deepEqual(cells(restored), cells(original));
        assert.equal(restored.entry, original.entry);
    }
    assert.throws(() => exportCardiacListing(assembleCardiac('CLA bad')), TypeError);
    assert.throws(() => exportCardiacListing({ok: true, entry: 1, words: [{address: 1, value: 2}, {address: 1, value: 3}]}), RangeError);
    assert.throws(() => exportCardiacListing({ok: true, entry: 0, words: [{address: 0, value: 2}]}), RangeError);
});

test('input strips are numeric values, separate from addressed program listings', () => {
    const parsed = parseCardiacDeck('\uFEFF+001, -042 999\r\n; note\r\n000 // end');
    assert.equal(parsed.ok, true);
    assert.deepEqual(parsed.values, [1, -42, 999, 0]);
    assert.equal(formatCardiacDeck(parsed.values), '001\n-042\n999\n000\n');
    assert.deepEqual(parseCardiacDeck(formatCardiacDeck(parsed.values)).values, parsed.values);
    assert.deepEqual(parseCardiacDeck('').values, []);
    for (const source of ['01: 080', '001\n1000\n002', '1.0', '0x10', 'NaN', null]) {
        const result = parseCardiacDeck(source);
        assert.equal(result.ok, false);
        assert.deepEqual(result.values, [], 'a rejected input strip never queues a partial prefix');
    }
    const invalid = parseCardiacDeck('001\n  -1000');
    assert.equal(invalid.diagnostics[0].line, 2);
    assert.equal(invalid.diagnostics[0].column, 3);
});

test('strip and formatting bounds are explicit', () => {
    assert.equal(formatCardiacWord(-7), '-007');
    assert.equal(formatCardiacWord(0), '000');
    assert.equal(formatCardiacWord(999), '999');
    for (const value of [1000, -1000, 1.5, '7', NaN, Infinity]) assert.throws(() => formatCardiacWord(value), RangeError);
    assert.equal(parseCardiacDeck('0 '.repeat(CARDIAC_SOURCE_LIMITS.deckValues + 1)).ok, false);
    assert.equal(parseCardiacDeck(' '.repeat(CARDIAC_SOURCE_LIMITS.characters + 1)).ok, false);
    assert.throws(() => formatCardiacDeck('001'), TypeError);
    assert.throws(() => formatCardiacDeck([1, 1000]), RangeError);
    assert.throws(() => formatCardiacDeck(Array(2)), RangeError, 'missing array entries must not disappear on export');
    assert.throws(() => formatCardiacDeck(Array(CARDIAC_SOURCE_LIMITS.deckValues + 1).fill(0)), RangeError);
});

test('six original examples agree with source files and survive numeric export', () => {
    assert.equal(Object.keys(CARDIAC_EXAMPLES).length, 6);
    for (const [id, example] of Object.entries(CARDIAC_EXAMPLES)) {
        const source = readFileSync(new URL(`../examples/${id}/program.cardiac`, import.meta.url), 'utf8');
        assert.equal(example.id, id);
        assert.equal(source, example.source);
        const result = assembleCardiac(source);
        assert.equal(result.ok, true, `${id}: ${JSON.stringify(result.diagnostics)}`);
        const restored = assembleCardiac(exportCardiacListing(result));
        assert.deepEqual(cells(restored), cells(result), id);
        assert.equal(restored.entry, result.entry, id);
        assert.deepEqual(parseCardiacDeck(formatCardiacDeck(example.input)).values, example.input);
        for (const language of ['en', 'de']) assert.ok(example.title[language] && example.description[language]);
    }
});

test('gallery entries name the real CARDIAC files and the capstone circuit contains the same assembled image', () => {
    const index = JSON.parse(readFileSync(new URL('../examples/index.json', import.meta.url), 'utf8'));
    const entries = index.filter(entry => entry.target === 'cardiac');
    assert.deepEqual(entries.map(entry => entry.id).sort(), Object.keys(CARDIAC_EXAMPLES).sort());
    for (const entry of entries) {
        assert.equal(entry.files.cardiac, `${entry.id}/program.cardiac`);
        assert.equal(entry.files.program, undefined, 'CARDIAC source is not disguised as generic pseudocode');
        assert.equal(isRetargetableExample({...entry, devices: ['arduino-uno', 'pico'], retarget: true}), false,
            'adding device metadata must not route CARDIAC source into the generic block compiler');
        for (const file of Object.values(entry.files)) readFileSync(new URL(`../examples/${file}`, import.meta.url));
        const deck = parseCardiacDeck(readFileSync(new URL(`../examples/${entry.files.deck}`, import.meta.url), 'utf8'));
        assert.deepEqual(deck.values, CARDIAC_EXAMPLES[entry.id].input);
    }
    const circuit = JSON.parse(readFileSync(new URL('../examples/cardiac-night-light/circuit.json', import.meta.url), 'utf8'));
    const machine = circuit.parts.find(part => part.kind === 'cardiac');
    const compiled = assembleCardiac(CARDIAC_EXAMPLES['cardiac-night-light'].source);
    assert.deepEqual(machine.params.program, {entry: compiled.entry, words: cells(compiled)});
    assert.equal(machine.params.inputSource, 'circuit');
    assert.ok(circuit.parts.some(part => part.kind === 'potentiometer'), 'the sensor stand-in exists');
    assert.ok(circuit.parts.some(part => part.kind === 'resistor'), 'LED current has a resistor');
    assert.ok(circuit.parts.some(part => part.kind === 'led'), 'the output device exists');
});

test('capstone decisions are stored before OUT and the bootstrap starts from fixed 001 alone', () => {
    const light = assembleCardiac(CARDIAC_EXAMPLES['cardiac-night-light'].source);
    // The code section is everything below the data section, which the source
    // opens with `ORG 80` / `sample:` — read the boundary from the assembler.
    assert.equal(light.symbols.SAMPLE, 80, 'the data section opens at the ORG the source declares');
    assert.deepEqual(light.words.filter(word => word.address < light.symbols.SAMPLE).map(word => word.value),
        [80, 180, 781, 309, 183, 684, 584, 801, 182, 684, 584, 801]);
    assert.equal(light.symbols.THRESHOLD, 81);
    assert.deepEqual(CARDIAC_EXAMPLES['cardiac-night-light'].expectedOutput, [1, 0, 0, 1]);
    const bootstrap = assembleCardiac(CARDIAC_EXAMPLES['cardiac-bootstrap'].source);
    assert.equal(bootstrap.entry, 0);
    assert.deepEqual(cells(bootstrap), [{address: 0, value: 1}]);
    assert.deepEqual(CARDIAC_EXAMPLES['cardiac-bootstrap'].input,
        [2, 800, 20, 80, 21, 180, 22, 281, 23, 680, 24, 580, 25, 900, 81, 7, 820, 35]);
});
