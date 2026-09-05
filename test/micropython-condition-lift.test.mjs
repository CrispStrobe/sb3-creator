// `repeat until` conditions round-trip through MicroPython.
//
// The emitter writes `repeat until X` as `while not (X):`, and a `= ` test as
// the `_eq(a, b)` loose-equality helper. The reader lifted `while C` as
// `REPEAT UNTIL not (C)` unconditionally — so the emitter's own `not (X)`
// doubled to `not (not (X))` — and it left `_eq(...)` unlifted, reading back as
// an unknown call. Both are byte-exact-oracle gaps the L3 audit measured.
//
// Fixed: `while not (X):` strips the pair and lifts to `REPEAT UNTIL X`, and
// `_eq(a, b)` lifts to `(a = b)` (recursively, balanced parens).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import micropythonToPseudocode from '../src/utils/micropythonToPseudocode.js';

const roundtrip = (prog) => {
    const c0 = new SB3Creator();
    c0.parse(prog);
    const src0 = c0.generateMicroPython().py;
    const { pseudocode } = micropythonToPseudocode(src0);
    const c1 = new SB3Creator();
    c1.parse(pseudocode);
    return { src0, src1: c1.generateMicroPython().py, pseudocode };
};

test('a comparison `repeat until` does not double-negate', () => {
    const r = roundtrip('DEVICE MICROBIT\nWHEN flag clicked:\n  set i to 0\n  REPEAT UNTIL (i > 5):\n    change i by 1\n    wait 0.1 seconds\n');
    assert.ok(!/not \(not/.test(r.pseudocode), `double negation survived: ${r.pseudocode}`);
    assert.match(r.pseudocode, /REPEAT UNTIL i > 5:/, 'the until condition was not lifted cleanly');
    assert.equal(r.src1, r.src0, 'emit -> read -> emit was not identical');
});

test('an equality `repeat until` lifts `_eq(a, b)` back to `(a = b)`', () => {
    const r = roundtrip('DEVICE MICROBIT\nWHEN flag clicked:\n  set i to 0\n  REPEAT UNTIL (i = 5):\n    change i by 1\n    wait 0.1 seconds\n');
    assert.ok(!/_eq\(/.test(r.pseudocode), `the _eq helper leaked into the pseudocode: ${r.pseudocode}`);
    assert.ok(!/not \(not/.test(r.pseudocode), 'double negation survived');
    assert.match(r.pseudocode, /REPEAT UNTIL i = 5:/, 'the equality condition was not lifted');
    assert.equal(r.src1, r.src0, 'emit -> read -> emit was not identical');
});
