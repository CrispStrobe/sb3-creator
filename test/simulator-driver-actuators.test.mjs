// The JS and Python simulator drivers drive actuators and whole-port parts
// (Lite task B7, docs/OPEN-TASKS-2026-09-29.md in brickwright-lite).
//
// MEASURED FIRST, at main ab234aed:
//  - The devices driver's setServo/setMotor/setDirection/setRelay/activate/
//    deactivate were empty in both languages: a JS/Python program's
//    `set servo angle` or `set motor speed` moved nothing, while the same
//    blocks in the Scratch VM reach the board through setDeviceControl.
//  - A program that uses ONLY devices blocks has no stc12 driver, so no
//    `_board`: every devices method that touched the board threw
//    ReferenceError (JS) / NameError (Python) — the reporters included.
//  - The stc12 driver's setPort/setPart were no-ops and readPort returned 0;
//    readKeypad read `board.keypad_<name>`, which nothing writes, so every
//    keypad read -1.
//
// What is held here is the DRIVER CONTRACT, against a recording board that
// models just enough (a pressed key shorting its row to its column, a 595
// shifting on its clock and latching on its latch): which board calls the
// generated program makes, in both languages, from the same source. The real
// engine end of the same routes is held in brickwright-lite, which pins the
// bw-board these calls land on (this repo's CI pins an older sibling).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';

const SB3 = join(import.meta.dirname, '..');
const SB3Creator = (await import(join(SB3, 'src/utils/sb3Creator.js'))).default;

const DEVICES = [
  'DEVICE STC12C5A60S2',
  'CLOCK 11059200',
  'PART arm = SERVO 1',
  'PART mymotor = MOTOR 1',
  '',
  'WHEN flag clicked:',
  '  set arm angle to 45',
  '  set mymotor speed to 60',
  '  set mymotor direction reverse',
  ''
].join('\n');

const PORTS = [
  'DEVICE STC89C52RC',
  'CLOCK 11059200',
  'PORT bar = P1 OUTPUT',
  'PART sr = 74HC595 data P3.4 clock P3.6 latch P3.5',
  'PART keys = KEYPAD4X4 ROWS P3.0 P3.1 P3.2 P3.3 COLS P3.7 P2.0 P2.1 P2.5',
  '',
  'WHEN flag clicked:',
  '  set sr to 129',
  '  set k to keys',
  '  set bar to k',
  ''
].join('\n');

const generate = (src) => {
  const c = new SB3Creator();
  c.parse(src);
  const js = c.generateJavaScript(undefined, { driver: 'simulator' });
  const py = c.generatePython(c.project, { driver: 'simulator' });
  return { js, py: Array.isArray(py) ? py.join('\n') : String(py.code || py) };
};

// The bench: two parts the devices family resolves by ordinal (a servo and a
// motor, after unrelated parts), a keypad with key 6 held (row 1, column 2:
// P3.1 shorts to P2.1), and a 595.
const PARTS = [['r1', 'resistor'], ['m1', 'dc_motor'], ['s1', 'servo'], ['k1', 'keypad_4x4']];
const ROWS = ['p3.0', 'p3.1', 'p3.2', 'p3.3'];
const COLS = ['p3.7', 'p2.0', 'p2.1', 'p2.5'];
const PRESSED = 6;

function jsBoard() {
  const pins = new Map();
  const calls = [];
  let shift = 0, latch = 0;
  const level = (p) => pins.get(String(p).toLowerCase());
  return {
    calls, pins, get latch() { return latch; },
    parts: PARTS.map(([id, kind]) => ({ id, kind })),
    setDeviceControl(id, verb, value) { calls.push([id, verb, value]); return true; },
    getDeviceState() { return null; },
    setPin(pin, mode, high) {
      const k = String(pin).toLowerCase();
      const was = pins.get(k);
      pins.set(k, { mode, high: !!high });
      if (high && !(was && was.high)) {
        if (k === 'p3.6') shift = ((shift << 1) | (level('p3.4')?.high ? 1 : 0)) & 0xff;
        if (k === 'p3.5') latch = shift;
      }
    },
    readPin(pin) {
      const c = COLS.indexOf(String(pin).toLowerCase());
      if (c < 0) return level(pin)?.high ? 1 : 0;
      const r = Math.floor(PRESSED / 4);
      return (c === PRESSED % 4 && level(ROWS[r]) && !level(ROWS[r]).high) ? 0 : 1;
    },
    readAnalog() { return 0; },
    advanceTo() {}
  };
}

