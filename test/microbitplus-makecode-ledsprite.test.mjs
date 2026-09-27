/**
 * MakeCode's LED sprites (game.LedSprite) and the game state around them on
 * the micro:bit — from dialect to blocks to dialect (the round trip) and to
 * MicroPython that RUNS: each program is executed by CPython against a small
 * stand-in for the `microbit` module, and the test reads what the program
 * printed and the 5x5 display it left behind.
 *
 * Why these: brickwright-lite's MakeCode census (2026-09-27) ran MakeCode's own
 * 215 micro:bit doc apps through import and export. Every app with a sprite
 * (hero, crashy-bird, snap-the-dot, radio-dashboard) had to refuse it —
 * `game.createSprite()` had no value form, and snap-the-dot did not even
 * recompile — and headbands refused game.startCountdown.
 *
 * A sprite is a numbered HANDLE (1, 2, 3 in creation order; 0 is none) in an
 * ordinary variable or array. The expected values come from MakeCode's source
 * (pxt-microbit 9.1.1 libs/core/game.ts), not from what the helpers happen to
 * do; brickwright-lite additionally compares the model with pxt-microbit's own
 * simulator on scripted sequences.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import SB3Creator from '../src/utils/sb3Creator.js';

const program = (body) => `DEVICE MICROBIT:\n  WHEN started:\n${body.map((l) => `    ${l}`).join('\n')}\n`;

function micropython(body) {
    const c = new SB3Creator();
    c.parse(typeof body === 'string' ? body : program(body));
    const r = c.generateMicroPython();
    assert.ok(r.ok, `MicroPython gen failed: ${JSON.stringify(r.reasons)}`);
    assert.deepEqual(r.warnings, [], 'nothing here should degrade');
    return r.py;
}

/**
 * A stand-in for `microbit`: the display as 25 levels (a level must be an int
 * in 0..9, as the device's is), a clock that `sleep` advances, and show()
 * recorded with its time so an animation can be read back frame by frame.
 */
const STUB = `
class _Stop(Exception):
    pass
_clock = [0]
_limit = [0]
_shown = []
class Image:
    def __init__(self, s='00000:00000:00000:00000:00000'):
        self.s = s
        self.rows = [[int(c) for c in row] for row in s.split(':')]
class _Display:
    def __init__(self):
        self.px = [[0] * 5 for _ in range(5)]
    def set_pixel(self, x, y, v):
        assert isinstance(v, int), 'level must be an int: %r' % (v,)
        assert 0 <= v <= 9, 'level out of range: %r' % (v,)
        self.px[y][x] = v
    def get_pixel(self, x, y):
        return self.px[y][x]
    def show(self, img):
        _shown.append([_clock[0], img.s])
        self.px = [row[:] for row in img.rows]
    def clear(self):
        self.px = [[0] * 5 for _ in range(5)]
    def scroll(self, text, delay=150, wait=True, loop=False):
        pass
display = _Display()
def running_time():
    return _clock[0]
def sleep(ms):
    _clock[0] += ms
    if _clock[0] > _limit[0]:
        raise _Stop()
`;

