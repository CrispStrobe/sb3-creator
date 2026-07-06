// Python/JavaScript -> blocks round-trip (PLAN §22 P3). generatePython /
// generateJavaScript emit the algorithmic subset; pythonToPseudocode /
// javascriptToPseudocode parse it back to pseudocode, which parse() recompiles to
// blocks. The loop must survive for every example and behave identically for the
// runnable ones. All three languages are two-way.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import pythonToPseudocode from '../src/utils/pythonToPseudocode.js';
import javascriptToPseudocode from '../src/utils/javascriptToPseudocode.js';
import examples from '../src/utils/examples.js';

const BACKENDS = [
    { name: 'python', gen: (c) => c.generatePython(), parse: (s) => pythonToPseudocode(s) },
    { name: 'javascript', gen: (c) => c.generateJavaScript(), parse: (s) => javascriptToPseudocode(s) }
];

// Every example's generated code (Python + JS) must parse back to pseudocode and
// recompile to blocks without throwing (graphics become comments and are dropped).
for (const be of BACKENDS) {
    for (const [name, code] of Object.entries(examples)) {
        test(`round-trip[${be.name}]: ${name} survives code -> pseudocode -> blocks`, () => {
            const c0 = new SB3Creator();
            c0.parse(code);
            const src = be.gen(c0);
            const { pseudocode } = be.parse(src);
            assert.match(pseudocode, /^SPRITE /m, 'produces a sprite');
            const c1 = new SB3Creator();
            assert.doesNotThrow(() => c1.parse(pseudocode), 'recompiles to blocks');
        });
    }
}