const runJs = (js, board) => {
  const sandbox = { bwBoard: board, console: { log() {}, error() {}, warn() {}, info() {} }, prompt: () => '' };
  vm.runInNewContext(js, sandbox, { timeout: 8000 });
};

// The same board in Python, for the Python driver.
const PY_BOARD = `
import json
class _Part:
    def __init__(self, i, k): self.id = i; self.kind = k
class _Board:
    def __init__(self):
        self.parts = [_Part(i, k) for i, k in ${JSON.stringify(PARTS)}]
        self.calls = []; self.pins = {}; self.shift = 0; self.latch = 0
    def setDeviceControl(self, i, verb, value): self.calls.append([i, verb, value]); return True
    def getDeviceState(self, i): return None
    def _lv(self, p): return self.pins.get(str(p).lower())
    def setPin(self, pin, mode, high):
        k = str(pin).lower(); was = self.pins.get(k)
        self.pins[k] = (mode, bool(high))
        if high and not (was and was[1]):
            if k == 'p3.6': self.shift = ((self.shift << 1) | (1 if (self._lv('p3.4') or (0, False))[1] else 0)) & 0xFF
            if k == 'p3.5': self.latch = self.shift
    def readPin(self, pin):
        cols = ${JSON.stringify(COLS)}; rows = ${JSON.stringify(ROWS)}
        k = str(pin).lower()
        if k not in cols: return 1 if (self._lv(k) or (0, False))[1] else 0
        r = ${PRESSED} // 4; row = self._lv(rows[r])
        return 0 if (cols.index(k) == ${PRESSED} % 4 and row and not row[1]) else 1
    def readAnalog(self, pin): return 0
    def advanceTo(self, t): pass
bw_board = _Board()
`;

function runPy(py) {
  const dir = mkdtempSync(join(tmpdir(), 'b7-py-'));
  try {
    const file = join(dir, 'prog.py');
    writeFileSync(file, PY_BOARD + '\n' + py + `
print("@@" + json.dumps({"calls": bw_board.calls, "latch": bw_board.latch,
    "port": {k: v[1] for k, v in bw_board.pins.items() if k.startswith("p1.")}}))
`);
    const out = execFileSync('python3', [file], { encoding: 'utf8' });
    return JSON.parse(out.split('\n').find((l) => l.startsWith('@@')).slice(2));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const WANT_DEVICE_CALLS = [['s1', 'angle', 45], ['m1', 'speed', 60], ['m1', 'direction', 'reverse']];

test('JS: servo and motor blocks reach setDeviceControl, by ordinal within their family', () => {
  const { js } = generate(DEVICES);
  const board = jsBoard();
  runJs(js, board);
  assert.deepEqual(board.calls, WANT_DEVICE_CALLS);
});

test('Python: the same program makes the same calls', () => {
  const { py } = generate(DEVICES);
  assert.deepEqual(runPy(py).calls, WANT_DEVICE_CALLS);
});

test('a part named by its id is passed through, and an ordinal past the family is not guessed', () => {
  const { js } = generate(DEVICES);
  const board = jsBoard();
  const sandbox = { bwBoard: board, console: { log() {}, error() {}, warn() {}, info() {} }, prompt: () => '' };
  vm.runInNewContext(js + '\n;_devices.setMotor("m1", 30); _devices.setServo(2, 10); _devices.setRelay("rl1", "on"); _devices.deactivate("rl1");', sandbox, { timeout: 8000 });
  assert.deepEqual(board.calls.slice(3), [['m1', 'speed', 30], ['2', 'angle', 10], ['rl1', 'state', 1], ['rl1', 'state', 0]]);
});

test('JS: a PART 595 shifts out, a keypad is scanned on the circuit, a PORT drives its eight pins', () => {
  const { js } = generate(PORTS);
  const board = jsBoard();
  runJs(js, board);
  assert.equal(board.latch, 129, '74HC595 latched the value (MSB first, as the C shift_out)');
  const port = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (board.pins.get(`p1.${i}`)?.high ? 1 : 0));
  assert.deepEqual(port, [0, 1, 1, 0, 0, 0, 0, 0], `the held key (${PRESSED}) read back and written to P1: ${port}`);
});

test('Python: the same PORT/PART/keypad program gives the same board', () => {
  const { py } = generate(PORTS);
  const r = runPy(py);
  assert.equal(r.latch, 129);
  const port = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (r.port[`p1.${i}`] ? 1 : 0));
  assert.deepEqual(port, [0, 1, 1, 0, 0, 0, 0, 0]);
});
