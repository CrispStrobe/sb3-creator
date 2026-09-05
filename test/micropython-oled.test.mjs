// The Pico OLED verbs lift back to the dialect instead of riding along as grey
// blocks — the last silent-loss bucket the L3 audit named.
//
// The Pico backend drives a single `_oled` (framebuf), so the display number is
// implicit (1): `oled clear` is `_oled.fill(0)`, `oled set cursor R C` is the
// pair `_oled.crow = int(R)` / `_oled.ccol = int(C)`, `oled print T` is
// `_oled_print(T)`, `oled hline X Y W` is `_oled.hline(int(X), int(Y), int(W),
// 1)`. The driver's `_oled.show()` flush is the emitter's own (flush-on-draw)
// and is dropped, not lifted.
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

test('the OLED draw verbs round-trip byte-for-byte and are not grey-blocked', () => {
    const r = roundtrips([
        'DEVICE PICO',
        'WHEN flag clicked:',
        '  oled clear 1',
        '  oled set cursor 2 3 on 1',
        '  oled print "HELLO" on 1',
        '  oled hline 0 10 128 on 1',
        ''
    ].join('\n'));
    assert.ok(!r.warnings.some(w => /grey block/.test(w)), `grey-blocked: ${JSON.stringify(r.warnings)}`);
    for (const re of [/oled clear 1/, /oled set cursor 2 3 on 1/, /oled print "HELLO" on 1/, /oled hline 0 10 128 on 1/]) {
        assert.match(r.pseudocode, re, 'an OLED verb was not lifted');
    }
    assert.equal(r.src1, r.src0, 'emit -> read -> emit was not identical');
});

test('the emitter-inserted flush (_oled.show()) is dropped, not turned into a verb', () => {
    // A program that never says `oled show` still emits `_oled.show()` flushes.
    const r = roundtrips('DEVICE PICO\nWHEN flag clicked:\n  oled clear 1\n  oled print "HI" on 1\n');
    assert.match(r.src0, /_oled\.show\(\)/, 'precondition: the emitter inserts a flush');
    assert.ok(!/oled show/.test(r.pseudocode), 'the auto-flush was invented into an `oled show` verb');
});
