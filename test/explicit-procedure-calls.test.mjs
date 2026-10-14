import {test} from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const parse = source => {
    const creator = new SB3Creator();
    creator.parse(source);
    assert.deepEqual(creator.warnings, []);
    return creator;
};
const blocks = creator => creator.project.targets.flatMap(target => Object.values(target.blocks));
const calls = creator => blocks(creator).filter(block => block.opcode === 'procedures_call');

test('explicit call retains a built-in collision and ordinary visibility beside it', () => {
    const creator = parse('DEFINE show:\n  say "ran"\nWHEN flag clicked:\n  show\n  CALL show\n  CALL show\n');
    assert.equal(blocks(creator).filter(block => block.opcode === 'looks_show').length, 1);
    assert.equal(calls(creator).length, 2);
    assert.equal(calls(creator)[0].mutation.proccode, 'show');
    const code = creator.decompile();
    assert.match(code, /^    show$/m);
    assert.equal(code.match(/^    CALL: \(show\)$/gm).length, 2);
    assert.equal(calls(parse(code)).length, 2);
});

test('actual multiword template and ordered value arguments survive decompilation', () => {
    const creator = parse('DEFINE draw (x) at (y):\n  say x\nWHEN flag clicked:\n  CALL draw (1 + 2) at (join "a)" "b(")\n');
    const call = calls(creator)[0];
    assert.equal(call.mutation.proccode, 'draw %s at %s');
    const ids = JSON.parse(call.mutation.argumentids);
    assert.equal(ids.length, 2);
    assert.deepEqual(Object.keys(call.inputs), ids);
    const restored = parse(creator.decompile());
    assert.equal(calls(restored).length, 1);
    assert.equal(calls(restored)[0].mutation.proccode, call.mutation.proccode);
    for (const opcode of ['operator_add', 'operator_join']) {
        assert.equal(blocks(restored).filter(block => block.opcode === opcode).length, 1);
    }
});

test('Boolean procedure slots preserve actual condition blocks and Boolean parameters', () => {
    const creator = parse('DEFINE choose <ok>:\n  IF ok THEN:\n    say "yes"\nDEFINE relay <ready>:\n  CALL choose (ready)\nWHEN flag clicked:\n  CALL choose (1 = 1)\n  CALL choose (false)\n');
    assert.equal(calls(creator).length, 3);
    for (const call of calls(creator)) {
        assert.equal(call.mutation.proccode, 'choose %b');
        assert.equal(Object.values(call.inputs)[0][0], 2);
    }
    const restored = parse(creator.decompile());
    assert.equal(calls(restored).length, 3);
    assert.ok(blocks(restored).some(block => block.opcode === 'argument_reporter_boolean'));
});

test('unknown, missing, spilled and malformed explicit calls fail by name', () => {
    const invalid = ['CALL missing', 'CALL draw', 'CALL draw 1 2', 'CALL draw (1 + 2',
        'CALL draw ("unterminated)', 'CALL draw (1))', 'CALL choose (42)', 'CALL choose ("true")'];
    assert.equal(invalid.length, 8);
    for (const invocation of invalid) {
        assert.throws(() => parse('DEFINE draw (x):\n  say x\nDEFINE choose <ok>:\n  say "chosen"\nWHEN flag clicked:\n  ' + invocation + '\n'),
            /unknown procedure|mismatched arguments|unclosed procedure argument|unterminated text|Boolean argument/, invocation);
    }
});

test('unambiguous legacy procedure calls remain readable', () => {
    const creator = parse('DEFINE greet (name):\n  say name\nWHEN flag clicked:\n  greet "friend"\n');
    assert.equal(calls(creator).length, 1);
    assert.match(creator.decompile(), /CALL: \(greet \("friend"\)\)/);
    assert.equal(calls(parse(creator.decompile())).length, 1);
});

test('call-prefixed legacy labels and explicit calls keep distinct procedure identities', () => {
    const creator = parse('DEFINE numbers:\n  say "numbers"\nDEFINE call numbers:\n  say "call numbers"\nDEFINE call call numbers:\n  say "call call numbers"\nWHEN flag clicked:\n  call numbers\n  CALL: (numbers)\n  CALL: (call numbers)\n  CALL: (call call numbers)\n');
    const labels = calls(creator).map(call => call.mutation.proccode);
    assert.deepEqual(labels, ['call numbers', 'numbers', 'call numbers', 'call call numbers']);
    assert.deepEqual(calls(parse(creator.decompile())).map(call => call.mutation.proccode), labels);
});

