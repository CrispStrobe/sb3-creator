// Procedures lift back to DEFINE blocks — closing a SILENT TOTAL loss.
//
// The reader lifts a single script (the main task). A program whose logic sits
// in a custom block emitted its work as `def proc_do_<name>()` before the task
// and called it with `yield from proc_do_<name>()`; the reader dropped the def
// (preamble) and skipped the call (a yield), so the whole program came back as
// `WHEN flag clicked: stop` with NO warning — a silent total loss.
//
// Now a `def proc_do_<name>()` becomes a `DEFINE <name>:` block (the name is the
// emitter's own pyProcRaw rule, reversed) and its calls become the call verb. A
// definition or call WITH parameters is refused BY NAME (the argument round-trip
// is not lifted yet), never dropped in silence.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import micropythonToPseudocode from '../src/utils/micropythonToPseudocode.js';

const roundtrips = (prog) => {
    const c0 = new SB3Creator();
    c0.parse(prog);
    const src0 = c0.generateMicroPython().py;
    const {pseudocode, warnings} = micropythonToPseudocode(src0);
    const c1 = new SB3Creator();
    c1.parse(pseudocode);
    return {src0, src1: c1.generateMicroPython().py, pseudocode, warnings};
};

test('a no-arg procedure and its calls round-trip byte-for-byte', () => {
    const r = roundtrips('DEVICE MICROBIT\nDEFINE greet:\n  display "hi"\n\nWHEN flag clicked:\n  greet\n  greet\n');
    assert.match(r.pseudocode, /DEFINE greet:/, 'the procedure was not lifted to a DEFINE');
    assert.match(r.pseudocode, /^  greet$/m, 'the procedure call was not lifted to the call verb');
    assert.ok(!/WHEN flag clicked:\n  stop/.test(r.pseudocode), 'the program body vanished to `stop`');
    assert.equal(r.src1, r.src0, 'emit -> read -> emit was not identical');
});

test('the program logic is no longer silently lost — it lifts, it does not vanish', () => {
    const r = roundtrips('DEVICE MICROBIT\nDEFINE step:\n  set n to (n + 1)\n\nWHEN flag clicked:\n  set n to 0\n  step\n');
    assert.match(r.pseudocode, /DEFINE step:/);
    assert.match(r.pseudocode, /set n to n \+ 1/, 'the procedure body was not lifted');
    assert.equal(r.src1, r.src0, 'emit -> read -> emit was not identical');
});

test('a procedure WITH parameters is refused by name, not dropped silently', () => {
    const r = roundtrips('DEVICE MICROBIT\nDEFINE show (v):\n  display v\n\nWHEN flag clicked:\n  show (7)\n');
    // The parameterised def is named as unlifted...
    assert.ok(r.warnings.some(w => /procedure show with parameters not lifted/.test(w)),
        `the parameterised procedure was not named: ${JSON.stringify(r.warnings)}`);
    // ...and its call is kept, named, rather than skipped into nothing.
    assert.ok(r.warnings.some(w => /procedure call with arguments not lifted/.test(w)),
        `the parameterised call was not named: ${JSON.stringify(r.warnings)}`);
});

test('a refused parameterised def is KEPT as a grey block, not only named', () => {
    // The reader's convention is warn AND keep: a statement it cannot lift stays
    // visible in the program as a `raw` grey block, so the def is both named in a
    // warning AND present in the pseudocode — not named into an empty program.
    // (The no-arg case lifts to a DEFINE; only the parameterised def rides along.)
    const {pseudocode} = roundtrips('DEVICE MICROBIT\nDEFINE show (v):\n  display v\n\nWHEN flag clicked:\n  show (7)\n');
    // The def's own line survives verbatim as a grey block...
    assert.match(pseudocode, /raw "def proc_do_show\(v\):"/,
        `the parameterised def line was dropped from the pseudocode:\n${pseudocode}`);
    // ...and so does its body (kept as the emitted lines, nothing lost). The
    // mutation that this guards: revert the def-refusal to `warn(...); continue;`
    // and the def vanishes from the pseudocode again — this assertion goes red.
    assert.match(pseudocode, /raw "display\.scroll\(str\(v\)/,
        `the parameterised def body was dropped from the pseudocode:\n${pseudocode}`);
});
