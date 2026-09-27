/**
 * MakeCode's radio handlers, music timing and melodies, and the A+B button, on
 * the micro:bit — from dialect to blocks to dialect (the round trip) and to
 * MicroPython that RUNS: each program is executed by CPython against small
 * stand-ins for the `microbit`, `radio` and `music` modules, and the test reads
 * what the program did (what it scrolled, what it played and when).
 *
 * Why these: brickwright-lite's MakeCode census (batch 2, 2026-09-27) ran
 * MakeCode's own 215 micro:bit doc apps through import and export. The calls
 * lost most often without a word were radio.onReceivedNumber (20 apps: the
 * handler could only be POLLED, so its body ran on every pass whether or not
 * a packet came) and music.beat (12: a beat was frozen to its 120 bpm length);
 * music.noteFrequency was refused in 7, and Button.AB read a variable.
 *
 * The expected values come from MakeCode's source (pxt-microbit 9.1.1,
 * libs/core/music.ts, melodies.ts, playable.ts), not from what the helpers
 * happen to do.
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
 * Stand-ins for the three modules. The clock advances only through sleep()
 * (the scheduler's 1 ms tick) and a blocking tone, so "when" is exact.
 * `radio._inbox` holds [at_ms, text] packets that arrive at that time.
 */
const MICROBIT = `
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
    def _check(self, x, y):
        if not (0 <= x < 5 and 0 <= y < 5):
            raise ValueError('index out of bounds')
    def show(self, img):
        self.px = [row[:] for row in img.rows]
    def clear(self):
        self.px = [[0] * 5 for _ in range(5)]
    def scroll(self, text, delay=150, wait=True, loop=False):
        _scrolled.append([_clock[0], str(text)])
    def set_pixel(self, x, y, v):
        self._check(x, y)
        self.px[y][x] = v
    def get_pixel(self, x, y):
        self._check(x, y)
        return self.px[y][x]
display = _Display()
class _Button:
    def __init__(self):
        self.down = False
    def is_pressed(self):
        return self.down
button_a = _Button()
button_b = _Button()
class _Pin:
    pass
pin0 = _Pin()
def running_time():
    return _clock[0]
def sleep(ms):
    _clock[0] += ms
    if _clock[0] > _limit[0]:
        raise _Stop()
`;
const RADIO = `
import microbit
_inbox = []
_sent = []
_on = [False]
def on():
    _on[0] = True
def config(**kw):
    pass
def send(text):
    _sent.append(text)
def receive():
    if not _on[0]:
        raise ValueError('radio is not enabled')
    if _inbox and _inbox[0][0] <= microbit._clock[0]:
        return _inbox.pop(0)[1]
    return None
`;
const MUSIC = `
import microbit
_log = []
def pitch(frequency, duration=-1, pin=None, wait=True):
    _log.append(['pitch', microbit._clock[0], int(frequency), duration])
    if duration > 0 and wait:
        microbit._clock[0] += duration
def stop(pin=None):
    _log.append(['stop', microbit._clock[0]])
def set_tempo(ticks=4, bpm=120):
    _log.append(['tempo', bpm])
def play(tune, pin=None, wait=True, loop=False):
    _log.append(['play', tune, wait, loop])
for _name in ['DADADADUM', 'ENTERTAINER', 'PRELUDE', 'ODE', 'NYAN', 'RINGTONE', 'FUNK', 'BLUES',
              'BIRTHDAY', 'WEDDING', 'FUNERAL', 'PUNCHLINE', 'PYTHON', 'BADDY', 'CHASE', 'BA_DING',
              'WAWAWAWAA', 'JUMP_UP', 'JUMP_DOWN', 'POWER_UP', 'POWER_DOWN']:
    globals()[_name] = _name
`;

