import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import SB3Creator from '../src/utils/sb3Creator.js';
import readCowgol from '../src/utils/cowgolToPseudocode.js';

const build = source => { const c = new SB3Creator(); c.parse(source); return c; };
const cc = process.env.CC || 'cc';
const haveCC = spawnSync(cc, ['--version'], {encoding: 'utf8'}).status === 0;
function runC(source) {
    const work = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-riscv-console-'));
    try {
        fs.writeFileSync(path.join(work, 'main.c'), source);
        const compiled = spawnSync(cc, ['-std=c99', '-Wall', '-Wextra', '-Werror', '-pedantic', '-O2',
            path.join(work, 'main.c'), '-o', path.join(work, 'program')], {encoding: 'utf8'});
        assert.equal(compiled.status, 0, compiled.stderr);
        return spawnSync(path.join(work, 'program'), [], {encoding: 'utf8', timeout: 2000});
    } finally { fs.rmSync(work, {recursive: true, force: true}); }
}

const PROGRAM = `DEVICE RISCV32
GLOBAL count = 0
GLOBAL text = "001"
WHEN flag clicked:
  REPEAT 3:
    change count by 2
  IF count = 6 THEN:
    say text
  ELSE:
    say "bad count"
  REPEAT UNTIL count > 8:
    change count by 1
  say count
  say -2147483648
  say "Grüße 🌱 # ; \\\" \\\\ ??/"
  stop all
  say "not reached"
`;

test('RISCV32 and aliases retain the declared machine and Cowgol round-trip', () => {
    for (const alias of ['RISCV32', 'RISCV', 'RISC-V', 'RV32']) {
        const c = build(`DEVICE ${alias}\nWHEN flag clicked:\n  say 42\n`);
        assert.equal(c.project.stc.device, 'riscv32');
        const cow = c.generateCowgol();
        assert.equal(cow.ok, true, cow.reasons.join('; '));
        const read = readCowgol(cow.cowgol);
        assert.equal(read.ok, true, read.reasons.join('; '));
        const again = build(read.pseudocode);
        assert.equal(again.project.stc.device, 'riscv32');
        assert.deepEqual(again.checkIntegrity(), []);
        assert.equal(again.generateRiscvC().ok, true);
    }
});

test('console C has a structured target, real entry point and block line map', () => {
    const c = build(PROGRAM), result = c.generateRiscvC();
    assert.equal(result.ok, true, result.reasons.join('; '));
    assert.equal(result.target, 'riscv32-gcc');
    assert.equal(result.profile, 'int32-console');
    assert.match(result.c, /int main\(void\)/);
    assert.doesNotMatch(result.c, /scratch_\w+|8051|__sfr|BW_SIO/);
    assert.equal(c.generateC(), result.c);
    assert.equal(c.generateC(JSON.parse(JSON.stringify(c.project)), {debug: true}), result.c);
    const unassigned = build('WHEN flag clicked:\n  say 42\n');
    assert.match(unassigned.generateC(undefined, {device: 'riscv32'}), /checked int32 RISC-V console C/);
    const lines = result.c.split('\n');
    for (const [line, id] of Object.entries(result.lineMap)) {
        assert.ok(lines[Number(line) - 1].trim());
        assert.ok(c.project.targets.some(t => t.blocks[id]));
    }
    assert.ok(Object.keys(result.lineMap).length > 12);
});

test('emitted console program executes its arithmetic, control flow, text and stop', {skip: !haveCC}, () => {
    const result = build(PROGRAM).generateRiscvC();
    assert.equal(result.ok, true, result.reasons.join('; '));
    const run = runC(result.c);
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, '001\n9\n-2147483648\nGrüße 🌱 # ; " \\ ??/\n');
});

test('Cowgol source imports to executable RV32 console C', {skip: !haveCC}, () => {
    const read = readCowgol(`# @bw-declaration "DEVICE RISCV32"
include "cowgol.coh";
include "brickwright.coh";
var n: int32 := 3;
while n > 0 loop
    bw_print_number(n);
    n := n - 1;
end loop;
bw_print_text("done");
`);
    assert.equal(read.ok, true, read.reasons.join('; '));
    const run = runC(build(read.pseudocode).generateC());
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, '3\n2\n1\ndone\n');
});

test('text-to-text assignment preserves numeric spelling and mixed-type assignment refuses', {skip: !haveCC}, () => {
    const c = build(`DEVICE RISCV32
GLOBAL first = "001"
GLOBAL second = ""
WHEN flag clicked:
  set second to first
  say second
  set first to "42"
  say first
  say second
`);
    const result = c.generateRiscvC();
    assert.equal(result.ok, true, result.reasons.join('; '));
    const run = runC(result.c);
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, '001\n42\n001\n');
    for (const declaration of ['GLOBAL first', 'GLOBAL first = 0']) {
        const mixed = build(`DEVICE RISCV32\n${declaration}\nGLOBAL second = "001"\nWHEN flag clicked:\n  set first to second\n  say first\n`);
        assert.equal(mixed.generateCowgol().ok, false);
        const refused = mixed.generateRiscvC();
        assert.equal(refused.ok, false);
        assert.equal(refused.c, undefined);
        assert.match(refused.reasons.join('; '), /Mixed numeric\/text variable first/);
    }
});

