// The LED cube's shift directions survive the trip out to C and back.
//
// `shift cube up` emitted `bw_cube_shift(0)`, the reader turned that back into
// `shift cube 0`, and the statement was then dropped as unrecognised — the
// block vanished from the round trip. The cause was two tables: the emitter had
// an object literal, the reader had an array, and the array carried a comment
// saying it "must agree with the emitter's". It did not.
//
// The fix is one exported table both sides import, so this file's real subject
// is not the six words — it is that there is nowhere left for a second copy to
// hide. The last test is the one that matters: it fails if anyone reintroduces
// a literal list of directions in either file.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import SB3Creator from '../src/utils/sb3Creator.js';
import { corpusFloor } from './helpers/corpus-floor.mjs';
import cToPseudocode from '../src/utils/cToPseudocode.js';
import { CUBE_DIRECTIONS, cubeDirectionIndex, cubeDirectionWord }
    from '../src/utils/cubeDirections.js';

const here = dirname(fileURLToPath(import.meta.url));

// MEASURED 2026-08-23: 6 directions. Several tests here are generated from
// this imported list, and one asserts only that the mapping is injective —
// which an empty list satisfies. Floor it where it enters the file.
corpusFloor('cube directions', () => CUBE_DIRECTIONS.length, 6,
    'CUBE_DIRECTIONS is imported from src/utils/cubeDirections.js; an empty export makes the direction tests generate nothing.');

const program = (direction) => `DEVICE STC12C5A60S2
CLOCK 11059200
LEDCUBE 4

WHEN flag clicked:
  clear cube
  set voxel 1 1 1 to 1
  shift cube ${direction}
  hold frame for 100 ms
`;

const cFor = (direction) => {
    const creator = new SB3Creator();
    creator.parse(program(direction));
    return creator.generateC();
};

test('every direction survives pseudocode -> C -> pseudocode', () => {
    for (const direction of CUBE_DIRECTIONS) {
        const c = cFor(direction);
        assert.match(c, new RegExp(`bw_cube_shift\\(${cubeDirectionIndex(direction)}\\)`),
            `${direction} should emit its own wire value`);

        const back = cToPseudocode(c);
        assert.ok(back.pseudocode.includes(`shift cube ${direction}`),
            `${direction} came back as: ${
                back.pseudocode.split('\n').find(l => l.includes('shift cube'))}`);
    }
});

test('the six directions emit six distinct wire values', () => {
    // A table that maps two directions to the same integer would round-trip one
    // of them into the other, which reads as "it works" in a spot check.
    const values = CUBE_DIRECTIONS.map(cubeDirectionIndex);
    assert.equal(new Set(values).size, CUBE_DIRECTIONS.length);
    assert.deepEqual(values, [...values].sort((a, b) => a - b),
        'the index is the wire value, so the array order is the encoding');
});

test('index and word are inverses of each other', () => {
    for (const [i, word] of CUBE_DIRECTIONS.entries()) {
        assert.equal(cubeDirectionIndex(word), i);
        assert.equal(cubeDirectionWord(i), word);
    }
    assert.equal(cubeDirectionWord(CUBE_DIRECTIONS.length), null, 'out of range is null');
    assert.equal(cubeDirectionWord(-1), null);
    assert.equal(cubeDirectionIndex('sideways'), -1);
});

test('pseudocode with a bad direction is caught by the parser, not the emitter', () => {
    // Worth pinning down which layer refuses, because it changes what the
    // emitter guard below is for: the parser does not recognise the statement
    // at all, so it never becomes a block.
    const creator = new SB3Creator();
    creator.parse(program('sideways'));
    assert.ok(creator.warnings.some(w => /unknown command/i.test(w)),
        `expected an unknown-command warning, got ${JSON.stringify(creator.warnings)}`);
});

test('a project whose DIR field is not a direction is refused, not shipped as "up"', () => {
    // The path the emitter guard actually protects: a .sb3 written by another
    // tool, or hand-edited, carrying a field value the menu never offered. The
    // emitter used to end that lookup with `|| 0`, so anything unrecognised
    // shipped as "up" — a cube shifting the wrong way with nothing in the
    // source to explain it.
    const creator = new SB3Creator();
    creator.parse(program('up'));

    let patched = 0;
    for (const target of creator.project.targets) {
        for (const block of Object.values(target.blocks || {})) {
            if (block.opcode === 'ledcube_shift' && block.fields && block.fields.DIR) {
                block.fields.DIR = ['sideways', null];
                patched++;
            }
        }
    }
    assert.equal(patched, 1, 'the fixture should contain exactly one shift block');

    assert.throws(() => creator.generateC(), /not a direction/i);
    assert.throws(() => creator.generateC(), /up, down, left, right, forward, back/);
});

test('an out-of-range wire value is reported, not invented', () => {
    const c = cFor('up').replace('bw_cube_shift(0)', 'bw_cube_shift(9)');
    const back = cToPseudocode(c);
    assert.ok(back.warnings.some(w => /not a known direction/i.test(w)),
        `expected a warning, got: ${JSON.stringify(back.warnings)}`);
    assert.ok(back.pseudocode.includes('shift cube 9'),
        'the number passes through rather than becoming a direction');
});

test('neither side carries its own copy of the direction words', () => {
    // The guard. Both files import the table; a literal list of the direction
    // words in either one is the bug coming back, and it comes back the moment
    // someone adds a direction and "fixes" the other side by hand.
    const files = {
        'sb3Creator.js': resolve(here, '../src/utils/sb3Creator.js'),
        'cToPseudocode.js': resolve(here, '../src/utils/cToPseudocode.js')
    };
    // Three of the six words in sequence on one line. Deliberately NOT matching
    // on quotes: the first version of this guard required them and would have
    // sailed straight past the emitter's original `{ up: 0, down: 1, left: 2 }`,
    // which is the copy that caused the bug. Checked both old forms against it.
    const restated = /\bup\b[^\n]{0,30}\bdown\b[^\n]{0,30}\bleft\b/;

    for (const [name, path] of Object.entries(files)) {
        const source = readFileSync(path, 'utf8');
        const offenders = source.split('\n')
            .map((line, i) => [i + 1, line])
            // The comment in each file quotes the old literal on purpose, to
            // record what went wrong; only code counts.
            .filter(([, line]) => !line.trim().startsWith('//'))
            .filter(([, line]) => restated.test(line));
        assert.deepEqual(offenders, [],
            `${name} restates the direction table; import it from cubeDirections.js`);
    }
});
