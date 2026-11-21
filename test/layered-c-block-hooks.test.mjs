// The three doors a dialect layered on this compiler uses for its own C-blocks
// (Brickwright Lite's TinkerCAD-style `cad …` modelling words are the first):
//   - SB3Creator#parseBodyHeader(header, target): a `…:` header no built-in owns;
//   - the Python reader's `with item:` statement (a `With` node);
//   - the JavaScript reader's zero-parameter `() => { … }` (an `ArrowBlock` node).
// Unclaimed, each behaves as it did before the door existed.
import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import pythonToPseudocode, {Tokenizer, Parser} from '../src/utils/pythonToPseudocode.js';
import javascriptToPseudocode from '../src/utils/javascriptToPseudocode.js';

test('parseBodyHeader turns an unknown `…:` header into a C-block with its body', () => {
    class Layered extends SB3Creator {
        parseBodyHeader (header, target) {
            if (!/^wrap$/i.test(header.trim())) return null;
            const {block} = this.createBlock('control_forever');
            return {block, extraBlocks: {}};
        }
    }
    const c = new Layered();
    c.parse('WHEN flag clicked:\n  wrap:\n    say "hi"\n');
    const blocks = c.project.targets.flatMap(t => Object.values(t.blocks));
    const wrap = blocks.find(b => b.opcode === 'control_forever');
    assert.ok(wrap && wrap.inputs.SUBSTACK, 'the header became a C-block with a body');
    const all = Object.assign({}, ...c.project.targets.map(t => t.blocks));
    assert.equal(all[wrap.inputs.SUBSTACK[1]].opcode, 'looks_say', 'the indented line is its body');

    assert.throws(() => new SB3Creator().parse('WHEN flag clicked:\n  wrap:\n    say "hi"\n'),
        /not a block header this dialect has/, 'without the door the header is still refused');
});

test('the Python reader parses `with item:` into a With node; `with` as a name is untouched', () => {
    const ast = new Parser(new Tokenizer('with thing.open(1):\n    x = 2\nwith = 3\n').tokenize()).parseProgram();
    assert.equal(ast.body[0].type, 'With');
    assert.equal(ast.body[0].item.type, 'Call');
    assert.equal(ast.body[0].body[0].type, 'Assign');
    assert.equal(ast.body[1].type, 'Assign');
    // Unclaimed, the translator refuses it by name rather than guessing.
    assert.doesNotThrow(() => pythonToPseudocode('with thing.open(1):\n    x = 2\n'));
});

test('the JavaScript reader keeps a zero-parameter arrow body; unclaimed it reads as nothing', () => {
    const out = javascriptToPseudocode('let x = 0;\nfoo(() => { x = 1; });\nx = 2;\n').pseudocode;
    assert.match(out, /set x to 2/);
    assert.doesNotMatch(out, /set x to 1/);
});
