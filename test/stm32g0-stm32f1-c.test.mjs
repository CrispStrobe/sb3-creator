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

function compileArmBinary (src, ld, mcpu) {
    const dir = mkdtempSync(join(tmpdir(), `bw-${mcpu}-`));
    writeFileSync(join(dir, 'main.c'), src);
    writeFileSync(join(dir, 'link.ld'), ld);
    execFileSync('arm-none-eabi-gcc', [
        `-mcpu=${mcpu}`, '-mthumb', '-Os', '-ffreestanding',
        '-nostdlib', `-T${join(dir, 'link.ld')}`, '-o', join(dir, 'fw.elf'),
        join(dir, 'main.c'), '-lgcc'
    ], { stdio: 'pipe' });
    execFileSync('arm-none-eabi-objcopy', ['-O', 'binary', join(dir, 'fw.elf'), join(dir, 'fw.bin')], { stdio: 'pipe' });
    return readFileSync(join(dir, 'fw.bin'));
}

// The emitted vector array fixes this prefix exactly; the reset pointer must
// point past that table into bytes actually present in the linked image.
function assertVectorImage (bin, vectorCount, stackTop) {
    const vectorBytes = vectorCount * Uint32Array.BYTES_PER_ELEMENT;
    assert.equal(bin.subarray(0, vectorBytes).length, vectorBytes, 'complete counted vector table is present');
    assert.equal(bin.readUInt32LE(0), stackTop, 'initial SP equals selected SRAM top');
    const reset = bin.readUInt32LE(Uint32Array.BYTES_PER_ELEMENT);
    assert.equal(reset & 1, 1, 'reset vector selects Thumb instructions');
    const offset = (reset & ~1) - 0x08000000;
    assert.equal(offset >= vectorBytes && offset < bin.length, true, 'reset entry points into actual linked code bytes');
    assert.equal(bin.subarray(offset, offset + Uint16Array.BYTES_PER_ELEMENT).length, Uint16Array.BYTES_PER_ELEMENT,
        'complete first Thumb halfword is present at reset entry');
}

test('linked vector contract rejects truncated tables and invalid reset entries', () => {
    const vectors = 48, stack = 0x20002000, bytes = vectors * Uint32Array.BYTES_PER_ELEMENT;
    const valid = Buffer.alloc(bytes + Uint32Array.BYTES_PER_ELEMENT);
    valid.writeUInt32LE(stack, 0); valid.writeUInt32LE(0x08000000 + bytes + 1, Uint32Array.BYTES_PER_ELEMENT);
    assertVectorImage(valid, vectors, stack);
    assert.throws(() => assertVectorImage(valid.subarray(0, bytes - 1), vectors, stack));
    for (const [word, value] of [[0, 0], [1, 0x08000000 + bytes], [1, 0x08000001], [1, 0x08000000 + valid.length + 1]]) {
        const changed = Buffer.from(valid);changed.writeUInt32LE(value, word * Uint32Array.BYTES_PER_ELEMENT);
        assert.throws(() => assertVectorImage(changed, vectors, stack));
    }
    assert.throws(() => assertVectorImage(valid.subarray(0, bytes + 1), vectors, stack));
});

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
        const bin = compileArmBinary(src, LD_G0, 'cortex-m0plus');
        assertVectorImage(bin, 48, 0x20002000);
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
        const bin = compileArmBinary(src, LD_F1, 'cortex-m3');
        assertVectorImage(bin, 68, 0x20005000);
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

test('STM32G030: Scratch variables, loops, conditionals and math compile cleanly', () => {
    const c = new SB3Creator();
    c.parse('DEVICE STM32G030\n'
        + 'PIN led = PA0 OUTPUT\n'
        + 'PIN btn = PA1 INPUT ACTIVE LOW\n'
        + 'PIN out2 = PC14 OUTPUT\n\n'
        + 'WHEN flag clicked:\n'
        + '  set count to 0\n'
        + '  repeat 10:\n'
        + '    change count by 1\n'
        + '  if count = 10 then:\n'
        + '    turn on led\n'
        + '  else:\n'
        + '    turn off led\n'
        + '  repeat until count = 0:\n'
        + '    change count by -1\n'
        + '    turn on out2\n'
        + '    turn off out2\n');

    const src = c.generateC(c.project, { debug: true });
    assert.deepEqual(c._cWarnings || [], [], 'no emission warnings for variables and loops');
    assert.match(src, /RCC_IOPENR\s*=\s*0x5u;/, 'both GPIOA and GPIOC enabled in IOPENR (0x5)');

    if (hasGcc) {
        const bin = compileArmBinary(src, LD_G0, 'cortex-m0plus');
        assertVectorImage(bin, 48, 0x20002000);
    }
});

