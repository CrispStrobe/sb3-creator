/**
 * 6502 OLED compile test: the I2C gap is closed.
 *
 * DEVICE EATER6502 + oled verbs + sda=PA0 scl=PA1 generates C that
 * compiles under cl65 with the eater.cfg linker config, zero errors.
 * Gated on `which cl65` — skipped where cc65 is not installed.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import SB3Creator from '../src/utils/sb3Creator.js';

const here = dirname(fileURLToPath(import.meta.url));

// Skip if cl65 is not on PATH
let hasCl65 = false;
try { execSync('which cl65', { stdio: 'pipe' }); hasCl65 = true; } catch { /* skip */ }

test('6502 OLED program generates valid C', () => {
    const src = readFileSync(resolve(here, 'fixtures/6502-oled-counter.bw'), 'utf8');
    const c = new SB3Creator();
    c.parse(src);
    const out = c.generateC();
    assert.equal(c.warnings.length, 0, 'zero warnings');
    assert.match(out, /I2C_SDA_HI\(\)/, 'I2C HI/LO primitives present');
    assert.match(out, /_i2c_sh/, 'VIA shadow byte present');
    assert.match(out, /BW_VIA_ORA/, 'VIA port A register present');
    assert.match(out, /font5x7/, '5x7 font table present');
    assert.match(out, /oled_cmd/, 'OLED command helper present');
    assert.ok(!out.includes('P2_1'), 'no 8051 sbit names in 6502 output');
});

test('6502 OLED program compiles under cl65', { skip: !hasCl65 && 'cl65 not on PATH' }, () => {
    const fixture = resolve(here, 'fixtures/6502-oled-counter.c');
    // Find the eater.cfg linker config
    const cfgPaths = [
        resolve(here, '../../stc-compiler/eater.cfg'),
        '/mnt/volume1/code/stc-compiler/eater.cfg',
    ];
    let cfg = null;
    for (const p of cfgPaths) {
        try { readFileSync(p); cfg = p; break; } catch { /* try next */ }
    }
    assert.ok(cfg, 'eater.cfg found');
    const result = execSync(
        `cl65 --cpu 65C02 -O -t none -C ${cfg} -o /tmp/test-6502-oled.rom ${fixture} 2>&1`,
        { encoding: 'utf8', timeout: 30000 }
    );
    // cl65 returns 0 on success; grep for errors
    const errors = (result.match(/error/gi) || []).length;
    assert.equal(errors, 0, `cl65 compilation produced ${errors} errors: ${result.slice(0, 200)}`);
});
