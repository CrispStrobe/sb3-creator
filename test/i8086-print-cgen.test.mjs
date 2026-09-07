// N2d — the measured i8086 C print boundary.
//
// Only literal text and genuinely numeric signed-16 values cross into the
// consumer's DOS helpers. Scratch string reporters are refused rather than
// falling through cRep as zero. Text and numeric declarations stay separate
// so a program pays only for the conversion code it calls.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const program = lines => [
    'DEVICE i8086',
    'PIN led = P1.0 OUTPUT',
    'WHEN flag clicked:',
    ...lines.map(line => `  ${line}`)
].join('\n');

const emit = src => {
    const creator = new SB3Creator();
    creator.parse(src);
    const generated = creator.generateC();
    return {
        code: typeof generated === 'string' ? generated : generated.code,
        warnings: creator._cWarnings || []
    };
};

test('literal text preserves dollar and empty strings behind the text-only DOS boundary', () => {
    const {code, warnings} = emit(program(['print "cost=$5"', 'print ""']));
    assert.match(code, /^extern void bw_puts\(const char \*s\);$/m);
    assert.doesNotMatch(code, /extern void bw_print_num/, 'numeric conversion leaked into a text-only program');
    assert.match(code, /^    bw_puts\("cost=\$5"\);$/m,
        '$ must be ordinary character data, not a DOS function-09 terminator');
    assert.match(code, /^    bw_puts\(""\);$/m, 'empty output must still reach the helper');
    assert.match(code, /every character \(including \$\), then CRLF/,
        'the emitted boundary does not state its observable termination contract');
    assert.doesNotMatch(code, /No C emitted/);
    assert.deepEqual(warnings, []);
});

test('numeric print admits the complete signed-16 boundary without a text helper', () => {
    const {code, warnings} = emit(program([
        'print -32768', 'print -1', 'print 0', 'print 32767'
    ]));
    assert.match(code, /^extern void bw_print_num\(int n\);$/m);
    assert.doesNotMatch(code, /extern void bw_puts\(const char/, 'text traversal leaked into numeric-only C');
    for (const n of ['-32768', '-1', '0', '32767']) {
        assert.match(code, new RegExp(`^    bw_print_num\\(${n}\\);$`, 'm'));
    }
    assert.match(code, /signed-16 decimal, then CRLF/);
    assert.deepEqual(warnings, []);
});

test('numeric print reuses the N2b int-16 refusal one step past either boundary', () => {
    for (const n of ['-32769', '32768']) {
        const {code, warnings} = emit(program([`print ${n}`]));
        assert.match(code, /No C emitted/);
        assert.match(code, new RegExp(`This program has: ${n.replace('-', '\\-')}\\.`));
        assert.doesNotMatch(code, /bw_print_num/);
        assert.equal(warnings.length, 1);
    }
});

test('text and numeric helper-use flags are independent and compose when both are used', () => {
    const {code} = emit(program(['print "n="', 'print 7']));
    assert.match(code, /extern void bw_puts\(const char \*s\);/);
    assert.match(code, /extern void bw_print_num\(int n\);/);
    assert.match(code, /bw_puts\("n="\);/);
    assert.match(code, /bw_print_num\(7\);/);
});

test('a string reporter is refused by name instead of becoming numeric zero', () => {
    const {code, warnings} = emit(program(['print ("a" join "b")']));
    assert.match(code, /^\/\* No C emitted for DEVICE I8086\./);
    assert.match(code, /operator_join is string-valued or has no numeric C lowering/);
    assert.match(code, /refused instead of printing zero/);
    assert.doesNotMatch(code, /bw_print_num\(0/);
    assert.doesNotMatch(code, /extern void bw_print_num/,
        'a refused reporter must not request the numeric runtime helper');
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /operator_join/);
});

test('a nested string reporter cannot hide below an arithmetic parent', () => {
    const {code} = emit(program(['print (1 + ("a" join "b"))']));
    assert.match(code, /No C emitted/);
    assert.match(code, /operator_join/);
    assert.doesNotMatch(code, /bw_print_num/);
});

for (const expression of ['letter 1 of "abc"', 'length of "abc"']) {
    test(`${expression} remains a named refusal outside the numeric print boundary`, () => {
        const {code, warnings} = emit(program([`print ${expression}`]));
        assert.match(code, /No C emitted/);
        assert.match(code, /string-valued or has no numeric C lowering/);
        assert.doesNotMatch(code, /bw_print_num/);
        assert.equal(warnings.length, 1);
    });
}

test('a loaded text-mode block with a reporter is refused rather than printed as empty text', () => {
    const creator = new SB3Creator();
    creator.parse(program(['print "safe"']));
    const block = creator.project.targets.flatMap(target => Object.values(target.blocks))
        .find(candidate => candidate.opcode === 'stc12_print');
    block.inputs.VALUE = [2, 'missing-reporter'];
    const generated = creator.generateC();
    const code = typeof generated === 'string' ? generated : generated.code;
    assert.match(code, /No C emitted/);
    assert.match(code, /text-mode print requires literal text/);
    assert.doesNotMatch(code, /bw_puts\(""\)/);
});

test('plain say remains comment-only and does not enter the terminal boundary', () => {
    const {code} = emit(program(['say "hello"']));
    assert.doesNotMatch(code, /extern void bw_(?:puts|print_num)/);
    assert.doesNotMatch(code, /bw_(?:puts|print_num)\(/);
    assert.doesNotMatch(code, /No C emitted/);
});

test('say-for-seconds is refused by name instead of being mistaken for print plus wait', () => {
    const {code, warnings} = emit(program(['say "later" for 1 seconds']));
    assert.doesNotMatch(code, /extern void bw_(?:puts|print_num)/);
    assert.doesNotMatch(code, /bw_(?:puts|print_num)\(/);
    assert.match(code, /No C emitted/);
    assert.match(code, /say for seconds is stage speech, not DOS terminal output/);
    assert.equal(warnings.length, 1);
});
