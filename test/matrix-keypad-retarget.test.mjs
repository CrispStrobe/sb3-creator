/**
 * Matrix keypad retarget: 17 direct-key pins → 7 direct + 10 matrix-virtual
 * on the eater6502 (which has only 7 PB inputs). The retarget system maps
 * overflow input pins to MK0-MK19 (matrix-virtual), and generateC emits a
 * bw_key_scan()/bw_key_read() driver for the VIA's 4×5 matrix.
 */
import { test } from 'node:test';
import { homedir } from 'node:os';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import SB3Creator from '../src/utils/sb3Creator.js';

const here = dirname(fileURLToPath(import.meta.url));
const calcSrc = readFileSync(resolve(here, '../examples/70-calculator/program.bw'), 'utf8');

test('calculator retargets to eater6502 (17 keys → 7 direct + 10 matrix)', () => {
    const result = SB3Creator.retargetPseudocode(calcSrc, 'eater6502');
    assert.ok(result.ok, `retarget failed: ${result.reasons?.join('; ')}`);
    assert.equal(result.reasons.length, 0);
    // Count pin types
    const lines = result.pseudocode.split('\n');
    const pbPins = lines.filter(l => /^PIN\s+\w+\s*=\s*PB\d/i.test(l));
    const mkPins = lines.filter(l => /^PIN\s+\w+\s*=\s*MK\d/i.test(l));
    assert.ok(pbPins.length >= 1, 'at least one direct PB input');
    assert.ok(mkPins.length >= 1, 'at least one matrix-virtual MK input');
    assert.equal(pbPins.length + mkPins.length, 17,
        `total input pins must be 17 (got ${pbPins.length} PB + ${mkPins.length} MK)`);
});

test('retargeted calculator generates C with matrix scan driver', () => {
    const result = SB3Creator.retargetPseudocode(calcSrc, 'eater6502');
    assert.ok(result.ok);
    const c = new SB3Creator();
    c.parse(result.pseudocode);
    const out = c.generateC();
    assert.equal(c.warnings.length, 0, 'zero C generation warnings');
    assert.match(out, /bw_key_scan/, 'matrix scan function present');
    assert.match(out, /bw_key_read/, 'matrix read function present');
    assert.match(out, /_mk_state/, 'matrix state array present');
    assert.match(out, /_mk_rows/, 'row pin table present');
    assert.match(out, /_mk_cols/, 'column pin table present');
    assert.match(out, /I2C_SDA_HI/, 'I2C for OLED present');
    assert.match(out, /font5x7/, '5x7 font for OLED present');
    // OLED init must be present (was missing before the 6502 init fix)
    assert.match(out, /oled_cmd\(0xAE\)/, 'SSD1306 display-off in init');
    assert.match(out, /oled_cmd\(0x8D\)/, 'SSD1306 charge pump in init');
    assert.match(out, /bw_oled_clear\(0\)/, 'GDDRAM clear in init');
});

let hasCl65 = false;
try { execSync('which cl65', { stdio: 'pipe' }); hasCl65 = true; } catch { /* skip */ }

test('retargeted calculator compiles under cl65', { skip: !hasCl65 && 'cl65 not on PATH' }, () => {
    const result = SB3Creator.retargetPseudocode(calcSrc, 'eater6502');
    assert.ok(result.ok);
    const c = new SB3Creator();
    c.parse(result.pseudocode);
    writeFileSync('/tmp/test-calc-6502.c', c.generateC());
    const cfgPaths = [
        resolve(here, '../../stc-compiler/eater.cfg'),
        join(homedir(), 'code', 'stc-compiler', 'eater.cfg'),   // worktree checkouts
        '/mnt/volume1/code/stc-compiler/eater.cfg',
    ];
    let cfg = null;
    for (const p of cfgPaths) {
        try { readFileSync(p); cfg = p; break; } catch { /* try next */ }
    }
    assert.ok(cfg, 'eater.cfg found');
    const output = execSync(
        `cl65 --cpu 65C02 -O -t none -C ${cfg} -o /tmp/test-calc-6502.rom /tmp/test-calc-6502.c 2>&1`,
        { encoding: 'utf8', timeout: 60000 }
    );
    const errors = (output.match(/\berror\b/gi) || []).length;
    assert.equal(errors, 0, `cl65 produced ${errors} errors`);
});

test('pin-count reduction: 17 keys from 9 pins (4 rows + 5 cols)', () => {
    const pools = SB3Creator.RETARGET_POOLS.eater6502;
    assert.ok(pools.matrix, 'matrix config exists');
    assert.equal(pools.matrix.rows.length, 4, '4 matrix rows');
    assert.equal(pools.matrix.cols.length, 5, '5 matrix cols');
    assert.ok(pools.matrix.rows.length * pools.matrix.cols.length >= 17,
        `${pools.matrix.rows.length}×${pools.matrix.cols.length} = ${pools.matrix.rows.length * pools.matrix.cols.length} ≥ 17 keys`);
});
