// These tests build actual .COM, .EXE, ELF, ROM and HEX artifacts through the pinned
// service, then execute them on the CPU oracles. No hosted HTTP source upload.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import SB3Creator from '../src/utils/sb3Creator.js';
import {boundaryCase, boundaryPrograms, overflowCases, controlCase} from './fixtures/cowgol/native-cases.mjs';

const service = process.env.COWGOL_STC_COMPILER;
const bundle = process.env.COWGOL_BUNDLE;
const board = process.env.COWGOL_BW_BOARD;
const avrRunner = process.env.COWGOL_AVR_RUNNER;
const avrRoot = process.env.AVR8JS_ROOT;
const required = process.env.REQUIRE_COWGOL_NATIVE_MACHINES === '1';
const boardPin = 'd21d6d8b819263eb08231134b7556efa82289a90';
const targets = ['z80-cpm', 'i8080-cpm', 'dos', 'eater6502', 'riscv32', 'atmega328p', 'arduino-nano', 'atmega168p'];
const isAvr = target => ['atmega328p', 'arduino-nano', 'atmega168p'].includes(target);
const binaryExtension = target => target === 'dos' ? 'exe' : target === 'eater6502' ? 'bin' :
    target === 'riscv32' ? 'elf' : isAvr(target) ? 'hex' : 'com';
const usesBoard = target => target === 'eater6502' || target === 'riscv32';
const oracle = target => process.env[target === 'dos' ? 'COWGOL_EMU2' : 'COWGOL_CPMEMU'];
const prerequisites = target => [
    ['COWGOL_STC_COMPILER', service && path.join(service, 'cowgol_build.py')],
    ['COWGOL_BUNDLE', bundle && path.join(bundle, 'manifest.json')],
    ...(isAvr(target) ? [['COWGOL_AVR_RUNNER', avrRunner],
        ['AVR8JS_ROOT', avrRoot && path.join(avrRoot, 'package.json')]] :
        usesBoard(target) ? [['COWGOL_BW_BOARD', board && path.join(board,
        target === 'eater6502' ? 'src/m6502-machine.js' : 'src/riscv32-machine.js')]] :
        [[target === 'dos' ? 'COWGOL_EMU2' : 'COWGOL_CPMEMU', oracle(target)]])
].filter(([, file]) => !file || !fs.existsSync(file)).map(([name]) => name);
const gate = target => ({skip: !required && prerequisites(target).length ?
    `Set ${prerequisites(target).join(', ')} for native machine execution` : false});

