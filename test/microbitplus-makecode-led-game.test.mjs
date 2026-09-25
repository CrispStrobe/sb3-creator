/**
 * MakeCode's `led` and `game` calls on the micro:bit — bar graph, toggle,
 * brightness, stopAnimation, score, lives, game over, pins.map — from
 * dialect to blocks to dialect (the round trip) and to MicroPython that
 * RUNS: each program is executed by CPython against a small stand-in for the
 * `microbit` module, and the test reads the 5x5 display it leaves behind.
 *
 * Why these: brickwright-lite's MakeCode census (2026-09-25) ran MakeCode's
 * own 215 micro:bit doc apps through import, and these were the calls an
 * import most often had to refuse (plotBarGraph in 15 apps, addScore 11,
 * setBrightness 9, stopAnimation 6, gameOver 5, toggle 3, removeLife 2,
 * pins.map 2) or lost (game.score 5).
 *
 * The expected pictures come from MakeCode's source (pxt-microbit 9.1.1,
 * libs/core/led.ts and game.ts), not from what the helpers happen to do.
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
 * A stand-in for the micro:bit's `microbit` module: the display as 25
 * levels, a clock that `sleep` advances, and `display.scroll` recorded
 * rather than animated. The scheduler never ends on its own (a game over
 * loops forever), so the clock stops the run at `untilMs`.
 */
const STUB = `
import json, sys
class _Stop(Exception):
    pass
_clock = [0]
_limit = [0]
_scrolled = []
class Image:
    def __init__(self, s='00000:00000:00000:00000:00000'):
        self.rows = [[int(c) for c in row] for row in s.split(':')]
class _Display:
    def __init__(self):
        self.px = [[0] * 5 for _ in range(5)]
    def set_pixel(self, x, y, v):
        assert 0 <= v <= 9, 'level out of range: %r' % (v,)
        assert isinstance(v, int), 'level must be an int: %r' % (v,)
        self.px[y][x] = v
    def get_pixel(self, x, y):
        return self.px[y][x]
    def show(self, img):
        self.px = [row[:] for row in img.rows]
    def clear(self):
        self.px = [[0] * 5 for _ in range(5)]
    def scroll(self, text, delay=150, wait=True, loop=False):
        _scrolled.append(str(text))
    def read_light_level(self):
        return 0
display = _Display()
def running_time():
    return _clock[0]
def sleep(ms):
    _clock[0] += ms
    if _clock[0] > _limit[0]:
        raise _Stop()
`;

