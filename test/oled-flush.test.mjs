/**
 * The OLED flush contract, the two verbs that make it expressible, and the
 * generator guard that has to survive a real MicroPython compiler.
 *
 * A 128x64 frame is a 1 KB I2C transfer. Every OLED verb used to end in one,
 * so a six-verb screen sent six per keypress and tore visibly. `oled show`
 * lets a program say where the frame ends; the driver then buffers. The
 * switch is opt-in — a program that never says `oled show` must keep the old
 * flush-per-verb behaviour, and that additive guarantee is tested here too.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import SB3Creator from '../src/utils/sb3Creator.js';

const build = (src) => { const c = new SB3Creator(); c.parse(src); return c; };
const upy = (src) => { const r = build(src).generateMicroPython(); assert.ok(r.ok, `refused: ${(r.reasons || []).join('; ')}`); return r.py; };
const count = (hay, needle) => hay.split(needle).length - 1;
// Slice out ONE top-level def. Cutting at some later marker is fragile: a
// program with no equality has no `def _eq(`, indexOf returns -1, and
// slice(start, -1) then swallows the whole file including the program body.
const funcBody = (py, header) => {
    const start = py.indexOf(header);
    assert.notEqual(start, -1, `generated code has no ${header}`);
    const next = py.indexOf('\ndef ', start + header.length);
    return py.slice(start, next === -1 ? undefined : next);
};

const pythonParses = (code) => {
    const dir = mkdtempSync(join(tmpdir(), 'oled-'));
    const file = join(dir, 'g.py');
    writeFileSync(file, code);
    execFileSync('python3', ['-c', `compile(open(${JSON.stringify(file)}).read(), 'g', 'exec')`]);
};

const HEAD = `DEVICE PICO
CLOCK 125000000
PIN sda = GP0 OUTPUT
PIN scl = GP1 OUTPUT
`;

// The same screen twice: once ending in `oled show`, once not.
const screen = (withShow) => `${HEAD}
STAGE:
  WHEN flag clicked:
    FOREVER:
      oled clear 1
      oled set cursor 0 0 on 1
      oled print "RECHNER" on 1
      oled hline 0 10 128 on 1
      oled set cursor 5 0 on 1
      oled print (n) on 1
${withShow ? '      oled show 1\n' : ''}      wait 0.02 seconds
`;

describe('oled show: one blit per frame instead of one per verb', () => {
    test('with `oled show`, clear and print stop flushing and the frame blits once', () => {
        const py = upy(screen(true));
        // The only flush left is the one the program asked for.
        assert.equal(count(py, '_oled.show()'), 1,
            'a buffered frame must blit exactly once, at `oled show`');
        // ...and the helper no longer ends in a flush of its own.
        const printDef = funcBody(py, 'def _oled_print(v):');
        assert.ok(!printDef.includes('_oled.show()'),
            '_oled_print must not flush when the program flushes for itself');
        assert.ok(py.includes('_oled.fill(0)'), 'clear still clears the buffer');
    });

    test('WITHOUT `oled show` the old flush-per-verb behaviour is untouched', () => {
        const py = upy(screen(false));
        const printDef = funcBody(py, 'def _oled_print(v):');
        assert.ok(printDef.includes('_oled.show()'),
            'an existing program that never says `oled show` must keep flushing per print');
        assert.ok(py.includes('_oled.fill(0)\n') && count(py, '_oled.show()') > 1,
            'clear must still flush too, so nothing existing changes behaviour');
    });

    test('the buffered program is valid Python', () => pythonParses(upy(screen(true))));
});

describe('the drawing verbs lower natively on the Pico', () => {
    test('oled hline reaches framebuf.hline, not a comment', () => {
        const py = upy(screen(true));
        assert.match(py, /_oled\.hline\(int\(0\), int\(10\), int\(128\), 1\)/);
    });

    test('oled pixel lowers too — it used to degrade silently', () => {
        const py = upy(`${HEAD}
STAGE:
  WHEN flag clicked:
    oled pixel 3 4 1 on 1
    oled show 1
    FOREVER:
      wait 1 seconds
`);
        assert.match(py, /_oled\.pixel\(int\(3\), int\(4\), int\(1\)\)/);
        assert.ok(!py.includes('pass  # devices_oledpixel'), 'must not fall through to the stub');
    });

    test('both verbs have a C lowering, so the ratchet holds', () => {
        const c = build(screen(true)).generateC(undefined, {});
        assert.match(c, /bw_oled_hline\(1, 0, 10, 128\);/);
        assert.match(c, /bw_oled_show\(1\);/);
        assert.match(c, /static void bw_oled_show\(int disp\)/);
    });
});

describe('the generator guard must survive MicroPython constant-folding', () => {
    // `if False:` is FOLDABLE and MicroPython folds it: the branch is dropped,
    // the body keeps no yield, the function compiles as an ordinary one
    // returning None, and `yield from` on it raises TypeError. Measured on a
    // stock RPI_PICO build, v1.28.0, with sys.settrace absent.
    const PROC = `${HEAD}
DEFINE FAST paint:
  oled clear 1
  oled print "hi" on 1
  oled show 1

STAGE:
  WHEN flag clicked:
    FOREVER:
      paint
      wait 0.1 seconds
`;
    test('a yield-less procedure is guarded by a non-foldable flag', () => {
        const py = upy(PROC);
        assert.ok(py.includes('if _bw_false:'), 'the guard must be the module flag');
        assert.ok(!py.includes('if False:'), '`if False:` is folded away and must never be emitted');
    });

    test('the flag is defined unconditionally, not only on debug builds', () => {
        const py = upy(PROC);
        assert.ok(py.includes('_bw_false = False'), 'the guard flag must exist in every build');
        assert.ok(py.indexOf('_bw_false = False') < py.indexOf('if _bw_false:'),
            'the flag has to be defined before the procedures that reference it');
    });
});

describe('stdlib imports follow the expression layer', () => {
    const withOps = `${HEAD}
STAGE:
  WHEN flag clicked:
    set a to floor of (7 / 2)
    set b to pick random 1 to 6
    FOREVER:
      wait 1 seconds
`;
    test('`floor of` and `pick random` bring their imports with them', () => {
        const py = upy(withOps);
        assert.match(py, /^import math$/m, 'math.floor without `import math` is a NameError on the device');
        assert.match(py, /^import random$/m);
        assert.ok(py.indexOf('import math') < py.indexOf('math.floor'));
    });

    test('a program that needs neither does not import them', () => {
        const py = upy(`${HEAD}
STAGE:
  WHEN flag clicked:
    set a to 1
    FOREVER:
      wait 1 seconds
`);
        assert.ok(!/^import math$/m.test(py) && !/^import random$/m.test(py),
            'imports are driven by use, not emitted unconditionally');
    });
});

describe('the new verbs round-trip through the decompiler', () => {
    test('oled show and oled hline come back as themselves', () => {
        const c = build(screen(true));
        const back = new SB3Creator().decompile(c.project);
        assert.match(back, /oled show 1/);
        assert.match(back, /oled hline 0 10 128 on 1/);
    });
});
