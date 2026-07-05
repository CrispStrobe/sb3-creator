// Unit tests for the second wave of features (custom blocks, sensing_of, current
// date, music) discovered by building Breakout / Bomberman / Tetris.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build, blocksOf, findBlock, findAll, hasOpcode, sprite, target } from './helpers.mjs';

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

test('bounded reporter binds its index before arithmetic (item .. + 1 of list)', () => {
    // `item (r*8+c)+1 of board` — the trailing + 1 belongs to the index, not an
    // addition wrapping the whole reporter. Found via a Sokoban/Tetris VM run.
    const code = `SPRITE S:
  LIST board
  WHEN flag clicked:
    set out to item ((2 * 8) + 0) + 1 of board
`;
    const b = blocksOf(build(code), 'S');
    const setX = findAll(b, 'data_setvariableto').find(x => x.fields.VARIABLE[0] === 'out');
    // The value is a single item-of-list reporter, not an operator_add of two things.
    const val = b[setX.inputs.VALUE[1]];
    assert.equal(val.opcode, 'data_itemoflist');
    // and its INDEX is ((2*8)+0)+1, i.e. an add whose right operand is 1
    const idx = b[val.inputs.INDEX[1]];
    assert.equal(idx.opcode, 'operator_add');
    assert.deepEqual(idx.inputs.NUM2, [1, [4, '1']]);
});

test('unbounded reporter keeps precedence (abs of x * -1)', () => {
    // Must stay (abs of x) * -1, not abs of (x * -1).
    const b = blocksOf(build(sprite('S', 'set r to abs of vx * -1')), 'S');
    const setR = findAll(b, 'data_setvariableto').find(x => x.fields.VARIABLE[0] === 'r');
    assert.equal(b[setR.inputs.VALUE[1]].opcode, 'operator_multiply');
});

test('set drag mode / bare turn', () => {
    const b = blocksOf(build(sprite('S', 'set drag mode draggable\nturn 15 degrees')), 'S');
    const drag = findBlock(b, 'sensing_setdragmode');
    assert.deepEqual(drag.fields.DRAG_MODE, ['draggable', null]);
    assert.ok(hasOpcode(b, 'motion_turnright'));
});

// ---- Compiler hardening ---------------------------------------------------------

test('warnings carry the source line number', () => {
    const code = `SPRITE S:
  WHEN flag clicked:
    move 10 steps
    frobnicate the widget`;
    const c = build(code);
    assert.ok(c.warnings.some((w) => /^Line 4: .*frobnicate/.test(w)), c.warnings.join(' | '));
});

test('COSTUME declarations add distinct animation frames', () => {
    const c = build(`SPRITE Hero:
  COSTUME walk1
  COSTUME walk2
  WHEN flag clicked:
    next costume`);
    const hero = target(c, 'Hero');
    assert.deepEqual(hero.costumes.map((x) => x.name), ['costume1', 'walk1', 'walk2']);
    assert.equal(new Set(hero.costumes.map((x) => x.assetId)).size, 3, 'each costume is a distinct asset');
});

test('BACKDROP declarations add stage backdrops', () => {
    const c = build(`BACKDROP night
BACKDROP day
SPRITE S:
  WHEN flag clicked:
    switch backdrop to "night"`);
    const stage = target(c, 'Stage');
    assert.deepEqual(stage.costumes.map((x) => x.name), ['backdrop1', 'night', 'day']);
});

test('SOUND declarations and default sounds are audible (non-empty)', () => {
    const c = build(`SPRITE Hero:
  SOUND jump 660
  WHEN flag clicked:
    play sound "jump"`);
    const hero = target(c, 'Hero');
    const jump = hero.sounds.find((s) => s.name === 'jump');
    const meow = hero.sounds.find((s) => s.name === 'Meow');
    assert.ok(jump && jump.sampleCount > 0, 'declared sound has samples');
    assert.ok(meow && meow.sampleCount > 0, 'default sound is no longer silent');
    // the generated asset is a real RIFF/WAVE payload
    const wav = c.assets.get(jump.assetId).data;
    assert.equal(String.fromCharCode(...wav.slice(0, 4)), 'RIFF');
    assert.equal(String.fromCharCode(...wav.slice(8, 12)), 'WAVE');
});

test('unknown sprite references produce a warning', () => {
    const c = build(`SPRITE Snake:
  WHEN flag clicked:
    IF touching Snak THEN:
      say "typo"`);
    assert.ok(c.warnings.some((w) => /unknown sprite "Snak"/.test(w)));
});