function run(body, { untilMs = 3000, inbox = [], buttons = '', noJson = false } = {}) {
    const py = micropython(body);
    const dir = mkdtempSync(join(tmpdir(), 'bw-mbmusic-'));
    try {
        writeFileSync(join(dir, 'microbit.py'), MICROBIT);
        writeFileSync(join(dir, 'radio.py'), RADIO);
        writeFileSync(join(dir, 'music.py'), MUSIC);
        writeFileSync(join(dir, 'main.py'), py);
        writeFileSync(join(dir, 'harness.py'), [
            'import sys, json',
            `sys.path.insert(0, ${JSON.stringify(dir)})`,
            // The simulator firmware has no json module; the device does.
            ...(noJson ? ["sys.modules['json'] = None"] : []),
            'import microbit, radio, music',
            `microbit._limit[0] = ${untilMs}`,
            `radio._inbox.extend(${JSON.stringify(inbox)})`,
            `microbit.button_a.down = ${/a/.test(buttons) ? 'True' : 'False'}`,
            `microbit.button_b.down = ${/b/.test(buttons) ? 'True' : 'False'}`,
            'try:',
            `    exec(open(${JSON.stringify(join(dir, 'main.py'))}).read(), {'__name__': '__main__'})`,
            'except microbit._Stop:',
            '    pass',
            "print(json.dumps({'scrolled': microbit._scrolled, 'music': music._log, 'sent': radio._sent, 'px': microbit.display.px}))"
        ].join('\n'));
        let out;
        try {
            out = execFileSync('python3', [join(dir, 'harness.py')], { encoding: 'utf8', timeout: 60_000 });
        } catch (e) {
            if (e.code === 'ENOENT') {
                throw new Error('python3 is not on PATH: this test executes the emitted MicroPython and has no other oracle');
            }
            throw new Error(`the emitted MicroPython raised:\n${e.stderr || e.message}\n---\n${py}`);
        }
        const state = JSON.parse(out.trim().split('\n').pop());
        return { ...state, texts: state.scrolled.map(([, t]) => t), grid: state.px.map((r) => r.join('')).join(':'), py };
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

// ── round trip: dialect → blocks → dialect ────────────────────────────────

const ROUND_TRIP = [
    ['microbitplus_beat', 'set b to beat quarter'],
    ['microbitplus_notefreq', 'set f to frequency of note FSharp5'],
    ['microbitplus_tempo', 'set t to music tempo'],
    ['microbitplus_rest', 'rest for 250 ms'],
    ['microbitplus_settempo', 'set music tempo to 90'],
    ['microbitplus_changetempo', 'change music tempo by 20'],
    ['microbitplus_playmelody', 'play melody Dadadadum until done'],
    ['microbitplus_playmelody', 'play melody JumpUp in background'],
    ['microbitplus_playmelody', 'play melody Nyan looping in background'],
    ['microbitplus_playtone', 'play tone frequency of note C hz for beat half ms'],
    ['microbitplus_playtone', 'play tone 440 hz'],
    ['microbitplus_isbutton', 'set p to read button_ab']
];

for (const [opcode, line] of ROUND_TRIP) {
    test(`${opcode}: \`${line}\` parses to its block and prints back to itself`, () => {
        const c = new SB3Creator();
        c.parse(program([line]));
        const blocks = c.project.targets.flatMap((t) => Object.values(t.blocks));
        assert.ok(blocks.some((b) => b.opcode === opcode), `no ${opcode} block from \`${line}\``);
        const printed = c.decompile();
        const again = new SB3Creator();
        again.parse(printed);
        assert.equal(again.decompile(), printed, 'the printed line does not read back to the same program');
        assert.ok(printed.replace(/[()]/g, '').includes(line), `\`${line}\` not in:\n${printed}`);
    });
}

for (const [opcode, hat] of [['microbitplus_whenradionum', 'WHEN radio receives number:'],
    ['microbitplus_whenradiostr', 'WHEN radio receives text:']]) {
    test(`${opcode}: \`${hat}\` is a hat, and prints back to itself`, () => {
        const src = `DEVICE MICROBIT\n\n${hat}\n  display read last radio number\n`;
        const c = new SB3Creator();
        c.parse(src);
        const top = c.project.targets.flatMap((t) => Object.values(t.blocks)).filter((b) => b.topLevel);
        assert.deepEqual(top.map((b) => b.opcode), [opcode]);
        assert.ok(top[0].next, 'the body is not attached to the hat');
        const printed = c.decompile();
        assert.ok(printed.includes(hat), printed);
        const again = new SB3Creator();
        again.parse(printed);
        assert.equal(again.decompile(), printed);
    });
}

test('`set tempo to 60` is still the Scratch music block: the micro:bit verb is qualified', () => {
    const c = new SB3Creator();
    c.parse(program(['set tempo to 60', 'set beat to 3']));
    const ops = c.project.targets.flatMap((t) => Object.values(t.blocks)).map((b) => b.opcode);
    assert.ok(ops.includes('music_setTempo'), ops.join(' '));
    assert.ok(ops.includes('data_setvariableto'), ops.join(' '));
    assert.ok(!ops.some((o) => /microbitplus_(settempo|beat)/.test(o)), ops.join(' '));
});

test('an unknown note or melody name is not invented', () => {
    const c = new SB3Creator();
    c.parse(program(['set f to frequency of note H', 'play melody Nonesuch']));
    const ops = c.project.targets.flatMap((t) => Object.values(t.blocks)).map((b) => b.opcode);
    assert.ok(!ops.includes('microbitplus_notefreq') && !ops.includes('microbitplus_playmelody'), ops.join(' '));
});

test('a literal tone lowers exactly as before', () => {
    const py = micropython(['play tone 880 hz for 200 ms', 'set buzzer to 440 hz']);
    assert.ok(py.includes('music.pitch(int(880), int(200), pin=pin0)'), py);
    assert.ok(py.includes('music.pitch(int(440), pin=pin0)'), py);
});

// ── radio handlers that run ───────────────────────────────────────────────

const RADIO_PROGRAM = (body) => `DEVICE MICROBIT

WHEN flag clicked:
  radio on group 1 power 7

${body}
`;

test('a number handler runs ONCE per packet, not once per pass', () => {
    const { texts } = run(RADIO_PROGRAM('WHEN radio receives number:\n  change count by 1\n  display count\n'),
        { inbox: [[100, '5'], [400, '6']], untilMs: 1000 });
    assert.deepEqual(texts, ['1', '2']);
});

test('each handler sees ITS packet, even when the next one arrives while it waits', () => {
    // MakeCode passes receivedNumber as the handler's parameter. The first
    // handler waits 500 ms; the second packet lands meanwhile. It must still
    // show 5, not 9.
    const { scrolled } = run(RADIO_PROGRAM('WHEN radio receives number:\n  wait 0.5 seconds\n  display read last radio number\n'),
        { inbox: [[100, '5'], [200, '9']], untilMs: 1500 });
    assert.deepEqual(scrolled.map(([, t]) => t), ['5', '9']);
    // The packet is taken at 100 ms, the handler starts on the next 1 ms tick
    // and waits 500: it shows at 601, not before.
    assert.equal(scrolled[0][0], 601, `shown at the wrong time: ${JSON.stringify(scrolled)}`);
});

test('numbers go to the number handler and text to the text handler', () => {
    const { texts } = run(RADIO_PROGRAM('WHEN radio receives number:\n  display read last radio number\n\n' +
        'WHEN radio receives text:\n  show text read last radio text\n'),
    { inbox: [[50, 'hello'], [80, '2.5'], [90, '-3']], untilMs: 500 });
    assert.deepEqual(texts, ['hello', '2.5', '-3']);
});

test('a radio hat alone still turns the radio on and listens', () => {
    const { texts } = run('DEVICE MICROBIT\n\nWHEN radio receives number:\n  display read last radio number\n',
        { inbox: [[10, '42']], untilMs: 200 });
    assert.deepEqual(texts, ['42']);
});

test('reading the last packet without a handler is defined (it was a NameError)', () => {
    const { texts } = run(['display read last radio number', 'show text read last radio text']);
    assert.deepEqual(texts, ['0', '']);
});

test('the last packet outside a handler is the latest one', () => {
    const { texts } = run(RADIO_PROGRAM('WHEN radio receives number:\n  wait 0.001 seconds\n\n' +
        'WHEN flag clicked:\n  wait 0.3 seconds\n  display read last radio number\n'),
    { inbox: [[10, '1'], [20, '2']], untilMs: 500 });
    assert.deepEqual(texts, ['2']);
});

test('a script with nothing to wait on no longer stops every other script', () => {
    // A plain function where the scheduler wanted a generator: it died with
    // "'NoneType' object is not an iterator" before `display 42` could run.
    const { texts } = run('DEVICE MICROBIT:\n  WHEN started:\n    show pattern 90000:00000:00000:00000:00000\n' +
        '  WHEN started:\n    wait 0.1 seconds\n    display 42\n', { untilMs: 500 });
    assert.deepEqual(texts, ['42']);
});

// ── music that keeps MakeCode's time ───────────────────────────────────────

test('a beat is 60000 / tempo, and the fractions shift it (MakeCode music.beat)', () => {
    // 120 bpm: whole 500, half 250, quarter 125, eighth 62, sixteenth 31,
    // double 1000, breve 2000 — MakeCode's `beat >> n` / `beat << n`.
    const { texts } = run(['display beat whole', 'display beat half', 'display beat quarter', 'display beat eighth',
        'display beat sixteenth', 'display beat double', 'display beat breve', 'wait 0.01 seconds']);
    assert.deepEqual(texts, ['500', '250', '125', '62', '31', '1000', '2000']);
});

test('the tempo moves the beat; a tempo that is not above 0 is ignored (setTempo)', () => {
    const { texts, music } = run(['set music tempo to 60', 'display beat whole', 'change music tempo by 40',
        'display music tempo', 'display beat quarter', 'set music tempo to 0', 'display music tempo', 'wait 0.01 seconds']);
    // 60 bpm: 1000 ms; 100 bpm: int(60000/100) >> 2 = 150.
    assert.deepEqual(texts, ['1000', '100', '150', '100']);
    assert.deepEqual(music.filter(([k]) => k === 'tempo'), [['tempo', 60], ['tempo', 100]],
        'the melody tempo did not follow');
});

test('note frequencies are MakeCode\'s Note enum', () => {
    const { texts } = run(['display frequency of note C', 'display frequency of note A', 'display frequency of note C3',
        'display frequency of note FSharp5', 'display frequency of note cSHARP5', 'wait 0.01 seconds']);
    assert.deepEqual(texts, ['262', '440', '131', '740', '555']);
});

test('playTone(noteFrequency(Note.E), beat(Quarter)) plays E for 125 ms', () => {
    const { music } = run(['play tone frequency of note E hz for beat quarter ms', 'wait 0.01 seconds']);
    assert.deepEqual(music[0], ['pitch', 0, 330, 125]);
});

test('a tone with no length rings until the next one (MakeCode ringTone)', () => {
    const { music } = run(['play tone frequency of note G hz', 'wait 0.01 seconds']);
    assert.deepEqual(music[0], ['pitch', 0, 392, -1]);
});

test('rest silences the tone and waits that long, while other scripts run', () => {
    const { music, scrolled } = run('DEVICE MICROBIT:\n  WHEN started:\n    play tone 440 hz\n' +
        '    rest for beat whole ms\n    display 1\n' +
        '  WHEN started:\n    wait 0.2 seconds\n    display 2\n', { untilMs: 2000 });
    assert.deepEqual(music.map(([k]) => k), ['pitch', 'stop']);
    assert.deepEqual(scrolled.map(([, t]) => t), ['2', '1'], 'the rest blocked the other script');
    // One beat at 120 bpm is 500 ms, from the start: `display 1` comes at 500.
    assert.equal(scrolled[1][0], 500, `the rest was not one beat: ${JSON.stringify(scrolled)}`);
});

test('a built-in melody plays by MicroPython\'s constant, until done, in background or looping', () => {
    const { music } = run(['play melody Dadadadum until done', 'play melody BaDing in background',
        'play melody PowerUp looping in background', 'wait 0.01 seconds']);
    assert.deepEqual(music, [['play', 'DADADADUM', true, false], ['play', 'BA_DING', false, false],
        ['play', 'POWER_UP', false, true]]);
});

// ── A+B ───────────────────────────────────────────────────────────────────

test('`read button_ab` is both buttons held, not a variable', () => {
    const body = ['IF read button_ab THEN:', '  display 1', 'ELSE:', '  display 0', 'wait 0.01 seconds'];
    assert.deepEqual(run(body, { buttons: 'ab' }).texts, ['1']);
    assert.deepEqual(run(body, { buttons: 'a' }).texts, ['0']);
    assert.deepEqual(run(body, { buttons: 'b' }).texts, ['0']);
});

// ── what stopped MakeCode's own programs in the simulator ─────────────────
//
// Measured by running every one of MakeCode's 206 compiling doc apps, as lite
// imports them, in lite's micro:bit simulator firmware (2026-09-27): before
// this change 111 stopped with a Python error — 95 on the yield-less task
// above, 8 on `import json`, 7 on the undefined `_radio_last_*`. After it,
// none.

test('a point off the grid is not drawn, and does not stop the program (MakeCode led.plot)', () => {
    // MakeCode ignores it; MicroPython's set_pixel raises ValueError. A falling
    // egg is drawn at y = 5 before the program checks `> 4`.
    const { texts, grid } = run(['set r to 5', 'plot x 2 y r on', 'plot x 0 - 1 y 0 on', 'plot x (r - 1) y 4 on',
        'toggle x 7 y 0', 'display 1', 'wait 0.01 seconds']);
    assert.deepEqual(texts, ['1']);
    assert.equal(grid, '00000:00000:00000:00000:00009');
});

test('a point plainly on the grid draws exactly as before', () => {
    const py = micropython(['plot x 2 y 3 on', 'plot x 4 y 0 off']);
    assert.ok(py.includes('    display.set_pixel(int(2), int(3), 9)\n'), py);
    assert.ok(py.includes('    display.set_pixel(int(4), int(0), 0)\n'), py);
    assert.doesNotMatch(py, /_bw_plot|if 0 <= int/, 'a literal on-grid point grew a check');
});

test('arrays work where there is no json module (the simulator firmware)', () => {
    const { texts } = run(['new array "a" = [3, 1, 2]', 'push 7 to array "a"', 'display item 3 of array "a"',
        'display length of array "a"', 'wait 0.01 seconds'], { noJson: true });
    assert.deepEqual(texts, ['7', '4']);
});

test('reading past the end of an array is empty, as the extension reports it', () => {
    const { texts } = run(['new array "a" = [3, 1, 2]', 'show text item 3 of array "a"', 'show text item 0 - 1 of array "a"',
        'display item 0 of array "a"', 'wait 0.01 seconds']);
    assert.deepEqual(texts, ['', '', '3']);
});

// ── showLeds and showIcon, each as itself ─────────────────────────────────
//
// MakeCode's basic.showLeds pauses 400 ms after drawing and showIcon 600 ms
// (pxt-microbit libs/core/basic.ts, the `interval` defaults). `show pattern`
// draws and moves on, so neither came across exactly, and a picture could not
// say which call it had been on the way back.

for (const [opcode, line] of [['microbitplus_showleds', 'show leds 0909099999999990999000900'],
    ['microbitplus_showicon', 'show icon 0909099999999990999000900']]) {
    test(`${opcode}: \`${line.slice(0, 9)}…\` parses to its block and prints back to itself`, () => {
        const c = new SB3Creator();
        c.parse(program([line]));
        assert.ok(c.project.targets.flatMap((t) => Object.values(t.blocks)).some((b) => b.opcode === opcode));
        const printed = c.decompile();
        assert.ok(printed.includes(line), printed);
        const again = new SB3Creator();
        again.parse(printed);
        assert.equal(again.decompile(), printed);
    });
}

test('show leds waits 400 ms and show icon 600 ms; show pattern does not wait (MakeCode basic.ts)', () => {
    const { scrolled, grid } = run(['show leds 90000:00000:00000:00000:00000', 'display 1',
        'show icon 00009:00000:00000:00000:00000', 'display 2', 'show pattern 00000:00000:00900:00000:00000',
        'display 3', 'wait 0.01 seconds']);
    assert.deepEqual(scrolled, [[400, '1'], [1000, '2'], [1000, '3']]);
    assert.equal(grid, '00000:00000:00900:00000:00000');
});

test('show pattern lowers exactly as before', () => {
    const py = micropython(['show pattern 90000:00000:00000:00000:00000', 'display 1']);
    assert.ok(py.includes("    display.show(Image('90000:00000:00000:00000:00000'))\n    display.scroll("), py);
});
