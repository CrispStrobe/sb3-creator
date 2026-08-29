/**
 * A bare value used as a condition means the same thing in every backend.
 *
 * THE DEFECT (D26), re-measured
 * ----------------------------
 * The ledger recorded this as "the PREFIX bitop form does not compose with a
 * comparison and the INFIX form does not work bare — complementary holes", and
 * said it had never been isolated to a component. Measured on 2026-08-29 across
 * six spellings and four backends, the row is right that there are two holes
 * and wrong about what either of them is.
 *
 * `IF <value> THEN:` has no shape of its own in Scratch — a round reporter
 * cannot go in a hexagonal slot — so `parseCondition`'s last resort builds
 * `<value> = "true"`. Every backend then read that literally, its own way. With
 * `val = 128` and the plainly-true condition `val bitand 128`:
 *
 *   device C   `if (((val & 128)))`         TRUE   — the only one that was right
 *   host C     `bw_cmp(x, "true") == 0`     false
 *   JavaScript `_eq(x, "true")`             false  — 128 is not the string "true"
 *   Python     `_eq(x, "true")`             false
 *   referee    `num(x) === num("true")`     TRUE WHEN x IS ZERO — `num("true")`
 *                                           is 0, so the test was inverted
 *
 * That inversion is why the row said the PREFIX form "works bare": measured
 * through the referee, the phantom variable a prefix spelling invents is 0, and
 * 0 was the one value that passed. Neither half of the row's summary survives
 * measurement, and both defects underneath it are real:
 *
 *   HOLE 1  a bare value as a condition is read differently by four backends.
 *   HOLE 2  the prefix spelling `bitand a b` is not a form at all: it is
 *           swallowed as a VARIABLE NAME, silently, in every position.
 *
 * THE FIX
 * -------
 * Hole 1: the rule the device C emitter already carried — "`IF <boolean-ish>
 * THEN:` parses to `x = true`; on a chip that is just `x`" — is now
 * `SB3Creator.boolishTruthTest`, and the JS, Python, host-C and referee
 * backends all ask it. The two with strings get Scratch's own cast (`_truthy`);
 * the C targets keep `(x)`, which is the same thing for a `long`.
 *
 * Hole 2: refused rather than accepted. Accepting `bitand a b` would give the
 * dialect two spellings for one operator while `decompile` emits exactly one,
 * so the parser now WARNS and names the infix form. The corpus gate that found
 * the original instance (`program-reads-what-it-writes.test.mjs`) catches it
 * only for shipped examples, after the fact; this makes the compiler say it.
 *
 * WHAT THIS FILE ASSERTS: the agreement itself, executed rather than argued —
 * the JavaScript and the Python are RUN, the referee is run, and the device C
 * is read. Mutations that bite: revert any one backend's `boolishTruthTest`
 * branch and the agreement test names the backend that disagrees.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import SB3Creator from '../src/utils/sb3Creator.js';
import { interpretTrace } from '../src/utils/traceOracle.js';

const HAVE_PYTHON = (() => {
    try { execFileSync('python3', ['--version'], { stdio: 'pipe' }); return true; } catch { return false; }
})();
const TMP = mkdtempSync(join(tmpdir(), 'bare-cond-'));

/** A stage program that says YES or NO, so JS and Python can be EXECUTED. */
const stageProgram = (setup, cond) => [
    'WHEN flag clicked:', ...setup.map((l) => `  ${l}`),
    `  IF ${cond} THEN:`, '    say "YES"', '  ELSE:', '    say "NO"',
].join('\n');

/** The same decision on a device, so the C emitter and the referee can answer. */
const deviceProgram = (setup, cond) => [
    'DEVICE STC12C5A60S2', 'CLOCK 11059200', 'PIN led = P1.0 OUTPUT', '',
    'WHEN flag clicked:', ...setup.map((l) => `  ${l}`),
    `  IF ${cond} THEN:`, '    turn on led', '  ELSE:', '    turn off led',
    '  wait 1 seconds',
].join('\n');

function runJs (source) {
    const c = new SB3Creator();
    c.parse(source);
    const logs = [];
    const sandbox = { console: { log: (...a) => logs.push(a.join(' ')), error () {}, warn () {}, info () {} }, prompt: () => '' };
    try { vm.runInNewContext(c.generateJavaScript(), sandbox, { timeout: 2000 }); } catch (e) {
        if (!/timed out/i.test(e.message) && e.code !== 'ERR_SCRIPT_EXECUTION_TIMEOUT') throw e;
    }
    return logs.join('|');
}

function runPy (source, tag) {
    const c = new SB3Creator();
    c.parse(source);
    const file = join(TMP, `${tag}.py`);
    writeFileSync(file, c.generatePython());
    return execFileSync('python3', [file], { encoding: 'utf8', timeout: 15000 }).trim();
}

