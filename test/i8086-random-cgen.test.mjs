// N2f — the i8086 C emitter's half of deterministic bounded random.
//
// SmallerC's tiny model has no 32-bit integer type. The emitter therefore
// names a narrow cdecl boundary; brickwright-lite supplies the 16x16 MUL-high
// implementation and proves its DOS-visible trace independently.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const program = lines => [
    'DEVICE i8086',
    'PIN tilt = P1.0 INPUT',
    'WHEN flag clicked:',
    ...lines.map(line => `  ${line}`)
].join('\n');

const emit = (source, mutate) => {
    const creator = new SB3Creator();
    creator.parse(source);
    if (mutate) mutate(creator.project);
    const generated = creator.generateC();
    return {creator, code: typeof generated === 'string' ? generated : generated.code};
};

test('i8086 pick-random crosses the named signed-16 helper instead of a commented zero', () => {
    const {creator, code} = emit(program([
        'set roll to pick random 1 to 8',
        'print roll'
    ]));
    assert.doesNotMatch(code, /No C emitted/);
    assert.match(code, /^extern int bw_random\(int from, int to\);$/m);
    assert.match(code, /^    roll = bw_random\(1, 8\);$/m);
    assert.match(code, /^    bw_print_num\(roll\);$/m);
    assert.match(code, /fixed seed 0x4d3d/);
    assert.match(code, /unbiased multiply-high rejection with 16x16 MUL/);
    assert.doesNotMatch(code, /bw_random\([^\n]*\/\*/,
        'an incomplete reporter lowering reached the helper');
    assert.deepEqual(creator._cWarnings, []);
});

test('random is numeric inside the print provenance boundary', () => {
    const {code} = emit(program(['print pick random -2 to 2']));
    assert.doesNotMatch(code, /No C emitted/);
    assert.match(code, /bw_print_num\(bw_random\(\-2, 2\)\);/);
});

test('equal, reversed and full signed-16 bounds remain explicit helper arguments', () => {
    const {code} = emit(program([
        'set equal to pick random 7 to 7',
        'set reversed to pick random 8 to 1',
        'set full to pick random -32768 to 32767'
    ]));
    assert.doesNotMatch(code, /No C emitted/);
    assert.match(code, /equal = bw_random\(7, 7\);/);
    assert.match(code, /reversed = bw_random\(8, 1\);/);
    assert.match(code, /full = bw_random\(\(\-32767 - 1\), 32767\);/);
});

test('a bound outside signed-16 refuses before the helper can wrap it', () => {
    const {code} = emit(program(['set roll to pick random 1 to 8']), project => {
        const random = project.targets.flatMap(target => Object.values(target.blocks))
            .find(block => block.opcode === 'operator_random');
        random.inputs.TO = [1, [4, 32768]];
    });
    assert.match(code, /No C emitted for DEVICE I8086/);
    assert.match(code, /This program has: 32768/);
    assert.doesNotMatch(code, /bw_random\(/);
});

test('a program without random requests no random helper', () => {
    const {code} = emit(program(['turn on tilt']));
    assert.doesNotMatch(code, /extern int bw_random|bw_random\(/);
});
