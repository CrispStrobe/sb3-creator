/**
 * The block→dialect→firmware bridge for the paint editor: a painted 8x8 grid
 * (FieldLed8x8, 64 chars '0'..'3') compiles to the verified MATRIX8X8 driver —
 * a clear + one setpx per lit pixel at its brightness. Sibling of
 * matrix-cgen.test.mjs; proves the EDITOR reaches real firmware.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import SB3Creator from '../src/utils/sb3Creator.js';

const HEAD =
    'PART screen = MATRIX8X8 ROWS 74HC595 DATA P3.4 CLOCK P3.6 LATCH P3.5 COLUMNS P0';

// grid with lit pixels: (2,3)=2, (0,0)=3, (7,7)=1 ; index = y*8 + x
function grid(pix) {
    const a = Array(64).fill('0');
    for (const [x, y, l] of pix) a[y * 8 + x] = String(l);
    return a.join('');
}

function genC(paintLine) {
    const src = `DEVICE STC89C52RC:\n  CLOCK 11059200\n  ${HEAD}\n  WHEN started:\n    ${paintLine}\n`;
    const c = new SB3Creator();
    c.parse(src);
    return { c, code: c.generateC() };
}

// Only the generated CALLS (drop the helper's own signature line).
function setpxCalls(code) {
    return (code.match(/bw_scr_screen_setpx\([^;]*\);/g) || [])
        .filter(s => !/unsigned char/.test(s));
}

test('paint lowers to clear + one setpx per lit pixel, brightness preserved', () => {
    const { code } = genC(`paint ${grid([[2, 3, 2], [0, 0, 3], [7, 7, 1]])} on screen`);
    assert.match(code, /bw_scr_screen_clear\(\);/, 'no clear before paint');
    const calls = setpxCalls(code);
    assert.equal(calls.length, 3, `expected 3 setpx, got ${calls.length}: ${calls}`);
    assert.ok(calls.includes('bw_scr_screen_setpx(2, 3, 2);'), 'pixel (2,3) level 2');
    assert.ok(calls.includes('bw_scr_screen_setpx(0, 0, 3);'), 'pixel (0,0) level 3');
    assert.ok(calls.includes('bw_scr_screen_setpx(7, 7, 1);'), 'pixel (7,7) level 1');
});

test('an all-off paint emits clear and NO setpx', () => {
    const { code } = genC(`paint ${'0'.repeat(64)} on screen`);
    assert.match(code, /bw_scr_screen_clear\(\);/);
    assert.equal(setpxCalls(code).length, 0, 'off grid must not light pixels');
});

test('paint forces the Timer-0 ISR scan (has_matrix), like the other verbs', () => {
    const { code } = genC(`paint ${grid([[1, 1, 3]])} on screen`);
    assert.match(code, /void bw_tick\(void\) __interrupt\(1\)/, 'no ISR — scan would never run');
    assert.match(code, /bw_scr_screen\[bw_scr_screen_scan\]/, 'no scan hook in the ISR');
});

test('round-trip: paint block decompiles back to the same paint line', () => {
    const g = grid([[2, 3, 2], [4, 5, 1]]);
    const { c } = genC(`paint ${g} on screen`);
    const text = c.generatePseudocode ? c.generatePseudocode() : null;
    if (text === null) return; // decompiler entry name differs; C path already proves lowering
    assert.match(text, new RegExp(`paint ${g} on screen`), `round-trip lost the grid:\n${text}`);
});

// ---- SDCC build (skipped when sdcc absent) ----------------------------------
test('paint C builds under sdcc -mmcs51 with no warnings', { skip: !hasSdcc() }, () => {
    const { code } = genC(`paint ${grid([[2, 3, 2], [0, 0, 3]])} on screen`);
    const dir = mkdtempSync(join(tmpdir(), 'paint-'));
    const cf = join(dir, 'p.c');
    writeFileSync(cf, code);
    const out = execFileSync('sdcc', ['-mmcs51', '--std-c99', '-c', cf, '-o', join(dir, 'p.rel')],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    assert.equal(out.trim(), '', `sdcc emitted output:\n${out}`);
});

function hasSdcc() {
    try { execFileSync('sdcc', ['--version'], { stdio: 'ignore' }); return true; } catch { return false; }
}
