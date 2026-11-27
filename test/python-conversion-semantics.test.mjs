import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import SB3Creator from '../src/utils/sb3Creator.js';
import pythonToPseudocode, { Parser, Tokenizer, Translator } from '../src/utils/pythonToPseudocode.js';
import javascriptToPseudocode from '../src/utils/javascriptToPseudocode.js';

const program = body => `def when_flag_clicked():\n${body.map(line => `    ${line}`).join('\n')}\nwhen_flag_clicked()\n`;
const nativeOutput = source => execFileSync('python3', ['-c', source], { encoding: 'utf8', timeout: 5000 });
const spanForLine = (source, line) => {
    const text = source.replace(/\r\n?/g, '\n').split('\n')[line - 1];
    return { start: { line, column: text.search(/\S/) + 1 }, end: { line, column: text.trimEnd().length + 1 } };
};
const refusal = source => {
    let caught;
    assert.throws(() => pythonToPseudocode(source), error => {
        caught = error;
        return error.name === 'PythonConversionError' && error.code === 'PYTHON_CONVERSION_UNSUPPORTED';
    });
    assert.equal(caught.isPyConversionError, true);
    assert.ok(caught.diagnostics.length > 0);
    assert.equal(caught.sourceSpan, caught.diagnostics[0].sourceSpan);
    assert.match(caught.message, /Keep this Python source to run it; no converted project was produced/);
    return caught;
};

const witnesses = [
    { name: 'positive floor division', lines: ['x = 7 // 2', 'print(x)'], output: '3\n', code: 'python-floor-division', line: 2 },
    { name: 'negative floor division', lines: ['x = -7 // 2', 'print(x)'], output: '-4\n', code: 'python-floor-division', line: 2 },
    { name: 'multiplication assignment', lines: ['x = 3', 'x *= 2', 'print(x)'], output: '6\n', code: 'python-augmented-assignment', line: 3 },
    { name: 'division assignment', lines: ['x = 8', 'x /= 2', 'print(x)'], output: '4.0\n', code: 'python-augmented-assignment', line: 3 },
    { name: 'remainder assignment', lines: ['x = 8', 'x %= 3', 'print(x)'], output: '2\n', code: 'python-augmented-assignment', line: 3 },
    { name: 'break', lines: ['x = 0', 'while x < 5:', '    x += 1', '    if x == 3:', '        break', 'print(x)'], output: '3\n', code: 'python-break', line: 6 },
    { name: 'continue', lines: ['x = 0', 'while x < 3:', '    x += 1', '    if x == 1:', '        continue', '    print(x)'], output: '2\n3\n', code: 'python-continue', line: 6 }
];

for (const witness of witnesses) {
    test(`valid Python ${witness.name} is refused instead of silently changed`, () => {
        const source = program(witness.lines);
        assert.equal(nativeOutput(source), witness.output, 'the original Python remains an executable source');
        const error = refusal(source);
        assert.deepEqual(error.diagnostics.map(d => d.code), [witness.code]);
        assert.deepEqual(error.sourceSpan, spanForLine(source, witness.line));
        assert.equal(error.diagnostics[0].kind, 'unsupported');
        assert.equal(error.diagnostics[0].severity, 'error');
        assert.match(error.message, new RegExp(`Line ${witness.line}:`));

        const creator = new SB3Creator();
        creator.parse('SPRITE Original:\nWHEN flag clicked:\n  say "kept"\n');
        const original = JSON.stringify(creator.project);
        assert.throws(() => creator.parse(pythonToPseudocode(source).pseudocode), { code: 'PYTHON_CONVERSION_UNSUPPORTED' });
        assert.equal(JSON.stringify(creator.project), original, 'failed conversion never supplies a replacement project');
    });
}

test('nested loop-control refusals retain each original statement location', () => {
    const source = program([
        'x = 0',
        'while x < 2:',
        '    x += 1',
        '    for _ in range(2):',
        '        if x == 1:',
        '            continue',
        '        print(x)',
        '        break'
    ]);
    assert.equal(nativeOutput(source), '2\n');
    const error = refusal(source);
    assert.deepEqual(error.diagnostics.map(d => [d.code, d.sourceSpan]), [
        ['python-continue', spanForLine(source, 7)],
        ['python-break', spanForLine(source, 9)]
    ]);
});

