#!/usr/bin/env node

import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename, dirname, join, relative} from 'node:path';
import {spawnSync} from 'node:child_process';
import SB3Creator from '../src/utils/sb3Creator.js';

const ROOT = new URL('..', import.meta.url).pathname;
const EXPECTED_TOTAL = 80;
const REPRODUCERS = new Set([
    'arduino-02-blink-without-delay',
    'arduino-02-button',
    'arduino-02-debounce',
    'arduino-08-string-addition',
    'arduino-sk-p09-motorized-pinwheel'
]);
const WAIT_CONTROL = 'arduino-01-blink';
const MCU = new Map([
    ['ARDUINO-UNO', 'atmega328p'],
    ['ARDUINO-NANO', 'atmega328p'],
    ['ARDUINO-MEGA', 'atmega2560'],
    ['ATMEGA168P', 'atmega168p'],
    ['ATTINY88', 'attiny88']
]);

function run (command, args, options = {}) {
    return spawnSync(command, args, {encoding: 'utf8', ...options});
}

const compiler = process.env.AVR_GCC || 'avr-gcc';
const version = run(compiler, ['--version']);
if (version.error || version.status !== 0) {
    console.error(`cannot run ${compiler}: ${version.error?.message || version.stderr}`);
    process.exit(2);
}

const tracked = run('git', ['ls-files', 'examples/**/program.bw'], {cwd: ROOT});
if (tracked.status !== 0) throw new Error(tracked.stderr);
const programs = tracked.stdout.trim().split('\n').filter(Boolean).map(file => {
    const source = readFileSync(join(ROOT, file), 'utf8');
    const device = /^DEVICE\s+(\S+)/m.exec(source)?.[1];
    return {file, source, device, id: basename(dirname(file))};
}).filter(row => MCU.has(row.device)).sort((a, b) => a.file.localeCompare(b.file));

if (programs.length !== EXPECTED_TOTAL) {
    throw new Error(`AVR corpus denominator changed: expected ${EXPECTED_TOTAL}, found ${programs.length}`);
}
for (const id of [...REPRODUCERS, WAIT_CONTROL]) {
    if (!programs.some(row => row.id === id)) throw new Error(`named control disappeared: ${id}`);
}

const work = mkdtempSync(join(tmpdir(), 'bw-avr-census-'));
const failures = [];
const counts = new Map();
let linked = 0;
try {
    for (const row of programs) {
        counts.set(row.device, (counts.get(row.device) || 0) + 1);
        const creator = new SB3Creator();
        creator.parse(row.source);
        // A few Arduino imports have no declared physical pin, so generateC's
        // normal auto mode quite correctly chooses runnable host C. This gate
        // is a DEVICE census: force the same bare-metal target selected by the
        // compiler UI when the user asks for firmware.
        const code = creator.generateC(undefined, {debug: true, target: 'device'});
        if (!/#include <avr\/io\.h>/.test(code) || /\bTMOD\b|__interrupt/.test(code)) {
            throw new Error(`${row.id}: AVR census emitted cross-target C`);
        }
        const stem = row.id.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const sourcePath = join(work, `${stem}.c`);
        const elfPath = join(work, `${stem}.elf`);
        writeFileSync(sourcePath, code);
        const result = run(compiler, [
            '-std=gnu11', '-Os', '-Wall', `-mmcu=${MCU.get(row.device)}`,
            sourcePath, '-o', elfPath
        ]);
        if (result.status === 0) {
            linked++;
            process.stdout.write('.');
        } else {
            failures.push({
                id: row.id,
                file: relative(ROOT, join(ROOT, row.file)),
                device: row.device,
                diagnostic: `${result.stdout}${result.stderr}`.trim()
            });
            process.stdout.write('F');
        }
    }
} finally {
    rmSync(work, {recursive: true, force: true});
}

console.log(`\n${compiler}: ${version.stdout.split('\n')[0]}`);
console.log(`targets: ${[...counts].map(([device, count]) => `${device}=${count}`).join(', ')}`);
for (const failure of failures) {
    console.error(`FAIL ${failure.id} (${failure.device}, ${failure.file})\n${failure.diagnostic}`);
}
console.log(`AVR native census: ${linked}/${programs.length} linked; ${failures.length} failed`);
if (failures.length) process.exitCode = 1;
