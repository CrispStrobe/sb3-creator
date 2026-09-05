// MicroPython reader body-fidelity gaps, each an emit -> read -> emit loss the
// L3 reader-coverage audit measured. Each has a byte-exact oracle: the emitter's
// own output is the truth the reader must reproduce.
//
//   gap 1  wait: `wait N seconds` is emitted as `yield int((N) * 1000)` and the
//          reader skipped every yield, losing the wait.
//   gap 2  change: `change v by X` is `v = v + X`; the reader lifted it as a
//          plain `set v to (v + X)`, which re-emits with parens (`v = (v + X)`).
//   gap 3  print: `print(str(X))` — the str() is the print verb's coercion; the
//          reader kept it and it doubled to `print(str(str(X)))` on re-emission.
//   gap 4  readPin: an STC-targeted program reads pins through `_stc*.readPin
//          ("name")`; unmapped it came back quoted as a string literal.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import micropythonToPseudocode from '../src/utils/micropythonToPseudocode.js';

const roundtrip = (prog) => {
    const c0 = new SB3Creator();
    c0.parse(prog);
    const src0 = c0.generateMicroPython().py;
    const { pseudocode, warnings } = micropythonToPseudocode(src0);
    const c1 = new SB3Creator();
    c1.parse(pseudocode);
    const src1 = c1.generateMicroPython().py;
    return { src0, src1, pseudocode, warnings };
};

test('gap 1 — a wait survives the round trip byte-for-byte', () => {
    const r = roundtrip('DEVICE MICROBIT\nWHEN flag clicked:\n  FOREVER:\n    wait 0.5 seconds\n');
    assert.match(r.pseudocode, /wait 0\.5 seconds/, 'the wait was lost');
    assert.equal(r.src1, r.src0, 'emit -> read -> emit was not identical');
});

test('gap 2 — `change v by X` round-trips, and `set v to (v + X)` stays a set', () => {
    const chg = roundtrip('DEVICE MICROBIT\nWHEN flag clicked:\n  set n to 0\n  FOREVER:\n    change n by 1\n    wait 1 seconds\n');
    assert.match(chg.pseudocode, /change n by 1/, 'change-by was flattened to a set');
    assert.equal(chg.src1, chg.src0, 'change-by emit -> read -> emit was not identical');

    const set = roundtrip('DEVICE MICROBIT\nWHEN flag clicked:\n  set n to 0\n  FOREVER:\n    set n to (n + 2)\n    wait 1 seconds\n');
    assert.match(set.pseudocode, /set n to n \+ 2/, 'a genuine set-to-expression should stay a set');
    assert.ok(!/change n/.test(set.pseudocode), 'a genuine set-to-expression was misread as change-by');
    assert.equal(set.src1, set.src0, 'set-to-expression emit -> read -> emit was not identical');
});

test('gap 3 — print does not double-wrap str()', () => {
    const r = roundtrip('DEVICE MICROBIT\nWHEN flag clicked:\n  print "hello"\n  print (7 + 1)\n');
    assert.ok(!/str\(str\(/.test(r.src1), `print re-wrapped str(): ${r.src1.match(/print\([^\n]*/)?.[0]}`);
    assert.equal(r.src1, r.src0, 'print emit -> read -> emit was not identical');
});

test('gap 4 — an STC readPin lifts to `read <name>`, not a quoted string', () => {
    const r = roundtrip('DEVICE STC12C5A60S2\nPIN btn = P1.0 INPUT\nPIN led = P1.1 OUTPUT\nWHEN flag clicked:\n  FOREVER:\n    IF (read btn = 1) THEN:\n      turn on led\n');
    assert.match(r.pseudocode, /\bread btn\b/, 'readPin was not lifted to a read reporter');
    assert.ok(!/"[^"]*readPin/.test(r.pseudocode), 'readPin came back quoted as a string literal');
});
