/**
 * generateMicroPython goldens: the generator-scheduler contract, the
 * hardware lowerings, and — the strong one — every emitted program must
 * be valid Python: python3's compile() parses it or the test fails.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import SB3Creator from '../src/utils/sb3Creator.js';
import examples from '../src/utils/examples.js';

const build = (src) => { const c = new SB3Creator(); c.parse(src); return c; };

const pythonParses = (code) => {
    const dir = mkdtempSync(join(tmpdir(), 'upy-'));
    const file = join(dir, 'g.py');
    writeFileSync(file, code);
    execFileSync('python3', ['-c', `compile(open(${JSON.stringify(file)}).read(), 'g', 'exec')`]);
};

const SRC = `WHEN flag clicked:
  set counter to 0
  REPEAT 4:
    change counter by 1
    wait 0.2 seconds
  display "done"
  print counter

WHEN flag clicked:
  FOREVER:
    IF key a pressed THEN:
      broadcast "hit"
    wait 0.05 seconds

WHEN I receive "hit":
  say "ouch"
`;

describe('generateMicroPython', () => {
    const c = build(SRC);
    const r = c.generateMicroPython();

    test('emits ok with the scheduler and hardware lowerings', () => {
        assert.ok(r.ok, (r.reasons || []).join('; '));
        assert.match(r.py, /from microbit import \*/);
        assert.match(r.py, /def _task_0\(\):/);
        assert.match(r.py, /yield int\(\(0\.2\) \* 1000\)/, 'wait is a ms yield');
        assert.match(r.py, /while True:[\s\S]*?yield 0/, 'forever yields at the back-edge');
        assert.match(r.py, /display\.scroll\(str\("done"\), wait=False/, 'the display VERB scrolls');
        assert.match(r.py, /print\(str\(/, 'print goes to serial');
        assert.ok(r.warnings.some((w) => w.includes('stage speech')),
            'say degrades by name — stage semantics, not LEDs');
        assert.match(r.py, /button_a\.is_pressed\(\)/, 'key a maps to the button');
        assert.match(r.py, /_pending\.append\("hit"\)/, 'broadcast queues');
        assert.match(r.py, /_receivers = \{"hit": _task_2\}/, 'receiver registered');
        assert.match(r.py, /_run\(\[_task_0\(\), _task_1\(\)\]\)/, 'flag tasks start');
    });

    test('the emitted program is valid Python', () => {
        pythonParses(r.py);
    });

    test('a keyless program still runs; unknown keys degrade with names', () => {
        const c2 = build(`WHEN flag clicked:
  IF key space pressed THEN:
    say "x"
`);
        const r2 = c2.generateMicroPython();
        assert.ok(r2.ok);
        assert.ok(r2.warnings.some((w) => w.includes("key 'space'")),
            `named degradation, got: ${r2.warnings.join('; ')}`);
        pythonParses(r2.py);
    });
});

describe('generateMicroPython: PIN programs', () => {
    const c = build(`DEVICE MICROBIT
PIN led = P0 OUTPUT ACTIVE LOW
PIN btn = P1 INPUT

WHEN flag clicked:
  FOREVER:
    turn on led
    wait 0.1 seconds
    turn off led
    wait 0.1 seconds

WHEN btn pressed:
  set led to 50 percent
`);
    const r = c.generateMicroPython();

    test('pins lower to microbit pin objects with the on/off convention', () => {
        assert.ok(r.ok, (r.reasons || []).join('; '));
        assert.match(r.py, /pin0\.write_digital\(0\)/, 'ON of an ACTIVE LOW pin drives 0');
        assert.match(r.py, /pin0\.write_digital\(1\)/, 'OFF drives 1');
        assert.match(r.py, /pin1\.read_digital\(\) == 1/, 'the hat polls the input pin');
        assert.match(r.py, /pin0\.write_analog\(int\(\(50\) \* 1023 \/ 100\)\)/, 'PWM maps to write_analog');
        assert.match(r.py, /_cur and not _prev/, 'the hat is edge-triggered, not level');
    });

    test('the PIN program parses as Python', () => {
        pythonParses(r.py);
    });

    test('a non-micro:bit pin location degrades by name', () => {
        const c2 = build(`DEVICE MICROBIT
PIN x = P1.0 OUTPUT

WHEN flag clicked:
  turn on x
`);
        const r2 = c2.generateMicroPython();
        assert.ok(r2.ok);
        assert.ok(r2.warnings.some((w) => w.includes('not a micro:bit pin')),
            r2.warnings.join('; '));
        pythonParses(r2.py);
    });
});

describe('generateMicroPython: gallery sweep', () => {
    for (const key of Object.keys(examples).slice(0, 10)) {
        test(`${key}: ok with named degradations, and parses`, () => {
            const c = build(examples[key]);
            const r = c.generateMicroPython();
            if (!r.ok) {
                assert.ok(r.reasons.length, 'failures carry reasons');
                return;
            }
            pythonParses(r.py);
        });
    }
});
