// Counted loops and waits round-trip through MicroPython.
//
// Two byte-exact-oracle gaps the L3 audit measured:
//   - `repeat N` is emitted as `for _ in range(int(N)):` with a `yield 0` back-
//     edge; the reader grey-blocked the `for` line, losing the loop.
//   - `wait until X` and a bodyless `repeat until X` are both emitted as
//     `while not (X):`, but the wait carries only the `yield 0` back-edge while
//     the repeat carries a body. The reader read every `while not` as a repeat,
//     so a `wait until` came back as a bodyless repeat and re-emitted differently.
// Fixed: `for _ in range(int(N))` lifts to `REPEAT N`; a `while not (X):` whose
// only body is `yield 0` lifts to `wait until X`, and `_truthy(X)` (the boolean
// coercion the condition wraps) is unwrapped.
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

test('a counted `repeat N` round-trips and is not grey-blocked', () => {
    const r = roundtrip('DEVICE MICROBIT\nWHEN flag clicked:\n  set count to 0\n  REPEAT 5:\n    change count by 1\n');
    assert.match(r.pseudocode, /REPEAT 5:/, 'the repeat loop was not lifted');
    assert.ok(!/raw "for _ in range/.test(r.pseudocode), 'the repeat loop was kept as a grey block');
    assert.equal(r.src1, r.src0, 'emit -> read -> emit was not identical');
});

test('a bodyless `wait until X` round-trips as a wait, not a repeat', () => {
    const r = roundtrip('DEVICE MICROBIT\nWHEN flag clicked:\n  set count to 0\n  wait until (count > 5)\n  change count by 1\n');
    assert.match(r.pseudocode, /wait until count > 5/, 'the wait-until was not lifted as a wait');
    assert.ok(!/REPEAT UNTIL/.test(r.pseudocode), 'the wait-until was misread as a repeat-until');
    assert.equal(r.src1, r.src0, 'emit -> read -> emit was not identical');
});

test('a `repeat until X` WITH a body is still a repeat, not a wait', () => {
    const r = roundtrip('DEVICE MICROBIT\nWHEN flag clicked:\n  set count to 0\n  REPEAT UNTIL (count > 5):\n    change count by 1\n');
    assert.match(r.pseudocode, /REPEAT UNTIL count > 5:/, 'the bodied repeat-until was not lifted correctly');
    assert.ok(!/wait until/.test(r.pseudocode), 'a repeat-until with a body was wrongly read as a wait');
    assert.equal(r.src1, r.src0, 'emit -> read -> emit was not identical');
});
