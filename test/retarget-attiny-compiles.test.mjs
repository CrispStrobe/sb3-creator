// Every example the retarget accepts for an ATtiny compiles for it.
//
// MEASURED 2026-10-06, before this gate: of the examples retargetPseudocode
// called ok, 6 on the ATtiny85 and 43 on the ATtiny88 emitted C that avr-gcc
// refused -- adc_read(NaN) for the tiny88's PCn ADC pins, the Uno's Timer 2
// for tiny85 PWM, Timer 1's servo frame on a chip whose Timer 1 is not the
// Uno's, a TFT driver falling back to 8051 pin names, and a NeoPixel the
// feature scan did not see. A retarget that says ok is a promise the app
// can build the result; this holds it for both chips.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import SB3Creator from '../src/utils/sb3Creator.js';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const hasGcc = (() => { try { execFileSync('avr-gcc', ['--version'], { stdio: 'pipe' }); return true; } catch { return false; } })();

for (const device of ['attiny85', 'attiny88']) {
    test(`every example retargeted ok to ${device} compiles`, { skip: hasGcc ? false : 'needs avr-gcc', timeout: 900000 }, () => {
        const dir = mkdtempSync(join(tmpdir(), `bw-rt-${device}-`));
        const failed = [];
        let built = 0;
        try {
            for (const name of readdirSync(EXAMPLES).sort()) {
                const file = join(EXAMPLES, name, 'program.bw');
                if (!existsSync(file)) continue;
                const rt = SB3Creator.retargetPseudocode(readFileSync(file, 'utf8'), device);
                if (!rt.ok) continue;
                const c = new SB3Creator();
                c.parse(rt.pseudocode);
                const code = c.generateC();
                if (!code.includes('#include <avr/io.h>')) continue;   // no pins: the host C target
                writeFileSync(join(dir, 'main.c'), code);
                try {
                    execFileSync('avr-gcc', [`-mmcu=${device}`, '-Os', '-std=c99', '-Wno-implicit-fallthrough',
                        '-ffunction-sections', '-fdata-sections', '-Wl,--gc-sections', '-o', join(dir, 'main.elf'), join(dir, 'main.c')],
                    { stdio: 'pipe', encoding: 'utf8' });
                    built++;
                } catch (e) {
                    failed.push(`${name}: ${String(e.stderr).split('\n').find((l) => /error/.test(l)) || e.message}`);
                }
            }
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
        // MEASURED 2026-10-06: 111 built for the attiny85, 124 for the attiny88.
        assert.ok(built > 50, `${device}: only ${built} examples built -- the sweep is not reaching them`);
        assert.deepEqual(failed, [], `${device}: retargeted ok, then did not compile`);
    });
}
