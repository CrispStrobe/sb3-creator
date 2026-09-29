/**
 * MakeCode census, the last partial micro:bit programs (brickwright-lite task
 * A2, 2026-09-29): images as values, radio serial numbers, the sound hat,
 * led.plotBrightness / led.point and parseFloat. Round trip (dialect ->
 * blocks -> dialect) and MicroPython EXECUTED under CPython against stand-ins
 * that carry MicroPython V2's own names (Image.set_pixel/get_pixel/
 * shift_left, microphone.was_event, SoundEvent.LOUD, machine.unique_id), so a
 * wrong name raises here as it does on the board.
 *
 * Why these: lite's census (docs/generated/MAKECODE-CENSUS.md, 2026-09-28)
 * refused them in MakeCode's own apps — the runtime image in gameofLife and
 * karel, RadioPacketProperty.SerialNumber / setTransmitSerialNumber in five
 * radio projects, input.onSound in v2-clap-lights, led.plotBrightness in
 * reaction-time, led.point in v2-blow-away, parseFloat in rotary-dial-radio.
 * The names were checked in lite's simulator firmware (MicroPython v1.18,
 * micro:bit v2.1.1), which runs the census.
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
 * Stand-ins for the modules. The clock advances only through sleep() (the
 * scheduler's tick). `radio._inbox` holds [at_ms, text] packets.
 * `microbit._events` holds [at_ms, 'loud'|'quiet'] sound events, each
 * reported once by was_event, as MicroPython's is.
 */
const MICROBIT = `
class _Stop(Exception):
    pass
_clock = [0]
_limit = [0]
_scrolled = []
_events = []
_thresholds = {}
class Image:
    def __init__(self, s='00000:00000:00000:00000:00000'):
        self.rows = [[int(c) for c in row] for row in s.split(':')]
    def width(self):
        return len(self.rows[0])
    def height(self):
        return len(self.rows)
    def _check(self, x, y):
        if not (0 <= x < self.width() and 0 <= y < self.height()):
            raise ValueError('index out of bounds')
    def set_pixel(self, x, y, v):
        self._check(x, y)
        if not (0 <= v <= 9):
            raise ValueError('brightness out of bounds')
        self.rows[y][x] = v
    def get_pixel(self, x, y):
        self._check(x, y)
        return self.rows[y][x]
    def shift_left(self, n):
        out = Image()
        out.rows = [[(row[x + n] if 0 <= x + n < len(row) else 0) for x in range(len(row))] for row in self.rows]
        return out
class _Display:
    def __init__(self):
        self.px = [[0] * 5 for _ in range(5)]
        self.shown = []
    def _check(self, x, y):
        if not (0 <= x < 5 and 0 <= y < 5):
            raise ValueError('index out of bounds')
    def show(self, img):
        self.px = [row[:] for row in img.rows]
        self.shown.append(_clock[0])
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
class SoundEvent:
    LOUD = 'loud'
    QUIET = 'quiet'
class _Microphone:
    def was_event(self, ev):
        for i, e in enumerate(_events):
            if e[0] <= _clock[0] and e[1] == ev:
                _events.pop(i)
                return True
        return False
    def set_threshold(self, ev, value):
        _thresholds[ev] = value
microphone = _Microphone()
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
const MACHINE = `
def unique_id():
    return b'\\x12\\x34\\x56\\xf8\\x9a\\xbc\\xde\\xf0'
