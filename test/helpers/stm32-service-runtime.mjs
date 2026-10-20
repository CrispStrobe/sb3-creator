// Exact MIT startup/linker inputs from the pinned canonical compile service.
// No network acquisition and no replacement for the generated program's main.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const root = new URL('../fixtures/stm32-service/', import.meta.url);
const source = JSON.parse(readFileSync(new URL('provenance.json', root), 'utf8'));
const commit = 'a043daa58c2437f936f94971b3b0695c9c2510cb';
if (source.commit !== commit) throw new Error('STM32 service source pin mismatch');

function checked(name) {
    const expected = source.sourceFiles[name];
    if (!expected) throw new Error(`unregistered STM32 service input: ${name}`);
    const bytes = readFileSync(new URL(name, root));
    if (bytes.length !== expected.bytes || createHash('sha256').update(bytes).digest('hex') !== expected.sha256)
        throw new Error(`STM32 service input changed: ${name}`);
    return bytes;
}

/** Stage the service's exact reset/IRQ adapter and selected flash linker. */
export function stageStm32ServiceRuntime(dir, device) {
    if (!Object.hasOwn(source.targets, device)) throw new Error(`unknown STM32 service target: ${device}`);
    const target = source.targets[device];
    const startup = checked('stm32-startup.S');
    const linker = checked(target.linker);
    checked('LICENSE');
    const startupPath = join(dir, 'stm32-startup.S');
    const linkerPath = join(dir, 'link.ld');
    writeFileSync(startupPath, startup);
    writeFileSync(linkerPath, linker);
    return { startup: startupPath, linker: linkerPath, cpu: target.cpu,
        flags: [`-DBW_VECTOR_COUNT=${target.vectors}`, '-Wl,--entry=Reset_Handler'] };
}
