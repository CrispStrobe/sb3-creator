// N2b — the 8086 C route's numeric model is a 16-bit int, stated and refused
// by name, and NO other family moves a byte.
//
// SmallerC's tiny (.COM) model — the one build that yields the image the DOS
// bench loads — has no 32-bit integer type: `long` is a parse error there.
// generateC typed every Scratch number `static long`, so on the 8086 a program
// that stored a number never compiled (brickwright-lite's
// test/i8086-c-long-ceiling measured the reach: 8 of the 33 programs past the
// verb choke, 177 of 300 as the choke lifts). The fix is a per-core scalar type
// (cIntType: `int` on i8086, `long` elsewhere) with two rules the tests below
// pin: (1) a literal or initial value outside -32768..32767 REFUSES the whole
// program by name — never wraps; (2) the emitted header states the width and
// the run-time wrap, so the learner reads the contract, not a surprise. The
// ASM route for the same board keeps 32-bit pairs; the differential in lite
// names the disagreement past 16 bits.
//
// The goldens: the same numeric program on every other family, captured from
// the emitter BEFORE this change (test/fixtures/n2b-int16-goldens.json). If the
// i8086 model leaked into another core by so much as a token, this reddens.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import SB3Creator from '../src/utils/sb3Creator.js';

const emit = (src) => { const c = new SB3Creator(); c.parse(src); const g = c.generateC(); return { code: typeof g === 'string' ? g : g.code, warnings: c._cWarnings || [] }; };
const NUMERIC = 'DEVICE i8086\nPIN led = P1.0 OUTPUT\nWHEN flag clicked:\n  set counter to 300\n  change counter by -5\n  REPEAT 3:\n    change counter by 1\n  IF counter > 100 THEN:\n    turn on led\n';

test('i8086: a numeric variable is a 16-bit int, and no `long` token reaches the output', () => {
    const { code, warnings } = emit(NUMERIC);
    assert.match(code, /^static int counter = 0;$/m, 'the variable is not `static int`');
    assert.doesNotMatch(code, /\blong\b/, 'a `long` token reached the 8086 C: SmallerC -seg16 cannot parse it');
    assert.match(code, /counter = 300;/); assert.match(code, /counter \+= -5;/);
    assert.match(code, /if \(\(counter > 100\)\)/, 'the comparison was not emitted');
    assert.match(code, /-32768\.\.32767/, 'the header does not state the range');
    assert.match(code, /wraps at 16 bits/, 'the header does not state the run-time wrap');
    assert.equal(warnings.length, 0, `unexpected warnings: ${warnings.join(' | ')}`);
});

test('i8086: a literal outside 16 bits refuses the whole program BY NAME, never wraps', () => {
    const { code, warnings } = emit(NUMERIC.replace('set counter to 300', 'set counter to 40000'));
    assert.match(code, /^\/\* No C emitted for DEVICE I8086\./, 'the program was not refused');
    assert.match(code, /This program has: 40000\./, 'the refusal does not name the literal');
    assert.match(code, /-32768 to 32767/, 'the refusal does not state the range');
    assert.doesNotMatch(code, /counter = /, 'C was emitted alongside the refusal');
    assert.doesNotMatch(code, /-25536/, 'the literal was wrapped');
    assert.equal(warnings.length, 1); assert.match(warnings[0], /40000/); assert.match(warnings[0], /N2b/);
});

test('i8086: the boundary values are admitted; one past each is refused, each named once', () => {
    assert.match(emit(NUMERIC.replace('300', '32767').replace('-5', '-32768')).code, /^static int counter/m);
    const { code } = emit(NUMERIC.replace('300', '32768').replace('-5', '-32769').replace('REPEAT 3', 'REPEAT 32768'));
    assert.match(code, /This program has: 32768, -32769\./, 'each refused literal is named exactly once, in order');
});

test('i8086: a variable INITIAL value outside 16 bits is refused too (cInit shares the check)', () => {
    const c = new SB3Creator();
    c.parse(NUMERIC);
    // Give the stage variable an out-of-range initial value the way a loaded project can.
    const stage = c.project.targets.find((t) => t.isStage);
    for (const v of Object.values(stage.variables)) if (v[0] === 'counter') v[1] = 70000;
    const g = c.generateC(); const code = typeof g === 'string' ? g : g.code;
    assert.match(code, /No C emitted/); assert.match(code, /70000/);
});

test('i8086: a fractional literal still truncates with no refusal (the model is integer, as everywhere)', () => {
    const { code } = emit(NUMERIC.replace('300', '2.5'));
    assert.match(code, /counter = 2;/);
});

const GOLDEN = JSON.parse(readFileSync(new URL('./fixtures/n2b-int16-goldens.json', import.meta.url), 'utf8'));
for (const fam of Object.keys(GOLDEN.programs)) {
    test(`golden: ${fam} emits byte-identical C for the numeric program (long stays long)`, () => {
        const { code } = emit(GOLDEN.programs[fam]);
        assert.match(code, /static long counter/, `${fam} lost its long`);
        assert.equal(code, GOLDEN.c[fam], `${fam} emission drifted from the pre-N2b golden`);
    });
}

test('the golden covers what it claims: variables, a REPEAT counter static and a print, on four families', () => {
    assert.deepEqual(Object.keys(GOLDEN.c).sort(), ['6502', '8051', 'arm', 'avr']);
    for (const [fam, code] of Object.entries(GOLDEN.c)) {
        assert.match(code, /REPEAT counters live across yields/, `${fam}: no task-mode REPEAT static in the golden`);
        assert.match(code, /static long bw_i\d+;/, `${fam}: the REPEAT static is not long`);
        assert.match(code, /bw_print_num\(counter\)/, `${fam}: no numeric print`);
    }
});