test('4-space, tab, and CRLF indentation parse like 2-space', () => {
    const two = `SPRITE S:
  WHEN flag clicked:
    FOREVER:
      IF score > 5 THEN:
        change score by 1
      ELSE:
        change score by 2
      wait 1 seconds`;
    const four = two.replace(/^( +)/gm, (m) => ' '.repeat(m.length * 2));
    const tabs = two.replace(/^( +)/gm, (m) => '\t'.repeat(m.length / 2));
    const crlf = two.replace(/\n/g, '\r\n');
    const shape = (code) => {
        const c = build(code);
        const b = blocksOf(c, 'S');
        return { n: Object.keys(b).length, warns: c.warnings.length, ig: c.checkIntegrity().length };
    };
    const base = shape(two);
    assert.ok(base.warns === 0 && base.ig === 0 && base.n > 5);
    for (const variant of [four, tabs, crlf]) assert.deepEqual(shape(variant), base);
});

test('SHAPE replaces a sprite costume with a real geometric shape', () => {
    const c = build(`SPRITE Paddle:
  SHAPE rect 16 90
  WHEN flag clicked:
    show
SPRITE Ball:
  SHAPE circle 18 #ff0000
  WHEN flag clicked:
    show`);
    const paddle = target(c, 'Paddle');
    const svg = c.assets.get(paddle.costumes[0].assetId).data;
    assert.match(svg, /<rect /);
    assert.match(svg, /width="90"|height="90"/); // 90 appears as a dimension
    assert.equal(paddle.costumes.length, 1);
    const ball = target(c, 'Ball');
    const bsvg = c.assets.get(ball.costumes[0].assetId).data;
    assert.match(bsvg, /<circle /);
    assert.match(bsvg, /#ff0000/); // explicit colour honoured
    assert.equal(c.warnings.length, 0);
});

test('applyCustomSVG bakes an uploaded SVG onto a named sprite', () => {
    const c = build('SPRITE Hero:\n  WHEN flag clicked:\n    show');
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90" viewBox="0 0 120 90"><rect width="120" height="90" fill="purple"/></svg>';
    assert.equal(c.applyCustomSVG('Hero', svg), true);
    assert.equal(c.applyCustomSVG('Nope', svg), false, 'unknown sprite returns false');
    const hero = target(c, 'Hero');
    assert.equal(c.assets.get(hero.costumes[0].assetId).data, svg, 'the uploaded SVG is the costume');
    assert.equal(hero.costumes[0].rotationCenterX, 60);
    assert.equal(hero.costumes[0].rotationCenterY, 45);
    // dimensions fall back to viewBox when width/height are missing
    const c2 = build('SPRITE A:\n  WHEN flag clicked:\n    show');
    c2.applyCustomSVG('A', '<svg viewBox="0 0 40 20"><rect width="40" height="20"/></svg>');
    const a = target(c2, 'A');
    assert.equal(a.costumes[0].rotationCenterX, 20);
    assert.equal(a.costumes[0].rotationCenterY, 10);
});

test('SHAPE polygon bakes an arbitrary custom SVG costume', () => {
    const c = build(`SPRITE Rocket:
  SHAPE polygon 20 0 40 40 20 30 0 40 #ff5533
  WHEN flag clicked:
    show`);
    const rocket = target(c, 'Rocket');
    const svg = c.assets.get(rocket.costumes[0].assetId).data;
    assert.match(svg, /<polygon points="/);
    assert.match(svg, /#ff5533/);
    // bounding box of the points is 40x40 -> svg is 44x44 (2px stroke padding)
    assert.match(svg, /width="44"/);
    assert.equal(c.warnings.length, 0);
});

test('unknown costume and sound names are flagged', () => {
    const c1 = build(sprite('S', 'switch costume to "nope"'));
    assert.ok(c1.warnings.some((w) => /unknown costume "nope"/.test(w)));
    const c2 = build(sprite('S', 'play sound "zzz"'));
    assert.ok(c2.warnings.some((w) => /unknown sound "zzz"/.test(w)));
    // a declared costume / a shared sound (Pop lives on the Stage) do NOT warn
    const ok = build(`SPRITE S:
  COSTUME jump
  WHEN flag clicked:
    switch costume to "jump"
    play sound "Pop"`);
    assert.equal(ok.warnings.length, 0, ok.warnings.join(' | '));
});
