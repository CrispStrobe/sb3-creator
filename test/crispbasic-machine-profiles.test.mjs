import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import basicToPseudocode from '../src/utils/basicToPseudocode.js';
import {crispBasicLogicalPin, hasCrispBasicPinMap} from '../src/utils/crispBasicMode.js';

const portable = {profile: 'bbc', mode: 'crispbasic', lineNumbers: false};
function generate(source) {
    const creator = new SB3Creator(); creator.parse(source);
    assert.deepEqual(creator.warnings, []);
    return creator.generateBASIC(undefined, portable);
}

const pybadgePins = [
    ...[2, 3, 5, 6, 9, 10, 11, 12, 13].map(pin => [`D${pin}`, pin]),
    ...Array.from({length: 6}, (_, index) => [`A${index}`, 14 + index])
];

for (const [terminal, pin] of pybadgePins) {
    test(`PyBadge ${terminal} retains logical ${pin} through the portable round trip`, () => {
        assert.equal(crispBasicLogicalPin('PYBADGE', terminal.toLowerCase()), pin);
        const source = `DEVICE PYBADGE\nPIN signal = ${terminal} OUTPUT\nWHEN flag clicked:\n  set signal high\n  toggle signal\n  wait 0.001 seconds\n  print read signal`;
        const generated = generate(source);
        assert.equal(generated.ok, true, JSON.stringify(generated));
        assert.ok(generated.basic.includes(`PROCpinMode(${pin},"output")`));
        assert.ok(generated.basic.includes(`PROCdigitalWrite(${pin},1)`));
        assert.ok(generated.basic.includes(`PROCdigitalToggle(${pin})`));
        const read = basicToPseudocode(generated.basic, {mode: 'crispbasic'});
        assert.equal(read.ok, true, JSON.stringify(read));
        const round = generate(read.pseudocode);
        assert.equal(round.ok, true, JSON.stringify(round));
        assert.ok(round.basic.includes(`PROCpinMode(${pin},"output")`));
        assert.ok(round.basic.includes(`FNdigitalRead(${pin})`));
    });
}

for (const terminal of ['SDA', 'SCL', 'STEMMA_SDA', 'STEMMA_SCL', 'D0', 'D1', 'D4', 'D7', 'D8', 'D14', 'A6', 'A7', 'A8', 'A9', 'D02', 'A00', 'RX', 'TX', 'FREE', 'MISO', 'MOSI', 'SCK']) {
    test(`PyBadge portable source refuses unqualified/alias terminal ${terminal}`, () => {
        assert.equal(crispBasicLogicalPin('pybadge', terminal), null);
        const source = `REM @bw device pybadge\nREM @bw pin signal ${terminal} output\nPROCpinMode(0,"output")\nPROCdigitalWrite(0,1)\nEND`;
        const read = basicToPseudocode(source, {mode: 'crispbasic'});
        assert.equal(read.ok, false);
        assert.equal(read.pseudocode, '');
    });
}

test('PyBadge LC virtual GPIO does not inherit the physical PyBadge profile', () => {
    assert.equal(hasCrispBasicPinMap('pybadge-lc'), false);
    const result = generate('DEVICE PYBADGE-LC\nPIN signal = D2 OUTPUT\nWHEN flag clicked:\n  set signal high');
    assert.equal(result.ok, false);
    assert.ok(result.diagnostics.some(item => item.code === 'crispbasic-device'));
});

for (const [terminal, pin] of [['P4.1', 33], ['P4.2', 34], ['P4.4', 36], ['P4.5', 37], ['P5.4', 44], ['P5.5', 45]]) {
    test(`STC15F2K60S2 additional package pad ${terminal} keeps logical ${pin}`, () => {
        const generated = generate(`DEVICE STC15F2K60S2\nPIN signal = ${terminal} OUTPUT\nWHEN flag clicked:\n  toggle signal`);
        assert.equal(generated.ok, true, JSON.stringify(generated));
        assert.ok(generated.basic.includes(`PROCpinMode(${pin},"output")`));
        const read = basicToPseudocode(generated.basic, {mode: 'crispbasic'});
        assert.equal(read.ok, true, JSON.stringify(read));
        assert.ok(generate(read.pseudocode).basic.includes(`PROCdigitalToggle(${pin})`));
    });
}
