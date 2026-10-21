import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stageStm32ServiceRuntime } from './helpers/stm32-service-runtime.mjs';

const original = name => readFileSync(new URL(`./fixtures/stm32-service/${name}`, import.meta.url));

test('all STM32 chains stage the exact pinned service startup and selected linker', () => {
    for (const [device, cpu, count] of [
        ['stm32f030', 'cortex-m0', 48], ['stm32g030', 'cortex-m0plus', 48], ['stm32f103', 'cortex-m3', 76],
    ]) {
        const dir = mkdtempSync(join(tmpdir(), 'bw-service-startup-'));
        try {
            const runtime = stageStm32ServiceRuntime(dir, device);
            assert.equal(runtime.cpu, cpu);
            assert.deepEqual(runtime.flags, [`-DBW_VECTOR_COUNT=${count}`, '-Wl,--entry=Reset_Handler']);
            assert.deepEqual(readFileSync(runtime.startup), original('stm32-startup.S'));
            assert.deepEqual(readFileSync(runtime.linker), original(`${device}-flash.ld`));
            assert.deepEqual(readdirSync(dir).sort(), ['link.ld', 'stm32-startup.S']);
        } finally { rmSync(dir, { recursive: true, force: true }); }
    }
});

test('non-STM32 and inherited target names cannot stage a reset adapter', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bw-service-refusal-'));
    try {
        for (const device of ['pico', 'stc15f2k60s2', 'constructor', '__proto__'])
            assert.throws(() => stageStm32ServiceRuntime(dir, device), /unknown STM32 service target/);
        assert.deepEqual(readdirSync(dir), []);
    } finally { rmSync(dir, { recursive: true, force: true }); }
});
