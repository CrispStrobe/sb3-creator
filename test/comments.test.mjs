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

// A body whose last lines are comments has no block after them to take them.
// They used to stay pending and attach to the next block created ANYWHERE —
// another script's FOREVER — whose own comment was then lost; and an empty
// hat's body indent was read from the blank line after it, so in a STAGE: or
// SPRITE section the next script parsed as over-indented and was dropped.
test('comments: trailing comments stay in their own script, and an empty hat leaves the next script alone', () => {
    const src = [
        'WHEN flag clicked:',
        '  # unsupported: turtle.setPosition()',
        '  # unsupported: turtle.turnRight()',
        '',
        'WHEN flag clicked:',
        '  FOREVER:',
        '    # unsupported: turtle.forward()',
        '  say "after"'
    ].join('\n');
    const c = new SB3Creator();
    c.parse(src);
    const stage = c.project.targets.find(t => t.isStage);
    const byText = Object.fromEntries(Object.values(stage.comments || {}).filter(x => x.blockId)
        .map(x => [x.text, stage.blocks[x.blockId].opcode]));
    assert.deepEqual(byText, {
        'unsupported: turtle.setPosition()\nunsupported: turtle.turnRight()': 'event_whenflagclicked',
        'unsupported: turtle.forward()': 'control_forever'
    });
    // The decompiled text parses again, with every script and comment.
    const text = new SB3Creator().decompile(c.project);
    const again = new SB3Creator();
    again.parse(text);
    assert.deepEqual(again.unparsed || [], []);
    const back = again.project.targets.find(t => t.isStage);
    assert.equal(Object.values(back.blocks).filter(b => b.opcode === 'event_whenflagclicked').length, 2);
    assert.ok(Object.values(back.blocks).some(b => b.opcode === 'control_forever'));
    assert.equal(Object.values(back.comments || {}).filter(x => x.blockId).length, 2);
    // and a fixed point from there on
    assert.equal(new SB3Creator().decompile(again.project), text);
});

test('comments: a comment indented less than the body belongs to the code after it', () => {
    const c = new SB3Creator();
    c.parse(['SPRITE T:', '  WHEN flag clicked:', '    IF 1 = 1 THEN:', '      say "a"', '    # about b', '    say "b"'].join('\n'));
    const sprite = c.project.targets.find(t => !t.isStage);
    const [comment] = Object.values(sprite.comments).filter(x => x.blockId);
    assert.equal(comment.text, 'about b');
    const block = sprite.blocks[comment.blockId];
    assert.equal(block.opcode, 'looks_say');
    assert.equal(sprite.blocks[block.inputs.MESSAGE[1]]?.fields?.TEXT?.[0] ?? block.inputs.MESSAGE[1][1], 'b');
});

test('comments: a comment above DEFINE belongs to the definition and survives a round trip', () => {
    const src = ['SPRITE T:', '  # what it does', '  DEFINE number (picture):', '    # unsupported: picture.fill()', '  WHEN flag clicked:', '    say "x"'].join('\n');
    const c = new SB3Creator();
    c.parse(src);
    const sprite = c.project.targets.find(t => !t.isStage);
    const define = Object.entries(sprite.blocks).find(([, b]) => b.opcode === 'procedures_definition');
    assert.equal(sprite.comments[define[1].comment].text, 'what it does\nunsupported: picture.fill()');
    const once = new SB3Creator().decompile(c.project);
    const again = new SB3Creator();
    again.parse(once);
    assert.equal(new SB3Creator().decompile(again.project), once);
    assert.match(once, /# what it does\n\s*# unsupported: picture\.fill\(\)\n\s*DEFINE number/);
});