`;

function run(body, { untilMs = 3000, inbox = [], events = [] } = {}) {
    const py = micropython(body);
    const dir = mkdtempSync(join(tmpdir(), 'bw-mba2-'));
    try {
        writeFileSync(join(dir, 'microbit.py'), MICROBIT);
        writeFileSync(join(dir, 'radio.py'), RADIO);
        writeFileSync(join(dir, 'machine.py'), MACHINE);
        writeFileSync(join(dir, 'main.py'), py);
        writeFileSync(join(dir, 'harness.py'), [
            'import sys, json',
            `sys.path.insert(0, ${JSON.stringify(dir)})`,
            'import microbit, radio',
            `microbit._limit[0] = ${untilMs}`,
            `radio._inbox.extend(${JSON.stringify(inbox)})`,
            `microbit._events.extend(${JSON.stringify(events)})`,
            'try:',
            `    exec(open(${JSON.stringify(join(dir, 'main.py'))}).read(), {'__name__': '__main__'})`,
            'except microbit._Stop:',
            '    pass',
            "print(json.dumps({'scrolled': microbit._scrolled, 'sent': radio._sent, 'px': microbit.display.px, " +
                "'shown': microbit.display.shown, 'thresholds': microbit._thresholds}))"
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
    ['microbitplus_createimage', 'set img to create image 09090:00000:00900:00000:09990'],
    ['microbitplus_imagesetpixel', 'set pixel x 1 y (a + 1) of image img to 1'],
    ['microbitplus_imagepixel', 'set b to pixel x 2 y 3 of image (item 0 of array "imgs")'],
    ['microbitplus_showimage', 'show image img offset 0'],
    ['microbitplus_plotimage', 'plot image (item k of array "imgs") offset (k + 1)'],
    ['microbitplus_plotbrightness', 'plot x 1 y 2 brightness 128'],
    ['microbitplus_point', 'set b to point x 3 y 4'],
    ['microbitplus_radioserial', 'radio transmit serial number on'],
    ['microbitplus_radioserial', 'radio transmit serial number off'],
    ['microbitplus_radiolastserial', 'set s to last radio serial number'],
    ['microbitplus_deviceserial', 'set s to device serial number'],
    ['microbitplus_soundthreshold', 'set quiet sound threshold to 40'],
    ['microbitplus_parsenumber', 'set n to number from text "12.5"']
];

for (const [opcode, line] of ROUND_TRIP) {
    test(`${opcode}: \`${line.slice(0, 50)}\` parses to its block and prints back to itself`, () => {
        const c = new SB3Creator();
        c.parse(program([line]));
        assert.ok(c.project.targets.flatMap((t) => Object.values(t.blocks)).some((b) => b.opcode === opcode),
            `no ${opcode} from \`${line}\``);
        assert.deepEqual(c.warnings, []);
        const printed = c.decompile();
        const again = new SB3Creator();
        again.parse(printed);
        assert.equal(again.decompile(), printed);
        assert.ok(printed.replace(/[()]/g, '').includes(line.replace(/[()]/g, '')), `\`${line}\` not in:\n${printed}`);
    });
}

test('the sound hat parses to its block, carries its level, and prints back to itself', () => {
    for (const level of ['loud', 'quiet']) {
        const c = new SB3Creator();
        c.parse(`DEVICE MICROBIT\n\nWHEN ${level} sound:\n  display 1\n`);
        const hat = c.project.targets.flatMap((t) => Object.values(t.blocks)).find((b) => b.opcode === 'microbitplus_whensound');
        assert.ok(hat && hat.topLevel, level);
        assert.equal(hat.fields.LEVEL[0], level);
        assert.match(c.decompile(), new RegExp(`WHEN ${level} sound:`));
    }
});

test('`set pixel … to` is the image block, not a variable called "pixel x …"', () => {
    const c = new SB3Creator();
    c.parse(program(['set img to create image 00000:00000:00000:00000:00000', 'set pixel x 0 y 0 of image img to 1']));
    const names = c.project.targets.flatMap((t) => Object.values(t.variables || {})).map((v) => v[0]);
    assert.deepEqual(names.filter((n) => /pixel/.test(n)), []);
});

// ── MicroPython that runs ─────────────────────────────────────────────────

test('an image is a value: pixels set and read on it, off-image ones ignored, shown from an offset', () => {
    const { texts, grid } = run(['set img to create image 90000:00000:00000:00000:00009',
        'set pixel x 2 y 1 of image img to 1',
        'set pixel x 9 y 1 of image img to 1',
        'set pixel x 4 y 4 of image img to 0',
        'IF pixel x 2 y 1 of image img THEN:', '  display "a"',
        'IF not (pixel x 4 y 4 of image img) THEN:', '  display "b"',
        'IF not (pixel x 9 y 9 of image img) THEN:', '  display "c"',
        'plot image img offset 1']);
    assert.deepEqual(texts, ['a', 'b', 'c']);
    // offset 1: the display's column x is the image's x + 1, as MakeCode draws it at -1
    assert.equal(grid, '00000:09000:00000:00000:00000');
});

test('two variables holding one image see each other\'s pixels (an image is a reference, as in MakeCode)', () => {
    const { texts } = run(['set a to create image 00000:00000:00000:00000:00000', 'set b to a',
        'set pixel x 0 y 0 of image b to 1', 'IF pixel x 0 y 0 of image a THEN:', '  display "shared"']);
    assert.deepEqual(texts, ['shared']);
});

test('show image waits its 400 ms after drawing; plot image does not', () => {
    const { texts, scrolled, shown } = run(['set img to create image 90000:00000:00000:00000:00000',
        'show image img offset 0', 'display 1', 'plot image img offset 0', 'display 2', 'wait 0.01 seconds']);
    assert.deepEqual(texts, ['1', '2']);
    assert.deepEqual(scrolled.map(([t]) => t), [400, 400]);
    assert.deepEqual(shown, [0, 400]);
});

