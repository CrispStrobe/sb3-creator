// Unit tests for the second wave of features (custom blocks, sensing_of, current
// date, music) discovered by building Breakout / Bomberman / Tetris.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build, blocksOf, findBlock, findAll, hasOpcode, sprite } from './helpers.mjs';

// ---- Custom blocks --------------------------------------------------------------

test('custom block: definition, prototype, and argument reporters', () => {
    const code = `SPRITE S:
  DEFINE draw box (col) (row):
    go to x: col y: row
    stamp
  WHEN flag clicked:
    draw box 3 4
`;
    const c = build(code);
    const b = blocksOf(c, 'S');
    const def = findBlock(b, 'procedures_definition');
    const proto = b[def.inputs.custom_block[1]];
    assert.equal(proto.opcode, 'procedures_prototype');
    assert.equal(proto.mutation.proccode, 'draw box %s %s');
    assert.deepEqual(JSON.parse(proto.mutation.argumentnames), ['col', 'row']);
    // body references params as argument reporters
    const reps = findAll(b, 'argument_reporter_string_number');
    const names = reps.map(r => r.fields.VALUE[0]).sort();
    assert.deepEqual([...new Set(names)], ['col', 'row']);
});

test('custom block: call emits procedures_call with matching proccode + argument ids', () => {
    const code = `SPRITE S:
  DEFINE draw box (col) (row):
    stamp
  WHEN flag clicked:
    draw box 3 4
`;
    const b = blocksOf(build(code), 'S');
    const proto = Object.values(b).find(x => x.opcode === 'procedures_prototype');
    const call = findBlock(b, 'procedures_call');
    assert.equal(call.mutation.proccode, 'draw box %s %s');
    // call argumentids match the definition's argumentids in order
    assert.deepEqual(JSON.parse(call.mutation.argumentids), JSON.parse(proto.mutation.argumentids));
    const ids = JSON.parse(call.mutation.argumentids);
    assert.deepEqual(call.inputs[ids[0]], [1, [4, '3']]);
    assert.deepEqual(call.inputs[ids[1]], [1, [4, '4']]);
});

test('custom block: parenthesized multi-token args are captured whole (regression)', () => {
    // Lazy-regex arg capture used to split "(pr + 1)" into "(pr". Token matching fixes it.
    const code = `SPRITE S:
  DEFINE set cell (row) (col) to (v):
    stamp
  WHEN flag clicked:
    set cell (pr + 1) (pc + 1) to 1
`;
    const b = blocksOf(build(code), 'S');
    const call = findBlock(b, 'procedures_call');
    const ids = JSON.parse(call.mutation.argumentids);
    // first arg is an operator_add block, not the literal string "(pr"
    const arg0 = b[call.inputs[ids[0]][1]];
    assert.equal(arg0.opcode, 'operator_add');
    const arg2 = call.inputs[ids[2]];
    assert.deepEqual(arg2, [1, [4, '1']]);
});

test('custom block: FAST marks warp true; boolean params use %b', () => {
    const code = `SPRITE S:
  DEFINE FAST paint <on>:
    stamp
  WHEN flag clicked:
    paint true
`;
    const b = blocksOf(build(code), 'S');
    const proto = Object.values(b).find(x => x.opcode === 'procedures_prototype');
    assert.equal(proto.mutation.proccode, 'paint %b');
    assert.equal(proto.mutation.warp, 'true');
    assert.ok(hasOpcode(b, 'argument_reporter_boolean'));
});

test('custom block: forward reference (call before DEFINE) resolves', () => {
    const code = `SPRITE S:
  WHEN flag clicked:
    greet 5
  DEFINE greet (n):
    say n
`;
    const c = build(code);
    assert.ok(hasOpcode(blocksOf(c, 'S'), 'procedures_call'));
    assert.equal(c.warnings.length, 0);
});

// ---- sensing_of -----------------------------------------------------------------

test('sensing_of: [property] of [Sprite] and of Stage', () => {
    const code = `SPRITE A:
  WHEN flag clicked:
    set d to x position of B
    set e to backdrop number of Stage
SPRITE B:
  WHEN flag clicked:
    show
`;
    const b = blocksOf(build(code), 'A');
    const ofs = findAll(b, 'sensing_of');
    assert.equal(ofs.length, 2);
    const props = ofs.map(o => o.fields.PROPERTY[0]).sort();
    assert.deepEqual(props, ['backdrop #', 'x position']);
});

test('sensing_of: only triggers for real target names', () => {
    // "2 of hearts" is not a target, so it must NOT become sensing_of.
    const c = build(sprite('S', 'set a to size of NotASprite'));
    assert.ok(!hasOpcode(blocksOf(c, 'S'), 'sensing_of'));
});

// ---- current date + misc --------------------------------------------------------

test('current date reporters', () => {
    const b = blocksOf(build(sprite('S', 'set y to current year\nset w to day of week')), 'S');
    const currents = findAll(b, 'sensing_current');
    const menus = currents.map(x => x.fields.CURRENTMENU[0]).sort();
    assert.deepEqual(menus, ['DAYOFWEEK', 'YEAR']);
});

test('music: play note / set tempo add the music extension', () => {
    const c = build(sprite('S', 'set tempo to 120\nplay note 60 for 0.5 beats\nrest for 1 beats'));
    const b = blocksOf(c, 'S');
    assert.ok(hasOpcode(b, 'music_setTempo'));
    assert.ok(hasOpcode(b, 'music_playNoteForBeats'));
    assert.ok(hasOpcode(b, 'music_restForBeats'));
    assert.ok(c.project.extensions.includes('music'));
});

test('set drag mode / bare turn', () => {
    const b = blocksOf(build(sprite('S', 'set drag mode draggable\nturn 15 degrees')), 'S');
    const drag = findBlock(b, 'sensing_setdragmode');
    assert.deepEqual(drag.fields.DRAG_MODE, ['draggable', null]);
    assert.ok(hasOpcode(b, 'motion_turnright'));
});
