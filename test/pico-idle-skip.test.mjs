// The pico C target idles instead of spinning.
//
// The busy-spin loops (the scheduler pass loop, the single-main forever,
// delay_ms, wait_until) burned the emulated 125 MHz core between events:
// profiled on the owner's 'slow and laggy' calculator, 89% of the page's
// entire main-thread time was the rp2040js interpreter grinding the spin.
// Measured in Node with the REAL calculator firmware: 248M instructions
// for 2 s of sim (sim/wall 0.25) before; 2.7M (sim/wall 18) after.
//
// The idle is WFE against TIMER ALARM0 armed at the next millisecond
// edge. The alarm IRQ vectors through an emitted 48-slot table to a
// handler that clears the TIMER latch; exception return sets the event
// register, so a WFE that races the alarm falls through instead of
// sleeping past it (ARMv6-M WFE semantics). The first design used
// PRIMASK-masked WFI with no vector table — rp2040js (correctly) wakes
// by VECTORING, so the core jumped through VTOR=0 into garbage; the
// vector table is not optional.
import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const PICO_TASKS = 'DEVICE PICO\nPIN led1 = GP25 OUTPUT\n\nWHEN flag clicked:\n  forever:\n    turn led1 on\n    wait 0.5 seconds\n    turn led1 off\n    wait 0.5 seconds\n';

test('pico build: bw_idle is WFE behind a real vector table', () => {
    const c = new SB3Creator();
    c.parse(PICO_TASKS);
    const out = c.generateC(c.project, { debug: true });
    // the primitive and its registers
    assert.match(out, /static void bw_idle\(void\)/);
    assert.match(out, /#define BW_TIMER_ALARM0\s+BW_MMIO\(0x40054010u\)/);
    assert.match(out, /#define BW_SCB_VTOR\s+BW_MMIO\(0xe000ed08u\)/);
    // the idle arms the next ms edge and sleeps on WFE (not WFI: rp2040js
    // wakes by vectoring, and hardware may too — the table must be real)
    assert.match(out, /BW_TIMER_ALARM0 = us \+ \(1000u - us % 1000u\)/);
    assert.match(out, /__asm volatile \("wfe"\)/);
    assert.ok(!out.includes('"wfi"'), 'WFI is the vectorless trap — never emitted');
    // the vector table: 48 slots, 256-aligned, all pointing at the handler
    assert.match(out, /__attribute__\(\(aligned\(256\)\)\) static const bw_vec_t bw_vectors\[48\]/);
    const tableBody = out.slice(out.indexOf('bw_vectors[48]'), out.indexOf('};', out.indexOf('bw_vectors[48]')));
    assert.equal((tableBody.match(/bw_alarm_irq/g) || []).length, 48, 'every slot carries the wake handler');
    // the handler clears the latch (or the IRQ refires forever)
    const handler = out.slice(out.indexOf('static void bw_alarm_irq'), out.indexOf('}', out.indexOf('static void bw_alarm_irq')));
    assert.match(handler, /BW_TIMER_INTR = 1u/);
    // main wires the wake path: VTOR, INTE, NVIC
    assert.match(out, /BW_SCB_VTOR = \(uint32_t\)bw_vectors/);
    assert.match(out, /BW_TIMER_INTE = 1u/);
    assert.match(out, /BW_NVIC_ISER = 1u/);
});

test('the tasks scheduler idles after two same-millisecond passes', () => {
    const c = new SB3Creator();
    c.parse(PICO_TASKS);
    const out = c.generateC(c.project, { debug: true });
    if (out.includes('bw_task')) {
        assert.match(out, /if \(bw_now\(\) == pass_ms\) \{ if \(\+\+bw_calm >= 2u\)/);
    }
});

test('the single-main flavor sleeps too: forever, delay_ms, wait_until', async () => {
    // the calculator IS the single-main case that motivated this — its
    // PLAIN compile (what export and the real firmware use) takes the
    // straight-line main; debug:true would flip to the task state
    // machine, which the tasks test covers
    const { readFileSync } = await import('fs');
    const { join } = await import('path');
    const c = new SB3Creator();
    c.parse(readFileSync(join(import.meta.dirname, '..', 'examples/70-calculator/program.bw'), 'utf8'));
    const out = c.generateC(undefined, {});
    assert.ok(!out.includes('bw_task'), 'fixture must be a single-main build');
    assert.match(out, /bw_idle\(\);\s+\/\* forever yields/, 'forever iterations yield to the ms edge');
    if (out.includes('static void delay_ms')) {
        assert.match(out, /while \(\(int32_t\)\(bw_now\(\) - start - ms\) < 0\) bw_idle\(\);/,
            'a blocking delay sleeps in ms steps');
    }
    assert.ok(!/while \(!\([^)]*\)\) ;/.test(out), 'no bare wait_until spin on arm');
});

test('the idle is pico-only: 8051 and AVR builds carry none of it', () => {
    for (const [dev, pin] of [['STC12', 'P1.0'], ['UNO', 'D13']]) {
        const c = new SB3Creator();
        c.parse(`DEVICE ${dev}\nPIN led1 = ${pin} OUTPUT\n\nWHEN flag clicked:\n  forever:\n    turn led1 on\n    wait 0.5 seconds\n`);
        const out = c.generateC(c.project, { debug: true });
        assert.ok(!out.includes('bw_idle'), `${dev} must not emit bw_idle (its idle is a follow-up lane)`);
        assert.ok(!out.includes('BW_NVIC_ISER'), `${dev} must not touch a Cortex-M NVIC`);
    }
});
