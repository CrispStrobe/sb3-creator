// `not` binds Python's way — the reference dialect's (stc-compiler
// c34ad1b), found on real silicon when `IF not k = shown` did nothing.
// Precedence, loosest to tightest: or < and < not < comparisons.
//
// The bug this pins: parseCondition checked `not` FIRST (loosest), so
// `not a and b` became `not (a and b)` where the language means
// `(not a) and b`. `not k = shown` looked correct only by coincidence
// (a comparison is tighter than `not` in either ordering).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

// Compile a single IF condition to Python and return the user's `if` line.
function ifLine(cond) {
    const c = new SB3Creator();
    c.parse(`DEVICE STC12C5A60S2\nPIN led = P1.0 OUTPUT\nWHEN flag clicked:\n  IF ${cond} THEN:\n    turn on led`);
    const py = c.generatePython(undefined, { driver: 'simulator' });
    const line = py.split('\n').find(l => /^\s+if \(/.test(l) && /\ba\b|\bb\b/.test(l));
    return (line || '').trim();
}

// A NOTE ON THE SPELLING, changed 2026-08-29 and deliberately re-asserted here.
// A bare operand used as a condition used to lower to `_eq(a, "true")` — an
// equality against the STRING "true", which is false for every number and was
// exactly inverted in the referee (D26). It lowers to `_truthy(a)` now, in
// JavaScript, Python and the referee alike, matching the rule the device C
// emitter already had. That is a change of SPELLING, not of precedence: the
// bracketing below is character-for-character what it was, which is the whole
// point of keeping this test on the same five conditions.
test('not binds tighter than and/or, looser than comparisons', () => {
    // (not a) and b — not does NOT swallow the and
    assert.equal(ifLine('not a and b'), 'if ((not _truthy(a)) and _truthy(b)):');
    // (not a) or b
    assert.equal(ifLine('not a or b'), 'if ((not _truthy(a)) or _truthy(b)):');
    // not (a = b) — comparison is tighter, so not wraps the whole test.
    // Still `_eq`: this one is a real equality, not a bare operand.
    assert.equal(ifLine('not a = b'), 'if (not _eq(a, b)):');
    // a and (not b)
    assert.equal(ifLine('a and not b'), 'if (_truthy(a) and (not _truthy(b))):');
    // (not a) and (not b)
    assert.equal(ifLine('not a and not b'),
        'if ((not _truthy(a)) and (not _truthy(b))):');
});
