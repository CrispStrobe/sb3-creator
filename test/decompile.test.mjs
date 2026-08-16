// Round-trip tests for the decompiler: pseudocode -> blocks -> pseudocode -> blocks
// should reproduce the same block structure (and re-compile with no warnings).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import examples from '../src/utils/examples.js';

function signature(project) {
    const s = {};
    for (const t of project.targets) {
        const name = t.isStage ? 'Stage' : t.name;
        s[name] = {
            ops: Object.values(t.blocks || {}).map((b) => b.opcode).sort(),
            vars: Object.values(t.variables || {}).map((v) => v[0]).sort(),
            lists: Object.values(t.lists || {}).map((l) => l[0]).sort(),
        };
    }
    return s;
}

for (const [name, code] of Object.entries(examples)) {
    test(`decompile round-trip: ${name}`, () => {
        const c1 = new SB3Creator();
        c1.parse(code);
        const pseudocode = c1.decompile();

        const c2 = new SB3Creator();
        c2.parse(pseudocode);

        assert.equal(c2.warnings.length, 0, `recompile warnings: ${c2.warnings.slice(0, 2).join(' | ')}`);
        assert.deepEqual(signature(c2.project), signature(c1.project), 'block structure must survive the round trip');
    });
}

// ---- lcd print + join round-trip (Bug 1) ----
// `lcd print join "COUNT: " count on 1` must parse the join as a reporter,
// not swallow it into a string literal. The decompiled form must be a fixed point.
test('lcd print with join expression round-trips', () => {
    const src = `DEVICE ARDUINO-UNO
CLOCK 16000000

SPRITE Cat:
  WHEN flag clicked:
    set count to 0
    lcd print ("COUNT: " join count) on 1`;
    const c1 = new SB3Creator();
    c1.parse(src);
    assert.equal(c1.warnings.length, 0, `parse warnings: ${c1.warnings.join(' | ')}`);
    const d1 = c1.decompile();

    // The decompiled output must contain a join, not a quoted string
    assert.doesNotMatch(d1, /"join /, 'join must not be quoted as a string literal');

    // Round-trip: decompiled -> re-parsed -> decompiled must be identical
    const c2 = new SB3Creator();
    c2.parse(d1);
    assert.equal(c2.warnings.length, 0, `reparse warnings: ${c2.warnings.join(' | ')}`);
    const d2 = c2.decompile();
    assert.equal(d2, d1, 'lcd print with join must be a decompile fixed point');
});

test('lcd print with prefix join (no parens) round-trips', () => {
    const src = `DEVICE ARDUINO-UNO
CLOCK 16000000

SPRITE Cat:
  WHEN flag clicked:
    set count to 0
    lcd print join "COUNT: " count on 1`;
    const c1 = new SB3Creator();
    c1.parse(src);
    assert.equal(c1.warnings.length, 0, `parse warnings: ${c1.warnings.join(' | ')}`);

    // The TEXT input must be a join reporter, not a string literal
    const t1 = c1.project.targets[1];
    const lcdBlock = Object.values(t1.blocks).find(b => b.opcode === 'devices_lcdprint');
    assert.ok(lcdBlock, 'must have a devices_lcdprint block');
    // TEXT should be a block reference (reporter), not type [1,[10,...]] string literal
    assert.notEqual(lcdBlock.inputs.TEXT[1][0], 10,
        'TEXT input must be a join reporter, not a string literal');

    const d1 = c1.decompile();
    assert.doesNotMatch(d1, /"join /, 'join must not be quoted as a string literal');
});

// ---- lcd clear wrong arity (Bug 2) ----
// `lcd clear on 1` has wrong syntax (clear takes a bare display name, not "on N").
// It should produce a warning, not silently create a variable named "on 1".
test('lcd clear with wrong arity warns instead of creating garbage variable', () => {
    const c = new SB3Creator();
    c.parse(`DEVICE ARDUINO-UNO
CLOCK 16000000

SPRITE Cat:
  WHEN flag clicked:
    lcd clear on 1`);
    // Must produce a warning about the whitespace in the display arg
    assert.ok(c.warnings.length > 0,
        'lcd clear on 1 should produce a warning');
    assert.ok(c.warnings.some(w => /whitespace|display|lcd clear/i.test(w)),
        `expected a warning about display arg whitespace, got: ${c.warnings.join(' | ')}`);
    // Must NOT create a variable named "on 1"
    const t1 = c.project.targets[1];
    const varNames = Object.values(t1.variables || {}).map(v => v[0]);
    assert.ok(!varNames.includes('on 1'),
        'must not create a variable named "on 1"');
});

test('decompiled pseudocode is human-readable (spot check)', () => {
    const c = new SB3Creator();
    c.parse(`SPRITE Hero:
  GLOBAL score
  WHEN flag clicked:
    set score to 0
    FOREVER:
      IF score > (2 + 3) THEN:
        move 10 steps
      wait 0.1 seconds`);
    const out = c.decompile();
    assert.match(out, /WHEN flag clicked:/);
    assert.match(out, /FOREVER:/);
    assert.match(out, /IF score > \(2 \+ 3\) THEN:/);
    assert.match(out, /move 10 steps/);
});