test('STM32F103: Scratch variables, loops, conditionals and math compile cleanly', () => {
    const c = new SB3Creator();
    c.parse('DEVICE STM32F103\n'
        + 'PIN led = PC13 OUTPUT\n'
        + 'PIN btn = PA0 INPUT ACTIVE LOW\n'
        + 'PIN out2 = PB1 OUTPUT\n\n'
        + 'WHEN flag clicked:\n'
        + '  set val to 42\n'
        + '  if val > 20 and not (val = 100) then:\n'
        + '    turn on led\n'
        + '  repeat until val = 0:\n'
        + '    change val by -1\n'
        + '    turn on out2\n'
        + '    turn off out2\n'
        + '  turn off led\n');

    const src = c.generateC(c.project, { debug: true });
    assert.deepEqual(c._cWarnings || [], [], 'clean emission for F103 logic');
    assert.match(src, /RCC_APB2ENR\s*=\s*0x1cu;/, 'GPIOA, GPIOB, and GPIOC clocks enabled in APB2ENR (0x1c)');

    if (hasGcc) {
        const bin = compileArmBinary(src, LD_F1, 'cortex-m3');
        assertVectorImage(bin, 68, 0x20005000);
    }
});

test('STM32F103: active-low PC13 LED inversion check', () => {
    const c = new SB3Creator();
    c.parse('DEVICE STM32F103\n'
        + 'PIN led = PC13 OUTPUT\n\n'
        + 'WHEN flag clicked:\n'
        + '  turn on led\n'
        + '  turn off led\n');

    const src = c.generateC(c.project);
    // On active-low LED, turning ON calls bw_pin_clr (pulling pin low)
    // and turning OFF calls bw_pin_set (releasing pin high). PC13 has virtual pin 45 (port C = 32 + 13).
    assert.match(src, /bw_pin_clr\(45u\);/, 'turn on PC13 calls bw_pin_clr for active-low');
    assert.match(src, /bw_pin_set\(45u\);/, 'turn off PC13 calls bw_pin_set for active-low');
});

test('STM32G030: active-high PA0 LED normal polarity check', () => {
    const c = new SB3Creator();
    c.parse('DEVICE STM32G030\n'
        + 'PIN led = PA0 OUTPUT\n\n'
        + 'WHEN flag clicked:\n'
        + '  turn on led\n'
        + '  turn off led\n');

    const src = c.generateC(c.project);
    // On normal active-high LED, turning ON calls bw_pin_set and turning OFF calls bw_pin_clr. PA0 is virtual pin 0.
    assert.match(src, /bw_pin_set\(0u\);/, 'turn on PA0 calls bw_pin_set');
    assert.match(src, /bw_pin_clr\(0u\);/, 'turn off PA0 calls bw_pin_clr');
});

test('STM32G030: complete pin dictionary acceptance', () => {
    // All 16 PA pins, 10 PB pins, PC14, PC15
    const validPins = [
        ...Array.from({ length: 16 }, (_, i) => `PA${i}`),
        ...Array.from({ length: 10 }, (_, i) => `PB${i}`),
        'PC14', 'PC15'
    ];

    for (const p of validPins) {
        const c = new SB3Creator();
        c.parse(`DEVICE STM32G030\nPIN testPin = ${p} OUTPUT\nWHEN flag clicked:\n  turn on testPin\n`);
        const src = c.generateC(c.project);
        const pin = (p.charCodeAt(1) - 'A'.charCodeAt(0)) * 16 + Number(p.slice(2));
        assert.match(src, new RegExp(`^\\s*bw_pin_set\\(${pin}u\\);$`, 'm'), `pin ${p} lowers to its actual GPIO set operation`);
    }

    // Invalid pins
    const invalidPins = ['PD0', 'PD5', 'PC0', 'PC13'];
    for (const p of invalidPins) {
        const c = new SB3Creator();
        assert.throws(() => {
            c.parse(`DEVICE STM32G030\nPIN testPin = ${p} OUTPUT\nWHEN flag clicked:\n  turn on testPin\n`);
        });
    }
});

