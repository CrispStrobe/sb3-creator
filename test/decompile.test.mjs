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
