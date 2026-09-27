/**
 * MakeCode census batch 3 on the micro:bit: the touch logo, the radio's signal
 * strength, and sound — music.play(tonePlayable) with its playback mode, the
 * V2 built-in sounds and music.playSoundEffect(createSoundEffect(...)). Round
 * trip (dialect -> blocks -> dialect) and MicroPython EXECUTED under CPython
 * against stand-ins that carry MicroPython V2's own names (audio.SoundEffect.
 * WAVEFORM_*, FX_*, SHAPE_*, Sound.*, pin_logo, radio.receive_full), so a
 * wrong name raises here as it does on the board.
 *
 * Why these: brickwright-lite's census (2026-09-27) — playSoundEffect refused
 * in 4 apps, music.play of a tone or sound expression in 3, receivedPacket in
 * 4 (SignalStrength in 2), onLogoEvent in 2. The emitted names were checked in
 * lite's simulator firmware (MicroPython v1.18, micro:bit v2.1.1).
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
class _Logo:
    def __init__(self):
        self.down = False
    def is_touched(self):
        return self.down
pin_logo = _Logo()
_played = []
class Sound:
    pass
for _n in ['GIGGLE', 'HAPPY', 'HELLO', 'MYSTERIOUS', 'SAD', 'SLIDE', 'SOARING', 'SPRING', 'TWINKLE', 'YAWN']:
    setattr(Sound, _n, _n)
class _SoundEffect:
    # MicroPython V2's constant names, so a wrong one raises AttributeError
    WAVEFORM_SINE = 'sine'; WAVEFORM_SAWTOOTH = 'sawtooth'; WAVEFORM_TRIANGLE = 'triangle'
    WAVEFORM_SQUARE = 'square'; WAVEFORM_NOISE = 'noise'
    FX_NONE = 'none'; FX_TREMOLO = 'tremolo'; FX_VIBRATO = 'vibrato'; FX_WARBLE = 'warble'
    SHAPE_LINEAR = 'linear'; SHAPE_CURVE = 'curve'; SHAPE_LOG = 'log'
    def __init__(self, freq_start=500, freq_end=2500, duration=500, vol_start=255, vol_end=0,
                 waveform='square', fx='none', shape='log'):
        self.args = [freq_start, freq_end, duration, vol_start, vol_end, waveform, fx, shape]
class _Audio:
    SoundEffect = _SoundEffect
    def play(self, source, wait=True):
        _played.append([_clock[0], source if isinstance(source, str) else source.args, wait])
audio = _Audio()
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
def receive_full():
    if not _on[0]:
        raise ValueError('radio is not enabled')
    if _inbox and _inbox[0][0] <= microbit._clock[0]:
        p = _inbox.pop(0)
        return (b'\\x01\\x00\\x01' + p[1].encode(), p[2] if len(p) > 2 else -60, 0)
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

function run(body, { untilMs = 3000, inbox = [], buttons = '', noJson = false, logo = false } = {}) {
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
            `microbit.pin_logo.down = ${logo ? 'True' : 'False'}`,
            'try:',
            `    exec(open(${JSON.stringify(join(dir, 'main.py'))}).read(), {'__name__': '__main__'})`,
            'except microbit._Stop:',
            '    pass',
            "print(json.dumps({'scrolled': microbit._scrolled, 'music': music._log, 'sent': radio._sent, 'px': microbit.display.px, 'played': microbit._played}))"
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


// ── round trip ────────────────────────────────────────────────────────────

const ROUND_TRIP = [
    ['microbitplus_islogo', 'set t to logo touched'],
    ['microbitplus_radiorssi', 'set s to last radio signal strength'],
    ['microbitplus_playtonemode', 'play tone 262 hz for beat quarter ms until done'],
    ['microbitplus_playtonemode', 'play tone 392 hz for 500 ms in background'],
    ['microbitplus_playsound', 'play sound giggle until done'],
    ['microbitplus_playsound', 'play sound twinkle in background'],
    ['microbitplus_playsoundeffect',
        'play sound effect noise from 4120 to 1266 hz volume 255 to 148 for 500 ms effect warble curve curve until done'],
    ['microbitplus_playsoundeffect',
        'play sound effect sine from 5000 to 0 hz volume 255 to 0 for 300 ms effect none curve linear in background']
];

for (const [opcode, line] of ROUND_TRIP) {
    test(`${opcode}: \`${line.slice(0, 50)}\` parses to its block and prints back to itself`, () => {
        const c = new SB3Creator();
        c.parse(program([line]));
        assert.ok(c.project.targets.flatMap((t) => Object.values(t.blocks)).some((b) => b.opcode === opcode),
            `no ${opcode} from \`${line}\``);
        const printed = c.decompile();
        const again = new SB3Creator();
        again.parse(printed);
        assert.equal(again.decompile(), printed);
        assert.ok(printed.replace(/[()]/g, '').includes(line), `\`${line}\` not in:\n${printed}`);
    });
}

test('a mode may be left out, and means until done; a plain tone is still the plain tone block', () => {
    const c = new SB3Creator();
    c.parse(program(['play sound hello', 'play tone 440 hz for 200 ms']));
    const ops = c.project.targets.flatMap((t) => Object.values(t.blocks)).map((b) => b.opcode);
    assert.ok(ops.includes('microbitplus_playsound') && ops.includes('microbitplus_playtone'), ops.join(' '));
    assert.ok(c.decompile().includes('play sound hello until done'));
});

test('an unknown sound name is not invented', () => {
    const c = new SB3Creator();
    c.parse(program(['play sound kazoo']));
    assert.ok(!c.project.targets.flatMap((t) => Object.values(t.blocks)).some((b) => b.opcode === 'microbitplus_playsound'));
});

// ── MicroPython that runs ─────────────────────────────────────────────────

test('logo touched reads the V2 touch logo', () => {
    const body = ['IF logo touched THEN:', '  display 1', 'ELSE:', '  display 0', 'wait 0.01 seconds'];
    assert.deepEqual(run(body, { logo: true }).texts, ['1']);
    assert.deepEqual(run(body).texts, ['0']);
});

test('a sound effect is MicroPython\'s audio.SoundEffect with the same eight parts, and until done waits its length', () => {
    const { played, scrolled } = run(['play sound effect square from 1600 to 1 hz volume 255 to 0 for 300 ms effect vibrato curve logarithmic',
        'display 1', 'play sound effect triangle from 1177 to 4967 hz volume 0 to 206 for 266 ms effect tremolo curve linear in background',
        'display 2', 'wait 0.01 seconds']);
    assert.deepEqual(played, [[0, [1600, 1, 300, 255, 0, 'square', 'vibrato', 'log'], false],
        [300, [1177, 4967, 266, 0, 206, 'triangle', 'tremolo', 'linear'], false]]);
    assert.deepEqual(scrolled, [[300, '1'], [300, '2']], 'until done waited, in background did not');
});

test('a built-in sound plays by MicroPython\'s Sound name', () => {
    const { played } = run(['play sound giggle', 'play sound yawn in background', 'wait 0.01 seconds']);
    assert.deepEqual(played, [[0, 'GIGGLE', true], [0, 'YAWN', false]]);
});

test('play tone ... until done waits the tone out while other scripts run; in background does not wait', () => {
    const { music, scrolled } = run('DEVICE MICROBIT:\n  WHEN started:\n    play tone 262 hz for 500 ms until done\n    display 1\n' +
        '    play tone 392 hz for 250 ms in background\n    display 2\n  WHEN started:\n    wait 0.1 seconds\n    display 3\n', { untilMs: 2000 });
    assert.deepEqual(music.map(([k, , f, d]) => [k, f, d]), [['pitch', 262, 500], ['pitch', 392, 250]]);
    assert.deepEqual(scrolled.map(([, t]) => t), ['3', '1', '2'], 'the tone blocked the other script');
    assert.equal(scrolled[1][0], 500, 'until done is the tone\'s length');
});

test('the signal strength is the handled packet\'s, from receive_full', () => {
    const { texts } = run('DEVICE MICROBIT\n\nWHEN radio receives number:\n  display last radio signal strength\n  display read last radio number\n',
        { inbox: [[100, '7', -42]], untilMs: 500 });
    assert.deepEqual(texts, ['-42', '7']);
});

test('a program that never reads the signal strength keeps the plain receiver', () => {
    const py = micropython('DEVICE MICROBIT\n\nWHEN radio receives number:\n  display read last radio number\n');
    assert.doesNotMatch(py, /receive_full|_radio_last_rssi/);
    assert.match(py, /m = radio\.receive\(\)/);
});

test('a slot\'s own `to` inside parentheses does not end the slot (the volume was the text "(pick random 0")', () => {
    const line = 'play sound effect sine from (pick random 100 to 200) to 3 hz volume (pick random 0 to 255) to 0 ' +
        'for (pick random 40 to 100) ms effect none curve linear until done';
    const c = new SB3Creator();
    c.parse(program([line, 'play tone (pick random 1 to 9) hz for (pick random 0 to 5) ms in background']));
    const blocks = c.project.targets.flatMap((t) => Object.values(t.blocks));
    const fx = blocks.find((b) => b.opcode === 'microbitplus_playsoundeffect');
    const tone = blocks.find((b) => b.opcode === 'microbitplus_playtonemode');
    for (const [b, keys] of [[fx, ['FROM', 'VFROM', 'MS']], [tone, ['FREQ', 'MS']]]) {
        for (const k of keys) assert.equal(c.project.targets[0].blocks[b.inputs[k][1]].opcode, 'operator_random', k);
    }
    assert.deepEqual(c.warnings, []);
    // and it runs: the end frequency and volume that are literals arrive as themselves
    const { played } = run([line, 'wait 0.01 seconds']);
    assert.deepEqual([played[0][1][1], played[0][1][4]], [3, 0], JSON.stringify(played));
});

test('out-of-range numbers are clamped as MakeCode clamps them (MicroPython raised ValueError)', () => {
    // MakeCode's jonnys-bird plays a volume of `pick random 0 to 1024`.
    const { played } = run(['play sound effect sine from 12000 to 0 - 5 hz volume 1024 to 300 for 20000 ms effect none curve linear in background',
        'wait 0.01 seconds']);
    assert.deepEqual(played[0][1].slice(0, 5), [9999, 0, 9999, 255, 255]);
});

test('a computed length is evaluated once: the wait is the sound\'s own length', () => {
    const py = micropython(['play sound effect sine from 100 to 200 hz volume 255 to 0 for (pick random 40 to 100) ms effect none curve linear',
        'play tone 262 hz for (pick random 40 to 100) ms until done']);
    assert.equal((py.match(/random\.randint\(40, 100\)/g) || []).length, 2, py);
    assert.match(py, /yield _bw_d/);
});
