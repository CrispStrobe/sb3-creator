import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {corpusFloor} from './helpers/corpus-floor.mjs';
import {requireSiblings, siblingGuardTest} from './helpers/siblings.mjs';

const example = path.resolve(import.meta.dirname, '../examples/blinkenrocket-pendant');
const read = name => readFileSync(path.join(example, name), 'utf8');
const exampleEntries = readdirSync(example, {recursive: true}).map(String);
const gate = requireSiblings('bw-circuit-ui');
siblingGuardTest(gate, 'the Blinkenrocket circuit package boundary');
const {wireEndpoint} = gate.skip ? {} : await import(new URL(
    'src/model/wire-endpoints.js', pathToFileURL(`${gate.paths['bw-circuit-ui']}/`)).href);

corpusFloor('Blinkenrocket example files checked for forbidden firmware artefacts',
    () => exampleEntries.length, 15,
    'MEASURED 2026-09-27: 17 files after three invalid retarget benches were removed.');

const connected = (circuit, a, at, b, bt) => circuit.wires.some(wire => {
    const from = wireEndpoint(wire, 'from');
    const to = wireEndpoint(wire, 'to');
    return (from?.part === a && from?.terminal === at && to?.part === b && to?.terminal === bt) ||
        (from?.part === b && from?.terminal === bt && to?.part === a && to?.terminal === at);
});

test('Blinkenrocket models the real QFN package, EEPROM and audio input', {skip: gate.skip}, () => {
    const circuit = JSON.parse(read('circuit.json'));
    const parts = new Map(circuit.parts.map(part => [part.id, part]));

    assert.equal(parts.get('attiny881')?.kind, 'attiny88_qfn32');
    assert.equal(parts.get('eeprom')?.kind, 'at24c64');
    assert.equal(parts.get('modemIn')?.kind, 'vsource');
    assert.equal(parts.get('modemIn')?.params?.wave, 'pcm');
    assert.equal(parts.has('bb1'), false, 'a QFN/TQFP device must not be seated in a DIP breadboard');
    assert.deepEqual(circuit.holeWires, []);

    assert.ok(connected(circuit, 'modemIn', 'pos', 'attiny881', 'pa0'));
    assert.ok(connected(circuit, 'attiny881', 'pc4', 'eeprom', 'sda'));
    assert.ok(connected(circuit, 'attiny881', 'pc5', 'eeprom', 'scl'));
    for (const terminal of ['a0', 'a1', 'a2', 'wp', 'gnd']) {
        assert.ok(connected(circuit, 'gnd1', 'gnd', 'eeprom', terminal),
            `EEPROM ${terminal} is strapped low`);
    }
});

test('Blinkenrocket GPL firmware stays external and the example states its licence', () => {
    const forbidden = /\.(?:hex|elf|eep|bin|o|a|c|cc|cpp|h)$/i;
    const artefacts = exampleEntries.filter(name => forbidden.test(name));
    assert.deepEqual(artefacts, [], `firmware/source artefacts in example: ${artefacts.join(', ')}`);
    assert.match(read('program.bw'), /^# SPDX-License-Identifier: BSD-3-Clause\n/);
    assert.match(read('PROVENANCE.md'), /does \*\*not\*\* contain or bundle the GPL-licensed Blinkenrocket/);
    assert.match(read('PROVENANCE.md'), /not as a formally supervised “clean-room” rewrite/);
});
