/**
 * Several boards in one project: `DEVICE <id> AS <Name>:` sections.
 *
 * A board is a layer above sprites: each has its own declarations, its own
 * program and its own sprites. A project without a board header must be read
 * and written exactly as before.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const parse = (src) => { const c = new SB3Creator(); c.parse(src); return c; };
const refused = (src) => {
    try { parse(src); } catch (e) { return (e.unparsed || []).map((u) => u.reason).join('\n') || String(e.message); }
    return null;
};

const PAIR = `DEVICE MICROBIT AS Remote:
GLOBAL sent = 0

STAGE:
  WHEN flag clicked:
    set sent to 1

SPRITE Helper:
  WHEN flag clicked:
    set sent to 2

DEVICE ARDUINO-UNO AS Car:
CLOCK 16000000
PIN led = D13 OUTPUT
LOCAL speed = 50

WHEN flag clicked:
  set speed to 0

SPRITE Wheel:
  WHEN flag clicked:
    set speed to 3
`;

test('a project without a board header has no boards and no boards comment', () => {
    const c = parse('DEVICE MICROBIT\nWHEN flag clicked:\n  set x to 1\n');
    assert.equal(c.project.boards, undefined);
    const stage = c.project.targets.find((t) => t.isStage);
    assert.deepEqual(Object.keys(stage.comments), [SB3Creator.STC_COMMENT_ID]);
    assert.equal(SB3Creator.readBoards(c.project), null);
    assert.doesNotMatch(c.decompile(), / AS /);
});

test('two board sections give two boards, each with its own block and targets', () => {
    const { project } = parse(PAIR);
    assert.deepEqual(project.boards.map((b) => [b.name, b.stc.device, b.targets]),
        [['Remote', 'microbit', ['Helper']], ['Car', 'arduino-uno', ['Car', 'Wheel']]]);
    assert.equal(project.stc, project.boards[0].stc, 'the first board is the project\'s board');
    assert.notEqual(project.boards[0].stc, project.boards[1].stc);
    assert.deepEqual(project.boards[0].stc.pins, [], 'a declaration of the second board leaked into the first');
    assert.deepEqual(project.boards[1].stc.pins.map((p) => p.name), ['led']);
    assert.deepEqual(project.targets.map((t) => t.name), ['Stage', 'Helper', 'Car', 'Wheel']);
    const car = project.targets.find((t) => t.name === 'Car');
    assert.deepEqual(Object.values(car.variables).map((v) => v[0]), ['speed'], 'the later board\'s LOCAL lives on its own sprite');
    assert.ok(Object.values(car.blocks).some((b) => b.topLevel), 'scripts under the header belong to the board\'s sprite');
});

test('the text round-trips, and again after scratch-vm has dropped every key it does not know', () => {
    const first = parse(PAIR);
    const text = first.decompile();
    assert.match(text, /^DEVICE MICROBIT AS Remote:$/m);
    assert.match(text, /^DEVICE ARDUINO-UNO AS Car:$/m);
    assert.match(text, /^PIN led = D13 OUTPUT$/m);
    const again = parse(text);
    assert.equal(again.decompile(), text, 'decompile(parse(text)) is not a fixed point');
    assert.deepEqual(again.project.boards.map((b) => [b.name, b.stc.device, b.targets]),
        first.project.boards.map((b) => [b.name, b.stc.device, b.targets]));

    // What survives a save through scratch-vm: targets and their comments only.
    const saved = JSON.parse(JSON.stringify(first.project));
    delete saved.stc;
    delete saved.boards;
    const recovered = SB3Creator.readBoards(saved);
    assert.deepEqual(recovered.map((b) => b.name), ['Remote', 'Car']);
    assert.equal(new SB3Creator().decompile(saved), text);
});

test('a sprite added to a saved project outside any board stays with the first board', () => {
    const c = parse(PAIR);
    const extra = c.createSprite('Stray');
    c.project.targets.push(extra);
    const text = c.decompile();
    assert.ok(text.indexOf('SPRITE Stray:') < text.indexOf('DEVICE ARDUINO-UNO AS Car:'), text);
});

test('a corrupt boards comment is absent, not invented', () => {
    const saved = JSON.parse(JSON.stringify(parse(PAIR).project));
    delete saved.boards;
    const stage = saved.targets.find((t) => t.isStage);
    stage.comments[SB3Creator.BOARDS_COMMENT_ID].text = `x\n${SB3Creator.BOARDS_MAGIC}[{"name":1}]`;
    assert.equal(SB3Creator.readBoards(saved), null);
});

test('what several boards cannot mean is refused by name', () => {
    assert.match(refused('DEVICE MICROBIT\nDEVICE ARDUINO-UNO AS Car:\n'), /already has a plain DEVICE line/);
    assert.match(refused('DEVICE MICROBIT AS A:\nDEVICE ARDUINO-UNO\n'), /already names its device/);
    assert.match(refused('DEVICE MICROBIT AS A:\nDEVICE MICROBIT AS a:\n'), /already used by a board or a sprite/);
    assert.match(refused('DEVICE MICROBIT AS A:\nSPRITE Car:\n  WHEN flag clicked:\n    set x to 1\nDEVICE ARDUINO-UNO AS Car:\n'),
        /already used by a board or a sprite/);
    assert.match(refused('DEVICE MICROBIT AS A:\nDEVICE NOSUCHCHIP AS B:\n'), /Unknown DEVICE "NOSUCHCHIP"/);
    assert.match(refused('DEVICE MICROBIT AS A:\nDEVICE ARDUINO-UNO AS B:\nSTAGE:\n'), /the Stage belongs to the first board/);
    assert.match(refused('DEVICE MICROBIT AS A:\nDEVICE ARDUINO-UNO AS B:\nGLOBAL n = 1\n'), /declare it with LOCAL/);
    assert.match(refused('DEVICE MICROBIT AS 9lives:\n'), /is not a board name/);
});

test('a refused board header leaves the boards read so far untouched', () => {
    const c = new SB3Creator();
    assert.throws(() => c.parse('DEVICE MICROBIT AS A:\nDEVICE NOSUCHCHIP AS B:\n'));
    assert.deepEqual(c.project.boards.map((b) => b.name), ['A']);
});
