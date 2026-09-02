/**
 * `GLOBAL name = value` used to name the variable "name = value".
 *
 * `/^(GLOBAL|LOCAL)\s+(.+)$/i` took the whole tail as the NAME, so the initial value was
 * dropped and — if the program then used the variable — a second, correct-but-uninitialized
 * one appeared beside the junk one. Four forms had it: GLOBAL, LOCAL, and both LIST spellings.
 * Found by inspecting a deployed screenshot of a round-tripped SPIKE project, which showed two
 * globals where the source declared one, on a gate that was passing because it counted opcodes.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import SB3Creator from '../src/utils/sb3Creator.js';

const parse = source => {
    const creator = new SB3Creator();
    creator.parse(source);
    return {
        vars: creator.project.targets.flatMap(t => Object.values(t.variables || {})),
        lists: creator.project.targets.flatMap(t => Object.values(t.lists || {})),
        creator
    };
};

test('an initializer sets the value and never becomes part of the name', () => {
    assert.deepEqual(parse('GLOBAL dist = 0\n\nWHEN flag clicked:\n  set dist to 5\n').vars,
        [['dist', 0]], 'the zero case is the one that shipped, and it produced two variables');
    assert.deepEqual(parse('GLOBAL score = 7\n\nWHEN flag clicked:\n  wait 1 seconds\n').vars,
        [['score', 7]]);
    assert.deepEqual(parse('SPRITE Cat:\n  LOCAL n = 3\n  WHEN flag clicked:\n    wait 1 seconds\n').vars,
        [['n', 3]]);
    assert.deepEqual(parse('GLOBAL LIST xs = [1, 2]\n\nWHEN flag clicked:\n  wait 1 seconds\n').lists,
        [['xs', [1, 2]]]);
    assert.deepEqual(parse('GLOBAL LIST ys = []\n\nWHEN flag clicked:\n  wait 1 seconds\n').lists,
        [['ys', []]]);
});

test('a quoted initializer keeps its text, and a name keeps its spaces', () => {
    assert.deepEqual(parse('GLOBAL label = "hi there"\n\nWHEN flag clicked:\n  wait 1 seconds\n').vars,
        [['label', 'hi there']]);
    // Scratch names may contain spaces, so the split point is the equals sign, not whitespace.
    assert.deepEqual(parse('GLOBAL my score = 5\n\nWHEN flag clicked:\n  wait 1 seconds\n').vars,
        [['my score', 5]]);
});

test('bare declarations are unchanged', () => {
    assert.deepEqual(parse('GLOBAL dist\n\nWHEN flag clicked:\n  set dist to 5\n').vars, [['dist', 0]]);
    assert.deepEqual(parse('GLOBAL LIST xs\n\nWHEN flag clicked:\n  wait 1 seconds\n').lists, [['xs', []]]);
});

test('a malformed declaration is left alone rather than invented into one', () => {
    // No name, or no value. Neither is a declaration with an initializer, and quietly
    // fabricating one would be a worse failure than keeping the old literal text.
    assert.deepEqual(parse('GLOBAL = 3\n\nWHEN flag clicked:\n  wait 1 seconds\n').vars, [['= 3', 0]]);
    assert.deepEqual(parse('GLOBAL x =\n\nWHEN flag clicked:\n  wait 1 seconds\n').vars, [['x =', 0]]);
});

test('declarations round-trip through decompile without drifting', () => {
    for (const source of [
        'GLOBAL score = 7\n\nWHEN flag clicked:\n  wait 1 seconds\n',
        'GLOBAL dist = 0\n\nWHEN flag clicked:\n  wait 1 seconds\n',
        'GLOBAL LIST xs = [1, 2]\n\nWHEN flag clicked:\n  wait 1 seconds\n',
        'GLOBAL label = "hi there"\n\nWHEN flag clicked:\n  wait 1 seconds\n',
        'SPRITE Cat:\n  LOCAL n = 3\n  WHEN flag clicked:\n    wait 1 seconds\n'
    ]) {
        const first = parse(source);
        const second = parse(first.creator.decompile());
        assert.deepEqual([second.vars, second.lists], [first.vars, first.lists],
            `declaration tables drifted on re-emit for: ${source.split('\n')[0]}`);
    }
});

test('the emitter adds an initializer only when it is not the parser default', () => {
    // Otherwise every variable in every project grows `= 0` and the canonical form drifts for
    // no gain. The defaults are the creator's own: 0 for a scalar, [] for a list.
    const zero = parse('GLOBAL dist = 0\n\nWHEN flag clicked:\n  wait 1 seconds\n');
    assert.match(zero.creator.decompile(), /^GLOBAL dist$/m);
    const seven = parse('GLOBAL score = 7\n\nWHEN flag clicked:\n  wait 1 seconds\n');
    assert.match(seven.creator.decompile(), /^GLOBAL score = 7$/m);
    const empty = parse('GLOBAL LIST ys = []\n\nWHEN flag clicked:\n  wait 1 seconds\n');
    assert.match(empty.creator.decompile(), /^GLOBAL LIST ys$/m);
});