test('images live in arrays too (gameofLife keeps one, karel one per record)', () => {
    const { grid } = run(['new array "imgs"', 'push create image 00000:00000:00900:00000:00000 to array "imgs"',
        'set pixel x 0 y 0 of image (item 0 of array "imgs") to 1', 'plot image (item 0 of array "imgs") offset 0']);
    assert.equal(grid, '90000:00000:00900:00000:00000');
});

test('point is whether that LED is lit; off the grid it is not', () => {
    const { texts } = run(['plot x 1 y 1 on', 'IF point x 1 y 1 THEN:', '  display "on"',
        'IF not (point x 2 y 1) THEN:', '  display "off"', 'IF not (point x 7 y 1) THEN:', '  display "edge"']);
    assert.deepEqual(texts, ['on', 'off', 'edge']);
});

test('plot brightness maps 0..255 onto 0..9 with anything lit staying lit; 0 is off; off the grid is ignored', () => {
    const { grid } = run(['plot x 0 y 0 brightness 255', 'plot x 1 y 0 brightness 1', 'plot x 2 y 0 brightness 128',
        'plot x 3 y 0 brightness 300', 'plot x 4 y 0 brightness 200', 'plot x 4 y 0 brightness 0', 'plot x 9 y 0 brightness 255']);
    assert.equal(grid.split(':')[0], '91590');
});

test('number from text is JavaScript\'s parseFloat: the leading number, NaN when there is none', () => {
    const { texts } = run(['display (number from text "12.5abc")', 'display (number from text " 42 ")',
        'display (number from text "-3e2")', 'display (number from text "abc")']);
    assert.deepEqual(texts, ['12.5', '42', '-300', 'nan']);
});

test('radio serial: a sender that turns it on puts its number in front; the receiver strips it and reads it', () => {
    const tx = run(['radio on group 1 power 6', 'radio send number 5', 'radio transmit serial number on',
        'radio send number 7', 'radio send text "hi"', 'radio transmit serial number off', 'radio send number 9',
        'display device serial number']);
    // unique_id's first four bytes, little-endian, top bit cleared
    const serial = 0x12 | (0x34 << 8) | (0x56 << 16) | ((0xf8 & 0x7f) << 24);
    assert.deepEqual(tx.texts, [String(serial)]);
    assert.deepEqual(tx.sent, ['5', `\u0000S${serial}\u00007`, `\u0000S${serial}\u0000hi`, '9']);
    const rx = run('DEVICE MICROBIT\n\nWHEN radio receives number:\n  display last radio serial number\n  display read last radio number\n',
        { inbox: [[100, `\u0000S${serial}\u00007`], [200, '8']], untilMs: 500 });
    assert.deepEqual(rx.texts, [String(serial), '7', '0', '8'], 'a packet with no serial number reads 0, as in MakeCode');
});

test('a receiver that never reads the serial number still gets the payload of a packet that carries one', () => {
    const rx = run('DEVICE MICROBIT\n\nWHEN radio receives number:\n  display read last radio number\n',
        { inbox: [[100, '\u0000S99\u000042']], untilMs: 300 });
    assert.deepEqual(rx.texts, ['42']);
    assert.doesNotMatch(rx.py, /_radio_last_serial/);
});

test('a program with no serial number sends exactly as before', () => {
    const py = micropython(['radio on group 1 power 6', 'radio send number 5']);
    assert.match(py, /radio\.send\(str\(5\)\)/);
    assert.doesNotMatch(py, /_bw_tx|unique_id/);
});

test('WHEN loud sound runs once per loud event; the threshold is set as MicroPython\'s', () => {
    const { texts, thresholds } = run('DEVICE MICROBIT\n\nWHEN flag clicked:\n  set loud sound threshold to 300\n' +
        '  set quiet sound threshold to 40\n\nWHEN loud sound:\n  display "L"\n\nWHEN quiet sound:\n  display "Q"\n',
    { events: [[100, 'loud'], [150, 'quiet'], [300, 'loud']], untilMs: 500 });
    assert.deepEqual(texts, ['L', 'Q', 'L']);
    assert.deepEqual(thresholds, { loud: 255, quiet: 40 }, 'a threshold is clamped to 0..255');
});

test('setting an array item past its end grows the array, as the extension and MakeCode do (Python raised IndexError)', () => {
    // gameofLife builds its next generation into an empty array, item by item.
    const { texts } = run(['new array "a"', 'set item 0 of array "a" to 5', 'set item 2 of array "a" to 7',
        'set item 0 - 1 of array "a" to 9', 'display length of array "a"', 'display item 1 of array "a"', 'display item 2 of array "a"']);
    assert.deepEqual(texts, ['3', '0', '7']);
});