test('STM32F103: complete pin dictionary acceptance', () => {
    // PA0-PA15, PB0-PB15, PC13-PC15
    const validPins = [
        ...Array.from({ length: 16 }, (_, i) => `PA${i}`),
        ...Array.from({ length: 16 }, (_, i) => `PB${i}`),
        'PC13', 'PC14', 'PC15'
    ];

    for (const p of validPins) {
        const c = new SB3Creator();
        c.parse(`DEVICE STM32F103\nPIN testPin = ${p} OUTPUT\nWHEN flag clicked:\n  turn on testPin\n`);
        const src = c.generateC(c.project);
        const pin = (p.charCodeAt(1) - 'A'.charCodeAt(0)) * 16 + Number(p.slice(2));
        assert.match(src, new RegExp(`^\\s*bw_pin_set\\(${pin}u\\);$`, 'm'), `pin ${p} lowers to its actual GPIO set operation`);
    }

    // Invalid pins
    const invalidPins = ['PD0', 'PD1', 'PC0', 'PC12'];
    for (const p of invalidPins) {
        const c = new SB3Creator();
        assert.throws(() => {
            c.parse(`DEVICE STM32F103\nPIN testPin = ${p} OUTPUT\nWHEN flag clicked:\n  turn on testPin\n`);
        });
    }
});

test('STM32G030 & STM32F103: flasher bootloader PID identification', async () => {
    const { STM32_PID_CHIPS } = await import('../src/utils/flasher.js');
    if (STM32_PID_CHIPS) {
        assert.equal(STM32_PID_CHIPS[0x0466], 'STM32G030 / G031');
        assert.equal(STM32_PID_CHIPS[0x0410], 'STM32F103 (Medium-density)');
    }
});

// ---- print / PWM register layouts per family, and DEVICE-without-pins ----

function emit (src) {
    const c = new SB3Creator();
    c.parse(src);
    return { c, code: c.generateC(c.project, {}) };
}

test('STM32G030 print: USART1 clocked from APBENR2 bit 14 and PA9/PA10 on AF1 (RM0444)', () => {
    const { code } = emit('DEVICE STM32G030\n\nWHEN flag clicked:\n  print 7\n');
    assert.match(code, /RCC_APBENR2 = 0x4000u;/, 'USART1EN = APBENR2 bit 14');
    assert.match(code, /RCC_IOPENR {2}= 0x1u;/, 'GPIOA clocked for PA9/PA10 even with no pin declared');
    assert.match(code, /GPIOA_MODER = 0x280000u;/, 'PA9/PA10 MODER = 10 (AF)');
    assert.match(code, /GPIOA_AFRH = \(GPIOA_AFRH & ~0xFF0u\) \| \(1u << 4\) \| \(1u << 8\);/, 'PA9/PA10 = AF1');
    assert.match(code, /USART1_CR1 = \(1u << 3\) \| 1u;/, 'v2 USART: UE is bit 0');
    if (hasGcc) assertVectorImage(compileArmBinary(code, LD_G0, 'cortex-m0plus'), 48, 0x20002000);
});

