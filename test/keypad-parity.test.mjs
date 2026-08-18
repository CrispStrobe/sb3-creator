// KEYPAD4X4 parity with the reference dialect (stc-compiler 58a1048) —
// and the C round-trip the A2 keyshow example demanded. The emitted
// scanner is the one verified on Prechin A2 silicon (2026-08-17/18).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import cToPseudocode from '../src/utils/cToPseudocode.js';

const KEYSHOW = `DEVICE STC89C52RC:
  CLOCK 11059200

  TABLE font = 0b00111111, 0b00000110, 0b01011011, 0b01001111

  PART keys = KEYPAD4X4 ROWS P1.7 P1.6 P1.5 P1.4 COLS P1.3 P1.2 P1.1 P1.0

  PORT segments = P0 OUTPUT

  PIN selA = P2.2 OUTPUT ACTIVE LOW

  WHEN started:
    turn on selA                 # inline comments strip like the oracle's
    set segments to 0
    FOREVER:
      set k to keys
      IF k >= 0 THEN:
        set segments to font[k]
        print "key"
        print k
      wait 30 ms
`;

const build = (src) => { const c = new SB3Creator(); c.parse(src); return c; };

test('keyshow transpiles with the silicon-verified scanner', () => {
    const c = build(KEYSHOW);
    assert.equal((c.warnings || []).length, 0, JSON.stringify(c.warnings));
    const cc = c.generateC();
    assert.match(cc, /static signed char bw_part_keys_read\(void\)/);
    // row-major: first row low, first column returns 0; last returns 15
    assert.match(cc, /P1_7 = 0;/);
    assert.match(cc, /if \(!P1_3\) \{ P1_7 = 1; return 0; \}/);
    assert.match(cc, /if \(!P1_0\) \{ P1_4 = 1; return 15; \}/);
    assert.match(cc, /return -1;/);
    assert.match(cc, /bw_part_keys_read\(\)/);
});

test('C round-trip is a fixed point (incl. TABLE, PORT, print-string)', () => {
    const a = build(KEYSHOW);
    const c1 = a.generateC();
    const { pseudocode, warnings } = cToPseudocode(c1);
    assert.equal((warnings || []).length, 0, JSON.stringify(warnings));
    assert.match(pseudocode, /PART keys = KEYPAD4X4 ROWS P1\.7 P1\.6 P1\.5 P1\.4 COLS P1\.3 P1\.2 P1\.1 P1\.0/);
    assert.match(pseudocode, /PORT segments = P0 OUTPUT/);
    assert.match(pseudocode, /TABLE font = 0x3F, 0x06, 0x5B, 0x4F/);
    assert.match(pseudocode, /print "key"/);
    const b = build(pseudocode);
    assert.equal(c1, b.generateC(), 'second-generation C differs');
});

test('a keypad cannot be written', () => {
    const c = build(KEYSHOW.replace('set k to keys', 'set keys to 5'));
    assert.ok((c.warnings || []).some((w) => /cannot be written/.test(w)),
        JSON.stringify(c.warnings));
});

test('duplicate pins are refused', () => {
    const c = build(KEYSHOW.replace('COLS P1.3', 'COLS P1.7'));
    assert.ok((c.warnings || []).some((w) => /same pin twice/.test(w)),
        JSON.stringify(c.warnings));
});

test('non-8051 targets refuse the part', () => {
    const c = build(KEYSHOW.replace('DEVICE STC89C52RC', 'DEVICE ARDUINO-UNO'));
    assert.ok((c.warnings || []).some((w) => /KEYPAD4X4 is not available/.test(w)),
        JSON.stringify(c.warnings));
});

test('decompile carries the PART declaration', () => {
    const c = build(KEYSHOW);
    const back = c.generatePseudocode ? c.generatePseudocode() : c.decompile();
    assert.match(back, /PART keys = KEYPAD4X4 ROWS P1\.7 P1\.6 P1\.5 P1\.4 COLS P1\.3 P1\.2 P1\.1 P1\.0/);
});

test('Python and JS route the keypad read through the runtime shim', () => {
    const c = build(KEYSHOW);
    const py = c.generatePython();
    assert.match(py, /_stc12\.readKeypad\("keys"\)/);
    assert.match(py, /def readKeypad/);
    const js = c.generateJavaScript();
    assert.match(js, /_stc12\.readKeypad\("keys"\)/);
    assert.match(js, /readKeypad/);   // neutral stub or board driver, either flavor
});
