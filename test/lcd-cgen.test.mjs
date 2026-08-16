/**
 * LCD C generation: string literals become C STRINGS, numbers become
 * numeric prints. Before 2026-08-16, `lcd print "HELLO" on 1` emitted
 * `bw_lcd_print(1, 0 /* HELLO *​/)` — the string demoted to a comment,
 * the firmware printing a null pointer, every LCD in the product blank
 * by construction while the whole I2C chain worked. Proven fixed by the
 * full app-path repro: hosted-compiled firmware in the emulator put
 * "HI BRICKWRIGHT" on the board model's display.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const SRC = `DEVICE STC12C5A60S2
CLOCK 11059200
PIN sda = P2.1 OUTPUT
PIN scl = P2.2 OUTPUT

STAGE:
  WHEN flag clicked:
    lcd clear 1
    lcd print "HI THERE" on 1
    set count to 7
    lcd print count on 1
`;

test('string literal lcd print emits a real C string', () => {
    const c = new SB3Creator();
    c.parse(SRC);
    const out = c.generateC();
    assert.match(out, /bw_lcd_print_s\(1, "HI THERE"\);/,
        'string literal must survive as a C string literal');
    assert.match(out, /bw_lcd_print_n\(1, count\);/,
        'variable prints through the numeric path');
    assert.doesNotMatch(out, /bw_lcd_print\(1, 0 \/\*/,
        'the null-pointer-with-comment emission must never return');
    assert.match(out, /bw_lcd_print_n\(int disp, long n\)/,
        'numeric driver present');
});

test('cCString escapes quotes, backslashes and non-ASCII', () => {
    const c = new SB3Creator();
    assert.equal(c.cCString('SAY "HI"'), '"SAY \\"HI\\""');
    assert.equal(c.cCString('a\\b'), '"a\\\\b"');
    assert.equal(c.cCString('grüß'), '"gr??"');   // non-ASCII degrades visibly, never breaks C
});
