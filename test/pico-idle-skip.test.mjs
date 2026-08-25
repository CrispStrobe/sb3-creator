// The pico scheduler idles instead of spinning.
//
// The busy-spin main loop (`for(;;){task();}`) burned the emulated 125 MHz
// core between key events: the rp2040js interpreter ground it at sim/wall
// ~0.22, and on silicon it is a needless full-power spin. The reference
// schedulers (the generated JS and MicroPython) sleep 1 ms after EVERY
// scheduler pass, so the C target sleeping after two same-millisecond
// passes is the same contract, read generously.
//
// The emitted idle is the standard pico idiom: TIMER ALARM0 at the next
// millisecond edge + WFI with PRIMASK set (a pended, NVIC-enabled interrupt
// wakes a masked core without vectoring — ARMv6-M B1.5.5 — so the
// freestanding build needs no vector table).
import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const PICO_TASKS = 'DEVICE PICO\nPIN led1 = GP25 OUTPUT\n\nWHEN flag clicked:\n  forever:\n    turn led1 on\n    wait 0.5 seconds\n    turn led1 off\n    wait 0.5 seconds\n';

test('pico tasks build: the main loop idles to the next ms edge', () => {
    const c = new SB3Creator();
    c.parse(PICO_TASKS);
    const out = c.generateC(c.project, { debug: true });
    // the primitive and its registers
    assert.match(out, /static void bw_idle\(void\)/);
    assert.match(out, /#define BW_TIMER_ALARM0\s+BW_MMIO\(0x40054010u\)/);
    assert.match(out, /#define BW_NVIC_ICPR\s+BW_MMIO\(0xe000e280u\)/);
    // WFI is guarded against the equality-miss race (a passed edge would
    // otherwise wait 2^32 us)
    assert.match(out, /if \(\(int32_t\)\(BW_TIMER_TIMELR - target\) < 0\) __asm volatile \("wfi"\);/);
    // pend and latch are cleared BEFORE unmasking — nothing may vector in
    // a build with no vector table
    const idleBody = out.slice(out.indexOf('static void bw_idle'), out.indexOf('}', out.indexOf('static void bw_idle')));
    const intr = idleBody.indexOf('BW_TIMER_INTR = 1u');
    const icpr = idleBody.indexOf('BW_NVIC_ICPR = 1u');
    const unmask = idleBody.indexOf('cpsie i');
    assert.ok(intr >= 0 && icpr > intr && unmask > icpr, 'clear latch, un-pend, THEN unmask');
    // the wake source is enabled once, in main
    assert.match(out, /BW_NVIC_ISER = 1u;/);
    // the loop only idles after two passes inside the same millisecond
    assert.match(out, /if \(bw_now\(\) == pass_ms\) \{ if \(\+\+bw_calm >= 2u\)/);
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

test('a pico build without tasks (plain main) stays untouched', () => {
    const c = new SB3Creator();
    c.parse('DEVICE PICO\nPIN led1 = GP25 OUTPUT\n\nWHEN flag clicked:\n  turn led1 on\n');
    const out = c.generateC(c.project, { debug: true });
    // no scheduler -> no idle machinery (a run-to-completion main has
    // nothing to wake for)
    if (!/bw_task/.test(out)) {
        assert.ok(!out.includes('bw_idle'), 'no scheduler, no idle');
    }
});
