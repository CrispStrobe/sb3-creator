// The `bw` CLI's transpile path, and the regression that brought it here:
// `bw transpile --to c` and `bw compile` disagreed on the same STM32 input.
// transpile passed no options to generateC, so it took the straight-line
// (non-scheduler) path — which on the ARM core reads the RP2040's TIMER
// (BW_TIMER_TIMELR), the wrong silicon for an STM32F030. compile passes
// {debug:true}, forcing the TIM3-tick scheduler. Two fixes closed it:
//   1. transpile --to c now also passes {debug:true};
//   2. STM32 forces the cooperative scheduler for any script (like a
//      MATRIX8X8), so even a release/straight-line caller cannot reach the
//      pico-timebase branch.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bw = path.join(root, 'bin', 'bw.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-'));
const run = (args) => execFileSync('node', [bw, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const STM32_BLINK = `DEVICE STM32F030
PIN led = PA0 OUTPUT

WHEN flag clicked:
  forever:
    set led to HIGH
    wait 500 ms
    set led to LOW
    wait 500 ms`;

test('bw transpile --to c for STM32 uses the TIM3 timebase, not the pico TIMER', () => {
    const f = path.join(tmp, 'blink.bw');
    fs.writeFileSync(f, STM32_BLINK);
    const c = run(['transpile', f, '--to', 'c']);
    assert.doesNotMatch(c, /BW_TIMER_TIME[LH]R/, 'must not leak the RP2040 microsecond timer');
    assert.match(c, /TIM3/, 'STM32 timebase is TIM3');
    assert.match(c, /bw_tick_irq|IRQ16/, 'the tick ISR is present (scheduler path)');
});

test('bw transpile --to c matches bw compile: both force the scheduler (debug:true)', () => {
    const f = path.join(tmp, 'blink2.bw');
    fs.writeFileSync(f, STM32_BLINK);
    const c = run(['transpile', f, '--to', 'c']);
    // The @bw round-trip markers and per-task state only exist on the
    // scheduler path; their presence is the observable proof debug:true is on.
    assert.match(c, /@bw yield/, 'round-trip markers present (debug build)');
    assert.match(c, /bw_task0/, 'cooperative task emitted, not a straight-line main');
});

test('bw transpile --to c still works for a non-ARM target (pico stays correct)', () => {
    const f = path.join(tmp, 'pico.bw');
    fs.writeFileSync(f, `DEVICE PICO\nPIN led = GP15 OUTPUT\n\nWHEN flag clicked:\n  forever:\n    set led to HIGH\n    wait 500 ms\n    set led to LOW\n    wait 500 ms`);
    const c = run(['transpile', f, '--to', 'c']);
    // The pico legitimately reads its hardware microsecond TIMER — the very
    // registers STM32 must NOT use. This guards against "fix" over-reach.
    assert.match(c, /BW_TIMER_TIME[LH]R|RP2040|SIO/, 'pico keeps its own timebase');
});

test('bw flash --engine rust passes the native flasher its flash subcommand', () => {
    const fake = path.join(tmp, 'fake-stcbsl.mjs');
    const argsFile = path.join(tmp, 'native-args.json');
    const hex = path.join(tmp, 'blink.hex');
    fs.writeFileSync(hex, ':00000001FF\n');
    fs.writeFileSync(fake, `#!/usr/bin/env node
import fs from 'node:fs';
if (process.argv[2] === '--help') process.exit(0);
fs.writeFileSync(${JSON.stringify(argsFile)}, JSON.stringify(process.argv.slice(2)));
`);
    fs.chmodSync(fake, 0o755);

    const out = run(['flash', hex, '--device', 'stc89c52rc',
        '--port', '/dev/cu.fake', '--engine', 'rust', '--rust-bin', fake]);
    assert.match(out, /flashed via stcbsl/);
    assert.deepEqual(JSON.parse(fs.readFileSync(argsFile, 'utf8')),
        ['--port', '/dev/cu.fake', 'flash', hex]);
});
