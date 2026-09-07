// N2d — the measured i8086 C print boundary.
//
// Only literal text and genuinely numeric signed-16 values cross into the
// consumer's DOS helpers. Scratch string reporters are refused rather than
// falling through cRep as zero. Text and numeric declarations stay separate
// so a program pays only for the conversion code it calls.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
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

for (const [name, lines] of Object.entries({
    'direct string assignment': ['set value to "abc"', 'print value'],
    'string assignment after print': ['print value', 'set value to "abc"'],
    'join assigned before print': ['set value to ("a" join "b")', 'print value']
})) {
    test(`${name} makes the printed variable a named whole-program refusal`, () => {
        const {code, warnings} = emit(program(lines));
        assert.match(code, /No C emitted/);
        assert.match(code, /variable "value" has a non-numeric set/);
        assert.doesNotMatch(code, /bw_print_num/);
        assert.ok(warnings.some(warning => /variable "value"/.test(warning)));
    });
}

test('a string assignment in another script is still part of numeric provenance', () => {
    const src = program(['print value']) + '\n\nWHEN flag clicked:\n  set value to "later"';
    const {code, warnings} = emit(src);
    assert.match(code, /No C emitted/);
    assert.match(code, /variable "value" has a non-numeric set/);
    assert.doesNotMatch(code, /bw_print_num/);
    assert.ok(warnings.some(warning => /variable "value"/.test(warning)));
});

test('the x-assignment grammar ambiguity cannot turn a string into printed zero', () => {
    const {code} = emit(program(['set x to "abc"', 'print x']));
    assert.match(code, /No C emitted/);
    assert.match(code, /variable "x" has a non-numeric set x/);
    assert.doesNotMatch(code, /bw_print_num/);
});

test('a string-or-number procedure argument is refused until call-site provenance exists', () => {
    const src = [
        'DEVICE i8086',
        'PIN led = P1.0 OUTPUT',
        'DEFINE show (value):',
        '  print value',
        'WHEN flag clicked:',
        '  show "abc"'
    ].join('\n');
    const {code, warnings} = emit(src);
    assert.match(code, /No C emitted/);
    assert.match(code, /argument_reporter_string_number/);
    assert.doesNotMatch(code, /bw_print_num/);
    assert.ok(warnings.some(warning => /argument_reporter_string_number/.test(warning)));
});

test('cross-variable provenance cycles remain refused while direct numeric self-updates are allowed', () => {
    const cyclic = emit(program([
        'set first to (second + 0)',
        'set second to (first + 0)',
        'print first'
    ]));
    assert.match(cyclic.code, /No C emitted/);
    assert.match(cyclic.code, /cyclic value provenance/);
    assert.doesNotMatch(cyclic.code, /bw_print_num/);

    const selfUpdate = emit(program(['change value by 1', 'print value']));
    assert.doesNotMatch(selfUpdate.code, /No C emitted/);
    assert.match(selfUpdate.code, /bw_print_num\(value\)/);
});

test('a string written through a list cannot acquire numeric print provenance', () => {
    const {code} = emit(program([
        'add "abc" to readings',
        'set value to (item (1) of readings)',
        'print value'
    ]));
    assert.match(code, /No C emitted/);
    assert.match(code, /non-numeric/, 'the dynamically string-valued list path must be named');
    assert.doesNotMatch(code, /bw_print_num/);
});

const MEASURED_NUMERIC = [
    'arduino-01-digital-read-serial',
    'arduino-02-digital-input-pullup',
    'arduino-02-state-change',
    'arduino-03-smoothing',
    'arduino-06-ping'
];

test('project-wide provenance preserves all five measured numeric print candidates', async () => {
    for (const name of MEASURED_NUMERIC) {
        const source = await readFile(new URL(`../examples/${name}/program.bw`, import.meta.url), 'utf8');
        const retargeted = SB3Creator.retargetPseudocode(source, 'stc12c5a60s2');
        assert.notEqual(retargeted && retargeted.ok, false, `${name}: retarget refused`);
        const text = typeof retargeted === 'string' ? retargeted :
            retargeted.pseudocode || retargeted.text || retargeted.source || retargeted.code;
        const {code, warnings} = emit(text.replace(/^DEVICE .*$/m, 'DEVICE i8086'));
        assert.doesNotMatch(code, /No C emitted/, `${name}: provenance narrowed measured reach`);
        assert.match(code, /bw_print_num\(/, `${name}: numeric print call absent`);
        assert.ok(!warnings.some(warning => /print helper|value provenance/.test(warning)),
            `${name}: print provenance refused: ${warnings.join(' | ')}`);
    }
});

test('project-wide provenance preserves the measured literal print candidate', async () => {
    const name = 'arduino-sk-p11-crystal-ball';
    const source = await readFile(new URL(`../examples/${name}/program.bw`, import.meta.url), 'utf8');
    const retargeted = SB3Creator.retargetPseudocode(source, 'stc12c5a60s2');
    assert.notEqual(retargeted && retargeted.ok, false, `${name}: retarget refused`);
    const text = typeof retargeted === 'string' ? retargeted :
        retargeted.pseudocode || retargeted.text || retargeted.source || retargeted.code;
    const {code} = emit(text.replace(/^DEVICE .*$/m, 'DEVICE i8086'));
    assert.doesNotMatch(code, /No C emitted/, `${name}: literal candidate narrowed`);
    assert.match(code, /bw_puts\(/, `${name}: text print call absent`);
});
