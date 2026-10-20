import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import SB3Creator from '../src/utils/sb3Creator.js';
import { stageStm32ServiceRuntime } from './helpers/stm32-service-runtime.mjs';

let hasGcc = false;
try {
    execFileSync('arm-none-eabi-gcc', ['--version'], { stdio: 'pipe' });
    hasGcc = true;
} catch {
    /* gcc absent */
}

const LD_G0 = 'stm32g030';

const LD_F1 = 'stm32f103';

function compileArmBinary (src, device, mcpu) {
    const dir = mkdtempSync(join(tmpdir(), `bw-${mcpu}-`));
    writeFileSync(join(dir, 'main.c'), src);
    const runtime = stageStm32ServiceRuntime(dir, device);
    assert.equal(mcpu, runtime.cpu, 'selected CPU agrees with canonical service target');
    execFileSync('arm-none-eabi-gcc', [
        `-mcpu=${mcpu}`, '-mthumb', '-Os', '-ffreestanding',
        '-nostdlib', `-T${runtime.linker}`, ...runtime.flags, '-o', join(dir, 'fw.elf'),
        join(dir, 'main.c'), runtime.startup, '-lgcc'
    ], { stdio: 'pipe' });
    execFileSync('arm-none-eabi-objcopy', ['-O', 'binary', join(dir, 'fw.elf'), join(dir, 'fw.bin')], { stdio: 'pipe' });
    return readFileSync(join(dir, 'fw.bin'));
}

// The canonical service startup vector table fixes this prefix; the reset pointer must
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
    // Read-modify-write, only the PA9/PA10 fields: the old whole-register
    // `GPIOA_MODER = 0x280000u` also cleared PA13/PA14 out of AF0 (SWD),
    // RM0444 §7.4.1 (reset MODER = 0xEBFFFFFF on port A).
    assert.match(code, /GPIOA_MODER = \(GPIOA_MODER & ~0x3c0000u\) \| 0x280000u;/, 'PA9/PA10 MODER = 10 (AF), RMW');
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

// ---- Silicon audit (2026-10-15): what must be true on the real chips ------
// Each test names the reference-manual section it encodes. They assert the
// register SEQUENCE, not just the presence of a name, and compile the result
// with arm-none-eabi-gcc where it is installed (CI installs it).

const LD_F0 = 'stm32f030';
const BUILD = {
    STM32F030: [LD_F0, 'cortex-m0', 48, 0x20001000],
    STM32G030: [LD_G0, 'cortex-m0plus', 48, 0x20002000],
    STM32F103: [LD_F1, 'cortex-m3', 68, 0x20005000],
};
function build (dev, code) {
    if (!hasGcc) return;
    const [ld, cpu, vectors, sp] = BUILD[dev];
    assertVectorImage(compileArmBinary(code, ld, cpu), vectors, sp);
}
/** Assert each pattern occurs, in this order, in `text`. */
function inOrder (text, sequence, what) {
    sequence.reduce((at, step) => {
        const m = text.slice(at).match(step);
        assert.ok(m, `${what}: ${step} after offset ${at}`);
        return at + m.index + m[0].length;
    }, 0);
}
const setupOf = (code) => code.slice(code.indexOf('static void bw_setup(void)'));
const fnOf = (code, sig) => { const i = code.indexOf(sig); return code.slice(i, code.indexOf('\n}\n', i) + 2); };
const BLINK = '\nPIN led1 = PA0 OUTPUT\n\nWHEN flag clicked:\n  forever:\n    toggle led1\n    wait 0.5 seconds\n';

