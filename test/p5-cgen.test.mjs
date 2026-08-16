/**
 * Port 5 C generation — the STC15's P5 (STC15-PERIPHERAL-MODEL.md §3).
 *
 * stc12.h declares nothing above P4, but the STC15F2K60S2 bonds P5.4
 * (RST-shared) and P5.5 on the DIP-40 — and the RBS15667 retro console
 * drives its buzzer transistor from P5.5. The emitter must declare the
 * SFRs itself on a P5-bearing part, and refuse-by-warning on parts
 * where the port does not exist.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const STC15_SRC = `DEVICE STC15F2K60S2
CLOCK 11059200
PIN buzzer = P5.5 OUTPUT ACTIVE LOW

STAGE:
  WHEN flag clicked:
    turn on buzzer
    wait 0.1 seconds
    turn off buzzer
`;

test('P5.5 on an STC15 declares the port SFRs and drives the sbit', () => {
    const c = new SB3Creator();
    c.parse(STC15_SRC);
    const out = c.generateC();
    // stc12.h already declares P5/P5M0/P5M1 at the STC15 addresses — the
    // supplement must NOT redeclare them, only add what is missing.
    assert.doesNotMatch(out, /__sfr {2}__at \(0xC8\) P5;/, 'P5 latch comes from stc12.h, never redeclared');
    assert.match(out, /__sbit __at \(0xCD\) P5_5;/, 'P5.5 sbit at 0xC8+5 (stc12.h stops at P5_3)');
    assert.match(out, /__sbit __at \(0xCC\) P5_4;/, 'P5.4 sbit declared');
    assert.match(out, /__sfr {2}__at \(0xD6\) T2H;/, 'Timer 2 high — STC15-only register rides the supplement');
    assert.match(out, /__sfr {2}__at \(0xBA\) P_SW2;/, 'P_SW2 declared');
    assert.match(out, /#define INT_CLKO WAKE_CLKO/, 'STC15 register names aliased');
    assert.match(out, /P5M1 &= ~0x20;/, 'push-pull mode set for bit 5');
    assert.match(out, /P5M0 \|= {2}0x20;/, 'push-pull mode set for bit 5');
    assert.match(out, /P5_5 = /, 'the pin is actually driven');
});

test('P5 on an STC12 warns that the port does not exist', () => {
    const c = new SB3Creator();
    c.parse(STC15_SRC.replace('STC15F2K60S2', 'STC12C5A60S2'));
    const out = c.generateC();
    assert.doesNotMatch(out, /__sfr {2}__at \(0xC8\) P5;/,
        'no P5 declaration on a part without the port');
    const warned = (c._cWarnings || []).join('\n');
    assert.match(warned, /P5 does not exist on DEVICE STC12C5A60S2/,
        'the refusal names the device and the reason');
});

test('an unbonded P5 bit warns about the DIP-40', () => {
    const c = new SB3Creator();
    c.parse(STC15_SRC.replace('P5.5', 'P5.1'));
    const out = c.generateC();
    const warned = (c._cWarnings || []).join('\n');
    assert.match(warned, /P5\.1 is not bonded/,
        'unbonded bit named in the warning');
});
