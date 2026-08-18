/**
 * OLED (SSD1306) C generation and round-trip tests.
 *
 * Verifies that OLED verbs produce the right bw_oled_* calls, that the
 * decompiler reads them back, and that the full round-trip
 * pseudocode -> C -> pseudocode is exact.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import cToPseudocode from '../src/utils/cToPseudocode.js';

const HEADER = `DEVICE STC12C5A60S2
CLOCK 11059200
PIN sda = P2.1 OUTPUT
PIN scl = P2.2 OUTPUT

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
    return cToPseudocode(cCode).pseudocode;
}

// ---- C generation tests ---------------------------------------------------

test('oled clear emits bw_oled_clear', () => {
    const out = generateC(`STAGE:
  WHEN flag clicked:
    oled clear 1
`);
    assert.match(out, /bw_oled_clear\(1\);/);
});

test('oled pixel emits bw_oled_pixel with 4 args', () => {
    const out = generateC(`STAGE:
  WHEN flag clicked:
    oled pixel 64 32 1 on 1
`);
    assert.match(out, /bw_oled_pixel\(1, 64, 32, 1\);/,
        'oled pixel must emit bw_oled_pixel(disp, x, y, val)');
});

test('oled print string emits bw_oled_print_s', () => {
    const out = generateC(`STAGE:
  WHEN flag clicked:
    oled print "HELLO" on 1
`);
    assert.match(out, /bw_oled_print_s\(1, "HELLO"\);/,
        'string literal must survive as a C string via _s path');
});

test('oled print variable emits bw_oled_print_n', () => {
    const out = generateC(`GLOBAL count

STAGE:
  WHEN flag clicked:
    set count to 42
    oled print count on 1
`);
    assert.match(out, /bw_oled_print_n\(1, count\);/,
        'variable prints through the numeric _n path');
});

test('oled set cursor emits bw_oled_cursor', () => {
    const out = generateC(`STAGE:
  WHEN flag clicked:
    oled set cursor 2 5 on 1
`);
    assert.match(out, /bw_oled_cursor\(1, 2, 5\);/);
});

test('oled driver block emitted when _cUses.oled is set', () => {
    const out = generateC(`STAGE:
  WHEN flag clicked:
    oled clear 1
`);
    assert.match(out, /OLED_ADDR\s+0x3C/, 'SSD1306 address defined');
    assert.match(out, /oled_cmd/, 'oled_cmd helper present');
    assert.match(out, /oled_data_start/, 'oled_data_start present');
    assert.match(out, /font5x7/, '5x7 font table present');
    assert.match(out, /oled_putchar/, 'oled_putchar present');
    assert.match(out, /oled_set_page_col/, 'page/col setter present');
});

test('oled shares I2C bus with LCD', () => {
    const c = new SB3Creator();
    c.parse(HEADER + `STAGE:
  WHEN flag clicked:
    oled clear 1
    lcd clear 2
`);
    const out = c.generateC();
    // I2C primitives should appear exactly once (shared)
    const i2cDelayCount = (out.match(/static void i2c_delay/g) || []).length;
    assert.equal(i2cDelayCount, 1,
        'i2c_delay emitted exactly once, not duplicated');
    assert.match(out, /I2C_SDA/, 'shared I2C SDA defined');
    assert.match(out, /LCD_ADDR/, 'LCD address defined');
    assert.match(out, /OLED_ADDR/, 'OLED address defined');
});

test('oled init sequence in bw_setup', () => {
    const out = generateC(`STAGE:
  WHEN flag clicked:
    oled clear 1
`);
    assert.match(out, /oled_cmd\(0xAE\)/, 'display off in init');
    assert.match(out, /oled_cmd\(0x20\).*oled_cmd\(0x02\)/, 'page mode in init');
    assert.match(out, /oled_cmd\(0xA1\)/, 'segment remap in init');
    assert.match(out, /oled_cmd\(0xC8\)/, 'COM scan in init');
    assert.match(out, /oled_cmd\(0x8D\).*oled_cmd\(0x14\)/, 'charge pump in init');
    assert.match(out, /oled_cmd\(0xAF\)/, 'display on in init');
    assert.match(out, /bw_oled_clear\(0\)/, 'clear GDDRAM in init');
});

// ---- Round-trip tests (pseudocode -> C -> pseudocode) ---------------------

test('oled clear round-trips exactly', () => {
    const result = roundTrip(`STAGE:
  WHEN flag clicked:
    oled clear 1
`);
    assert.match(result, /oled clear 1/i);
});

test('oled pixel round-trips exactly', () => {
    const result = roundTrip(`STAGE:
  WHEN flag clicked:
    oled pixel 64 32 1 on 1
`);
    assert.match(result, /oled pixel 64 32 1 on 1/i);
});

test('oled print variable round-trips exactly', () => {
    const result = roundTrip(`GLOBAL count

STAGE:
  WHEN flag clicked:
    set count to 42
    oled print count on 1
`);
    assert.match(result, /oled print count on 1/i);
});

test('oled print string round-trips INTACT (C reader learned string literals, 2026-08-18)', () => {
    const result = roundTrip(`STAGE:
  WHEN flag clicked:
    oled print "HELLO" on 1
`);
    assert.match(result, /oled print "HELLO" on 1/i,
        'the C reader keeps string literals now — a former known limitation');
});

test('oled set cursor round-trips exactly', () => {
    const result = roundTrip(`STAGE:
  WHEN flag clicked:
    oled set cursor 2 5 on 1
`);
    assert.match(result, /oled set cursor 2 5 on 1/i);
});

test('oled pixel with variables round-trips', () => {
    const result = roundTrip(`GLOBAL x
GLOBAL y

STAGE:
  WHEN flag clicked:
    set x to 64
    set y to 32
    oled pixel x y 1 on 1
`);
    assert.match(result, /oled pixel x y 1 on 1/i);
});
