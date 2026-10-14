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
    assert.equal(code.match(/^    CALL show$/gm).length, 2);
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
    assert.match(creator.decompile(), /CALL greet \("friend"\)/);
    assert.equal(calls(parse(creator.decompile())).length, 1);
});
