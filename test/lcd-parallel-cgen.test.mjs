import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import cToPseudocode from '../src/utils/cToPseudocode.js';

const A2 = `DEVICE STC89C52RC
CLOCK 11059200
PART lcd = LCD1602 DATA P0.4 P0.5 P0.6 P0.7 RS P2.6 RW P2.5 EN P2.7

STAGE:
  WHEN flag clicked:
    lcd clear 1
    lcd print "BRICKWRIGHT" on 1
`;

test('LCD1602 PART selects the direct A2 4-bit driver', () => {
    const c = new SB3Creator();
    c.parse(A2);
    assert.deepEqual(c.warnings, []);
    const out = c.generateC();
    assert.match(out, /#define LCD_D4 P0_4/);
    assert.match(out, /#define LCD_RW P2_5/);
    assert.match(out, /#define LCD_RS P2_6/);
    assert.match(out, /#define LCD_EN P2_7/);
    assert.match(out, /LCD_D7 = \(nib & 0x80\)/);
    assert.match(out, /delay_ms\(40\)/);
    assert.doesNotMatch(out, /LCD_ADDR|lcd_i2c_send|I2C_SDA/);
    assert.match(out, /bw_lcd_print_s\(1, "BRICKWRIGHT"\);/);
    const back = cToPseudocode(out).pseudocode;
    assert.match(back, /PART lcd = LCD1602 DATA P0\.4 P0\.5 P0\.6 P0\.7 RS P2\.6 RW P2\.5 EN P2\.7/);
});

test('write-only LCD form omits RW and round-trips', () => {
    const src = A2.replace('RS P2.6 RW P2.5 EN P2.7',
        'RS P2.0 EN P2.1 WRITE ONLY');
    const c = new SB3Creator();
    c.parse(src);
    assert.deepEqual(c.warnings, []);
    const out = c.generateC();
    assert.doesNotMatch(out, /#define LCD_RW/);
    const text = c.decompile();
    assert.match(text, /PART lcd = LCD1602 DATA P0\.4 P0\.5 P0\.6 P0\.7 RS P2\.0 EN P2\.1 WRITE ONLY/);
    const again = new SB3Creator();
    again.parse(text);
    assert.deepEqual(again.warnings, []);
    assert.equal(again.decompile(), text);
});

test('parallel LCD claims pins against PIN and PART declarations', () => {
    const c = new SB3Creator();
    c.parse(A2.replace('CLOCK 11059200', 'CLOCK 11059200\nPIN clash = P0.4 OUTPUT'));
    assert.match(c.warnings.join('\n'), /P0\.4 is already declared/);
});
