// The bitwise and shift operators (bitand/bitor/bitxor/shiftleft/shiftright/
// bitnot) round-trip through Python and JavaScript. generatePython /
// generateJavaScript already emit them as `& | ^ << >> ~`, but the readers had
// no tokenizer entry, no precedence level and no render mapping for those, so
// every program using one refused to import ("unexpected character &",
// "unexpected OP <"). Surfaced by brickwright-lite's L3 reader-coverage audit:
// the 8051 programs 08-led-chaser-595 (`<<`) and 20-shift-register-binary
// (`&`, `<<`) were the two refusals. This locks the fix: emit -> read -> emit
// is identical, and the pseudocode names every operator.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import pythonToPseudocode from '../src/utils/pythonToPseudocode.js';
import javascriptToPseudocode from '../src/utils/javascriptToPseudocode.js';

// One program that exercises all six operators the generators emit.
const BITOPS = `SPRITE Bits:
WHEN flag clicked:
  set v to 0
  set v to (v bitand 128)
  set v to (v bitor 1)
  set v to (v bitxor 3)
  set v to (v shiftleft 1)
  set v to (v shiftright 2)
  set v to (bitnot v)
`;

const OPS = ['bitand', 'bitor', 'bitxor', 'shiftleft', 'shiftright', 'bitnot'];

const BACKENDS = [
    { name: 'python', gen: (c) => c.generatePython(), read: (s) => pythonToPseudocode(s) },
    { name: 'javascript', gen: (c) => c.generateJavaScript(), read: (s) => javascriptToPseudocode(s) }
];

for (const be of BACKENDS) {
    test(`bitwise/shift round-trips through ${be.name}, and every operator survives`, () => {
        const c0 = new SB3Creator();
        c0.parse(BITOPS);
        const src0 = be.gen(c0);

        // The reader lifts it back — the bug was that it threw here.
        let pseudocode;
        assert.doesNotThrow(() => { ({ pseudocode } = be.read(src0)); }, `${be.name}: reader refused the bit operators`);

        // Every operator is named in the lifted pseudocode, not dropped.
        for (const op of OPS) {
            assert.match(pseudocode, new RegExp(`\\b${op}\\b`), `${be.name}: '${op}' missing from the lifted pseudocode`);
        }

        // The lifted pseudocode recompiles, and a second emit is byte-identical:
        // the operators, their precedence and their operands all survived intact.
        const c1 = new SB3Creator();
        assert.doesNotThrow(() => c1.parse(pseudocode), `${be.name}: lifted pseudocode did not recompile`);
        assert.equal(be.gen(c1), src0, `${be.name}: emit -> read -> emit was not identical`);
    });
}

test('a plain `<` comparison still parses (the shift fix did not eat the operator)', () => {
    const prog = `SPRITE Cmp:\nWHEN flag clicked:\n  set v to 0\n  if (v < 5) then:\n    say "small"\n`;
    for (const be of BACKENDS) {
        const c = new SB3Creator();
        c.parse(prog);
        assert.doesNotThrow(() => be.read(be.gen(c)), `${be.name}: a bare '<' comparison broke`);
    }
});
