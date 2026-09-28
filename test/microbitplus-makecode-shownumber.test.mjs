/**
 * MakeCode's basic.showNumber as `show number N`, on the micro:bit: from
 * dialect to blocks to dialect, and to MicroPython executed under CPython
 * against a stand-in `microbit` module.
 *
 * Why: lite imported basic.showNumber as `display N`, lite's own display word,
 * which scrolls and moves on. MakeCode's WAITS while the number is shown, so
 * an imported program ran ahead of MakeCode's: a counter that shows each
 * value counted as fast as it could, and a game drew over the score. The
 * owner's decision (2026-09-28): a separate blocking word, as show leds and
 * show icon are; `display` keeps its meaning.
 *
 * The numbers are MakeCode's: pxt-microbit 9.1.1 libs/core/basic.ts
 * (showNumber is showString(Math.roundWithPrecision(value, 2).toString())),
 * and each wait MEASURED 2026-09-28 in pxt-microbit's own simulator:
 * 7 -> 750 ms, 42 and -3 -> 2550, 100 and 2.5 -> 3450, 3.14159 -> 4350
 * ("3.14"), 0.001 -> 5250, 12.999 -> 2550 ("13"), 42 at 100 -> 1700,
 * 5 at 60 -> 300. brickwright-lite holds the import against that simulator.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import SB3Creator from '../src/utils/sb3Creator.js';

const program = (body) => `DEVICE MICROBIT:\n  WHEN started:\n${body.map((l) => `    ${l}`).join('\n')}\n`;
const opcodes = (src) => { const c = new SB3Creator(); c.parse(src); return c.project.targets.flatMap((t) => Object.values(t.blocks)).map((b) => b.opcode); };

const STUB = `
class _Stop(Exception):
    pass
_clock = [0]
_limit = [0]
_log = []
class Image:
    def __init__(self, s='00000:00000:00000:00000:00000'):
        self.rows = [[int(c) for c in row] for row in s.split(':')]
class _Display:
    def show(self, x):
        _log.append([_clock[0], 'show', x if isinstance(x, str) else 'image'])
    def scroll(self, text, delay=150, wait=True, loop=False):
        assert wait is False, 'a blocking scroll stops every other script'
        _log.append([_clock[0], 'scroll', text, delay])
    def clear(self):
        pass
    def set_pixel(self, x, y, v):
        pass
    def get_pixel(self, x, y):
        return 0
display = _Display()
def running_time():
    return _clock[0]
def sleep(ms):
    _clock[0] += ms
    if _clock[0] > _limit[0]:
        raise _Stop()
`;

function run(body, untilMs = 60000) {
    const c = new SB3Creator();
    c.parse(typeof body === 'string' ? body : program(body));
    const r = c.generateMicroPython();
    assert.ok(r.ok, JSON.stringify(r.reasons));
    assert.deepEqual(r.warnings, []);
    const dir = mkdtempSync(join(tmpdir(), 'bw-mbnum-'));
    try {
        writeFileSync(join(dir, 'microbit.py'), STUB);
        writeFileSync(join(dir, 'main.py'), r.py.replace('from microbit import *',
            `from microbit import *\nimport microbit as _mb\n_mb._limit[0] = ${untilMs}`));
        writeFileSync(join(dir, 'harness.py'), [
            'import sys, json',
            `sys.path.insert(0, ${JSON.stringify(dir)})`,
            'import microbit',
            'def _print(*a):',
            "    microbit._log.append([microbit._clock[0], 'print', ' '.join(str(x) for x in a)])",
            'try:',
            `    exec(open(${JSON.stringify(join(dir, 'main.py'))}).read(), {'__name__': '__main__', 'print': _print})`,
            'except microbit._Stop:',
            '    pass',
            "print(json.dumps(microbit._log))"
        ].join('\n'));
        return JSON.parse(execFileSync('python3', [join(dir, 'harness.py')], { encoding: 'utf8' }).trim().split('\n').pop());
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

for (const line of ['show number 7', 'show number (n + 1)', 'show number game score', 'show number n delay 100 ms']) {
    test(`\`${line}\` parses to microbitplus_shownumber and prints back to itself`, () => {
        const c = new SB3Creator();
        c.parse(program([line]));
        assert.ok(opcodes(program([line])).includes('microbitplus_shownumber'));
        const printed = c.decompile();
        const again = new SB3Creator();
        again.parse(printed);
        assert.equal(again.decompile(), printed);
        assert.ok(printed.replace(/[()]/g, '').includes(line.replace(/[()]/g, '')), printed);
    });
}

test('`display N` keeps its meaning, and `show number N on <seven-segment>` is still the STC verb', () => {
    assert.ok(opcodes(program(['display 5'])).includes('microbit_display'));
    assert.ok(!opcodes(program(['display 5'])).includes('microbitplus_shownumber'));
    const stc = 'DEVICE STC89C52RC:\n  PART disp = SEVENSEG8 SEGMENTS P0 SELECT P2.2 P2.3 P2.4\n  WHEN started:\n    show number 42 on disp\n';
    const ops = opcodes(stc);
    assert.ok(ops.includes('stc12_seg_shownum'), ops.join(' '));
    assert.ok(!ops.includes('microbitplus_shownumber'));
});

test('the caller waits as long as MakeCode\'s showNumber: a digit 5 x interval, a number while it scrolls', () => {
    // [value, interval, the wait MEASURED in pxt-microbit's simulator, the text]
    const cases = [['7', 150, 750, '7'], ['0', 150, 750, '0'], ['42', 150, 2550, '42'], ['(0 - 3)', 150, 2550, '-3'],
        ['3.14159', 150, 4350, '3.14'], ['100', 150, 3450, '100'], ['2.5', 150, 3450, '2.5'], ['0.001', 150, 5250, '0.001'],
        ['12.999', 150, 2550, '13'], ['42', 100, 1700, '42'], ['5', 60, 300, '5']];
    const body = [];
    for (const [v, ms] of cases) body.push(ms === 150 ? `show number ${v}` : `show number ${v} delay ${ms} ms`, 'print "done"');
    const log = run(body);
    let t = 0;
    const done = log.filter((e) => e[1] === 'print');
    const shown = log.filter((e) => e[1] !== 'print');
    cases.forEach(([, ms, wait, text], i) => {
        t += wait;
        assert.equal(done[i][0], t, `after ${text}: the caller resumed at ${done[i][0]}, not ${t}`);
        const s = shown[i];
        assert.equal(s[2], text, `${text} was written as ${s[2]}`);
        assert.equal(s[1], text.length === 1 ? 'show' : 'scroll');
        if (s[1] === 'scroll') assert.equal(s[3], ms, 'the scroll speed is the interval');
    });
});

test('the wait is a yield: another script runs while the number is shown', () => {
    const log = run('DEVICE MICROBIT:\n  WHEN started:\n    show number 42\n    print "shown"\n' +
        '  WHEN started:\n    wait 1 seconds\n    print "other"\n', 4000);
    const prints = log.filter((e) => e[1] === 'print').map(([t, , text]) => [t, text]);
    assert.deepEqual(prints, [[1000, 'other'], [2550, 'shown']]);
});

test('with LED sprites, the number is not drawn over: the sprites redraw only after it', () => {
    const log = run(['set s to create sprite at x 0 y 0', 'show number 42', 'print "after"'], 3000);
    assert.equal(log.find((e) => e[1] === 'print')[0], 2550);
    const py = new SB3Creator();
    py.parse(program(['set s to create sprite at x 0 y 0', 'show number 42']));
    assert.match(py.generateMicroPython().py, /_bw_busy = True[\s\S]*_bw_busy = False/);
});