// The quiz must still score correctly after code -> blocks, for BOTH languages.
for (const be of BACKENDS) {
    test(`round-trip[${be.name}]: the quiz still scores 2 after code -> blocks`, () => {
        const c0 = new SB3Creator();
        c0.parse(examples.educational);
        const { pseudocode, warnings } = be.parse(be.gen(c0));
        assert.equal(warnings.length, 0, 'no lossy warnings for the algorithmic subset');
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
}

// Editing the code must change the blocks (not just identity round-trip).
for (const be of BACKENDS) {
    test(`round-trip[${be.name}]: editing the expected answer changes behaviour`, () => {
        const c0 = new SB3Creator();
        c0.parse(examples.educational);
        const edited = be.gen(c0).replace('_eq(answer, 12)', '_eq(answer, 99)');
        const { pseudocode } = be.parse(edited);
        const c1 = new SB3Creator();
        c1.parse(pseudocode);
        const js = c1.generateJavaScript();
        const answers = ['12', '32'];
        let i = 0;
        const logs = [];
        new Function('prompt', 'console', js)(() => answers[i++], { log: (...x) => logs.push(x.join(' ')) });
        assert.equal(logs.filter((l) => l === 'Correct!').length, 1, 'first answer now wrong');
        assert.equal(logs[logs.length - 1], '1', 'final score is 1');
    });
}

test('python: key constructs map back to pseudocode', () => {
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
    const c = new SB3Creator();
    assert.doesNotThrow(() => c.parse(pseudocode));
});

test('javascript: key constructs map back to pseudocode', () => {
    const js = [
        'let nums = [];',
        'let total = 0;',
        'function when_flag_clicked() {',
        '  nums.push(5);',
        '  for (let _i1 = 0; _i1 < 3; _i1++) {',
        '    total += 1;',
        '  }',
        '  if (_eq(total, 3)) {',
        '    console.log("done");',
        '  }',
        '  while (!(total < 0)) {',
        '    total += -1;',
        '  }',
        '  if ((total > 5)) {',
        '    console.log((String("t=") + String(total)));',
        '  }',
        '}',
        'when_flag_clicked();'
    ].join('\n');
    const { pseudocode } = javascriptToPseudocode(js);
    assert.match(pseudocode, /LIST nums/);
    assert.match(pseudocode, /add 5 to nums/);
    assert.match(pseudocode, /REPEAT 3:/);
    assert.match(pseudocode, /change total by 1/);
    assert.match(pseudocode, /IF total = 3 THEN:/);
    assert.match(pseudocode, /say "done"/);
    assert.match(pseudocode, /REPEAT UNTIL total < 0:/);
    assert.match(pseudocode, /IF total > 5 THEN:/);
    assert.match(pseudocode, /"t=" join total/);
    const c = new SB3Creator();
    assert.doesNotThrow(() => c.parse(pseudocode));
});

test('javascript: list ops (push/splice/length) and &&/||/! map back', () => {
    const js = [
        'let xs = [];',
        'function when_flag_clicked() {',
        '  xs.push(1);',
        '  xs.splice(Number(2) - 1, 1);',
        '  xs.splice(Number(1) - 1, 0, 9);',
        '  xs[Number(1) - 1] = 7;',
        '  xs.length = 0;',
        '  if (((xs.length > 0) && !(xs.includes(3)))) {',
        '    console.log("x");',
        '  }',
        '}'
    ].join('\n');
    const { pseudocode } = javascriptToPseudocode(js);
    assert.match(pseudocode, /add 1 to xs/);
    assert.match(pseudocode, /delete 2 of xs/);
    assert.match(pseudocode, /insert 9 at 1 of xs/);
    assert.match(pseudocode, /replace item 1 of xs with 7/);
    assert.match(pseudocode, /delete all of xs/);
    assert.match(pseudocode, /length of xs/);
    assert.match(pseudocode, /and/);
    assert.match(pseudocode, /not /);
    assert.match(pseudocode, /xs contains 3/);
    const c = new SB3Creator();
    assert.doesNotThrow(() => c.parse(pseudocode));
});

test('python: input(), pick random, and join map back', () => {
    const py = [
        'def when_flag_clicked():',
        '    global x',
        '    x = input(str("pick?") + " ")',
        '    x = random.randint(1, 6)',
        '    print(str("v=") + str(x))',
        'when_flag_clicked()'
    ].join('\n');
    const { pseudocode } = pythonToPseudocode(py);
    assert.match(pseudocode, /ask "pick\?" and wait/);
    assert.match(pseudocode, /set x to answer/);
    assert.match(pseudocode, /pick random 1 to 6/);
    assert.match(pseudocode, /"v=" join x/);
});

test('javascript: prompt, _rand, and String concat map back', () => {
    const js = [
        'let x = 0;',
        'function when_flag_clicked() {',
        '  x = prompt(String("pick?"));',
        '  x = _rand(1, 6);',
        '  console.log((String("v=") + String(x)));',
        '}'
    ].join('\n');
    const { pseudocode } = javascriptToPseudocode(js);
    assert.match(pseudocode, /ask "pick\?" and wait/);
    assert.match(pseudocode, /pick random 1 to 6/);
    assert.match(pseudocode, /"v=" join x/);
});

// Empty / malformed input must throw a clean, typed error (not crash the caller).
test('parsers reject empty input with a clear error', () => {
    assert.throws(() => pythonToPseudocode(''), /empty/i);
    assert.throws(() => javascriptToPseudocode(''), /empty/i);
});

test('javascript parser reports a line number on a syntax error', () => {
    assert.throws(() => javascriptToPseudocode('function f() {\n  let x = ;\n}'), /line \d+/);
});

// Regression: minimal top-level code with no hat/function must still compile
// (previously "SyntaxError: bad input on line 1" when JS was fed to the pseudocode parser).
test('minimal module-level declarations compile (no function/hat)', () => {
    for (const [parse, src] of [
        [javascriptToPseudocode, '// Generated\nlet my_variable = 0;'],
        [pythonToPseudocode, '# Generated\nmy_variable = 0'],
        [javascriptToPseudocode, 'let a = 5;\nlet b = [];']
    ]) {
        const { pseudocode } = parse(src);
        assert.match(pseudocode, /^SPRITE /m);
        const c = new SB3Creator();
        assert.doesNotThrow(() => c.parse(pseudocode));
    }
});

// Regression: a whole example's generated code, edited to nonsense in ONE line,
// should surface a typed parse error rather than crash.
test('a broken line yields a typed, line-numbered parse error', () => {
    assert.throws(() => javascriptToPseudocode('function f() {\n  let x = @#$;\n}'), /JavaScript parse error \(line \d+\)/);
    assert.throws(() => pythonToPseudocode('def f():\n    x = = 5'), /Python parse error \(line \d+\)/);
});