function run(body, untilMs = 2000) {
    const py = micropython(body);
    const dir = mkdtempSync(join(tmpdir(), 'bw-mbled-'));
    try {
        writeFileSync(join(dir, 'microbit.py'), STUB);
        const main = py.replace('from microbit import *',
            `from microbit import *\nimport microbit as _mb\n_mb._limit[0] = ${untilMs}`);
        writeFileSync(join(dir, 'main.py'), main);
        writeFileSync(join(dir, 'harness.py'), [
            'import sys, json',
            `sys.path.insert(0, ${JSON.stringify(dir)})`,
            'import microbit',
            'try:',
            `    exec(open(${JSON.stringify(join(dir, 'main.py'))}).read(), {'__name__': '__main__'})`,
            'except microbit._Stop:',
            '    pass',
            "print(json.dumps({'px': microbit.display.px, 'scrolled': microbit._scrolled}))"
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
        return { ...state, grid: state.px.map((row) => row.join('')).join(':'), py };
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

// ── round trip: dialect → blocks → dialect ────────────────────────────────

const ROUND_TRIP = [
    ['microbitplus_plotbargraph', 'plot bar graph of 4 up to 16'],
    ['microbitplus_toggle', 'toggle x 1 y 2'],
    ['microbitplus_setbrightness', 'set display brightness to 128'],
    ['microbitplus_stopanimation', 'stop animation'],
    ['microbitplus_addscore', 'change game score by 2'],
    ['microbitplus_setscore', 'set game score to 5'],
    ['microbitplus_removelife', 'remove game life 1'],
    ['microbitplus_gameover', 'game over'],
    ['microbitplus_score', 'set s to game score'],
    ['microbitplus_map', 'set m to map v from low 0 high 1023 to low 0 high 4']
];

for (const [opcode, line] of ROUND_TRIP) {
    test(`${opcode}: \`${line}\` parses to its block and prints back to itself`, () => {
        const c = new SB3Creator();
        c.parse(program([line]));
        const blocks = Object.values(c.project.targets.flatMap((t) => Object.values(t.blocks)));
        assert.ok(blocks.some((b) => b.opcode === opcode), `no ${opcode} block from \`${line}\``);
        const printed = c.decompile();
        const again = new SB3Creator();
        again.parse(printed);
        assert.equal(again.decompile(), printed, 'the printed line does not read back to the same program');
        // The printer may parenthesise a reporter; the words stay the same.
        assert.ok(printed.replace(/[()]/g, '').includes(line), `\`${line}\` not in:\n${printed}`);
    });
}

test('`set brightness to 50` is still a variable: the display verb is qualified', () => {
    const c = new SB3Creator();
    c.parse(program(['set brightness to 50', 'change score by 1']));
    const ops = c.project.targets.flatMap((t) => Object.values(t.blocks)).map((b) => b.opcode);
    assert.ok(ops.includes('data_setvariableto'), ops.join(' '));
    assert.ok(ops.includes('data_changevariableby'), ops.join(' '));
    assert.ok(!ops.some((o) => /setbrightness|addscore/.test(o)), ops.join(' '));
});

// ── MicroPython that runs ─────────────────────────────────────────────────

test('bar graph: 4 of 16 lights the bottom row and grows from the centre (MakeCode led.ts)', () => {
    // v = 4/16; cells are walked bottom-up, centre column first, k += 1/16,
    // and a cell is lit while k <= v: k = 0..4 → the whole bottom row, then
    // the centre and its two neighbours on the row above.
    const { grid } = run(['plot bar graph of 4 up to 16', 'wait 0.01 seconds']);
    assert.equal(grid, '00000:00000:00000:09990:99999');
});

test('bar graph: high 0 auto-scales to the largest value seen', () => {
    // First value 10 becomes the maximum (full bar); 5 of that is half:
    // k = 0..8/16 → the bottom three rows.
    const { grid } = run(['plot bar graph of 10 up to 0', 'plot bar graph of 5 up to 0', 'wait 0.01 seconds']);
    assert.equal(grid, '00000:00000:99999:99999:99999');
});

test('bar graph: a negative value plots its magnitude', () => {
    const { grid } = run(['plot bar graph of 0 - 16 up to 16', 'wait 0.01 seconds']);
    assert.equal(grid, '99999:99999:99999:99999:99999');
});

test('toggle flips a pixel each way', () => {
    const { grid } = run(['plot x 1 y 1 on', 'toggle x 1 y 1', 'toggle x 3 y 3', 'wait 0.01 seconds']);
    assert.equal(grid, '00000:00000:00000:00090:00000');
});

test('brightness scales what is on screen AND what is drawn after it', () => {
    // (9 * 128 + 254) // 255 = 5
    const { grid } = run(['plot x 0 y 0 on', 'set display brightness to 128', 'plot x 4 y 4 on', 'wait 0.01 seconds']);
    assert.equal(grid, '50000:00000:00000:00000:00005');
});

test('brightness: fading to 0 and back restores the picture', () => {
    const { grid } = run(['show pattern 90009:00000:00900:00000:90009', 'set display brightness to 0',
        'set display brightness to 255', 'wait 0.01 seconds']);
    assert.equal(grid, '90009:00000:00900:00000:90009');
});

test('brightness: a shown pattern is drawn at the brightness in force', () => {
    const { grid } = run(['set display brightness to 28', 'show pattern 90000:00000:00000:00000:00000', 'wait 0.01 seconds']);
    // (9 * 28 + 254) // 255 = 1 — dim, but lit
    assert.equal(grid, '10000:00000:00000:00000:00000');
});

test('a program that never sets brightness draws exactly as before', () => {
    const py = micropython(['plot x 2 y 3 on', 'show pattern 90000:00000:00000:00000:00000']);
    assert.ok(py.includes('display.set_pixel(int(2), int(3), 9)'), py);
    assert.ok(py.includes("display.show(Image('90000:00000:00000:00000:00000'))"), py);
    assert.doesNotMatch(py, /_bw_lvl|_bw_bright/, 'a non-dimming program grew the brightness machinery');
});

test('stop animation keeps the frame on screen', () => {
    const { grid } = run(['show pattern 09090:00000:00000:00000:00000', 'stop animation', 'wait 0.01 seconds']);
    assert.equal(grid, '09090:00000:00000:00000:00000');
});

test('game score counts, and never goes below 0 (game.setScore clamps)', () => {
    const { scrolled } = run(['change game score by 3', 'display game score', 'change game score by 0 - 10',
        'display game score', 'wait 0.01 seconds']);
    assert.deepEqual(scrolled, ['3', '0']);
});

test('set game score replaces the score, clamped at 0 like game.setScore', () => {
    const { scrolled } = run(['change game score by 3', 'set game score to 10', 'display game score',
        'set game score to 0 - 4', 'display game score', 'wait 0.01 seconds']);
    assert.deepEqual(scrolled, ['10', '0']);
});

test('reading only `game score` still defines it', () => {
    const { scrolled } = run(['display game score', 'wait 0.01 seconds']);
    assert.deepEqual(scrolled, ['0']);
});

test('losing the third life is game over, which shows GAME OVER and the score', () => {
    const { scrolled } = run(['change game score by 7', 'remove game life 1', 'display game score',
        'remove game life 2', 'display 99'], 10_000);
    // After the first life only the program's own display ran; the third
    // life ends the game, so `display 99` is never reached.
    assert.equal(scrolled[0], '7');
    assert.ok(scrolled.includes(' GAMEOVER '), JSON.stringify(scrolled));
    assert.ok(scrolled.includes(' SCORE '), JSON.stringify(scrolled));
    assert.equal(scrolled[scrolled.indexOf(' SCORE ') + 1], '7');
    assert.ok(!scrolled.includes('99'), 'the script went on after game over');
});

test('game over leaves the other scripts running (MakeCode unplugs only events)', () => {
    const { scrolled } = run('DEVICE MICROBIT:\n  WHEN started:\n    game over\n' +
        '  WHEN started:\n    wait 1 seconds\n    display 42\n', 10_000);
    assert.ok(scrolled.includes('42'), `the other script stopped: ${JSON.stringify(scrolled)}`);
    assert.ok(scrolled.includes(' GAMEOVER '), JSON.stringify(scrolled));
});

test('map is pins.map: ((v - a) * (d - c)) / (b - a) + c', () => {
    const { scrolled } = run(['set m to map 512 from low 0 high 1023 to low 0 high 4', 'display m',
        'set n to map 5 from low 0 high 10 to low 100 high 200', 'display n', 'wait 0.01 seconds']);
    assert.deepEqual(scrolled, [String(512 * 4 / 1023), '150.0']);
});
