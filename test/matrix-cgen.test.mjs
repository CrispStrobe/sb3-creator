/**
 * MATRIX8X8 C generation, round-trip, and clash-check tests — the sb3-creator
 * mirror of stc-compiler's test_matrix.py (a91981a). MATRIX8X8 is an 8x8 LED
 * dot matrix that refreshes itself in the Timer-0 ISR (one row per tick, 125
 * Hz), so the drawing verbs are plain frame-buffer writes and the WHEN block
 * keeps running.
 *
 * Measured A2 wiring (docs/BOARD-PRECHIN-A2.md): 595 rows active-HIGH Q7=top,
 * port columns active-LOW bit7=left. These tests pin the contract and the scan
 * ORIENTATION against the reference, not the silicon.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import SB3Creator from '../src/utils/sb3Creator.js';

const SRC = `DEVICE STC89C52RC:
  CLOCK 11059200

  TABLE heart = 0b01100110, 0b11111111, 0b11111111, 0b11111111, 0b01111110, 0b00111100, 0b00011000, 0b00000000

  PART screen = MATRIX8X8 ROWS 74HC595 DATA P3.4 CLOCK P3.6 LATCH P3.5 COLUMNS P0

  WHEN started:
    show image heart on screen
    wait 1 second
    clear screen
    set d to 0
    REPEAT 8:
      light pixel d d
      wait 100 ms
      change d by 1
    draw row 0 = 0b11111111
    scroll screen left
    set pixel 2 3 to on
    set pixel 4 5 brightness 2
    set screen brightness 1
    IF pixel 2 3 is on THEN:
      clear pixel 2 3
`;

function genC(src) {
    const c = new SB3Creator();
    c.parse(src);
    return { c, code: c.generateC() };
}

/** The bw_tick ISR body (the whole `void bw_tick(void) __interrupt(1) { ... }`). */
function isrBody(code) {
    const m = code.match(/void bw_tick\(void\) __interrupt\(1\)\n\{[\s\S]*?\n\}/);
    assert.ok(m, 'no bw_tick ISR in generated C');
    return m[0];
}

// ---- structure --------------------------------------------------------------

