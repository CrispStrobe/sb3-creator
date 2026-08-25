// STM32F030 through the REAL chain: blocks → generateC →
// arm-none-eabi-gcc → bw-board's CortexM0Machine + F0 board → pins.
// The emulator-side contract lives in bw-board's
// test/stm32f0-board.test.mjs; this proves the GENERATED firmware
// honors it end to end: blink lands on the 500 ms grid, the WFI idle
// parks the core, and both honesty ledgers stay empty.
//
// Needs the bw-board checkout and arm-none-eabi-gcc; skips loudly
// where either is absent (CI installs the toolchain for the pico
// chain already; the sibling comes from the pinned checkout).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';

const SB3 = join(import.meta.dirname, '..');
const BWB = process.env.BW_BOARD || join(SB3, '..', 'bw-board');

let hasGcc = false;
try { execFileSync('arm-none-eabi-gcc', ['--version'], { stdio: 'pipe' }); hasGcc = true; } catch { /* skip */ }
const siblingGate = requireSiblings('bw-board');
siblingGuardTest(siblingGate, 'the STM32F0 chain');
const skipReason = siblingGate.skip || (hasGcc ? false : 'needs arm-none-eabi-gcc');

const LD = `ENTRY(main)
MEMORY { FLASH (rx) : ORIGIN = 0x08000000, LENGTH = 16K
         RAM  (rwx): ORIGIN = 0x20000000, LENGTH = 4K }
SECTIONS {
  .text : { KEEP(*(.vectors)) *(.text*) *(.rodata*) } > FLASH
  .bss  : { *(.bss*) *(COMMON) } > RAM
}
`;

test('STM32F030: generated blink runs on the F0 machine, parked and honest',
    { skip: skipReason },
    async () => {
        const SB3Creator = (await import(join(SB3, 'src/utils/sb3Creator.js'))).default;
        const c = new SB3Creator();
        c.parse('DEVICE STM32F030\nPIN led1 = PA0 OUTPUT\nPIN btn1 = PA1 INPUT ACTIVE LOW\n\n'
            + 'WHEN flag clicked:\n  forever:\n    turn on led1\n    wait 0.5 seconds\n'
            + '    turn off led1\n    wait 0.5 seconds\n');
        const src = c.generateC(c.project, { debug: true });
        assert.deepEqual(c._cWarnings || [], [], 'clean emission');

        const dir = mkdtempSync(join(tmpdir(), 'bw-f0chain-'));
        writeFileSync(join(dir, 'main.c'), src);
        writeFileSync(join(dir, 'link.ld'), LD);
        execFileSync('arm-none-eabi-gcc', ['-mcpu=cortex-m0', '-mthumb', '-Os', '-ffreestanding',
            '-nostdlib', `-T${join(dir, 'link.ld')}`, '-o', join(dir, 'fw.elf'), join(dir, 'main.c'), '-lgcc'],
        { stdio: 'pipe' });
        execFileSync('arm-none-eabi-objcopy', ['-O', 'binary', join(dir, 'fw.elf'), join(dir, 'fw.bin')], { stdio: 'pipe' });
        const bin = readFileSync(join(dir, 'fw.bin'));

        const { CortexM0Machine } = await import(join(BWB, 'src/cortex-m0-machine.js'));
        const { attachStm32F0 } = await import(join(BWB, 'src/stm32f0-board.js'));
        const m = new CortexM0Machine({ clockHz: 48_000_000, sramBytes: 4096 });
        const pins = new Map();
        const board = attachStm32F0(m, {
            onPinChange: (pin, mode, high) => {
                const prev = pins.get(pin) || { changes: 0 };
                if (prev.mode !== mode || prev.high !== high) {
                    pins.set(pin, { mode, high, changes: prev.changes + 1 });
                }
            }
        });
        m.loadFirmware(bin);
        m.advanceNs(3_000_000_000);

        const pa0 = pins.get('PA0');
        assert.ok(pa0 && pa0.mode === 'pushpull', 'PA0 drives as an output');
        assert.ok(pa0.changes >= 6 && pa0.changes <= 9, `PA0 blinks on the grid (${pa0.changes} changes in 3 s)`);
        const pa1 = pins.get('PA1');
        assert.equal(pa1 && pa1.mode, 'input-pullup', 'ACTIVE LOW button gets the pull-up');
        assert.ok(Number(m.stats.sleptNs) / 3e9 > 0.9,
            `WFI parks the core (${(Number(m.stats.sleptNs) / 3e7).toFixed(1)}% slept)`);
        assert.deepEqual(m.unmapped, [], 'no unmapped accesses');
        assert.deepEqual(board.rcc.gatedAccesses, [], 'no clock-gated accesses');
    });

test('STM32F030: the leak guard names an unported feature instead of lying',
    { skip: skipReason },
    async () => {
        const SB3Creator = (await import(join(SB3, 'src/utils/sb3Creator.js'))).default;
        const c = new SB3Creator();
        // analog read is not ported to the F0 yet — the build must SAY so
        c.parse('DEVICE STM32F030\nPIN pot1 = PA5 ANALOG\n\nWHEN flag clicked:\n  forever:\n    say read pot1\n    wait 1 seconds\n');
        const out = c.generateC(c.project, { debug: true });
        const warned = (c._cWarnings || []).length > 0;
        const leaked = /BW_ADC_|BW_SIO|BW_IOBANK0/.test(out);
        assert.ok(warned || !leaked,
            `an unported feature either warns by name or emits nothing RP2040 (warned=${warned}, leaked=${leaked})`);
    });
