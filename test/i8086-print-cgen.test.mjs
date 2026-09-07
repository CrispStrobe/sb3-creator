// N2d — the measured i8086 C print boundary.
//
// Only genuinely numeric signed-16 values cross into the consumer's DOS
// helper. Scratch text and string reporters are refused rather than falling
// through cRep as zero.
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

const emit = (src, mutateProject) => {
    const creator = new SB3Creator();
    creator.parse(src);
    if (mutateProject) mutateProject(creator.project);
    const generated = creator.generateC();
    return {
        code: typeof generated === 'string' ? generated : generated.code,
        warnings: creator._cWarnings || []
    };
};

test('literal text is refused by name outside the numeric-only boundary', () => {
    const {code, warnings} = emit(program(['print "cost=$5"', 'print ""']));
    assert.match(code, /No C emitted/);
    assert.match(code, /text-mode print is outside the numeric-only i8086 C print boundary/);
    assert.doesNotMatch(code, /bw_(?:puts|print_num)/);
    assert.equal(warnings.length, 1);
});

test('numeric print admits the complete signed-16 boundary without a text helper', () => {
    const {code, warnings} = emit(program([
        'print -32768', 'print -1', 'print 0', 'print 32767'
    ]));
    assert.match(code, /^extern void bw_print_num\(int n\);$/m);
    assert.doesNotMatch(code, /extern void bw_puts\(const char/, 'text traversal leaked into numeric-only C');
    assert.match(code, /^    bw_print_num\(\(-32767 - 1\)\);$/m,
        'INT16_MIN must use the SmallerC-safe general literal spelling');
    assert.doesNotMatch(code, /^    bw_print_num\(-32768\);$/m);
    for (const n of ['-1', '0', '32767']) {
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

test('literal text refuses the whole program even beside an otherwise valid number', () => {
    const {code, warnings} = emit(program(['print "n="', 'print 7']));
    assert.match(code, /No C emitted/);
    assert.match(code, /text-mode print is outside the numeric-only i8086 C print boundary/);
    assert.doesNotMatch(code, /bw_(?:puts|print_num)/);
    assert.equal(warnings.length, 1);
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

test('math operators share the numeric lowerer boundary instead of falling back to zero', () => {
    const admitted = emit(program(['print (floor of 9)']));
    assert.doesNotMatch(admitted.code, /No C emitted/);
    assert.match(admitted.code, /bw_print_num\(9\)/);

    for (const op of ['sqrt', 'sin']) {
        const refused = emit(program([`print (${op} of 9)`]));
        assert.match(refused.code, /No C emitted/, `${op} fell through as numeric zero`);
        assert.match(refused.code, new RegExp(`${op} of has no numeric C lowering`));
        assert.doesNotMatch(refused.code, /bw_print_num/);
    }
});

test('an 8051-only port reporter cannot leak an unresolved token into i8086 C', () => {
    const {code} = emit([
        'DEVICE i8086',
        'PORT bus = P1 INPUT',
        'WHEN flag clicked:',
        '  print read bus'
    ].join('\n'));
    assert.match(code, /No C emitted/);
    assert.match(code, /stc12_readport/);
    assert.doesNotMatch(code, /bw_print_num\(P1\)/);
});

test('the actual-lowerer backstop refuses a missing pin fallback comment', () => {
    const {code} = emit(program(['print read led']), project => {
        for (const target of project.targets || []) {
            for (const block of Object.values(target.blocks || {})) {
                if (block.opcode === 'stc12_read') block.fields.PIN[0] = 'missing';
            }
        }
    });
    assert.match(code, /No C emitted/);
    assert.match(code, /stc12_read has no complete numeric i8086 C lowering/);
    assert.doesNotMatch(code, /bw_print_num\(.*\/\*/);
});

test('an invalid pin hidden behind a scalar write refuses the whole program', () => {
    const {code} = emit(program(['set value to read led', 'print value']), project => {
        for (const target of project.targets || []) {
            for (const block of Object.values(target.blocks || {})) {
                if (block.opcode === 'stc12_read') block.fields.PIN[0] = 'missing';
            }
        }
    });
    assert.match(code, /No C emitted/);
    assert.match(code, /stc12_read has no complete numeric i8086 C lowering/);
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
    assert.match(code, /text-mode print is outside the numeric-only i8086 C print boundary/);
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

test('a legacy write missing its ID still poisons the same-name variable', () => {
    const {code} = emit(program(['set value to "abc"', 'print value']), project => {
        for (const target of project.targets || []) {
            for (const block of Object.values(target.blocks || {})) {
                if (block.opcode === 'data_setvariableto') block.fields.VARIABLE[1] = null;
            }
        }
    });
    assert.match(code, /No C emitted/);
    assert.match(code, /variable "value" has a non-numeric set/);
    assert.doesNotMatch(code, /bw_print_num/);
});

test('a missing reporter ID refuses same-name declaration ambiguity', () => {
    const {code} = emit(program(['set value to 1', 'print value']), project => {
        const target = project.targets[0];
        target.variables['legacy-alias'] = ['value', 0];
        for (const block of Object.values(target.blocks || {})) {
            if (block.opcode === 'stc12_print') block.inputs.VALUE[1][2] = null;
        }
    });
    assert.match(code, /No C emitted/);
    assert.match(code, /variable "value" has ambiguous identity/);
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

test('a boolean procedure argument is refused until the i8086 parameter ABI is proven', () => {
    const src = [
        'DEVICE i8086',
        'PIN led = P1.0 OUTPUT',
        'DEFINE show <flag>:',
        '  print flag',
        'WHEN flag clicked:',
        '  show true'
    ].join('\n');
    const {code} = emit(src);
    assert.match(code, /No C emitted/);
    assert.match(code, /argument_reporter_boolean/);
    assert.doesNotMatch(code, /bw_print_num/);
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

    const selfSet = emit(program(['set value to (value + 1)', 'print value']));
    assert.doesNotMatch(selfSet.code, /No C emitted/);
    assert.match(selfSet.code, /bw_print_num\(value\)/);

    const acyclic = emit(program(['set first to (second + 1)', 'print first']));
    assert.doesNotMatch(acyclic.code, /No C emitted/);
    assert.match(acyclic.code, /bw_print_num\(first\)/);
});

test('a string written through a list cannot acquire numeric print provenance', () => {
    const {code} = emit(program([
        'set readIndex to 0',
        'delete all of readings',
        'add "abc" to readings',
        'set value to (item (readIndex + 1) of readings)',
        'print value'
    ]));
    assert.match(code, /No C emitted/);
    assert.match(code, /non-numeric/, 'the dynamically string-valued list path must be named');
    assert.doesNotMatch(code, /bw_print_num/);
});

test('a direct numeric list item still refuses when its i8086 C lowering is absent', () => {
    const {code} = emit(program([
        'set readIndex to 0',
        'delete all of readings',
        'add 7 to readings',
        'print (item (readIndex + 1) of readings)'
    ]));
    assert.match(code, /No C emitted/);
    assert.match(code, /data_itemoflist has no complete numeric i8086 C lowering/);
    assert.doesNotMatch(code, /bw_print_num/);
});

for (const listWrite of [
    'add read led to readings',
    'replace item (readIndex + 1) of readings with read led'
]) {
    test(`an invalid pin hidden behind "${listWrite}" refuses the whole program`, () => {
        const {code} = emit(program([
            'set readIndex to 0',
            'delete all of readings',
            'add 0 to readings',
            listWrite,
            'set value to (item (readIndex + 1) of readings)',
            'print value'
        ]), project => {
            for (const target of project.targets || []) {
                for (const block of Object.values(target.blocks || {})) {
                    if (block.opcode === 'stc12_read') block.fields.PIN[0] = 'missing';
                }
            }
        });
        assert.match(code, /No C emitted/);
        assert.match(code, /stc12_read has no complete numeric i8086 C lowering/);
        assert.doesNotMatch(code, /bw_print_num/);
    });
}

test('a variable-list provenance cycle is refused rather than treated as a self-update', () => {
    const {code} = emit(program([
        'set readIndex to 0',
        'delete all of readings',
        'add value to readings',
        'set value to (item (readIndex + 1) of readings)',
        'print value'
    ]));
    assert.match(code, /No C emitted/);
    assert.match(code, /cyclic value provenance/);
    assert.doesNotMatch(code, /bw_print_num/);
});

const MEASURED_NUMERIC = [
    'arduino-01-digital-read-serial',
    'arduino-02-digital-input-pullup',
    'arduino-02-state-change',
    'arduino-06-ping'
];

test('state-change retarget preserves not-equal as a real block graph and semantic i8086 C', async () => {
    const source = await readFile(new URL('../examples/arduino-02-state-change/program.bw', import.meta.url), 'utf8');
    const retargeted = SB3Creator.retargetPseudocode(source, 'stc12c5a60s2');
    assert.notEqual(retargeted && retargeted.ok, false, 'state-change retarget refused');
    const text = typeof retargeted === 'string' ? retargeted :
        retargeted.pseudocode || retargeted.text || retargeted.source || retargeted.code;
    assert.match(text, /^      IF not \(buttonState = lastButtonState\) THEN:$/m);
    assert.doesNotMatch(text, /"buttonState !"/);

    const creator = new SB3Creator();
    creator.parse(text.replace(/^DEVICE .*$/m, 'DEVICE i8086'));
    const cat = creator.project.targets.find(target => target.name === 'Cat');
    const not = Object.values(cat.blocks).find(block => block.opcode === 'operator_not');
    assert.ok(not, 'state-change condition lost its operator_not block');
    const equals = cat.blocks[not.inputs.OPERAND[1]];
    assert.equal(equals.opcode, 'operator_equals');
    assert.equal(equals.inputs.OPERAND1[1][1], 'buttonState');
    assert.equal(equals.inputs.OPERAND2[1][1], 'lastButtonState');

    const generated = creator.generateC();
    const code = typeof generated === 'string' ? generated : generated.code;
    assert.deepEqual(creator.warnings, []);
    assert.deepEqual(creator._cWarnings || [], []);
    assert.match(code, /if \(\(!\(s0_buttonState == s0_lastButtonState\)\)\) \{/);
    assert.doesNotMatch(code, /0 \/\* buttonState ! \*\//,
        'not-equal silently fell through to a numeric-zero string comment');
});

test('i8086 refuses a comparison operand that falls through to a commented zero', () => {
    const creator = new SB3Creator();
    creator.parse(program([
        'IF a = b THEN:',
        '  turn on led'
    ]));
    const stage = creator.project.targets.find(target => target.isStage);
    const equals = Object.values(stage.blocks).find(block => block.opcode === 'operator_equals');
    assert.ok(equals, 'defence fixture did not produce an equality block');
    // The exact graph the old `!=` tokenizer made: its left side was the
    // literal text `a !`, which cNum represented as a diagnostic zero.
    equals.inputs.OPERAND1 = [1, [10, 'a !']];
    const generated = creator.generateC();
    const code = typeof generated === 'string' ? generated : generated.code;
    assert.match(code, /^\/\* No C emitted for DEVICE I8086\./);
    assert.match(code, /This program supplies: a !\./);
    assert.doesNotMatch(code, /0 \/\* a ! \*\/ ==/,
        'commented-zero comparison escaped the whole-program refusal');
    assert.match((creator._cWarnings || []).join(' | '), /operand\(s\) a ! completely/);
});

test('project-wide provenance preserves all four honest measured numeric print candidates', async () => {
    for (const name of MEASURED_NUMERIC) {
        const source = await readFile(new URL(`../examples/${name}/program.bw`, import.meta.url), 'utf8');
        const retargeted = SB3Creator.retargetPseudocode(source, 'stc12c5a60s2');
        assert.notEqual(retargeted && retargeted.ok, false, `${name}: retarget refused`);
        const text = typeof retargeted === 'string' ? retargeted :
            retargeted.pseudocode || retargeted.text || retargeted.source || retargeted.code;
        const {code, warnings} = emit(text.replace(/^DEVICE .*$/m, 'DEVICE i8086'));
        assert.doesNotMatch(code, /No C emitted/, `${name}: provenance narrowed measured reach`);
        assert.match(code, /bw_print_num\(/, `${name}: numeric print call absent`);
        for (const call of code.matchAll(/^\s*bw_print_num\((.*)\);$/gm)) {
            assert.doesNotMatch(call[1], /\/\*|\bP[0-3]\b|\bBW_[A-Z0-9_]+:/,
                `${name}: numeric helper contains an unresolved lowering: ${call[1]}`);
        }
        assert.ok(!warnings.some(warning => /print helper|value provenance/.test(warning)),
            `${name}: print provenance refused: ${warnings.join(' | ')}`);
    }
});

test('smoothing is named as a numeric-list dependency instead of counted as emitted', async () => {
    const name = 'arduino-03-smoothing';
    const source = await readFile(new URL(`../examples/${name}/program.bw`, import.meta.url), 'utf8');
    const retargeted = SB3Creator.retargetPseudocode(source, 'stc12c5a60s2');
    const text = typeof retargeted === 'string' ? retargeted :
        retargeted.pseudocode || retargeted.text || retargeted.source || retargeted.code;
    const {code} = emit(text.replace(/^DEVICE .*$/m, 'DEVICE i8086'));
    assert.match(code, /No C emitted/);
    assert.match(code, /data_itemoflist has no complete numeric i8086 C lowering/);
    assert.doesNotMatch(code, /bw_print_num/);
});

test('the measured crystal-ball text program remains a named refusal', async () => {
    const name = 'arduino-sk-p11-crystal-ball';
    const source = await readFile(new URL(`../examples/${name}/program.bw`, import.meta.url), 'utf8');
    const retargeted = SB3Creator.retargetPseudocode(source, 'stc12c5a60s2');
    assert.notEqual(retargeted && retargeted.ok, false, `${name}: retarget refused`);
    const text = typeof retargeted === 'string' ? retargeted :
        retargeted.pseudocode || retargeted.text || retargeted.source || retargeted.code;
    const {code} = emit(text.replace(/^DEVICE .*$/m, 'DEVICE i8086'));
    assert.match(code, /No C emitted/);
    assert.match(code, /text-mode print is outside the numeric-only i8086 C print boundary/);
    assert.doesNotMatch(code, /bw_(?:puts|print_num)/);
});

test('the measured string-addition program remains an exact named refusal', async () => {
    const name = 'arduino-08-string-addition';
    const source = await readFile(new URL(`../examples/${name}/program.bw`, import.meta.url), 'utf8');
    const retargeted = SB3Creator.retargetPseudocode(source, 'stc12c5a60s2');
    const text = typeof retargeted === 'string' ? retargeted :
        retargeted.pseudocode || retargeted.text || retargeted.source || retargeted.code;
    const {code} = emit(text.replace(/^DEVICE .*$/m, 'DEVICE i8086'));
    assert.match(code, /No C emitted/);
    assert.match(code, /operator_join is string-valued/);
    assert.doesNotMatch(code, /bw_print_num/);
});
