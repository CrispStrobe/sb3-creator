// `!=` is dialect syntax for Scratch's native `not (a = b)` graph. Keep the
// repair at the parser boundary: a harness rewrite would leave retargeting and
// every generated language free to run the silently corrupted left operand.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const program = condition => [
    'DEVICE ARDUINO-UNO',
    'CLOCK 16000000',
    '',
    'SPRITE Cat:',
    '  WHEN flag clicked:',
    `    IF ${condition} THEN:`,
    '      set answer to 1'
].join('\n');

const parsed = condition => {
    const creator = new SB3Creator();
    creator.parse(program(condition));
    assert.deepEqual(creator.warnings, []);
    const target = creator.project.targets.find(item => item.name === 'Cat');
    return {creator, blocks: target.blocks};
};

const conditionRoot = blocks => {
    const control = Object.values(blocks).find(block => block.opcode === 'control_if');
    assert.ok(control, 'condition fixture did not produce control_if');
    return blocks[control.inputs.CONDITION[1]];
};

for (const spelling of ['a!=b', 'a != b']) {
    test(`not-equal ${spelling} is the native not(equals) graph and canonical round-trip`, () => {
        const {creator, blocks} = parsed(spelling);
        const not = conditionRoot(blocks);
        assert.equal(not.opcode, 'operator_not');
        const equals = blocks[not.inputs.OPERAND[1]];
        assert.equal(equals.opcode, 'operator_equals');
        assert.equal(equals.inputs.OPERAND1[1][1], 'a');
        assert.equal(equals.inputs.OPERAND2[1][1], 'b');
        const canonical = creator.decompile();
        assert.match(canonical, /^    IF not \(a = b\) THEN:$/m);
        const again = new SB3Creator();
        again.parse(canonical);
        assert.equal(again.decompile(), canonical);
    });
}

test('operator-looking text inside quotes is an operand, not a comparison token', () => {
    const {blocks} = parsed('"a!=b!" = label');
    const equals = conditionRoot(blocks);
    assert.equal(equals.opcode, 'operator_equals');
    assert.equal(equals.inputs.OPERAND1[1][1], 'a!=b!');
    assert.equal(equals.inputs.OPERAND2[1][1], 'label');
});

test('not-equal preserves boolean precedence with not and and', () => {
    const conjunction = parsed('a != b and c = d');
    const and = conditionRoot(conjunction.blocks);
    assert.equal(and.opcode, 'operator_and');
    assert.equal(conjunction.blocks[and.inputs.OPERAND1[1]].opcode, 'operator_not');
    assert.equal(conjunction.blocks[and.inputs.OPERAND2[1]].opcode, 'operator_equals');
    assert.match(conjunction.creator.decompile(), /^    IF \(not \(a = b\)\) and \(c = d\) THEN:$/m);

    const negated = parsed('not a != b');
    assert.match(negated.creator.decompile(), /^    IF not \(not \(a = b\)\) THEN:$/m);
});

const FAMILIES = [
    ['8051', 'DEVICE STC12C5A60S2', 'PIN led = P1.0 OUTPUT'],
    ['avr', 'DEVICE ARDUINO-UNO', 'PIN led = D13 OUTPUT'],
    ['arm', 'DEVICE PICO', 'PIN led = GP25 OUTPUT'],
    ['6502', 'DEVICE EATER6502', 'PIN led = PA0 OUTPUT'],
    ['i8086', 'DEVICE i8086', 'PIN led = P1.0 OUTPUT']
];

for (const [family, device, pin] of FAMILIES) {
    test(`not-equal keeps semantic C on the ${family} target family`, () => {
        const creator = new SB3Creator();
        creator.parse([
            device,
            pin,
            'WHEN flag clicked:',
            '  set a to 1',
            '  set b to 2',
            '  IF a != b THEN:',
            '    turn on led'
        ].join('\n'));
        assert.deepEqual(creator.warnings, []);
        assert.match(creator.decompile(), /^\s+IF not \(a = b\) THEN:$/m);
        const generated = creator.generateC();
        const code = typeof generated === 'string' ? generated : generated.code;
        assert.match(code, /if \(\(!\(a == b\)\)\) \{/);
        assert.doesNotMatch(code, /0 \/\* a ! \*\//);
        assert.deepEqual(creator._cWarnings || [], []);
    });
}