/** The referee's verdict: did the LED come on? */
function runReferee (source) {
    const c = new SB3Creator();
    const project = c.parse(source);
    const trace = interpretTrace(project, { horizonMs: 100 });
    assert.deepEqual(trace.unsupported, [], 'the referee must speak every opcode used here');
    const last = trace.events.filter((e) => e.pin === 'led').at(-1);
    return last ? last.level === 1 : false;
}

/** What the device C emitter decided, read off the emitted `if`. */
function cCondition (source) {
    const c = new SB3Creator();
    c.parse(source);
    return c.generateC().split('\n').map((l) => l.trim()).find((l) => /^if \(/.test(l));
}

describe('a bare value used as a condition', () => {
    // Numbers and strings, with the answer Scratch's own cast gives. These are
    // the values the four backends used to disagree about.
    const CASES = [
        { setup: ['set val to 128'], cond: 'val bitand 128', want: true, why: '128 & 128 = 128' },
        { setup: ['set val to 128'], cond: 'val bitand 1', want: false, why: '128 & 1 = 0' },
        { setup: ['set val to 5'], cond: 'val shiftright 3', want: false, why: '5 >> 3 = 0' },
        { setup: ['set val to 5'], cond: 'val shiftleft 3', want: true, why: '5 << 3 = 40' },
        { setup: ['set val to 0'], cond: 'val', want: false, why: '0 is false' },
        { setup: ['set val to 1'], cond: 'val', want: true, why: 'non-zero is true' },
    ];

    for (const { setup, cond, want, why } of CASES) {
        test(`\`IF ${cond} THEN\` is ${want} in JavaScript, Python and the referee — ${why}`, (t) => {
            const stage = stageProgram(setup, cond);
            assert.equal(runJs(stage), want ? 'YES' : 'NO', 'JavaScript');
            if (HAVE_PYTHON) {
                assert.equal(runPy(stage, cond.replace(/\W+/g, '_')), want ? 'YES' : 'NO', 'Python');
            } else {
                t.diagnostic('python3 not on PATH — the Python half of this case did not run');
            }
            assert.equal(runReferee(deviceProgram(setup, cond)), want, 'the referee');
        });
    }

    test('the string cases follow Scratch: "", "0" and "false" are the only false ones', () => {
        const table = [['""', false], ['"0"', false], ['"false"', false],
            ['"FALSE"', false], ['"true"', true], ['"hello"', true], ['"00"', false]];
        for (const [lit, want] of table) {
            const src = stageProgram([`set val to ${lit}`], 'val');
            assert.equal(runJs(src), want ? 'YES' : 'NO', `JavaScript on ${lit}`);
            if (HAVE_PYTHON) {
                assert.equal(runPy(src, `s${lit.replace(/\W+/g, '')}`), want ? 'YES' : 'NO', `Python on ${lit}`);
            }
        }
    });

    test('the device C emitter reads it as truth, and always did', () => {
        // This is the rule the other three now follow, so it is asserted as the
        // reference rather than as one opinion among four.
        assert.equal(cCondition(deviceProgram(['set val to 128'], 'val bitand 128')),
            'if (((val & 128))) {');
        assert.equal(cCondition(deviceProgram(['set val to 128'], '(val bitand 128) > 0')),
            'if (((val & 128) > 0)) {');
    });

    test('bare and compared agree — the two halves the D26 row called complementary', () => {
        for (const [bare, compared] of [
            ['val bitand 128', '(val bitand 128) > 0'],
            ['val bitand 1', '(val bitand 1) > 0'],
        ]) {
            const setup = ['set val to 128'];
            assert.equal(runJs(stageProgram(setup, bare)), runJs(stageProgram(setup, compared)),
                `JavaScript: \`${bare}\` and \`${compared}\` must decide the same way`);
            assert.equal(runReferee(deviceProgram(setup, bare)), runReferee(deviceProgram(setup, compared)),
                `the referee: \`${bare}\` and \`${compared}\` must decide the same way`);
        }
    });
});

describe('the prefix spelling of a bit operator is refused, not swallowed', () => {
    const PREFIX = ['bitand val 128', 'bitand val 128 > 0', '(bitand val 128) > 0'];

    for (const cond of PREFIX) {
        test(`\`IF ${cond} THEN\` warns instead of inventing a variable`, () => {
            const c = new SB3Creator();
            c.parse(deviceProgram(['set val to 128'], cond));
            const named = c.warnings.filter((w) => /reads as a VARIABLE NAME/.test(w));
            assert.equal(named.length, 1,
                `expected exactly one prefix-form warning, got ${JSON.stringify(c.warnings)}`);
            assert.match(named[0], /bitand/, 'the warning must name the operator it found');
            assert.match(named[0], /infix/, 'and say which spelling the dialect uses');
        });
    }

    test('the warning carries the line number of the statement it is on', () => {
        const c = new SB3Creator();
        c.parse(deviceProgram(['set val to 128'], 'bitand val 128'));
        // DEVICE/CLOCK/PIN/blank/WHEN/set/IF -> the IF is source line 7.
        assert.match(c.warnings.find((w) => /VARIABLE NAME/.test(w)), /^Line 7:/);
    });

    test('the infix spelling is silent, in every position', () => {
        for (const cond of ['val bitand 128', 'val bitand 128 > 0', '(val bitand 128) > 0']) {
            const c = new SB3Creator();
            c.parse(deviceProgram(['set val to 128'], cond));
            assert.deepEqual(c.warnings, [], `\`${cond}\` is the dialect's own form and must not warn`);
        }
    });

    test('a real multi-word variable name is still a name', () => {
        const c = new SB3Creator();
        c.parse(stageProgram(['set high score to 10', 'set n to high score'], 'n > 5'));
        assert.deepEqual(c.warnings, [],
            'the refusal is scoped to names containing a bit-operator word, so ordinary '
            + 'multi-word names are untouched');
    });
});

describe('a comparison in value position says so', () => {
    test('`set flag to (val > 5)` warns rather than storing the text', () => {
        const c = new SB3Creator();
        c.parse(stageProgram(['set val to 128', 'set flag to (val > 5)'], 'flag'));
        const named = c.warnings.filter((w) => /is a COMPARISON used where a value is expected/.test(w));
        assert.equal(named.length, 1, `got ${JSON.stringify(c.warnings)}`);
        // And the reason it is worth a warning: the value really is the text.
        const dev = new SB3Creator();
        dev.parse(deviceProgram(['set val to 128', 'set flag to (val > 5)'], 'flag'));
        assert.match(dev.generateC(), /flag = 0 \/\* val > 5 \*\//,
            'the emitted C is a constant 0 with the source as a comment — which is why '
            + 'this shape has to be named at parse time');
    });

    test('an ordinary string value does not warn', () => {
        const c = new SB3Creator();
        c.parse(stageProgram(['set msg to "hello"'], 'msg'));
        assert.deepEqual(c.warnings, []);
    });
});

/**
 * FOUND WHILE ISOLATING D26, NOT FIXED HERE — and named rather than tolerated.
 *
 * `not <condition>` has no VALUE form either, and unlike a comparison it is a
 * shape this repo's own Arduino reader EMITS: `cToPseudocode` translates
 * `int sensorVal = digitalRead(2);` on an INPUT_PULLUP pin to
 * `set sensorVal to not read d2`, because it has to undo the polarity the
 * declaration applies. Re-parsed, that is a variable called "not read d2" that
 * nothing writes — so the importer's own round trip is not faithful, and the
 * gate that re-parses it (`arduino-import.test.mjs`) only checks for warnings,
 * which is exactly what a silent swallow does not produce.
 *
 * It is NOT fixed with the other two because it is not a bug with an obvious
 * repair: it is a dialect decision. A boolean in value position has to be
 * given a value, and Scratch says the STRINGS "true"/"false" while every C
 * target says 1/0. Choosing either makes `print` disagree across backends —
 * the same disease D26 turned out to be. That choice belongs with whoever owns
 * the dialect, and it wants the four-backend agreement test above extended to
 * value position rather than a one-emitter patch.
 *
 * DELETE THIS TEST when the form is supported, and add the value-position row
 * to the agreement table.
 */
describe('OPEN DEFECT: a boolean used where a value is expected', () => {
    test('`set x to not <cond>` is swallowed as a variable name, silently', () => {
        const c = new SB3Creator();
        c.parse([
            'DEVICE ARDUINO-UNO', 'CLOCK 16000000', 'PIN btn = D2 INPUT ACTIVE LOW', '',
            'WHEN flag clicked:', '  set raw to not read btn', '  print raw',
        ].join('\n'));
        assert.deepEqual(c.warnings, [],
            'nothing warns — if this now warns, the hole was closed or narrowed; '
            + 'update this test and D26 in docs/WAVE-OPEN-DEFECTS.md');
        assert.match(c.generateC(), /raw = not_read_btn;/,
            'the emitted C reads a phantom global that nothing ever writes. When this '
            + 'stops reproducing, delete this test and extend the agreement table above '
            + 'to value position.');
    });

    test("and it is a shape this repo's own Arduino reader emits", async () => {
        const cToPseudocode = (await import('../src/utils/cToPseudocode.js')).default;
        const { pseudocode } = cToPseudocode([
            '#include <Arduino.h>',
            'void setup() { pinMode(2, INPUT_PULLUP); pinMode(13, OUTPUT); }',
            'void loop() { int sensorVal = digitalRead(2); digitalWrite(13, sensorVal); }',
        ].join('\n'));
        assert.match(pseudocode, /^PIN d2 = D2 INPUT ACTIVE LOW$/m,
            'the reader states the polarity INPUT_PULLUP implies');
        assert.match(pseudocode, /set sensorVal to not read d2/,
            'and compensates for it with a form the parser cannot read back');
    });
});
