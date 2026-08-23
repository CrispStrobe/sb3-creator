/**
 * Z80 calculator retarget: 17 direct-key pins → 8 direct IN + 9 matrix MK
 * via the matrix-keypad transform. The Z80 bench has OUT0-OUT7 (latch) +
 * IN0-IN7 (buffer); rows OUT2-OUT5 × cols IN0-IN4 give 20 virtual keys.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import SB3Creator from '../src/utils/sb3Creator.js';
import { runBounded } from './helpers/timed.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const calcSrc = readFileSync(resolve(here, '../examples/70-calculator/program.bw'), 'utf8');

test('calculator retargets to z80 (17 keys → 8 direct IN + 9 matrix MK)', () => {
    const result = SB3Creator.retargetPseudocode(calcSrc, 'z80');
    assert.ok(result.ok, `retarget failed: ${result.reasons?.join('; ')}`);
    assert.equal(result.reasons.length, 0);
    const lines = result.pseudocode.split('\n');
    const inPins = lines.filter(l => /^PIN\s+\w+\s*=\s*IN\d/i.test(l));
    const mkPins = lines.filter(l => /^PIN\s+\w+\s*=\s*MK\d/i.test(l));
    assert.ok(inPins.length >= 1, 'at least one direct IN input');
    assert.ok(mkPins.length >= 1, 'at least one matrix-virtual MK input');
    assert.equal(inPins.length + mkPins.length, 17,
        `total input pins must be 17 (got ${inPins.length} IN + ${mkPins.length} MK)`);
});

test('retargeted Z80 calculator generates C with matrix scan + OLED', () => {
    const result = SB3Creator.retargetPseudocode(calcSrc, 'z80');
    assert.ok(result.ok);
    const c = new SB3Creator();
    c.parse(result.pseudocode);
    const out = c.generateC();
    assert.equal(c.warnings.length, 0, 'zero C generation warnings');
    // Matrix keypad scan
    assert.match(out, /bw_key_scan/, 'matrix scan function present');
    assert.match(out, /bw_key_read/, 'matrix read function present');
    assert.match(out, /_mk_state/, 'matrix state array present');
    assert.match(out, /_mk_rows/, 'row pin table present');
    assert.match(out, /_mk_cols/, 'column pin table present');
    assert.match(out, /BW_PORT_OUT/, 'Z80 OUT latch write in scan');
    assert.match(out, /BW_PORT_IN/, 'Z80 IN buffer read in scan');
    // OLED init
    assert.match(out, /I2C_SDA_HI/, 'I2C HI/LO primitives');
    assert.match(out, /oled_cmd\(0xAE\)/, 'SSD1306 display-off in init');
    assert.match(out, /oled_cmd\(0x8D\)/, 'SSD1306 charge pump in init');
    assert.match(out, /bw_oled_clear\(0\)/, 'GDDRAM clear in init');
    assert.match(out, /font5x7/, '5x7 font table present');
    // Z80 core
    assert.match(out, /__sfr/, 'Z80 __sfr port declarations');
    assert.match(out, /_z80_sh/, 'Z80 shadow byte present');
});

let hasSdcc = false;
try { execSync('which sdcc', { stdio: 'pipe' }); hasSdcc = true; } catch { /* skip */ }

test('retargeted Z80 calculator compiles under sdcc -mz80', { skip: !hasSdcc && 'sdcc not on PATH' }, () => {
    const result = SB3Creator.retargetPseudocode(calcSrc, 'z80');
    assert.ok(result.ok);
    const c = new SB3Creator();
    c.parse(result.pseudocode);
    writeFileSync('/tmp/test-calc-z80.c', c.generateC());
    // 60 s bounds sdcc on the generated Z80 source; the discriminator decides
    // whether an overrun was the compiler or the machine.
    const output = runBounded({
        what: 'sdcc -mz80 compiling the retargeted calculator',
        budgetMs: 60000,
        run: (ms) => execSync(
            'sdcc -mz80 --no-std-crt0 -c /tmp/test-calc-z80.c -o /tmp/test-calc-z80.rel 2>&1',
            { encoding: 'utf8', timeout: ms })
    });
    const errors = (output.match(/\berror\b/gi) || []).length;
    assert.equal(errors, 0, `sdcc -mz80 produced ${errors} errors`);
});

test('Z80 matrix: pin-count reduction — 17 keys from 12 pins (4 rows + 5 cols + 3 extra IN)', () => {
    const pools = SB3Creator.RETARGET_POOLS.z80;
    assert.ok(pools.matrix, 'matrix config exists');
    assert.equal(pools.matrix.rows.length, 4, '4 matrix rows');
    assert.equal(pools.matrix.cols.length, 5, '5 matrix cols');
    assert.ok(pools.matrix.rows.length * pools.matrix.cols.length >= 17,
        `${pools.matrix.rows.length}×${pools.matrix.cols.length} = ${pools.matrix.rows.length * pools.matrix.cols.length} ≥ 17 keys`);
});