test('matrix compiles with buffer, scan and helpers', () => {
    const { code } = genC(SRC);
    // 2 bits/pixel, 4 levels, one widen-point constant.
    assert.match(code, /#define MATRIX_PLANES 2/);
    assert.match(code, /#define MATRIX_LEVELS 4/);
    assert.match(code, /static unsigned char bw_scr_screen\[8 \* MATRIX_PLANES\];/);
    for (const helper of ['_clear', '_setpx', '_getpx', '_row', '_image', '_scroll']) {
        assert.match(code, new RegExp(`bw_scr_screen${helper}`), `missing helper ${helper}`);
    }
    assert.match(code, /bw_scr_screen_dim/);      // global brightness storage
    assert.match(code, /bw_scr_level\(/);         // brightness clamp
});

test('ISR: bw_ms++ is first and there is no mul/div/mod', () => {
    const body = isrBody(genC(SRC).code);
    assert.ok(body.indexOf('bw_ms++') < body.indexOf('bw_scr_screen'),
        'bw_ms++ must precede the matrix scan in the ISR');
    // No multiply/divide/modulo anywhere in the ISR (table-driven scan).
    const stripped = body.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const op of ['*', '/', '%']) {
        assert.ok(!stripped.includes(op), `ISR must contain no ${op}`);
    }
    // One row per tick, wrapping at 8.
    assert.match(body, /bw_scr_screen_scan\+\+;/);
    assert.match(body, /if \(bw_scr_screen_scan >= 8\) bw_scr_screen_scan = 0;/);
});

test('ISR is the SOLE writer of the 595 pins and the column port', () => {
    const code = genC(SRC).code;
    const body = isrBody(code);
    for (const sig of ['P3_4 =', 'P3_6 =', 'P3_5 =', 'P0 =']) {
        assert.ok(body.includes(sig), `ISR must write ${sig}`);
    }
    // Nothing OUTSIDE the ISR writes P0 or the 595 pins (mainline only touches
    // the RAM frame buffer). Strip the ISR body, then look.
    const outside = code.replace(body, '');
    for (const sig of ['P0 =', 'P3_4 =', 'P3_5 =', 'P3_6 =']) {
        assert.ok(!outside.includes(sig), `${sig} must appear only inside the ISR`);
    }
});

test('rowbit table is Q7 = top', () => {
    assert.match(genC(SRC).code, /\{ 0x80, 0x40, 0x20, 0x10, 0x08, 0x04, 0x02, 0x01 \};/);
});

test('the scan renders active-low columns with bit7 = left', () => {
    const body = isrBody(genC(SRC).code);
    // Columns are driven from ~lit (active-low), off a rowbit table indexed by
    // the scan cursor — the measured A2 orientation.
    assert.match(body, /bw_rb = bw_scr_screen_rowbit\[bw_scr_screen_scan\];/);
    assert.match(body, /P0 = \(unsigned char\)~bw_lit;/);
    // setpx addresses the column with 0x80 >> x (bit7 = left).
    assert.match(genC(SRC).code, /m = \(unsigned char\)\(0x80 >> x\);/);
});

// ---- verb lowering ----------------------------------------------------------

test('drawing verbs lower to the frame-buffer helpers', () => {
    const code = genC(SRC).code;
    assert.match(code, /bw_scr_screen_image\(bw_tab_heart\);/);
    assert.match(code, /bw_scr_screen_clear\(\);/);
    // light pixel d d  ->  level MATRIX_LEVELS - 1
    assert.match(code, /bw_scr_screen_setpx\(\(unsigned char\)\(d\), \(unsigned char\)\(d\), \(unsigned char\)\(MATRIX_LEVELS - 1\)\);/);
    // draw row 0 = 0b11111111  ->  255
    assert.match(code, /bw_scr_screen_row\(\(unsigned char\)\(0\), \(unsigned char\)\(255\)\);/);
    // scroll screen left  ->  scroll(0)
    assert.match(code, /bw_scr_screen_scroll\(0\);\s+\/\* left \*\//);
    // set pixel 2 3 to on  ->  level MATRIX_LEVELS - 1
    assert.match(code, /bw_scr_screen_setpx\(\(unsigned char\)\(2\), \(unsigned char\)\(3\), \(unsigned char\)\(MATRIX_LEVELS - 1\)\);/);
    // set pixel 4 5 brightness 2  ->  bw_scr_level(2)
    assert.match(code, /bw_scr_screen_setpx\(\(unsigned char\)\(4\), \(unsigned char\)\(5\), \(unsigned char\)\(bw_scr_level\(2\)\)\);/);
    // set screen brightness 1  ->  the dim byte
    assert.match(code, /bw_scr_screen_dim = bw_scr_level\(1\);/);
});

test('brightness reporter lowers to a getpx != 0 test', () => {
    const code = genC(SRC).code;
    assert.match(code, /bw_scr_screen_getpx/);
    assert.match(code, /bw_scr_screen_getpx\([^;]*?\) != 0\)/);
});

// ---- gotcha #1: a matrix forces the cooperative ISR path even for one WHEN --

test('a single WHEN with a matrix still emits the Timer-0 ISR + scan', () => {
    const lone = `DEVICE STC89C52RC:
  CLOCK 11059200

  PART screen = MATRIX8X8 ROWS 74HC595 DATA P3.4 CLOCK P3.6 LATCH P3.5 COLUMNS P0

  WHEN started:
    clear screen
`;
    const code = genC(lone).code;
    assert.match(code, /void bw_tick\(void\) __interrupt\(1\)/,
        'a lone WHEN with a matrix must NOT compile to the straight-line delay_ms path');
    const body = isrBody(code);
    assert.match(body, /bw_scr_screen_rowbit\[bw_scr_screen_scan\]/,
        'the ISR must carry the matrix scan hook');
    assert.ok(!code.includes('delay_ms('), 'no blocking delay_ms in the scheduler path');
});

// ---- round-trip (text <-> blocks) ------------------------------------------

test('the PART line and the C are stable across a pseudocode round-trip', () => {
    const c1 = new SB3Creator();
    c1.parse(SRC);
    const pc = c1.decompile();
    assert.match(pc,
        /PART screen = MATRIX8X8 ROWS 74HC595 DATA P3\.4 CLOCK P3\.6 LATCH P3\.5 COLUMNS P0/);
    for (const verb of [/show image heart on screen/, /light pixel d d/, /clear screen/,
        /scroll screen left/, /set pixel 2 3 to on/, /pixel 2 3 is on/]) {
        assert.match(pc, verb);
    }
    const C1 = c1.generateC();
    const c2 = new SB3Creator();
    c2.parse(pc);
    assert.equal(c2.generateC(), C1, 'C must be identical after pseudocode -> blocks -> C');
});

// ---- clash checks (sb3-creator refuses via warnings, not exceptions) --------

function warnsFor(mutate) {
    const c = new SB3Creator();
    c.parse(SRC.replace(...mutate));
    return c.warnings.join('\n');
}

test('a declared PIN on a claimed matrix pin is refused', () => {
    const w = warnsFor(['  WHEN started:', '  PIN stray = P3.4 OUTPUT\n\n  WHEN started:']);
    assert.match(w, /P3\.4 is already claimed by "screen"/);
});

test('a whole PORT over the column port is refused (PART then PORT)', () => {
    const w = warnsFor(['  WHEN started:', '  PORT other = P0 OUTPUT\n\n  WHEN started:']);
    assert.match(w, /overlaps pins already claimed by "screen"|owns those latches/);
});

test('the same symmetric clash is refused in the other order (PORT then PART)', () => {
    const c = new SB3Creator();
    c.parse(`DEVICE STC89C52RC:
  CLOCK 11059200

  PORT other = P0 OUTPUT
  PART screen = MATRIX8X8 ROWS 74HC595 DATA P3.4 CLOCK P3.6 LATCH P3.5 COLUMNS P0

  WHEN started:
    clear screen
`);
    assert.match(c.warnings.join('\n'), /inside the whole port "other"/);
});

test('a duplicated control pin is refused', () => {
    const w = warnsFor(['CLOCK P3.6', 'CLOCK P3.4']);
    assert.match(w, /names the same pin twice/);
});

test('a control pin inside the column port is refused', () => {
    const w = warnsFor(['DATA P3.4', 'DATA P0.5']);
    assert.match(w, /names the same pin twice/);
});

test('MATRIX8X8 is gated off a non-8051 device', () => {
    const c = new SB3Creator();
    c.parse(SRC.replace('DEVICE STC89C52RC', 'DEVICE ATMEGA328P'));
    assert.match(c.warnings.join('\n'), /MATRIX8X8 is not available/);
});

test('show image requires a TABLE', () => {
    const c = new SB3Creator();
    c.parse(SRC.replace('show image heart on screen', 'show image nope on screen'));
    assert.match(c.warnings.join('\n'), /not a TABLE/);
});

// ---- builds under sdcc if present -------------------------------------------

test('the emitted C builds under sdcc with zero warnings (if sdcc present)', (t) => {
    let sdcc = true;
    try { execFileSync('sdcc', ['--version'], { stdio: 'pipe' }); } catch { sdcc = false; }
    if (!sdcc) return t.skip('sdcc not installed');
    const dir = mkdtempSync(join(tmpdir(), 'matrix-cgen-'));
    const path = join(dir, 'm.c');
    writeFileSync(path, genC(SRC).code);
    const r = execFileSync('sdcc', ['-mmcs51', '--std-c99', path], { cwd: dir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    assert.equal(r, '', 'sdcc emitted output (warnings/errors)');
    assert.ok(existsSync(join(dir, 'm.ihx')), 'sdcc produced no .ihx');
});
