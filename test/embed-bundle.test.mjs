// The embeddable transpiler bundle is the mechanism behind a self-contained
// Rust CLI: one JS transpiler (SB3Creator), run inside the binary by an
// embedded JS engine, never reimplemented in Rust and never Python. This
// test proves the two claims that make that safe:
//
//   1. the bundle runs in a BARE JS engine — a sandbox with no require, no
//      process, no fs, no Buffer, no DOM (what QuickJS/boa give a Rust host);
//   2. the C it produces there is byte-identical to calling SB3Creator
//      directly in node — modulo the @bw yield markers, which are
//      run-random block-ids that differ even between two node runs.
//
// If either breaks, "embed the JS transpiler in Rust" is no longer sound.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';
import SB3Creator from '../src/utils/sb3Creator.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const bundlePath = resolve(root, 'build/bw-transpiler.embed.js');

// A real STM32F030 program: DEVICE + PIN declarations, ADC + PWM + GPIO, so
// the codegen exercises the ARM core path (where the pico-timebase leak bug
// would show if debug:true were dropped).
const PROGRAM = `DEVICE STM32F030
PIN led = PA0 OUTPUT
PIN pot = PA5 ANALOG
PIN dim = PA6 PWM

WHEN flag clicked:
  forever:
    set led to HIGH
    wait 500 ms
    set led to LOW
    wait 500 ms`;

// Drop the run-random @bw yield markers so two correct runs compare equal.
const stripYields = (c) => c.split('\n').filter((l) => !l.includes('@bw yield')).join('\n');

/** Build the bundle fresh, then eval it in a bare sandbox and return it. */
function runInBareEngine (program) {
    execFileSync('node', [resolve(root, 'scripts/bundle-embed.mjs')], { cwd: root, stdio: 'pipe' });
    const code = readFileSync(bundlePath, 'utf8');
    // The sandbox deliberately exposes ONLY what a minimal engine has:
    // globalThis and a console. No require, process, fs, Buffer, TextEncoder,
    // setTimeout — if the transpiler needed any, this would throw.
    const sandbox = { globalThis: null, console: { log () {}, error () {}, warn () {} } };
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { timeout: 20000 });
    assert.equal(sandbox.bwEmbedReady, true, 'embed surface did not initialise');
    return sandbox.bwTranspileC(program);
}

test('the embed bundle runs in a bare JS engine (no node/DOM globals)', () => {
    const c = runInBareEngine(PROGRAM);
    assert.match(c, /@bw device stm32f030/, 'targets STM32F030');
    assert.match(c, /RCC|GPIOA/, 'emits ARM GPIO setup');
    assert.match(c, /ADC/, 'emits the ADC for the analog pin');
    assert.doesNotMatch(c, /BW_TIMER_TIME[LH]R|rp2040/i,
        'must NOT leak the pico timebase — that is the debug:true bug');
});

test('bare-engine C is byte-identical to node SB3Creator (sans run-random ids)', () => {
    const fromEngine = runInBareEngine(PROGRAM);
    const direct = new SB3Creator();
    direct.parse(PROGRAM);
    const fromNode = direct.generateC(undefined, { debug: true });
    assert.equal(stripYields(fromEngine), stripYields(fromNode),
        'the embedded engine must produce the same C as the transpiler in node');
});

test('bwDevices reaches the retarget pool through the embed surface', () => {
    execFileSync('node', [resolve(root, 'scripts/bundle-embed.mjs')], { cwd: root, stdio: 'pipe' });
    const sandbox = { globalThis: null, console: { log () {}, error () {}, warn () {} } };
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(readFileSync(bundlePath, 'utf8'), sandbox, { timeout: 20000 });
    const devices = sandbox.bwDevices();
    // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53):
    // devices.length > 5 -> observed 13.
    assert.ok(Array.isArray(devices) && devices.length > 5, 'returns the device id list');
    assert.ok(devices.includes('pico') && devices.includes('z80'), 'the known ids are present');
});