test('wrapped calls preserve grouped arguments and parentheses inside text', () => {
    const creator = parse('DEFINE call draw (x) at <ok>:\n  say x\nWHEN flag clicked:\n  CALL: (call draw (join "a)" "b(") at (<true>))\n');
    assert.equal(calls(creator)[0].mutation.proccode, 'call draw %s at %b');
    const restored = parse(creator.decompile());
    assert.equal(calls(restored)[0].mutation.proccode, 'call draw %s at %b');
    assert.equal(blocks(restored).filter(block => block.opcode === 'operator_join').length, 1);
    for (const text of ['CALL: (missing)', 'CALL: (call draw (1) at (42))', 'CALL: (numbers', 'CALL: (numbers))']) {
        assert.throws(() => parse('DEFINE numbers:\n  say "n"\nDEFINE call draw (x) at <ok>:\n  say x\nWHEN flag clicked:\n  ' + text + '\n'), /unknown procedure|mismatched arguments|Boolean argument|unclosed procedure argument|complete parenthesized procedure invocation/, text);
    }
});

test('reserved invocation differs from a legacy call parameter in every label case', () => {
    for (const label of ['call', 'CALL', 'Call']) {
        const creator = parse(`DEFINE ${label} (x):\n  say x\nDEFINE show:\n  say "show"\nWHEN flag clicked:\n  ${label} (show)\n  CALL: (show)\n  CALL: (${label} ("argument"))\n`);
        const labels = calls(creator).map(call => call.mutation.proccode);
        assert.deepEqual(labels, [`${label} %s`, 'show', `${label} %s`]);
        assert.deepEqual(calls(parse(creator.decompile())).map(call => call.mutation.proccode), labels);
    }
});

test('registered call-prefixed legacy labels cannot bypass malformed argument checks', () => {
    for (const text of ['call draw (1 + 2', 'call draw "unterminated', 'CALL: (call draw (1 + 2)']) {
        assert.throws(() => parse(`DEFINE call draw (x):\n  say x\nWHEN flag clicked:\n  ${text}\n`),
            /unknown procedure|mismatched arguments|unclosed procedure argument|unterminated text|complete parenthesized procedure invocation/, text);
    }
});

test('reserved marker consumes exactly one whole invocation without trailing tokens', () => {
    const creator = parse('DEFINE CALL: (x):\n  say x\nWHEN flag clicked:\n  CALL: (CALL: ("quoted CALL: ) ("))\n');
    assert.equal(calls(creator)[0].mutation.proccode, 'CALL: %s');
    assert.equal(calls(parse(creator.decompile()))[0].mutation.proccode, 'CALL: %s');
    for (const text of ['CALL:', 'CALL: ()', 'CALL: numbers', 'CALL: (numbers) trailing', 'CALL: (numbers) (extra)', 'CALL: ("unterminated)']) {
        assert.throws(() => parse(`DEFINE numbers:\n  say "n"\nWHEN flag clicked:\n  ${text}\n`),
            /unknown procedure|mismatched arguments|complete parenthesized procedure invocation|not a block header/, text);
    }
});

test('literal and typed argument signatures preserve identity independently of definition order', () => {
    for (const definitions of [
        'DEFINE foo (x):\n  say x\nDEFINE foo bar:\n  say "literal"\nDEFINE foo <ok>:\n  IF ok THEN:\n    say "boolean"\n',
        'DEFINE foo <ok>:\n  IF ok THEN:\n    say "boolean"\nDEFINE foo bar:\n  say "literal"\nDEFINE foo (x):\n  say x\n'
    ]) {
        const creator = parse(definitions + 'WHEN flag clicked:\n  CALL: (foo bar)\n  CALL: (foo (bar))\n  CALL: (foo (<true>))\n');
        const expected = ['foo bar', 'foo %s', 'foo %b'];
        assert.deepEqual(calls(creator).map(call => call.mutation.proccode), expected);
        assert.deepEqual(calls(parse(creator.decompile())).map(call => call.mutation.proccode), expected);
    }
});


test('typed Boolean markers accept whitespace and reject an empty condition', () => {
    const creator = parse('DEFINE choose <ok>:\n  IF ok THEN:\n    say "yes"\nWHEN flag clicked:\n  CALL: (choose ( <1 < 2> ))\n');
    assert.equal(calls(creator)[0].mutation.proccode, 'choose %b');
    assert.equal(blocks(creator).filter(block => block.opcode === 'operator_lt').length, 1);
    assert.throws(() => parse('DEFINE choose <ok>:\n  say "yes"\nWHEN flag clicked:\n  CALL: (choose (<>))\n'), /Boolean argument requires a condition/);
});

test('crossing literal labels cannot consume bare canonical arguments', () => {
    const first = 'DEFINE greet (x) at:\n  say x\n';
    const second = 'DEFINE greet at (x):\n  say x\n';
    for (const definitions of [first + second, second + first]) {
        assert.throws(() => parse(definitions + 'WHEN flag clicked:\n  CALL: (greet at at)\n'), /unknown procedure|mismatched arguments/);
        const creator = parse(definitions + 'WHEN flag clicked:\n  CALL: (greet (at) at)\n  CALL: (greet at (at))\n');
        const expected = ['greet %s at', 'greet at %s'];
        assert.deepEqual(calls(creator).map(call => call.mutation.proccode), expected);
        assert.deepEqual(calls(parse(creator.decompile())).map(call => call.mutation.proccode), expected);
    }
});