test('int32 intermediate overflow exits before later output, including in a loop', {skip: !haveCC}, () => {
    for (const body of [
        'say (2147483647 + 1)',
        'say (-2147483648 - 1)',
        'say (65536 * 65536)',
        'set n to 2147483646\n  REPEAT 2:\n    change n by 1'
    ]) {
        const result = build(`DEVICE RISCV32\nGLOBAL n = 0\nWHEN flag clicked:\n  ${body}\n  say "wrong"\n`).generateRiscvC();
        assert.equal(result.ok, true, result.reasons.join('; '));
        const run = runC(result.c);
        assert.equal(run.status, 1, run.stderr);
        assert.equal(run.stdout, '');
        assert.match(run.stderr, /signed int32 overflow/);
    }
});

test('conditions short-circuit and signed bit operations preserve all 32 bits', {skip: !haveCC}, () => {
    const c = build(`DEVICE RISCV32
WHEN flag clicked:
  IF (0 = 1) and ((2147483647 + 1) = 0) THEN:
    say "wrong"
  ELSE:
    say "short circuit"
  say ((-1) bitxor 2147483647)
  say ((-2147483648) bitor 1)
  say ((-1) bitand 2147483647)
`);
    const result = c.generateRiscvC();
    assert.equal(result.ok, true, result.reasons.join('; '));
    const run = runC(result.c);
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, 'short circuit\n-2147483648\n-2147483647\n2147483647\n');
});

test('unsupported console operations refuse with no partial C or host-C fallback', () => {
    for (const body of ['wait 1 seconds', 'move 10 steps', 'say x position', 'pen down',
        'say (3 / 2)', 'say 0.5', 'broadcast "hello"']) {
        const c = build(`DEVICE RISCV32\nWHEN flag clicked:\n  ${body}\n`);
        const result = c.generateRiscvC();
        assert.equal(result.ok, false, body);
        assert.equal(result.c, undefined, body);
        assert.ok(result.reasons.length, body);
        assert.throws(() => c.generateC(), error => error.code === 'RISCV_CONSOLE_UNSUPPORTED', body);
    }
    for (const source of ['DEVICE RISCV32\nWHEN flag clicked:\n  say 1\nWHEN flag clicked:\n  say 2\n',
        'DEVICE RISCV32\nLIST numbers = [1, 2]\nWHEN flag clicked:\n  say 3\n',
        'DEVICE RISCV32\nTABLE numbers = 1, 2\nWHEN flag clicked:\n  say 3\n']) {
        assert.equal(build(source).generateRiscvC().ok, false);
    }
});

test('RISCV32 has no invented circuit pins or hardware retarget mappings', () => {
    for (const declaration of ['PIN led = GP0 OUTPUT', 'PIN led = P1.0 OUTPUT',
        'PORT leds = P1 OUTPUT', 'CHIP via = W65C22 AT $6000']) {
        assert.throws(() => build(`DEVICE RISCV32\n${declaration}\nWHEN flag clicked:\n  say 1\n`), /RISC-V console has no GPIO/);
    }
    const hardware = build('DEVICE ARDUINO-UNO\nPIN led = D13 OUTPUT\nWHEN flag clicked:\n  turn on led\n');
    assert.equal(hardware.generateRiscvC().ok, false);
    const moved = SB3Creator.retargetPseudocode(hardware.decompile(), 'riscv32');
    assert.equal(moved.ok, false);
    const consoleOnly = SB3Creator.retargetPseudocode('DEVICE ARDUINO-UNO\nWHEN flag clicked:\n  say 42\n', 'riscv32');
    assert.equal(consoleOnly.ok, true, consoleOnly.reasons.join('; '));
    assert.equal(build(consoleOnly.pseudocode).generateRiscvC().ok, true);
    const bare = SB3Creator.retargetPseudocode('WHEN flag clicked:\n  say 42\n', 'riscv32');
    assert.equal(bare.ok, true, bare.reasons.join('; '));
    assert.equal(build(bare.pseudocode).project.stc.device, 'riscv32');
});

test('CLI retains existing output when RISCV32 conversion refuses', () => {
    const work = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-riscv-cli-'));
    try {
        const input = path.join(work, 'refused.bw'), output = path.join(work, 'keep.c');
        fs.writeFileSync(input, 'DEVICE RISCV32\nWHEN flag clicked:\n  wait 1 seconds\n');
        fs.writeFileSync(output, 'preserve this file\n');
        const cli = spawnSync(process.execPath, ['bin/bw.mjs', 'transpile', input, '--to', 'c', '-o', output], {encoding: 'utf8'});
        assert.notEqual(cli.status, 0);
        assert.match(cli.stderr, /RISC-V console.*timer/);
        assert.equal(fs.readFileSync(output, 'utf8'), 'preserve this file\n');
    } finally { fs.rmSync(work, {recursive: true, force: true}); }
});
