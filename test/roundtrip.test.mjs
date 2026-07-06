// Python -> blocks round-trip (PLAN §22 P3). generatePython emits the algorithmic
// subset; pythonToPseudocode parses it back to pseudocode, which parse() recompiles
// to blocks. The loop must survive for every example, and behave identically for the
// runnable ones.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import pythonToPseudocode from '../src/utils/pythonToPseudocode.js';
import examples from '../src/utils/examples.js';

// Every example's generated Python must parse back to pseudocode and recompile to
// blocks without throwing (graphics become comments and are simply dropped).
for (const [name, code] of Object.entries(examples)) {
    test(`round-trip: ${name} survives Python -> pseudocode -> blocks`, () => {
        const c0 = new SB3Creator();
        c0.parse(code);
        const py = c0.generatePython();
        const { pseudocode } = pythonToPseudocode(py);
        assert.match(pseudocode, /^SPRITE /m, 'produces a sprite');
        const c1 = new SB3Creator();
        assert.doesNotThrow(() => c1.parse(pseudocode), 'recompiles to blocks');
    });
}

test('round-trip: the quiz still scores correctly after Python -> blocks', () => {
    const c0 = new SB3Creator();
    c0.parse(examples.educational);
    const { pseudocode, warnings } = pythonToPseudocode(c0.generatePython());
    assert.equal(warnings.length, 0, 'no lossy warnings for the algorithmic subset');
    // recompile and run via the JS backend
    const c1 = new SB3Creator();
    c1.parse(pseudocode);
    const js = c1.generateJavaScript();
    const answers = ['12', '32'];
    let i = 0;
    const logs = [];
    new Function('prompt', 'console', js)(() => answers[i++], { log: (...x) => logs.push(x.join(' ')) });
    assert.equal(logs.filter((l) => l === 'Correct!').length, 2, 'both answers correct');
    assert.equal(logs[logs.length - 1], '2', 'final score is 2');
});

test('round-trip: key constructs map back to pseudocode', () => {
    const py = [
        'nums = []',
        'total = 0',
        'def when_flag_clicked():',
        '    global total',
        '    nums.append(5)',
        '    for _ in range(int(3)):',
        '        total += 1',
        '    if _eq(total, 3):',
        '        print("done")',
        '    while not (total < 0):',
        '        total += -1',
        'when_flag_clicked()'
    ].join('\n');
    const { pseudocode } = pythonToPseudocode(py);
    assert.match(pseudocode, /LIST nums/);
    assert.match(pseudocode, /add 5 to nums/);
    assert.match(pseudocode, /REPEAT 3:/);
    assert.match(pseudocode, /change total by 1/);
    assert.match(pseudocode, /IF total = 3 THEN:/);
    assert.match(pseudocode, /say "done"/);
    assert.match(pseudocode, /REPEAT UNTIL total < 0:/);
    // and it compiles
    const c = new SB3Creator();
    assert.doesNotThrow(() => c.parse(pseudocode));
});

test('round-trip: input(), list ops, and math map back', () => {
    const py = [
        'def when_flag_clicked():',
        '    global x',
        '    x = input(str("pick?") + " ")',
        '    x = (pick_helper)',
        '    print(str("v=") + str(x))',
        'when_flag_clicked()'
    ].join('\n').replace('(pick_helper)', 'random.randint(1, 6)');
    const { pseudocode } = pythonToPseudocode(py);
    assert.match(pseudocode, /ask "pick\?" and wait/);
    assert.match(pseudocode, /set x to answer/);
    assert.match(pseudocode, /pick random 1 to 6/);
    assert.match(pseudocode, /"v=" join x/);
});