test('STM32G030 ADC: ADCEN is APBENR2 bit 20 (RM0444), not the F0 APB2ENR bit 9', () => {
    const { code } = emit('DEVICE STM32G030\nPIN pot = PA1 ANALOG\n\nWHEN flag clicked:\n  set v to read pot\n');
    assert.match(code, /RCC_APBENR2 = 0x100000u;\s*\/\* ADC \*\//);
    assert.doesNotMatch(code, /RCC_APB2ENR/);
});

test('STM32F103 print: F1 USART layout SR/DR/BRR/CR1@0x0C, UE bit 13, PA9 AF push-pull (RM0008)', () => {
    const { code } = emit('DEVICE STM32F103\nPIN led = PC13 OUTPUT\n\nWHEN flag clicked:\n  print 7\n');
    assert.match(code, /#define USART1_SR {4}BW_MMIO\(0x40013800u\)/);
    assert.match(code, /#define USART1_DR {4}BW_MMIO\(0x40013804u\)/);
    assert.match(code, /#define USART1_BRR {3}BW_MMIO\(0x40013808u\)/);
    assert.match(code, /#define USART1_CR1 {3}BW_MMIO\(0x4001380cu\)/);
    assert.doesNotMatch(code, /0x4001381cu|0x40013828u/, 'no F0/G0 ISR/TDR offsets on the F1');
    assert.match(code, /USART1_CR1 = \(1u << 3\) \| \(1u << 13\);/, 'TE + UE(bit 13)');
    assert.match(code, /RCC_APB2ENR = 0x4014u;/, 'IOPA(2) + IOPC(4) + USART1(14)');
    // PA9 nibble (bits 4-7) = 0xB AF push-pull; PA10 nibble (bits 8-11) = 0x4 floating input
    const crh = Number.parseInt(code.match(/GPIOA_CRH = 0x([0-9a-f]+)u;/)[1], 16);
    assert.equal((crh >>> 4) & 0xF, 0xB);
    assert.equal((crh >>> 8) & 0xF, 0x4);
    if (hasGcc) assertVectorImage(compileArmBinary(code, LD_F1, 'cortex-m3'), 68, 0x20005000);
});

test('STM32F103 PWM: TIM3 pins configured through CRL as AF push-pull, never MODER, and it compiles', () => {
    const { c, code } = emit('DEVICE STM32F103\nPIN a = PA6 PWM\nPIN b = PA7 PWM\nPIN d = PB1 PWM\n\n'
        + 'WHEN flag clicked:\n  set a to 30 percent\n  set b to 60 percent\n  set d to 90 percent\n');
    assert.deepEqual(c._cWarnings || [], []);
    assert.doesNotMatch(code, /^\s*(#define\s+)?GPIO[A-C]_(MODER|AFR[LH])\b/m, 'F0/G0-only GPIO registers do not exist on the F1');
    assert.match(code, /GPIOA_CRL {3}= \(GPIOA_CRL & ~\(0xFu << 24\)\) \| \(0xBu << 24\);/, 'PA6 = TIM3_CH1');
    assert.match(code, /GPIOA_CRL {3}= \(GPIOA_CRL & ~\(0xFu << 28\)\) \| \(0xBu << 28\);/, 'PA7 = TIM3_CH2');
    assert.match(code, /GPIOB_CRL {3}= \(GPIOB_CRL & ~\(0xFu << 4\)\) \| \(0xBu << 4\);/, 'PB1 = TIM3_CH4');
    // RM0008 §15.4: TIM3 at 0x40000400, CCMR1 0x18, CCMR2 0x1C, CCER 0x20, CCR1 0x34
    assert.match(code, /TIM3_CCMR1 {3}BW_MMIO\(0x40000418u\)/);
    assert.match(code, /TIM3_CCMR2 {3}BW_MMIO\(0x4000041cu\)/);
    assert.match(code, /TIM3_CCER {4}BW_MMIO\(0x40000420u\)/);
    assert.match(code, /TIM3_CCR1 {4}BW_MMIO\(0x40000434u\)/);
    assert.match(code, /RCC_APB1ENR = \(1u << 1\);/, 'TIM3EN');
    if (hasGcc) assertVectorImage(compileArmBinary(code, LD_F1, 'cortex-m3'), 68, 0x20005000);
});

test('an explicit DEVICE line builds for the chip even with no pins; no DEVICE line stays host C', () => {
    for (const dev of ['STM32F030', 'STM32G030', 'STM32F103', 'PICO', 'ESP8266', 'ARDUINO-UNO']) {
        const { code } = emit(`DEVICE ${dev}\n\nWHEN flag clicked:\n  set n to 3\n  print n\n`);
        assert.doesNotMatch(code, /#include <stdio\.h>/, `${dev}: device C, not host C`);
        assert.match(code, /@bw-begin/, `${dev}: device marker present`);
    }
    const { code: host } = emit('WHEN flag clicked:\n  set n to 3\n  print n\n');
    assert.match(host, /#include <stdio\.h>/, 'no DEVICE line: host C as before');
    // opts.target still overrides the declaration.
    const c = new SB3Creator();
    c.parse('DEVICE STM32F030\n\nWHEN flag clicked:\n  print 1\n');
    assert.match(c.generateC(c.project, { target: 'host' }), /#include <stdio\.h>/);
});

test('STM32F103 ADC: the F1 ADC1 sequence (RM0008 §11), not the F0/G0 ADEN/CHSELR one', () => {
    const { c, code } = emit('DEVICE STM32F103\nPIN pot1 = PA0 ANALOG\nPIN pot2 = PB1 ANALOG\n\n'
        + 'WHEN flag clicked:\n  forever:\n    print read pot1\n    print read pot2\n    wait 0.1 seconds\n');
    assert.deepEqual(c._cWarnings || [], []);
    assert.doesNotMatch(code, /ADC_CHSELR|ADC_ISR|ADRDY|ADSTART/, 'no F0/G0 ADC registers on the F1');
    for (const [name, addr] of [['ADC1_SR', '0x40012400u'], ['ADC1_CR2', '0x40012408u'], ['ADC1_SMPR2', '0x40012410u'],
        ['ADC1_SQR1', '0x4001242cu'], ['ADC1_SQR3', '0x40012434u'], ['ADC1_DR', '0x4001244cu'], ['RCC_CFGR', '0x40021004u']]) {
        assert.match(code, new RegExp(`#define ${name} +BW_MMIO\\(${addr}\\)`), name);
    }
    assert.match(code, /RCC_CFGR = \(RCC_CFGR & ~\(3u << 14\)\) \| \(2u << 14\);/, 'ADCPRE = /6, <= 14 MHz');
    assert.match(code, /ADC1_CR2 \|= \(1u << 3\);[^\n]*RSTCAL/);
    assert.match(code, /ADC1_CR2 \|= \(1u << 2\);[^\n]*CAL/);
    assert.match(code, /ADC1_SQR3 = \(uint32_t\)channel & 0x1Fu;/);
    assert.match(code, /\(7u << 17\) \| \(1u << 20\) \| \(1u << 22\)/, 'EXTSEL=SWSTART, EXTTRIG, SWSTART');
    assert.match(code, /while \(!\(ADC1_SR & \(1u << 1\)\)\) ;/, 'polls SR.EOC');
    assert.match(code, /adc_read\(0\)/, 'PA0 = ADC12_IN0');
    assert.match(code, /adc_read\(9\)/, 'PB1 = ADC12_IN9');
    const apb2 = Number.parseInt(code.match(/RCC_APB2ENR = 0x([0-9a-f]+)u;/)[1], 16);
    for (const bit of [2, 3, 9]) assert.ok(apb2 & (1 << bit), `APB2ENR bit ${bit} (IOPA, IOPB, ADC1EN)`);
    // analog input = CRL nibble 0 for PA0 and PB1
    assert.equal(Number.parseInt(code.match(/GPIOA_CRL = 0x([0-9a-f]+)u;/)[1], 16) & 0xF, 0);
    assert.equal((Number.parseInt(code.match(/GPIOB_CRL = 0x([0-9a-f]+)u;/)[1], 16) >>> 4) & 0xF, 0);
    if (hasGcc) assertVectorImage(compileArmBinary(code, LD_F1, 'cortex-m3'), 68, 0x20005000);
});

test('STM32F103 chip temperature: ADC1 channel 16 with TSVREFE, kept through adc_read', () => {
    const { code } = emit('DEVICE STM32F103\n\nWHEN flag clicked:\n  print chip temperature\n');
    assert.match(code, /ADC1_CR2 \|= \(1u << 23\);/, 'TSVREFE');
    assert.match(code, /ADC1_SMPR1 \|= \(7u << 18\);/, 'SMP16 = 239.5 cycles');
    assert.match(code, /ADC1_CR2 = \(ADC1_CR2 & \(1u << 23\)\)/, 'a conversion start keeps TSVREFE');
    assert.doesNotMatch(code, /ADC_CCR|TSEN/);
    if (hasGcc) assertVectorImage(compileArmBinary(code, LD_F1, 'cortex-m3'), 68, 0x20005000);
});