test('silicon clock: STM32F030 HSI/2 x12 = 48 MHz, 1 wait state, before any peripheral (RM0360 §6, §3.5.1)', () => {
    const { c, code } = emit('DEVICE STM32F030' + BLINK);
    assert.deepEqual(c._cWarnings || [], []);
    assert.match(code, /#define F_CPU 48000000UL/);
    assert.match(code, /#define FLASH_ACR {4}BW_MMIO\(0x40022000u\)/);
    assert.match(code, /#define RCC_CR {7}BW_MMIO\(0x40021000u\)/);
    assert.match(code, /#define RCC_CFGR {5}BW_MMIO\(0x40021004u\)/);
    inOrder(fnOf(code, 'static void bw_clock_init(void)'), [
        /FLASH_ACR = \(1u << 4\) \| 1u;/,                                  // PRFTBE + LATENCY=1 first
        /RCC_CFGR = \(RCC_CFGR & ~\(\(0xFu << 18\) \| \(3u << 15\)\)\) \| \(10u << 18\);/, // PLLMUL 1010 = x12, PLLSRC 00 = HSI/2
        /RCC_CR \|= \(1u << 24\);/,                                       // PLLON
        /bw_wait\(&RCC_CR, 1u << 25, 1u << 25\)/,                          // PLLRDY
        /RCC_CFGR = \(RCC_CFGR & ~3u\) \| 2u;/,                            // SW = PLL
        /bw_wait\(&RCC_CFGR, 3u << 2, 2u << 2\)/,                          // SWS = PLL
    ], 'F030 clock sequence');
    assert.equal(8e6 / 2 * (0b1010 + 2), 48e6, 'PLLMUL code 1010 is x12: HSI/2 x 12 = F_CPU');
    inOrder(setupOf(code), [/bw_clock_init\(\);/, /RCC_AHBENR/, /TIM3_PSC/], 'clock before clocks and prescalers');
    build('STM32F030', code);
});

test('silicon clock: STM32G030 HSI16 -> PLL M1 N8 R2 = 64 MHz, 2 wait states read back (RM0444 §5, §3.3.4)', () => {
    const { code } = emit('DEVICE STM32G030' + BLINK);
    assert.match(code, /#define F_CPU 64000000UL/);
    assert.match(code, /#define RCC_CFGR {5}BW_MMIO\(0x40021008u\)/, 'G0 CFGR is at +0x08');
    assert.match(code, /#define RCC_PLLCFGR {2}BW_MMIO\(0x4002100cu\)/);
    const fn = fnOf(code, 'static void bw_clock_init(void)');
    inOrder(fn, [
        /FLASH_ACR = \(FLASH_ACR & ~7u\) \| \(1u << 8\) \| 2u;/,
        /bw_wait\(&FLASH_ACR, 7u, 2u\)/,                                   // LATENCY taken into account
        /\| \(1u << 29\) \| \(1u << 28\) \| \(8u << 8\) \| 2u;/,           // PLLR=/2, PLLREN, PLLN=8, PLLM=/1, HSI16
        /RCC_CR \|= \(1u << 24\);/,
        /bw_wait\(&RCC_CR, 1u << 25, 1u << 25\)/,
        /RCC_CFGR = \(RCC_CFGR & ~7u\) \| 2u;/,                            // SW = 010 PLLRCLK
        /bw_wait\(&RCC_CFGR, 7u << 3, 2u << 3\)/,                          // SWS
    ], 'G030 clock sequence');
    assert.equal(16e6 / 1 * 8 / 2, 64e6, 'VCO 128 MHz / R 2 = F_CPU');
    inOrder(setupOf(code), [/bw_clock_init\(\);/, /RCC_IOPENR/], 'clock first');
    build('STM32G030', code);
});

test('silicon clock: STM32F103 HSE 8 MHz x9 = 72 MHz, APB1 /2, 2 wait states, HSI fallback (RM0008 §7, §3.3.3)', () => {
    const { code } = emit('DEVICE STM32F103\nPIN led = PC13 OUTPUT\n\nWHEN flag clicked:\n  print 1\n');
    assert.match(code, /#define F_CPU 72000000UL/);
    const fn = fnOf(code, 'static void bw_clock_init(void)');
    inOrder(fn, [
        /cfgr \|= \(2u << 14\) \| \(4u << 8\);/,                           // ADCPRE /6, PPRE1 = 100 (/2)
        /FLASH_ACR = \(1u << 4\) \| 2u;/,                                  // PRFTBE + LATENCY=2 before the switch
        /RCC_CR \|= \(1u << 16\);/,                                       // HSEON
        /bw_wait\(&RCC_CR, 1u << 17, 1u << 17\)/,                          // HSERDY
        /cfgr \|= \(7u << 18\) \| \(1u << 16\);/,                          // PLLMUL 0111 = x9, PLLSRC = HSE
        /cfgr \|= \(14u << 18\);/,                                        // fallback HSI/2 x16 = 64 MHz
        /RCC_CFGR = cfgr;/,
        /RCC_CR \|= \(1u << 24\);/,
        /bw_wait\(&RCC_CR, 1u << 25, 1u << 25\)/,
        /RCC_CFGR = \(RCC_CFGR & ~3u\) \| 2u;/,
        /bw_wait\(&RCC_CFGR, 3u << 2, 2u << 2\)/,
    ], 'F103 clock sequence');
    assert.equal(8e6 * (0b0111 + 2), 72e6, 'PLLMUL code 0111 is x9');
    // APB1 = 36 MHz, but a prescaled APB1 clocks its timers at 2 x PCLK1 =
    // 72 MHz (RM0008 §7.2, Figure 8), so TIM3's F_CPU-based prescaler is right;
    // USART1 is on APB2 = 72 MHz, so BRR = F_CPU / baud is right too.
    assert.match(code, /TIM3_PSC = \(uint16_t\)\(F_CPU \/ 1000000UL - 1UL\);/);
    assert.match(code, /USART1_BRR = \(uint32_t\)\(F_CPU \/ 9600UL\);/);
    inOrder(setupOf(code), [/bw_clock_init\(\);/, /RCC_APB2ENR/], 'clock first');
    build('STM32F103', code);
});

test('silicon clock: CLOCK must be the PLL default or the reset clock; anything else refuses by name', () => {
    for (const [dev, reset] of [['STM32F030', 8], ['STM32G030', 16], ['STM32F103', 8]]) {
        const ok = emit(`DEVICE ${dev}\nCLOCK ${reset} MHz${BLINK}`);
        assert.deepEqual(ok.c._cWarnings || [], [], `${dev} at its reset clock`);
        assert.match(ok.code, /static void bw_clock_init\(void\) \{ \}/, `${dev}: nothing to program at reset`);
        assert.doesNotMatch(ok.code, /PLLON/);
        build(dev, ok.code);
        const bad = emit(`DEVICE ${dev}\nCLOCK 24 MHz${BLINK}`);
        assert.match(bad.code, new RegExp(`^/\\* No C emitted for DEVICE ${dev}\\.`));
        assert.ok(bad.c._cWarnings.some((w) => w.includes(`CLOCK 24000000 Hz on the ${dev}`)), `${dev}: names the clock`);
    }
});

test('silicon G030: GPIO is the IOPORT at 0x50000000, no F0 0x48000000 address (RM0444 §2.2.2)', () => {
    const { code } = emit('DEVICE STM32G030\nPIN led1 = PA0 OUTPUT\nPIN b = PB1 INPUT ACTIVE LOW\nPIN x = PC14 OUTPUT\n\nWHEN flag clicked:\n  print 1\n');
    for (const [name, addr] of [['GPIOA_MODER', '0x50000000u'], ['GPIOA_PUPDR', '0x5000000cu'], ['GPIOA_IDR', '0x50000010u'],
        ['GPIOA_ODR', '0x50000014u'], ['GPIOA_BSRR', '0x50000018u'], ['GPIOA_AFRL', '0x50000020u'], ['GPIOA_AFRH', '0x50000024u'],
        ['GPIOB_MODER', '0x50000400u'], ['GPIOB_BSRR', '0x50000418u'], ['GPIOC_MODER', '0x50000800u'], ['GPIOC_BSRR', '0x50000818u']]) {
        assert.match(code, new RegExp(`#define ${name} +BW_MMIO\\(${addr}\\)`), name);
    }
    assert.doesNotMatch(code, /0x480[0-9a-f]{5}u/, 'no F0 AHB2 GPIO address on the G0');
    // The rest of the G0 map this generator emits, against RM0444 Table 6.
    for (const addr of ['0x40021000u', '0x40000400u', '0x40013800u', '0x40022000u']) assert.ok(code.includes(addr), addr);
    build('STM32G030', code);
});

test('silicon F0/G0: MODER/PUPDR are read-modify-write so PA13/PA14 stay SWD (RM0360 §8.4.1, RM0444 §7.4.1)', () => {
    for (const dev of ['STM32F030', 'STM32G030']) {
        const { code } = emit(`DEVICE ${dev}\nPIN led1 = PA0 OUTPUT\nPIN b = PA1 INPUT ACTIVE LOW\nPIN p = PA2 ANALOG\nPIN q = PB1 INPUT\n\n`
            + 'WHEN flag clicked:\n  print read p\n');
        const setup = setupOf(code);
        assert.doesNotMatch(setup, /GPIO[A-C]_(MODER|PUPDR) = 0x/, `${dev}: no whole-register mode write`);
        // PA0 out (01), PA1 in (00), PA2 analog (11), PA9/PA10 AF (10): mask covers exactly those fields.
        const m = setup.match(/GPIOA_MODER = \(GPIOA_MODER & ~0x([0-9a-f]+)u\) \| 0x([0-9a-f]+)u;/);
        assert.ok(m, `${dev}: GPIOA_MODER RMW`);
        const mask = Number.parseInt(m[1], 16), val = Number.parseInt(m[2], 16);
        assert.equal(mask, 0x3f | (0xf << 18), `${dev}: only PA0-PA2 and PA9/PA10 fields`);
        assert.equal(mask & (0xf << 26), 0, `${dev}: PA13/PA14 (bits 26-29) untouched`);
        assert.equal(val, 0x1 | (0x3 << 4) | (0x2 << 18) | (0x2 << 20));
        assert.match(setup, /GPIOA_PUPDR = \(GPIOA_PUPDR & ~0x3c003fu\) \| 0x4u;/, `${dev}: PA1 pull-up, PA9/PA10 no pull`);
        assert.match(setup, /GPIOB_MODER = \(GPIOB_MODER & ~0xcu\) \| 0x0u;/, `${dev}: PB1 input, explicitly (G0 resets to analog)`);
        assert.match(setup, /GPIOB_PUPDR = \(GPIOB_PUPDR & ~0xcu\) \| 0x8u;/, `${dev}: plain INPUT = pull-down`);
        build(dev, code);
    }
});

test('silicon F103: ACTIVE LOW input sets ODR for the pull-up; plain INPUT clears it (RM0008 §9.1, Table 20)', () => {
    const { c, code } = emit('DEVICE STM32F103\nPIN led1 = PA0 OUTPUT\nPIN btn1 = PA1 INPUT ACTIVE LOW\nPIN b2 = PB12 INPUT\n\n'
        + 'WHEN flag clicked:\n  forever:\n    IF read btn1 THEN:\n      turn on led1\n    ELSE:\n      turn off led1\n');
    assert.deepEqual(c._cWarnings || [], []);
    const setup = setupOf(code);
    inOrder(setup, [/RCC_APB2ENR/, /bw_pin_set\(1u\);\s*\/\* btn1: pull-up \(ODR\) \*\//, /GPIOA_CRL = 0x([0-9a-f]+)u;/], 'ODR then CNF');
    assert.match(setup, /bw_pin_clr\(28u\);\s*\/\* b2: pull-down \(ODR\) \*\//);
    const crl = Number.parseInt(setup.match(/GPIOA_CRL = 0x([0-9a-f]+)u;/)[1], 16);
    assert.equal((crl >>> 4) & 0xf, 0x8, 'PA1 CNF=10 MODE=00: input with pull');
    const crhB = Number.parseInt(setup.match(/GPIOB_CRH = 0x([0-9a-f]+)u;/)[1], 16);
    assert.equal((crhB >>> 16) & 0xf, 0x8, 'PB12 CNF=10 MODE=00');
    build('STM32F103', code);
});

test('silicon F103 PWM: every declared pin is driven — TIM2 PA0-PA3 and TIM3 CH3 PB0 (RM0008 §9.3.7, §15)', () => {
    const { c, code } = emit('DEVICE STM32F103\nPIN a = PA0 PWM\nPIN b = PA3 PWM\nPIN d = PB0 PWM\nPIN e = PA6 PWM\n\n'
        + 'WHEN flag clicked:\n  set a to 10 percent\n  set b to 20 percent\n  set d to 30 percent\n  set e to 40 percent\n');
    assert.deepEqual(c._cWarnings || [], [], 'no pin refused at emit time');
    assert.doesNotMatch(code, /no PWM on/);
    assert.match(code, /RCC_APB1ENR = \(1u << 1\) \| 1u;/, 'TIM3EN + TIM2EN (APB1ENR bit 0)');
    inOrder(setupOf(code), [/RCC_APB1ENR/, /TIM2_PSC = \(uint16_t\)\(F_CPU \/ 1000000UL - 1UL\);/, /TIM2_ARR = 999u;/, /TIM2_CR1 = 1u;/],
        'TIM2 clocked, then the same 1 kHz frame');
    assert.match(code, /#define TIM2_CR1 {5}BW_MMIO\(0x40000000u\)/);
    assert.match(code, /#define TIM3_CCR3 {4}BW_MMIO\(0x4000043cu\)/);
    const pwm = fnOf(code, 'static void pwm_set(');
    assert.match(pwm, /gpio == 16u\) \{ {2}\/\* PB0 = TIM3_CH3 \*\/\n\s+GPIOB_CRL {3}= \(GPIOB_CRL & ~0xFu\) \| 0xBu;/);
    assert.match(pwm, /TIM3_CCMR2 {2}= \(TIM3_CCMR2 & ~0x00FFu\) \| 0x0060u;/, 'OC3M = PWM1');
    assert.match(pwm, /TIM3_CCER {2}\|= \(1u << 8\);/, 'CC3E');
    assert.match(pwm, /BW_MMIO\(0x40000034u \+ s\) = duty;/, 'TIM2_CCR1..4 at 0x34 + 4n');
    for (const [p, g] of [['PA0', 0], ['PA3', 3], ['PB0', 16], ['PA6', 6]]) assert.match(code, new RegExp(`pwm_set\\(${g}, `), p);
    build('STM32F103', code);
    // An undeclarable pin still refuses at declaration, by the chip's own words.
    assert.throws(() => emit('DEVICE STM32F103\nPIN z = PB5 PWM\n'), /PWM on the STM32F103 means PA0-PA3 \(TIM2\) or PA6, PA7, PB0, PB1 \(TIM3\)/);
});

test('silicon G030 ADC: CKMODE, ADVREGEN + wait, ADCAL, then ADEN/ADRDY; CCRDY per channel (RM0444 §15.3)', () => {
    const { code } = emit('DEVICE STM32G030\nPIN pot = PA1 ANALOG\n\nWHEN flag clicked:\n  print read pot\n');
    assert.match(code, /#define ADC_CFGR2 {4}BW_MMIO\(0x40012410u\)/);
    assert.match(code, /#define ADC_SMPR {5}BW_MMIO\(0x40012414u\)/);
    inOrder(fnOf(code, 'static long adc_read('), [
        /ADC_CFGR2 = \(ADC_CFGR2 & ~\(3u << 30\)\) \| \(2u << 30\);/,      // CKMODE = PCLK/4 (ADEN = 0)
        /ADC_CR = \(1u << 28\);/,                                         // ADVREGEN
        /for \(d = 0; d < 400u; d\+\+\) \{ \}/,                             // tADCVREG_STUP
        /ADC_CR = \(1u << 28\) \| \(1u << 31\);/,                          // ADCAL
        /while \(ADC_CR & \(1u << 31\)\) ;/,
        /ADC_SMPR = 7u;/,
        /ADC_CR = \(1u << 28\) \| 1u;/,                                   // ADEN, ADVREGEN kept
        /while \(!\(ADC_ISR & 1u\)\) ;/,                                  // ADRDY
        /ADC_CHSELR = \(1u << channel\);/,
        /while \(!\(ADC_ISR & \(1u << 13\)\)\) ;/,                         // CCRDY
        /ADC_CR = \(1u << 28\) \| 1u \| \(1u << 2\);/,                     // ADSTART
        /while \(!\(ADC_ISR & \(1u << 2\)\)\) ;/,                          // EOC
    ], 'G0 ADC sequence');
    assert.equal(64e6 / 4, 16e6, 'PCLK/4 = 16 MHz ADC clock (DS12991: fADC max 35 MHz)');
    build('STM32G030', code);
});

test('silicon G030 chip temperature: channel 12, TSEN, factory TS_CAL1, >= 5 us sampling (RM0444 §15.10)', () => {
    const { c, code } = emit('DEVICE STM32G030\n\nWHEN flag clicked:\n  print chip temperature\n');
    assert.deepEqual(c._cWarnings || [], []);
    const fn = fnOf(code, 'static long bw_chip_temp(void)');
    assert.match(fn, /ADC_CCR \|= \(1u << 23\);/, 'TSEN');
    assert.match(fn, /adc_read\(12\)/, 'G0 sensor is ADC_IN12');
    assert.doesNotMatch(fn, /adc_read\(16\)|143000L|430L/, 'no F0 channel or F0 curve');
    assert.match(code, /#define BW_TS_CAL1 {3}\(\*\(volatile const uint16_t \*\)0x1FFF75A8u\)/);
    assert.match(fn, /t100 = 3000L \+ \(mv100 - cal100\) \* 100L \/ 250L;/, 'rises 2.5 mV/C from the 30 C point');
    assert.match(fn, /76000L/, 'typical V30 = 0.76 V when the calibration word is erased');
    assert.equal(Math.round(160.5 / 16e6 * 1e7) / 10, 10, 'SMP 160.5 cycles at 16 MHz = 10 us (DS12991: ts_temp min 5 us)');
    // The integer curve: 0.76 V at 30 C, +2.5 mV per degree, VDDA = 3.3 V.
    const temp = (raw, cal) => {
        const mv100 = Math.trunc(raw * 330000 / 4095);
        const cal100 = (cal === 0 || cal > 0xfff) ? 76000 : Math.trunc(cal * 300000 / 4095);
        const t100 = 3000 + Math.trunc((mv100 - cal100) * 100 / 250);
        return Math.trunc((t100 + 50 + 100000) / 100) - 1000;
    };
    assert.equal(temp(Math.round(0.76 / 3.3 * 4095), 0xffff), 30);
    assert.equal(temp(Math.round(0.81 / 3.3 * 4095), 0xffff), 50);
    assert.equal(temp(Math.round(0.76 / 3.3 * 4095), Math.round(0.76 / 3.0 * 4095)), 30, 'TS_CAL1 rescaled from 3.0 V');
    build('STM32G030', code);
});

test('silicon tone: timer clock enabled BEFORE its registers; G030 APBENR2 bit 15, F103 TIM4/IRQ30 (RM0444 §5.4.15, RM0008 §15)', () => {
    const cases = [
        ['STM32F030', /RCC_APB1ENR \|= \(1u << 8\);/, '0x40002000u', 19],
        ['STM32G030', /RCC_APBENR2 \|= \(1u << 15\);/, '0x40002000u', 19],
        ['STM32F103', /RCC_APB1ENR \|= \(1u << 2\);/, '0x40000800u', 30],
    ];
    for (const [dev, clk, base, irq] of cases) {
        const { c, code } = emit(`DEVICE ${dev}\nPIN spk = PA4 TONE\n\nWHEN flag clicked:\n  set spk to 440 hz\n`);
        assert.deepEqual(c._cWarnings || [], [], dev);
        assert.match(code, new RegExp(`#define BW_TONE_CR1  BW_MMIO\\(${base}\\)`), `${dev}: tone timer base`);
        inOrder(fnOf(code, 'static void tone_set('), [clk, /BW_TONE_CR1 = 0;/, /BW_TONE_PSC =/, new RegExp(`NVIC_ISER = \\(1u << ${irq}\\);`)],
            `${dev}: clock, then timer`);
        assert.match(code, new RegExp(`\\[16 \\+ ${irq}\\] = \\(void \\*\\)bw_tone_irq`), `${dev}: vector`);
        if (dev === 'STM32G030') assert.doesNotMatch(code, /RCC_APB1ENR/, 'the G0 has no RCC_APB1ENR');
        build(dev, code);
    }
});

test('silicon: foreign drivers and broadcasts refuse the whole STM32 program by name', () => {
    const progs = [
        ['servo', 'PIN servo = PA6 OUTPUT\nPART arm = SERVO 1\n\nWHEN flag clicked:\n  set arm angle to 90\n'],
        ['NeoPixel', 'PIN neopixel = PA3 OUTPUT\n\nWHEN flag clicked:\n  set neopixel 0 to R 255 G 0 B 0 on 1\n'],
        ['LCD', 'PIN led1 = PA0 OUTPUT\n\nWHEN flag clicked:\n  lcd clear 1\n  lcd print "HI" on 1\n'],
        ['OLED', 'PIN led1 = PA0 OUTPUT\n\nWHEN flag clicked:\n  oled clear 1\n  oled print "HI" on 1\n'],
        ['broadcast', 'PIN led1 = PA0 OUTPUT\n\nWHEN flag clicked:\n  broadcast go\n\nWHEN I receive go:\n  turn on led1\n'],
    ];
    for (const dev of ['STM32F030', 'STM32G030', 'STM32F103']) {
        for (const [what, body] of progs) {
            const { c, code } = emit(`DEVICE ${dev}\n${body}`);
            assert.match(code, new RegExp(`^/\\* No C emitted for DEVICE ${dev}\\.`), `${dev} ${what}: refused`);
            assert.doesNotMatch(code, /BW_MMIO|int main/, `${dev} ${what}: nothing half-built`);
            assert.ok((c._cWarnings || []).some((w) => w.includes(dev) && w.includes(what)), `${dev} ${what}: warning names it`);
        }
    }
});

test('silicon F103 DS18B20: 1-Wire DQ is CRL/CRH output open-drain, never MODER (RM0008 §9.1.6)', () => {
    const { c, code } = emit('DEVICE STM32F103\nPART probe = DS18B20 ON PA1\n\nWHEN flag clicked:\n  print temperature from probe\n');
    assert.deepEqual(c._cWarnings || [], []);
    assert.doesNotMatch(code, /_MODER/);
    assert.match(code, /GPIOA_CRL = \(GPIOA_CRL & ~\(0xFu << 4\)\) \| \(0x6u << 4\);/, 'PA1 CNF=01 MODE=10');
    build('STM32F103', code);
});

test('silicon: timer and reset timer run on the millisecond tick; list and answer limits are stated', () => {
    for (const dev of ['STM32F030', 'STM32G030', 'STM32F103']) {
        const { c, code } = emit(`DEVICE ${dev}\nPIN led1 = PA0 OUTPUT\n\nWHEN flag clicked:\n  reset timer\n  wait 1 seconds\n`
            + '  print timer * 1000\n  delete all of big\n  add 1 to big\n  print length of big\n  ask "n?" and wait\n  print answer\n');
        assert.match(code, /static uint32_t bw_timer_t0;/);
        assert.match(code, /bw_timer_t0 = bw_now\(\);/);
        assert.match(code, /\(\(long\)\(\(bw_now\(\) - bw_timer_t0\) \/ 1000u\)\)/);
        assert.doesNotMatch(code, /no C equivalent|reset timer \*\//);
        const w = c._cWarnings || [];
        assert.ok(w.some((x) => /timer counts whole seconds/.test(x)), `${dev}: timer resolution stated`);
        assert.ok(w.some((x) => x.includes(`lists hold at most 32 numbers each in ${dev} C`)), `${dev}: list cap stated`);
        assert.ok(w.some((x) => x.includes(`the answer holds at most 31 characters in ${dev} C`)), `${dev}: answer cap stated`);
        assert.ok(!w.some((x) => /no C equivalent/.test(x)), `${dev}: no silent stub`);
        build(dev, code);
    }
});

test('silicon: the generated header and PWM refusal name the actual STM32 chip', () => {
    for (const [dev, core] of [['STM32F030', 'M0'], ['STM32G030', 'M0\\+'], ['STM32F103', 'M3']]) {
        const { code } = emit(`DEVICE ${dev}${BLINK}`);
        assert.match(code, new RegExp(`^/\\* Generated by Brickwright — blocks → C for the ${dev} \\(Cortex-${core}\\)\\.`));
        assert.doesNotMatch(code.split('\n')[0], /STC12|8051/);
    }
    // A PWM verb on a pin that is not declared PWM: the emit-time refusal names the chip.
    const { c } = emit('DEVICE STM32G030\nPIN led1 = PA0 OUTPUT\n\nWHEN flag clicked:\n  set led1 to 50 percent\n');
    const w = (c._cWarnings || []).join(' | ');
    if (/no usable PWM/.test(w)) assert.match(w, /on the STM32G030/);
});
