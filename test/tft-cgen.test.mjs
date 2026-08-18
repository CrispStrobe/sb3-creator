/**
 * TFT (ILI9341) C generation and round-trip tests.
 *
 * Verifies that TFT verbs produce the right bw_tft_* calls, that the
 * decompiler reads them back, and that the full round-trip
 * pseudocode → C → pseudocode is exact.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import cToPseudocode from '../src/utils/cToPseudocode.js';

const HEADER = `DEVICE STC12C5A60S2
CLOCK 11059200
PIN cs = P1.0 OUTPUT
PIN dc = P1.1 OUTPUT
PIN sck = P1.2 OUTPUT
PIN mosi = P1.3 OUTPUT

`;

function generateC(bw) {
    const c = new SB3Creator();
    c.parse(HEADER + bw);
    return c.generateC();
}

function roundTrip(bw) {
    const src = HEADER + bw;
    const c = new SB3Creator();
    c.parse(src);
    const cCode = c.generateC();
    const result = cToPseudocode(cCode);
    return result.pseudocode;
}

// ---- C generation tests ---------------------------------------------------

test('tft pixel emits bw_tft_pixel with 6 args', () => {
    const out = generateC(`STAGE:
  WHEN flag clicked:
    tft pixel 10 20 R 255 G 128 B 0 on 1
`);
    assert.match(out, /bw_tft_pixel\(1, 10, 20, 255, 128, 0\);/,
        'tft pixel must emit bw_tft_pixel(disp, x, y, r, g, b)');
});

test('tft fill emits bw_tft_fill with 8 args', () => {
    const out = generateC(`STAGE:
  WHEN flag clicked:
    tft fill 0 0 240 320 R 0 G 0 B 255 on 1
`);
    assert.match(out, /bw_tft_fill\(1, 0, 0, 240, 320, 0, 0, 255\);/,
        'tft fill must emit bw_tft_fill(disp, x, y, w, h, r, g, b)');
});

test('tft clear emits bw_tft_clear', () => {
    const out = generateC(`STAGE:
  WHEN flag clicked:
    tft clear 1
`);
    assert.match(out, /bw_tft_clear\(1\);/);
});

test('tft print string emits bw_tft_print_s', () => {
    const out = generateC(`STAGE:
  WHEN flag clicked:
    tft print "HELLO" on 1
`);
    assert.match(out, /bw_tft_print_s\(1, "HELLO"\);/,
        'string literal must survive as a C string via _s path');
});

test('tft print variable emits bw_tft_print_n', () => {
    const out = generateC(`GLOBAL count

STAGE:
  WHEN flag clicked:
    set count to 42
    tft print count on 1
`);
    assert.match(out, /bw_tft_print_n\(1, count\);/,
        'variable prints through the numeric _n path');
});

test('tft set cursor emits bw_tft_cursor', () => {
    const out = generateC(`STAGE:
  WHEN flag clicked:
    tft set cursor 2 5 on 1
`);
    assert.match(out, /bw_tft_cursor\(1, 2, 5\);/);
});

test('tft driver block is emitted when _cUses.tft is set', () => {
    const out = generateC(`STAGE:
  WHEN flag clicked:
    tft clear 1
`);
    assert.match(out, /tft_spi_write/,
        'SPI bit-bang driver must be present');
    assert.match(out, /tft_cmd\(0x2A\)/,
        'CASET command in tft_set_window');
    assert.match(out, /tft_cmd\(0x11\)/,
        'SLPOUT in init sequence');
    assert.match(out, /tft_cmd\(0x29\)/,
        'DISPON in init sequence');
    assert.match(out, /rgb565/,
        'RGB565 conversion function');
    assert.match(out, /#define TFT_CS\s+P1_0/,
        'TFT_CS resolved from declared pin');
    assert.match(out, /#define TFT_DC\s+P1_1/,
        'TFT_DC resolved from declared pin');
    assert.match(out, /#define TFT_SCK\s+P1_2/,
        'TFT_SCK resolved from declared pin');
    assert.match(out, /#define TFT_MOSI\s+P1_3/,
        'TFT_MOSI resolved from declared pin');
});

// ---- Round-trip tests (pseudocode → C → pseudocode) -----------------------

test('tft pixel round-trips exactly', () => {
    const result = roundTrip(`STAGE:
  WHEN flag clicked:
    tft pixel 10 20 R 255 G 128 B 0 on 1
`);
    assert.match(result, /tft pixel 10 20 R 255 G 128 B 0 on 1/i);
});

test('tft fill round-trips exactly', () => {
    const result = roundTrip(`STAGE:
  WHEN flag clicked:
    tft fill 0 0 100 50 R 255 G 0 B 0 on 1
`);
    assert.match(result, /tft fill 0 0 100 50 R 255 G 0 B 0 on 1/i);
});

test('tft clear round-trips exactly', () => {
    const result = roundTrip(`STAGE:
  WHEN flag clicked:
    tft clear 1
`);
    assert.match(result, /tft clear 1/i);
});

test('tft print string round-trips INTACT (C reader learned string literals, 2026-08-18)', () => {
    // The C reader now keeps string literals (`bw_print(\"key\")` came back as
    // `print 0` until the A2 keyshow round-trip exposed it). The former
    // known-limitation behavior — degrading to 0 — is gone for TFT, OLED
    // and LCD alike.
    const result = roundTrip(`STAGE:
  WHEN flag clicked:
    tft print "HELLO" on 1
`);
    assert.match(result, /tft print "HELLO" on 1/i,
        'the C reader keeps string literals now');
});

test('tft print variable round-trips exactly', () => {
    const result = roundTrip(`GLOBAL count

STAGE:
  WHEN flag clicked:
    set count to 42
    tft print count on 1
`);
    assert.match(result, /tft print count on 1/i);
});

test('tft set cursor round-trips exactly', () => {
    const result = roundTrip(`STAGE:
  WHEN flag clicked:
    tft set cursor 2 5 on 1
`);
    assert.match(result, /tft set cursor 2 5 on 1/i);
});

test('tft pixel with variables round-trips', () => {
    const result = roundTrip(`GLOBAL x
GLOBAL y

STAGE:
  WHEN flag clicked:
    set x to 100
    set y to 160
    tft pixel x y R 0 G 255 B 0 on 1
`);
    assert.match(result, /tft pixel x y R 0 G 255 B 0 on 1/i);
});

test('mixed tft and lcd verbs both work', () => {
    const out = generateC(`PIN sda = P2.1 OUTPUT
PIN scl = P2.2 OUTPUT

STAGE:
  WHEN flag clicked:
    tft clear 1
    lcd clear 2
`);
    assert.match(out, /bw_tft_clear\(1\);/);
    assert.match(out, /bw_lcd_clear\(2\);/);
    assert.match(out, /tft_spi_write/,
        'TFT SPI driver present');
    assert.match(out, /i2c_write/,
        'I2C LCD driver present');
});
