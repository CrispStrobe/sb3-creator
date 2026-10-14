import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import SB3Creator from '../src/utils/sb3Creator.js';

let hasGcc = false;
try {
    execFileSync('arm-none-eabi-gcc', ['--version'], { stdio: 'pipe' });
    hasGcc = true;
} catch {
    /* gcc absent */
}

const LD_G0 = `ENTRY(main)
MEMORY { FLASH (rx) : ORIGIN = 0x08000000, LENGTH = 64K
         RAM  (rwx): ORIGIN = 0x20000000, LENGTH = 8K }
SECTIONS {
  .text : { KEEP(*(.vectors)) *(.text*) *(.rodata*) } > FLASH
  .bss  : { *(.bss*) *(COMMON) } > RAM
}
`;

const LD_F1 = `ENTRY(main)
MEMORY { FLASH (rx) : ORIGIN = 0x08000000, LENGTH = 64K
         RAM  (rwx): ORIGIN = 0x20000000, LENGTH = 20K }
SECTIONS {
  .text : { KEEP(*(.vectors)) *(.text*) *(.rodata*) } > FLASH
  .bss  : { *(.bss*) *(COMMON) } > RAM
}
`;

test('STM32G030: pin spelling, default clock, C emission and compilation', async () => {
    assert.equal(SB3Creator.defaultClock('stm32g030'), 64000000);

    const c = new SB3Creator();
    c.parse('DEVICE STM32G030\n'
        + 'PIN led1 = PA0 OUTPUT\n'
        + 'PIN btn1 = PB1 INPUT ACTIVE LOW\n'
        + 'PIN pot  = PA1 ANALOG\n\n'
        + 'WHEN flag clicked:\n'
        + '  forever:\n'
        + '    turn on led1\n'
        + '    wait 0.5 seconds\n'
        + '    turn off led1\n'
        + '    wait 0.5 seconds\n');

    const src = c.generateC(c.project, { debug: true });
    assert.deepEqual(c._cWarnings || [], [], 'clean emission for STM32G030');

    // Vector table: initial SP 0x20002000, TIM3 IRQ at vector index 16+16=32, total 48
    assert.match(src, /\(void \*\)0x20002000,\s*\/\* initial SP \*\//);
    assert.match(src, /\[16 \+ 16\] = \(void \*\)bw_tick_irq, \/\* TIM3 = IRQ16 \*\//);
    assert.match(src, /const void \*bw_vectors\[48\]/);

    // Clocks: RCC_IOPENR for GPIOs, RCC_APBENR1 for TIM3
    assert.match(src, /RCC_IOPENR\s*=/);
    assert.match(src, /RCC_APBENR1\s*=\s*\(1u << 1\);/);

    // GPIO configuration: MODER / PUPDR
    assert.match(src, /GPIOA_MODER/);
    assert.match(src, /GPIOB_MODER/);
    assert.match(src, /GPIOB_PUPDR/);

    // F_CPU = 64MHz default
    assert.match(src, /#define F_CPU 64000000UL/);

    if (hasGcc) {
        const dir = mkdtempSync(join(tmpdir(), 'bw-g0test-'));
        writeFileSync(join(dir, 'main.c'), src);
        writeFileSync(join(dir, 'link.ld'), LD_G0);
        execFileSync('arm-none-eabi-gcc', [
            '-mcpu=cortex-m0plus', '-mthumb', '-Os', '-ffreestanding',
            '-nostdlib', `-T${join(dir, 'link.ld')}`, '-o', join(dir, 'fw.elf'),
            join(dir, 'main.c'), '-lgcc'
        ], { stdio: 'pipe' });
        execFileSync('arm-none-eabi-objcopy', ['-O', 'binary', join(dir, 'fw.elf'), join(dir, 'fw.bin')], { stdio: 'pipe' });
        const bin = readFileSync(join(dir, 'fw.bin'));
        // counted 48 vectors * 4 bytes = 192 bytes
        assert.ok(bin.length >= 192, 'counted 48 vectors * 4 = 192 bytes minimum');
        const sp = bin[0] | (bin[1] << 8) | (bin[2] << 16) | (bin[3] << 24);
        assert.equal(sp >>> 0, 0x20002000, 'initial SP in binary matches 8K SRAM top');
    }
});

test('STM32F103: pin spelling, default clock, C emission and compilation', async () => {
    assert.equal(SB3Creator.defaultClock('stm32f103'), 72000000);

    const c = new SB3Creator();
    c.parse('DEVICE STM32F103\n'
        + 'PIN led  = PC13 OUTPUT\n'
        + 'PIN btn  = PA0 INPUT ACTIVE LOW\n'
        + 'PIN pot  = PB0 ANALOG\n\n'
        + 'WHEN flag clicked:\n'
        + '  forever:\n'
        + '    turn on led\n'
        + '    wait 0.5 seconds\n'
        + '    turn off led\n'
        + '    wait 0.5 seconds\n');

    const src = c.generateC(c.project, { debug: true });
    assert.deepEqual(c._cWarnings || [], [], 'clean emission for STM32F103');

    // Vector table: initial SP 0x20005000, TIM3 IRQ at vector index 29+16=45, total 68
    assert.match(src, /\(void \*\)0x20005000,\s*\/\* initial SP \*\//);
    assert.match(src, /\[16 \+ 29\] = \(void \*\)bw_tick_irq, \/\* TIM3 = IRQ29 \*\//);
    assert.match(src, /const void \*bw_vectors\[68\]/);

    // Clocks: RCC_APB2ENR for GPIOs, RCC_APB1ENR for TIM3
    assert.match(src, /RCC_APB2ENR\s*=/);
    assert.match(src, /RCC_APB1ENR\s*=\s*\(1u << 1\);/);

    // GPIO configuration: CRL / CRH
    assert.match(src, /GPIOC_CRH/);
    assert.match(src, /GPIOA_CRL/);
    assert.match(src, /GPIOB_CRL/);

    // NVIC_ISER IRQ 29 for TIM3
    assert.match(src, /NVIC_ISER = \(1u << 29\);/);

    // F_CPU = 72MHz default
    assert.match(src, /#define F_CPU 72000000UL/);

    if (hasGcc) {
        const dir = mkdtempSync(join(tmpdir(), 'bw-f1test-'));
        writeFileSync(join(dir, 'main.c'), src);
        writeFileSync(join(dir, 'link.ld'), LD_F1);
        execFileSync('arm-none-eabi-gcc', [
            '-mcpu=cortex-m3', '-mthumb', '-Os', '-ffreestanding',
            '-nostdlib', `-T${join(dir, 'link.ld')}`, '-o', join(dir, 'fw.elf'),
            join(dir, 'main.c'), '-lgcc'
        ], { stdio: 'pipe' });
        execFileSync('arm-none-eabi-objcopy', ['-O', 'binary', join(dir, 'fw.elf'), join(dir, 'fw.bin')], { stdio: 'pipe' });
        const bin = readFileSync(join(dir, 'fw.bin'));
        // counted 68 vectors * 4 bytes = 272 bytes
        assert.ok(bin.length >= 272, 'counted 68 vectors * 4 = 272 bytes minimum');
        const sp = bin[0] | (bin[1] << 8) | (bin[2] << 16) | (bin[3] << 24);
        assert.equal(sp >>> 0, 0x20005000, 'initial SP in binary matches 20K SRAM top');
    }
});

test('STM32G030 and STM32F103: pin refusals and tier caps', () => {
    const cG0 = new SB3Creator();
    assert.throws(() => {
        cG0.parse('DEVICE STM32G030\nPIN bad = PD0 OUTPUT\nWHEN flag clicked:\n  turn on bad\n');
    }, (err) => {
        return err.isSB3Error && /is not how stm32g030 names a pin/.test(err.message);
    });

    const cF1 = new SB3Creator();
    assert.throws(() => {
        cF1.parse('DEVICE STM32F103\nPIN bad = PD0 OUTPUT\nWHEN flag clicked:\n  turn on bad\n');
    }, (err) => {
        return err.isSB3Error && /is not how stm32f103 names a pin/.test(err.message);
    });

    // Blue Pill LED active-low property in RETARGET_POOLS
    assert.equal(SB3Creator.RETARGET_POOLS.stm32f103.ledActiveLow, true);
    assert.equal(SB3Creator.RETARGET_POOLS.stm32g030.ledActiveLow, false);
});