async function machine(t, target) {
    assert.deepEqual(prerequisites(target), [], 'CI requires the pinned compiler bundle and native CPU oracles');
    if (usesBoard(target)) {
        assert.equal(execFileSync('git', ['-C', board, 'rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(), boardPin);
    }
    if (isAvr(target)) {
        assert.equal(JSON.parse(fs.readFileSync(path.join(avrRoot, 'package.json'), 'utf8')).version, '0.21.1');
    }
    const work = fs.mkdtempSync(path.join(process.cwd(), '.cowgol-native-machine-'));
    t.after(() => fs.rmSync(work, {recursive: true, force: true}));
    const RiscV32Machine = target === 'riscv32' ?
        (await import(pathToFileURL(path.resolve(board, 'src/riscv32-machine.js')).href)).RiscV32Machine : null;
    let serial = 0;
    return (source, {overflow = false, ...options} = {}) => {
        const creator = new SB3Creator(); creator.parse(source);
        const generated = creator.generateCowgol(undefined, {target});
        assert.equal(generated.ok, true, generated.reasons.join('; '));
        const cow = path.join(work, `case${serial}.cow`);
        const binary = path.join(work, `case${serial++}.${binaryExtension(target)}`);
        fs.writeFileSync(cow, generated.cowgol);
        const compiled = JSON.parse(execFileSync(process.env.PYTHON || 'python3', ['-c', `
import base64, json, os, pathlib, sys
from types import SimpleNamespace
sys.path.insert(0, sys.argv[1])
import cowgol_build
if sys.argv[3] == "riscv32" and os.environ.get("COWGOL_RISCV_GCC_STAGE"):
    import app
    app.RISCV_GCC_STAGE = os.environ["COWGOL_RISCV_GCC_STAGE"]
    app.RISCV_GCC_STAGE_BIN = str(pathlib.Path(app.RISCV_GCC_STAGE) / "bin")
if sys.argv[3] in ("atmega328p", "arduino-nano", "atmega168p") and os.environ.get("COWGOL_AVR_GCC_ROOT"):
    import app
    app.stage_avr = lambda: str(pathlib.Path(os.environ["COWGOL_AVR_GCC_ROOT"]) / "bin")
elif sys.argv[3] in ("atmega328p", "arduino-nano", "atmega168p") and os.environ.get("COWGOL_AVR_STAGE"):
    import app
    app.AVR_STAGE = os.environ["COWGOL_AVR_STAGE"]
    app.AVR_STAGE_BIN = str(pathlib.Path(app.AVR_STAGE) / "bin")
    app._AVR_STAMP = str(pathlib.Path(app.AVR_STAGE) / ".bundle-fingerprint")
request = SimpleNamespace(code=pathlib.Path(sys.argv[2]).read_text(), language="cowgol",
    target=sys.argv[3], format="elf" if sys.argv[3] == "riscv32" else "hex" if sys.argv[3] in ("atmega328p", "arduino-nano", "atmega168p") else "bin",
    options=[], defines={}, disassemble=False, symbols=False)
result = cowgol_build.build_cowgol(request)
if not result.get("success"):
    raise RuntimeError(json.dumps(result))
pathlib.Path(sys.argv[4]).write_bytes(base64.b64decode(result["base64"], validate=True))
print(json.dumps({key: result.get(key) for key in ("target", "toolchain", "compiler_commit", "bytes", "memory_end", "image", "memory_layout")}))
`, path.resolve(service), cow, target, binary], {encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024}));
        assert.equal(compiled.target, target);
        assert.equal(fs.statSync(binary).size, compiled.bytes);
        assert.match(compiled.compiler_commit, /^[a-f0-9]{40}$/);
        if (isAvr(target)) {
            const layout = compiled.memory_layout;
            assert.equal(compiled.toolchain, `cowgol-${target}`);
            const chip168 = target === 'atmega168p';
            const expectedMcu = chip168 ? 'atmega168p' : 'atmega328p';
            assert.equal(layout.mcu, expectedMcu);
            assert.equal(layout.flash_limit, chip168 ? 16384 : target === 'arduino-nano' ? 30720 : 32256);
            assert.ok(layout.flash_end <= layout.flash_limit, 'image must respect the exact chip and bootloader boundary');
            assert.equal(layout.stack_start, chip168 ? 0x300 : 0x700);
            assert.equal(layout.ram_end, chip168 ? 0x500 : 0x900);
            assert.equal(layout.heap_end - layout.heap_start, chip168 ? 128 : 512);
            assert.ok(layout.bss_end <= layout.stack_start);
            const layoutFile = `${binary}.layout.json`;
            fs.writeFileSync(layoutFile, JSON.stringify(layout));
            const observed = JSON.parse(execFileSync(process.execPath,
                [avrRunner, binary, layoutFile, JSON.stringify(options)], {encoding: 'utf8', timeout: 20000}));
            assert.ok(observed.runs.length);
            for (const run of observed.runs) {
                assert.equal(run.mcu, expectedMcu);
                assert.equal(run.flashSize, chip168 ? 16384 : 32768);
                assert.equal(run.sramSize, chip168 ? 1024 : 2048);
                assert.equal(run.stopped, true, 'generated AVR program must halt within its cycle budget');
                assert.equal(run.status, overflow ? 1 : 0, run.text);
                assert.equal(run.flashUnchanged, true);
                assert.ok(run.minSP >= layout.stack_start, 'generated program must retain the qualified SRAM stack area');
                assert.deepEqual(run.uart, {ubrr: 103, ucsrb: 24, ucsrc: 6});
            }
            return {output: observed.runs[0].text, observed, compiled};
        }
        if (target === 'riscv32') {
            assert.equal(fs.readFileSync(binary).subarray(0, 4).toString('binary'), '\x7fELF');
            const image = compiled.image;
            assert.ok(image && Number.isSafeInteger(image.entry) && image.segments.length);
            const machine = new RiscV32Machine({memSize: 1 << 22, resetPc: image.entry});
            for (const segment of image.segments) machine.load(Buffer.from(segment.bytes, 'base64'), segment.addr);
            machine.run(50_000_000);
            assert.equal(machine.halted, true, 'native-profile RV32 program must halt within its instruction budget');
            assert.equal(machine.exitCode, overflow ? 1 : 0, machine.output);
            return {output: machine.output, compiled};
        }
        if (target === 'eater6502') {
            assert.equal(compiled.bytes, 32768);
            const observed = JSON.parse(execFileSync(process.execPath,
                [path.join(service, 'scripts/run-cowgol-eater6502.mjs'), binary, JSON.stringify(options)],
                {encoding: 'utf8', timeout: 20000}));
            assert.equal(observed.romUnchanged, true);
            assert.deepEqual(observed.romWrites, [], 'native generated code must never write ROM');
            assert.ok(observed.runs.every(run => run.stopped && run.status === (overflow ? 1 : 0)), JSON.stringify(observed));
            return {output: observed.runs[0].text, observed, compiled};
        }
        const result = spawnSync(oracle(target), [binary], {encoding: 'utf8', timeout: 10000});
        assert.ifError(result.error);
        // CP/M ExitWithError returns to the OS without a portable error code.
        // Its observable failure contract is the diagnostic plus immediate stop.
        assert.equal(result.status, overflow && target === 'dos' ? 1 : 0, result.stdout + result.stderr);
        return {output: result.stdout.replace(/\r\n/g, '\n'), compiled};
    };
}

for (const target of targets) {
    test(`${target}: generated int32 boundary arithmetic executes on the native CPU`, gate(target), async t => {
        const run = await machine(t, target);
        // Every operand/sign case still executes. The 1 KiB chip uses one
        // operation per image, keeping compiler temporaries within real SRAM.
        const fixtures = target === 'atmega168p' ? boundaryPrograms(1) : [boundaryCase()];
        for (const fixture of fixtures) {
            const result = run(fixture.source);
            assert.equal(result.output, fixture.output);
        }
    });
    test(`${target}: generated overflow checks stop before wrapping or later output`, gate(target), async t => {
        const run = await machine(t, target);
        for (const fixture of overflowCases) {
            assert.equal(run(fixture.source, {overflow: true}).output, fixture.output, fixture.name);
        }
    });
    test(`${target}: generated nested calls, lazy conditions and loops execute`, gate(target), async t => {
        const run = await machine(t, target);
        assert.equal(run(controlCase.source).output, controlCase.output);
    });
}

test('Eater generated PB7 GPIO uses native latch, input and reset behavior', gate('eater6502'), async t => {
    const source = `DEVICE EATER6502
PIN led = PB7 OUTPUT ACTIVE LOW
PIN input = PA0 INPUT
WHEN flag clicked:
  turn on led
  toggle led
  say read input
  say "GPIO done"
`;
    const run = await machine(t, 'eater6502');
    const {observed} = run(source, {inA: 1, inB: 0, runs: 2});
    assert.deepEqual(observed.runs.map(run => run.text), ['1\nGPIO done\n', '1\nGPIO done\n']);
    assert.deepEqual(observed.via, {ora: 0, orb: 0x80, ddra: 0, ddrb: 0x80});
});

for (const [target, device] of [['atmega328p', 'UNO'], ['arduino-nano', 'NANO'], ['atmega168p', 'ATMEGA168P']]) {
    test(`${target} generated GPIO preserves active-low input, output latch and cold initialization`, gate(target), async t => {
        const source = `DEVICE ${device}
PIN led = D13 OUTPUT ACTIVE LOW
PIN button = A5 INPUT ACTIVE LOW
GLOBAL count = 6
WHEN flag clicked:
  turn on led
  toggle led
  say read button
  change count by 2
  say count
  say "GPIO done"
`;
        const run = await machine(t, target);
        const {observed} = run(source, {pins: {'19': false}, runs: 2});
        assert.deepEqual(observed.runs.map(run => run.text), ['1\n8\nGPIO done\n', '1\n8\nGPIO done\n']);
        for (const run of observed.runs) {
            assert.equal(run.registers.B.ddr & 32, 32);
            assert.equal(run.registers.B.port & 32, 32);
            assert.equal(run.registers.C.ddr & 32, 0);
            assert.equal(run.registers.C.port & 32, 32);
            assert.equal(run.registers.C.pin & 32, 0);
        }
    });

    test(`${target} generated waits hold a real GPIO pulse for the requested milliseconds`, gate(target), async t => {
        const run = await machine(t, target);
        for (const milliseconds of [0, 1, 7]) {
            const source = `DEVICE ${device}
PIN led = D13 OUTPUT
WHEN flag clicked:
  turn on led
  wait ${milliseconds / 1000} seconds
  turn off led
  say "blink done"
`;
            const {observed} = run(source, {runs: 2});
            for (const observedRun of observed.runs) {
                assert.equal(observedRun.text, 'blink done\n');
                const edges = observedRun.gpio.filter(edge => edge.bank === 'B' &&
                    (edge.ddr & 32) && ((edge.value ^ edge.previous) & 32));
                assert.equal(edges.length, 2);
                assert.equal(edges[0].value & 32, 32);
                assert.equal(edges[1].value & 32, 0);
                const cycles = edges[1].cycle - edges[0].cycle;
                assert.ok(cycles >= milliseconds * 16000,
                    `GPIO pulse ${cycles} cycles is shorter than ${milliseconds} ms at 16 MHz`);
                assert.ok(cycles <= milliseconds * 16050 + 1000,
                    `GPIO pulse ${cycles} cycles exceeds the qualified delay plus call overhead`);
            }
        }
    });
}
