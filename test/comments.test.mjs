// Comment preservation: `# comment` lines attach to the following block as Scratch
// block comments (stored on the target, the ground truth) so they survive
// compile → decompile (To blocks → From blocks), including nested and hat-level.
// P4: statement-level comments also survive the Python/JS code round-trips (emitted
// as `#`/`//`, re-attached on parse), gated by the `comments` codegen option.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import pythonToPseudocode from '../src/utils/pythonToPseudocode.js';
import javascriptToPseudocode from '../src/utils/javascriptToPseudocode.js';

const SRC = [
    'SPRITE T:',
    '  # this handler runs at start',
    '  WHEN flag clicked:',
    '    # reset the score',
    '    set score to 0',
    '    # greet',
    '    say "hi"',
    '    IF score = 0 THEN:',
    '      # nested note',
    '      say "zero"'
].join('\n');

test('comments: # lines become block comments (no "unknown command" warnings)', () => {
    const c = new SB3Creator();
    c.parse(SRC);
    assert.deepEqual(c.warnings, [], 'comment lines must not warn');
    const sprite = c.project.targets.find(t => !t.isStage);
    const comments = Object.values(sprite.comments || {});
    assert.equal(comments.length, 4, 'four comments captured');
    assert.ok(comments.every(cm => cm.blockId && cm.text), 'each references a block and has text');
});

test('comments: survive compile → decompile at the right indentation', () => {
    const c = new SB3Creator();
    c.parse(SRC);
    const decompiled = new SB3Creator().decompile(c.project);
    assert.match(decompiled, /^\s{4}# reset the score$/m);
    assert.match(decompiled, /^\s{6}# nested note$/m);
    // and it is a stable fixed point
    const c2 = new SB3Creator();
    c2.parse(decompiled);
    assert.equal(new SB3Creator().decompile(c2.project), decompiled, 'decompile is idempotent with comments');
});

// Stack-level comments (P4): those on statements inside a handler survive the code
// round-trips. (A comment on the hat/WHEN line itself stays pseudocode↔blocks-only.)
const STACK_SRC = [
    'SPRITE T:',
    '  WHEN flag clicked:',
    '    # reset the score',
    '    set score to 0',
    '    # greet',
    '    say "hi"',
    '    IF score = 0 THEN:',
    '      # nested note',
    '      say "zero"'
].join('\n');

test('comments: appear in generated Python/JS by default (P4)', () => {
    const c = new SB3Creator(); c.parse(STACK_SRC);
    const py = c.generatePython();
    const js = c.generateJavaScript();
    assert.match(py, /^\s+# reset the score$/m, 'Python emits the comment as #');
    assert.match(js, /^\s+\/\/ nested note$/m, 'JS emits the comment as //');
});

test('comments: {comments:false} strips them (inert, run the same)', () => {
    const c = new SB3Creator(); c.parse(STACK_SRC);
    const noC = new SB3Creator();
    noC.parse(STACK_SRC.split('\n').filter(l => !l.trim().startsWith('#')).join('\n'));
    assert.equal(c.generateJavaScript(c.project, { comments: false }), noC.generateJavaScript(), 'toggle off = inert');
    assert.equal(c.generatePython(c.project, { comments: false }), noC.generatePython(), 'toggle off = inert (py)');
});

test('comments: survive a full pseudocode → Python → blocks round-trip', () => {
    const c = new SB3Creator(); c.parse(STACK_SRC);
    const back = pythonToPseudocode(c.generatePython());
    assert.deepEqual(back.warnings, [], 'no warnings');
    assert.match(back.pseudocode, /^\s+# reset the score$/m);
    assert.match(back.pseudocode, /^\s+# nested note$/m);
});

test('comments: survive a full pseudocode → JavaScript → blocks round-trip', () => {
    const c = new SB3Creator(); c.parse(STACK_SRC);
    const back = javascriptToPseudocode(c.generateJavaScript());
    assert.deepEqual(back.warnings, [], 'no warnings');
    assert.match(back.pseudocode, /^\s+# greet$/m);
    assert.match(back.pseudocode, /^\s+# nested note$/m);
});