test('side-effecting floor operands are refused before a replacement is produced', () => {
    const source = [
        'def left():', '    print("left")', '    return 7',
        'def right():', '    print("right")', '    return 2',
        'def when_flag_clicked():', '    x = left() // right()', '    print(x)',
        'when_flag_clicked()', ''
    ].join('\n');
    assert.equal(nativeOutput(source), 'left\nright\n3\n');
    const error = refusal(source);
    assert.equal(error.diagnostics[0].code, 'python-floor-division');
    assert.deepEqual(error.sourceSpan, spanForLine(source, 8));
});

test('an augmented subscript with observable index and RHS evaluation is refused', () => {
    const source = [
        'values = [3]',
        'def index():', '    print("index")', '    return 0',
        'def value():', '    print("value")', '    return 2',
        'def when_flag_clicked():', '    values[index()] *= value()', '    print(values[0])',
        'when_flag_clicked()', ''
    ].join('\n');
    assert.equal(nativeOutput(source), 'index\nvalue\n6\n');
    const error = refusal(source);
    assert.equal(error.diagnostics[0].code, 'python-augmented-assignment');
    assert.deepEqual(error.sourceSpan, spanForLine(source, 9));
});

test('multiline expressions have a complete one-based, end-exclusive statement span', () => {
    const source = program(['x = (', '    -7 //', '    2', ')', 'print(x)']);
    assert.equal(nativeOutput(source), '-4\n');
    const error = refusal(source);
    assert.deepEqual(error.sourceSpan, { start: { line: 2, column: 5 }, end: { line: 5, column: 6 } });
});

test('CRLF source and a nested f-string expression retain their enclosing statement location', () => {
    const source = program(['print("first")', 'print(f"value={7 // 2}")']).replace(/\n/g, '\r\n');
    assert.equal(nativeOutput(source), 'first\nvalue=3\n');
    const error = refusal(source);
    assert.equal(error.diagnostics[0].code, 'python-floor-division');
    assert.deepEqual(error.sourceSpan, spanForLine(source, 3));
});

test('ordinary += and -= conversion still executes like the original Python', () => {
    const source = program(['total = 3', 'total += 2', 'total -= 1', 'print(total)']);
    const expected = nativeOutput(source).trim();
    const { pseudocode, warnings } = pythonToPseudocode(source);
    assert.deepEqual(warnings, []);
    const creator = new SB3Creator();
    creator.parse(pseudocode);
    const output = [];
    new Function('console', creator.generateJavaScript())({ log: value => output.push(String(value)) });
    assert.deepEqual(output, [expected]);
    assert.match(pseudocode, /change total by 2/);
    assert.match(pseudocode, /change total by \(0 - 1\)/);
});

test('operator-like strings and comments do not create false refusals', () => {
    const source = program(['# // *= /= %= break continue', 'print("// *= /= %= break continue")']);
    const { pseudocode, warnings } = pythonToPseudocode(source);
    assert.deepEqual(warnings, []);
    assert.match(pseudocode, /say "\/\/ \*= \/= %= break continue"/);
});

test('independent JavaScript parsing and shared translator policies are unchanged', () => {
    const source = 'function when_flag_clicked() { let x = 3; x += 2; console.log(x); }\nwhen_flag_clicked();';
    assert.deepEqual(javascriptToPseudocode(source).warnings, []);
    const ast = new Parser(new Tokenizer(program(['x = 7 // 2'])).tokenize()).parseProgram();
    assert.equal(ast.body[0].sourceSpan, undefined, 'location enrichment is opt-in for other readers');
    const translator = new Translator();
    assert.match(translator.program(ast), /set x to \(7 \/ 2\)/,
        'the new refusal is at the generic Python boundary, not a policy change for every layered reader');
});

test('the refusal controls reject the previous silent translator path', () => {
    // Counterexample: bypass only the new boundary guard, retaining the real
    // parser and translator. Every witness used to return a changed projection
    // without warnings; an assertion that requires refusal must reject it.
    for (const witness of witnesses) {
        const ast = new Parser(new Tokenizer(program(witness.lines)).tokenize()).parseProgram();
        const translator = new Translator();
        const previous = () => ({ pseudocode: translator.program(ast), warnings: translator.warnings });
        assert.throws(() => assert.throws(previous, { code: 'PYTHON_CONVERSION_UNSUPPORTED' }),
            { code: 'ERR_ASSERTION' }, witness.name);
        assert.deepEqual(translator.warnings, [], 'the original silent acceptance is demonstrated');
    }
});
