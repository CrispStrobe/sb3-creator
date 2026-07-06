// Comment preservation: `# comment` lines attach to the following block as Scratch
// block comments (stored on the target, the ground truth) so they survive
// compile → decompile (To blocks → From blocks), including nested and hat-level.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

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

test('comments: do not affect generated Python/JS (they run the same)', () => {
    const withC = new SB3Creator(); withC.parse(SRC);
    const noC = new SB3Creator(); noC.parse(SRC.split('\n').filter(l => !l.trim().startsWith('#')).join('\n'));
    assert.equal(withC.generateJavaScript(), noC.generateJavaScript(), 'comments are inert for codegen');
});