function run(body, untilMs = 1000) {
    const py = micropython(body);
    const dir = mkdtempSync(join(tmpdir(), 'bw-mbspr-'));
    try {
        writeFileSync(join(dir, 'microbit.py'), STUB);
        const main = py.replace('from microbit import *',
            `from microbit import *\nimport microbit as _mb\n_mb._limit[0] = ${untilMs}`);
        writeFileSync(join(dir, 'main.py'), main);
        writeFileSync(join(dir, 'harness.py'), [
            'import sys, json',
            `sys.path.insert(0, ${JSON.stringify(dir)})`,
            'import microbit',
            '_log = []',
            "def _print(*a):",
            "    _log.append([microbit._clock[0], ' '.join(str(x) for x in a)])",
            'try:',
            `    exec(open(${JSON.stringify(join(dir, 'main.py'))}).read(), {'__name__': '__main__', 'print': _print})`,
            'except microbit._Stop:',
            '    pass',
            "print(json.dumps({'px': microbit.display.px, 'log': _log, 'shown': microbit._shown}))"
        ].join('\n'));
        let out;
        try {
            out = execFileSync('python3', [join(dir, 'harness.py')], { encoding: 'utf8', timeout: 60_000 });
        } catch (e) {
            if (e.code === 'ENOENT') {
                throw new Error('python3 is not on PATH: this test executes the emitted MicroPython and has no other oracle');
            }
            throw new Error(`the emitted MicroPython raised:\n${e.stderr || e.message}\n---\n${main}`);
        }
        const state = JSON.parse(out.trim().split('\n').pop());
        return {
            ...state,
            grid: state.px.map((row) => row.join('')).join(':'),
            printed: state.log.map(([, text]) => text),
            py
        };
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

/** `print` of a sprite's five properties, comma-separated, in LedSpriteProperty order. */
const state = (s) => `print (x of sprite ${s}) join "," join (y of sprite ${s}) join "," join (direction of sprite ${s}) join "," join (brightness of sprite ${s})`;

// ── round trip: dialect → blocks → dialect ────────────────────────────────

const ROUND_TRIP = [
    ['microbitplus_createsprite', 'set s to create sprite at x 2 y 3'],
    ['microbitplus_createsprite', 'set s to create sprite at x (a + 1) y (b * 2)'],
    ['microbitplus_spriteget', 'set v to x of sprite s'],
    ['microbitplus_spriteget', 'set v to blink of sprite (item 0 of array "obs")'],
    ['microbitplus_spriteset', 'set sprite s direction to 45'],
    ['microbitplus_spriteset', 'set sprite (item i of array "obs") brightness to 8'],
    ['microbitplus_spritechange', 'change sprite s y by (0 - 1)'],
    ['microbitplus_spritechange', 'change sprite s blink by 100'],
    ['microbitplus_spritemove', 'move sprite s by 1'],
    ['microbitplus_spriteturn', 'turn sprite s right by 45 degrees'],
    ['microbitplus_spriteturn', 'turn sprite s left by (n * 45) degrees'],
    ['microbitplus_spritebounce', 'bounce sprite s if on edge'],
    ['microbitplus_spritedelete', 'delete sprite (item 0 of array "obs")'],
    ['microbitplus_spritetouching', 'IF sprite s touching sprite t THEN:'],
    ['microbitplus_spritetouchingedge', 'IF sprite s touching edge THEN:'],
    ['microbitplus_spritedeleted', 'IF sprite s deleted THEN:'],
    ['microbitplus_isgameover', 'IF game is over THEN:'],
    ['microbitplus_isrunning', 'IF game is running THEN:'],
    ['microbitplus_ispaused', 'IF game is paused THEN:'],
    ['microbitplus_life', 'set v to game life'],
    ['microbitplus_startcountdown', 'start countdown 10000 ms'],
    ['microbitplus_pausegame', 'pause game'],
    ['microbitplus_resumegame', 'resume game'],
    ['microbitplus_setlife', 'set game life to 5'],
    ['microbitplus_addlife', 'add game life 2']
];

for (const [opcode, line] of ROUND_TRIP) {
    test(`${opcode}: \`${line}\` parses to its block and prints back to itself`, () => {
        const body = /THEN:$/.test(line) ? [line, '  pause game'] : [line];
        const c = new SB3Creator();
        c.parse(program(body));
        const blocks = c.project.targets.flatMap((t) => Object.values(t.blocks));
        assert.ok(blocks.some((b) => b.opcode === opcode), `no ${opcode} block from \`${line}\``);
        const printed = c.decompile();
        const again = new SB3Creator();
        again.parse(printed);
        assert.equal(again.decompile(), printed, 'the printed line does not read back to the same program');
        // The printer parenthesises a reporter and asks a boolean `= "true"`;
        // the words stay the same.
        const words = (s) => s.replace(/[()]/g, '').replace(/ = "true"/g, '');
        assert.ok(words(printed).includes(words(line)), `\`${line}\` not in:\n${printed}`);
    });
}

test('the sprite words do not take over the Scratch motion, list and variable verbs', () => {
    const c = new SB3Creator();
    c.parse(`DEVICE MICROBIT:\n  WHEN started:\n    move 10 steps\n    turn right 15 degrees\n    if on edge, bounce\n` +
        `    set sprite_count to 3\n    change sprite_count by 1\n`);
    const ops = c.project.targets.flatMap((t) => Object.values(t.blocks)).map((b) => b.opcode);
    for (const op of ['motion_movesteps', 'motion_turnright', 'motion_ifonedgebounce', 'data_setvariableto', 'data_changevariableby']) {
        assert.ok(ops.includes(op), `${op} missing: ${ops.join(' ')}`);
    }
    assert.ok(!ops.some((op) => /sprite/.test(op)), `a sprite block appeared: ${ops.join(' ')}`);
});

test('`set sprite s x by 1` and `change sprite s x to 1` are not sprite words (the verb names its preposition)', () => {
    for (const line of ['set sprite s x by 1', 'change sprite s x to 1']) {
        const c = new SB3Creator();
        c.parse(program([line]));
        const ops = c.project.targets.flatMap((t) => Object.values(t.blocks)).map((b) => b.opcode);
        assert.ok(!ops.includes('microbitplus_spriteset') && !ops.includes('microbitplus_spritechange'), `${line}: ${ops.join(' ')}`);
    }
});

// ── the model, executed ───────────────────────────────────────────────────

test('a sprite starts pointing right at full brightness, clamped onto the grid; handles count from 1', () => {
    const r = run(['set a to create sprite at x 7 y (0 - 2)', 'set b to create sprite at x 2 y 3', 'print a', 'print b', state('a'), state('b')]);
    assert.deepEqual(r.printed, ['1', '2', '4,0,90,255', '2,3,90,255']);
});

test('setDirection floors to a multiple of 45 with JavaScript\'s remainder, folded into -135..180 (game.ts)', () => {
    // (Math.floor(d / 45) % 8) * 45, then <= -180 -> +360, > 180 -> -360.
    const cases = [[50, 45], [-10, -45], [225, -135], [-180, 180], [360, 0], [181, 180], [270, -90], [-200, 135], [-405, -45], [720, 0]];
    const body = ['set a to create sprite at x 2 y 2'];
    for (const [d] of cases) {
        body.push(`set sprite a direction to ${d < 0 ? `(0 - ${-d})` : d}`, 'print direction of sprite a');
    }
    const r = run(body);
    assert.deepEqual(r.printed.map(Number), cases.map(([, want]) => want));
});

test('turn right/left adds/subtracts, then rounds as setDirection does; change direction turns right', () => {
    const r = run(['set a to create sprite at x 2 y 2',
        'turn sprite a right by 45 degrees', 'print direction of sprite a',
        'turn sprite a left by 200 degrees', 'print direction of sprite a',
        'change sprite a direction by 100', 'print direction of sprite a']);
    // 90+45 = 135; 135-200 = -65 -> floor(-1.44) = -2 -> -90; -90+100 = 10 -> 0
    assert.deepEqual(r.printed, ['135', '-90', '0']);
});

test('move goes one LED per unit along the direction, clamped at the edge; -135 is the else branch', () => {
    const dirs = [[0, '2,1'], [45, '3,1'], [90, '3,2'], [135, '3,3'], [180, '2,3'], [-45, '1,1'], [-90, '1,2'], [-135, '1,3']];
    const body = [];
    for (const [d] of dirs) {
        body.push('set a to create sprite at x 2 y 2', `set sprite a direction to ${d < 0 ? `(0 - ${-d})` : d}`,
            'move sprite a by 1', 'print (x of sprite a) join "," join (y of sprite a)', 'delete sprite a');
    }
    body.push('set b to create sprite at x 4 y 4', 'move sprite b by 3', 'print (x of sprite b) join "," join (y of sprite b)',
        'move sprite b by (0 - 9)', 'print (x of sprite b) join "," join (y of sprite b)');
    const r = run(body);
    assert.deepEqual(r.printed, [...dirs.map(([, want]) => want), '4,4', '0,4']);
});

test('if on edge, bounce is MakeCode\'s table, corners included', () => {
    // [x, y, direction] -> direction after bounce (game.ts ifOnEdgeBounce)
    const cases = [
        [2, 0, 0, 180], [2, 1, 0, 0], [4, 2, 45, -45], [2, 0, 45, 135], [4, 0, 45, 135], [4, 2, 90, -90],
        [4, 2, 135, -135], [2, 4, 135, 45], [4, 4, 135, -45], [2, 4, 180, 0], [0, 2, -45, 45], [2, 0, -45, -135],
        [0, 0, -45, 135], [0, 2, -90, 90], [0, 2, -135, 135], [2, 4, -135, -45], [0, 4, -135, 45], [2, 2, 90, 90]
    ];
    const body = [];
    for (const [x, y, d] of cases) {
        body.push(`set a to create sprite at x ${x} y ${y}`, `set sprite a direction to ${d < 0 ? `(0 - ${-d})` : d}`,
            'bounce sprite a if on edge', 'print direction of sprite a', 'delete sprite a');
    }
    const r = run(body);
    assert.deepEqual(r.printed.map(Number), cases.map((c) => c[3]));
});

test('touching is the same pixel with both alive; an edge is row/column 0 or 4; a deleted sprite touches nothing', () => {
    const r = run(['set a to create sprite at x 2 y 2', 'set b to create sprite at x 2 y 2', 'set c to create sprite at x 0 y 3',
        'IF sprite a touching sprite b THEN:', '  print "ab"',
        'IF sprite a touching sprite c THEN:', '  print "ac"',
        'IF sprite c touching edge THEN:', '  print "c edge"',
        'IF sprite a touching edge THEN:', '  print "a edge"',
        'delete sprite b',
        'IF sprite a touching sprite b THEN:', '  print "ab after"',
        'IF sprite b deleted THEN:', '  print "b deleted"',
        'IF sprite a deleted THEN:', '  print "a deleted"',
        'delete sprite c',
        'IF sprite c touching edge THEN:', '  print "c edge after"']);
    assert.deepEqual(r.printed, ['ab', 'c edge', 'b deleted']);
});

test('set/change x and y go to the point clamped; brightness clamps to 0..255; blink to 0..10000', () => {
    const r = run(['set a to create sprite at x 1 y 1',
        'set sprite a x to 9', 'change sprite a y by (0 - 5)', state('a'),
        'set sprite a brightness to 300', 'print brightness of sprite a',
        'change sprite a brightness by (0 - 400)', 'print brightness of sprite a',
        'set sprite a blink to 20000', 'print blink of sprite a',
        'change sprite a blink by (0 - 30000)', 'print blink of sprite a']);
    assert.deepEqual(r.printed, ['4,0,90,255', '255', '0', '10000', '0']);
});

test('a fresh sprite\'s blink is undefined in MakeCode, so changing it gives NaN and the sprite never blinks', () => {
    // hero's ghost: ghost.change(LedSpriteProperty.Blink, 100) on a new sprite.
    const r = run(['set g to create sprite at x 0 y 0', 'change sprite g blink by 100', 'print blink of sprite g',
        'wait 0.1 seconds', 'print (x of sprite g)'], 400);
    assert.equal(r.printed[0], 'nan');
    assert.equal(r.grid, '90000:00000:00000:00000:00000', 'a NaN blink is never off');
});

test('the screen is the sprites: live ones drawn at their brightness (summed, capped), redrawn every 30 ms', () => {
    const r = run(['set a to create sprite at x 1 y 1', 'set b to create sprite at x 1 y 1', 'set c to create sprite at x 3 y 4',
        'set sprite a brightness to 8', 'set sprite b brightness to 8', 'set sprite c brightness to 100',
        'set d to create sprite at x 0 y 0', 'delete sprite d', 'plot x 4 y 0 on', 'wait 0.1 seconds']);
    // 16/255 -> level 1 (anything lit stays lit), 100 -> 4; the plotted LED
    // is wiped by the next redraw, as MakeCode's plot() clears its image.
    assert.equal(r.grid, '00000:01000:00000:00000:00040');
});

test('a blinking sprite shows while floor(now / blink) is even', () => {
    const at = (ms) => run(['set a to create sprite at x 2 y 2', 'set sprite a blink to 200', `wait ${ms / 1000} seconds`], ms + 5).grid;
    assert.equal(at(100), '00000:00000:00900:00000:00000');
    assert.equal(at(290), '00000:00000:00000:00000:00000');
    assert.equal(at(430), '00000:00000:00900:00000:00000');
});

test('pause game stops the redraw (after one last plot); resume redraws; running needs a sprite', () => {
    const r = run(['IF game is running THEN:', '  print "running before"',
        'set a to create sprite at x 0 y 0',
        'IF game is running THEN:', '  print "running"',
        'pause game', 'move sprite a by 2',
        'IF game is paused THEN:', '  print "paused"',
        'IF game is running THEN:', '  print "running while paused"',
        'wait 0.1 seconds', 'print (x of sprite a)'], 300);
    assert.deepEqual(r.printed, ['running', 'paused', '2']);
    assert.equal(r.grid, '90000:00000:00000:00000:00000', 'paused: the old frame stays');
    const resumed = run(['set a to create sprite at x 0 y 0', 'pause game', 'move sprite a by 2', 'resume game', 'wait 0.1 seconds'], 300);
    assert.equal(resumed.grid, '00900:00000:00000:00000:00000');
});

test('a handle that names no sprite does nothing and reads 0', () => {
    const r = run(['set a to create sprite at x 1 y 1', 'move sprite 0 by 1', 'move sprite 7 by 1', 'delete sprite 0',
        'print x of sprite 0', 'print x of sprite 9', 'IF sprite 0 touching sprite a THEN:', '  print "touch"', state('a')]);
    assert.deepEqual(r.printed, ['0', '0', '1,1,90,255']);
});

test('game over stops the sprite engine: the game-over sequence owns the screen', () => {
    const r = run(['set a to create sprite at x 0 y 0', 'game over'], 150);
    // game over clears, waits 100 ms, then fills the screen; no sprite redraw at 30/60/90 ms.
    assert.equal(r.grid, '99999:99999:99999:99999:99999');
});

test('startCountdown plays MakeCode\'s nine 400 ms intro frames, then game over comes max(500, ms) later', () => {
    const r = run(['print "start"', 'start countdown 100 ms', 'print "after"', 'IF game is over THEN:', '  print "over"'], 4300);
    assert.deepEqual(r.log, [[0, 'start'], [3600, 'after']], 'the caller waits for the intro, and the game is not over yet');
    const a = '90909:09090:90909:09090:90909';
    const b = '09090:90909:09090:90909:09090';
    const on = '99999:99999:99999:99999:99999';
    assert.deepEqual(r.shown.slice(0, 9), [[0, a], [400, b], [800, a], [1200, b], [1600, a], [2000, b],
        [2400, on], [2800, on], [3200, '00000:00000:00000:00000:00000']]);
    // 500 ms (the floor) after the intro: game over clears at 4100 and fills
    // the screen at 4200 (+1: the timer task starts on the scheduler's next 1 ms pass).
    const [when, frame] = r.shown[9] || [];
    assert.equal(frame, on, JSON.stringify(r.shown.slice(8)));
    assert.ok(when >= 4200 && when <= 4202, `game over filled the screen at ${when}, not 4200`);
    const twice = run(['start countdown 1000 ms', 'start countdown 1000 ms', 'print "second returned"'], 4000);
    assert.deepEqual(twice.log, [[3600, 'second returned']], 'a second countdown is ignored, as checkStart() refuses it');
});

test('set life ends the game at 0; add life adds; game life reads it', () => {
    const r = run(['print game life', 'add game life 2', 'print game life', 'set game life to (0 - 3)', 'print "unreached"'], 350);
    assert.deepEqual(r.printed, ['3', '5']);
    assert.equal(r.grid, '99999:99999:99999:99999:99999', 'life 0 is game over');
});

test('sprites in an array: handles are numbers, so the arrays shim keeps them', () => {
    const r = run(['new array "obs"', 'set k to 0', 'REPEAT 3:', '  push create sprite at x 4 y k to array "obs"', '  change k by 1',
        'change sprite (item 1 of array "obs") x by (0 - 2)', 'delete sprite (item 0 of array "obs")',
        'print item 1 of array "obs"', 'print x of sprite (item 1 of array "obs")',
        'IF sprite (item 0 of array "obs") deleted THEN:', '  print "first gone"', 'wait 0.05 seconds'], 200);
    assert.deepEqual(r.printed, ['2', '2', 'first gone']);
    assert.equal(r.grid, '00000:00900:00009:00000:00000');
});

test('a program with no sprite gets none of the engine', () => {
    const py = micropython(['change game score by 1', 'game over']);
    assert.ok(!/_bw_sprites|_bw_splot|_bw_spr\b/.test(py), 'sprite helpers emitted for a sprite-less program');
});
