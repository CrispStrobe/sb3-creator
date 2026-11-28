import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import read from '../src/utils/cowgolToPseudocode.js';
import {cowgolTargets} from '../src/utils/cowgol.js';

const build = source => { const creator = new SB3Creator(); creator.parse(source); return creator; };
const generate = (source, target) => build(source).generateCowgol(undefined, {target});
const targets = ['z80-cpm', 'i8080-cpm', 'dos', 'riscv32', 'eater6502', 'atmega328p', 'arduino-nano'];

test('native profiles qualify declaration-free console Blocks for every actual compiler target', () => {
    for (const target of targets) {
        const result = generate('GLOBAL n = 1\nWHEN flag clicked:\n  REPEAT 3:\n    change n by 2\n  say n\n  stop all\n', target);
        assert.equal(result.ok, true, result.reasons.join('; '));
        assert.equal(result.profile, 'native-int32');
        assert.equal(result.target, target);
        assert.match(result.cowgol, /bw_checked_add\(bw_v0, 2\)/);
        assert.match(result.cowgol, /ExitWithError\(\)/);
        assert.ok(result.warnings.some(warning => warning.includes('checked signed int32')));
    }
});

test('native targets reject incompatible device declarations without executable output', () => {
    for (const [target, device] of [['z80-cpm', 'i8086'], ['i8080-cpm', 'eater6502'],
        ['dos', 'z80'], ['riscv32', 'arduino-uno'], ['eater6502', 'atmega328p'], ['atmega328p', 'arduino-nano'], ['arduino-nano', 'arduino-uno'], ['arduino-nano', 'atmega168p']]) {
        const result = generate(`DEVICE ${device}\nWHEN flag clicked:\n  say 1\n`, target);
        assert.equal(result.ok, false, target);
        assert.equal(result.cowgol, undefined);
        assert.match(result.reasons.join('; '), /cannot run DEVICE/);
    }
    for (const [target, device] of [['z80-cpm', 'z80'], ['i8080-cpm', 'z80'], ['dos', '8086'],
        ['riscv32', 'rv32'], ['eater6502', 'eater6502'], ['atmega328p', 'atmega328p'], ['atmega328p', 'uno'], ['arduino-nano', 'nano'], ['arduino-nano', 'arduino-nano']]) {
        const result = generate(`DEVICE ${device}\nWHEN flag clicked:\n  say 1\n`, target);
        assert.equal(result.ok, true, result.reasons.join('; '));
    }
    for (const target of ['arm', '__proto__', 'constructor', 'toString', null]) {
        const result = generate('WHEN flag clicked:\n  say 1\n', target);
        assert.equal(result.ok, false);
        assert.equal(result.cowgol, undefined);
        assert.match(result.reasons.join('; '), /Unknown native Cowgol target/);
    }
});

test('native profiles reject canvas and unsupported language semantics before compilation', () => {
    for (const target of targets) for (const statement of [
        'clear', 'move 10 steps', 'say x position',
        'say (3 / 2)', 'say 0.5', 'broadcast "go"'
    ]) {
        const result = generate(`WHEN flag clicked:\n  ${statement}\n`, target);
        assert.equal(result.ok, false, `${target}: ${statement}`);
        assert.equal(result.cowgol, undefined);
        assert.ok(result.diagnostics.length);
    }
    for (const target of targets) {
        const creator = build('WHEN flag clicked:\n  say 1\n');
        creator.project.stc = {tables: [{name: 'values', values: [1, 2]}]};
        assert.equal(creator.generateCowgol(undefined, {target}).ok, false);
    }
});

test('native literal waits use the qualified AVR board runtimes only', () => {
    const source = 'DEVICE UNO\nWHEN flag clicked:\n  wait 0.025 seconds\n  wait 0 seconds\n  say 42\n';
    const result = generate(source, 'atmega328p');
    assert.equal(result.ok, true, result.reasons.join('; '));
    assert.match(result.cowgol, /bw_delay\(25\)/);
    assert.match(result.cowgol, /bw_delay\(0\)/);
    for (const target of targets.filter(target => !['atmega328p', 'arduino-nano'].includes(target))) {
        const refused = generate('WHEN flag clicked:\n  wait 0.01 seconds\n', target);
        assert.equal(refused.ok, false);
        assert.equal(refused.cowgol, undefined);
        assert.match(refused.reasons.join('; '), /no qualified timer/);
    }
    for (const duration of ['-1', '2147483.648', 'seconds']) {
        const refused = generate(`GLOBAL seconds = 1\nWHEN flag clicked:\n  wait ${duration} seconds\n`, 'atmega328p');
        assert.equal(refused.ok, false, duration);
        assert.equal(refused.cowgol, undefined);
        assert.match(refused.reasons.join('; '), /literal duration/);
    }
    const authored = build('GLOBAL delaySeconds = 7\nWHEN flag clicked:\n  wait delaySeconds seconds\n');
    const target = authored.project.targets[0];
    const variable = Object.values(target.variables)[0];
    variable[0] = '1';
    const wait = Object.values(target.blocks).find(block => block.opcode === 'control_wait');
    wait.inputs.DURATION[1][1] = '1';
    for (const options of [{target: 'atmega328p'}, {}]) {
        const refused = authored.generateCowgol(undefined, options);
        assert.equal(refused.ok, false, 'a numeric variable name must not become a literal wait');
        assert.equal(refused.cowgol, undefined);
        assert.match(refused.reasons.join('; '), /literal duration/);
    }
});

test('native target metadata describes generator contracts without sharing mutable state', () => {
    const metadata = cowgolTargets();
    assert.deepEqual(metadata.map(item => item.target), targets);
    assert.ok(metadata.every(item => item.profile === 'native-int32' && item.capabilities.console));
    const uno = metadata.find(item => item.target === 'atmega328p');
    assert.deepEqual(uno.devices, ['atmega328p', 'arduino-uno']);
    assert.equal(uno.clock, 16000000);
    assert.equal(uno.capabilities.delay, true);
    assert.equal(uno.capabilities.pullups, true);
    const nano = metadata.find(item => item.target === 'arduino-nano');
    assert.deepEqual(nano.devices, ['arduino-nano']);
    assert.equal(nano.clock, 16000000);
    assert.equal(nano.mcu, 'atmega328p');
    assert.deepEqual(nano.memory, {flashLimit: 30720, ramBytes: 2048, heapBytes: 512, stackReserve: 512});
    assert.equal(uno.memory.flashLimit, 32256);
    assert.equal(nano.capabilities.delay, true);
    assert.equal(nano.capabilities.pullups, true);
    assert.ok(metadata.filter(item => item !== uno && item !== nano).every(item => !item.capabilities.delay));
    nano.memory.flashLimit = 32768;
    assert.equal(cowgolTargets().find(item => item.target === 'arduino-nano').memory.flashLimit, 30720);
    uno.devices.push('arduino-nano'); uno.capabilities.canvas = true;
    assert.equal(generate('DEVICE NANO\nWHEN flag clicked:\n  say 1\n', 'atmega328p').ok, false);
    assert.equal(cowgolTargets().find(item => item.target === 'atmega328p').capabilities.canvas, false);
});

test('console-only native profiles refuse GPIO and peripheral metadata even when unused', () => {
    for (const [target, source] of [
        ['z80-cpm', 'DEVICE Z80\nPIN led = OUT0 OUTPUT'],
        ['i8080-cpm', 'DEVICE Z80\nPIN button = IN0 INPUT'],
        ['dos', 'DEVICE I8086\nPIN led = P1.0 OUTPUT']
    ]) {
        const result = generate(`${source}\nWHEN flag clicked:\n  say 1\n`, target);
        assert.equal(result.ok, false);
        assert.equal(result.cowgol, undefined);
        assert.match(result.reasons.join('; '), /console output, not digital GPIO/);
    }
    const creator = build('DEVICE EATER6502\nWHEN flag clicked:\n  say 1\n');
    creator.project.stc.machine = {regions: [{kind: 'rom', start: 0x9000, end: 0xffff}]};
    assert.match(creator.generateCowgol(undefined, {target: 'eater6502'}).reasons.join('; '), /custom memory map/);
});

test('native Eater GPIO includes PB7 and active-low outputs while ordinary conversion remains bounded', () => {
    const creator = build('DEVICE EATER6502\nPIN led = PB7 OUTPUT ACTIVE LOW\nPIN button = PA0 INPUT\nWHEN flag clicked:\n  turn on led\n  toggle led\n  IF read button = 1 THEN:\n    set led high\n');
    const result = creator.generateCowgol(undefined, {target: 'eater6502'});
    assert.equal(result.ok, true, result.reasons.join('; '));
    assert.match(result.cowgol, /bw_pin_mode\(15, 1\)/);
    assert.match(result.cowgol, /bw_digital_write\(15, 0\)/);
    assert.match(result.cowgol, /bw_digital_toggle\(15\)/);
    assert.equal(creator.generateCowgol().ok, false);
    const input = generate('DEVICE EATER6502\nPIN button = PA0 INPUT ACTIVE LOW\nWHEN flag clicked:\n  say read button\n', 'eater6502');
    assert.equal(input.ok, false);
    assert.match(input.reasons.join('; '), /input pull-up/);
    const clock = generate('DEVICE EATER6502\nCLOCK 2000000\nWHEN flag clicked:\n  say 1\n', 'eater6502');
    assert.equal(clock.ok, false);
    assert.match(clock.reasons.join('; '), /CLOCK 1000000/);
});

test('native ATmega328P uses real GPIO, pull-ups, canonical clock and reserved UART pins', () => {
    const result = generate('DEVICE UNO\nPIN led = D13 OUTPUT ACTIVE LOW\nPIN button = A5 INPUT ACTIVE LOW\nWHEN flag clicked:\n  turn on led\n  toggle led\n  say read button\n', 'atmega328p');
    assert.equal(result.ok, true, result.reasons.join('; '));
    assert.match(result.cowgol, /bw_pin_mode\(19, 2\)/);
    assert.match(result.cowgol, /bw_digital_write\(13, 0\)/);
    assert.match(result.cowgol, /bw_print_number\(\(1 - bw_digital_read\(19\)\)\)/);
    for (const pin of ['D0', 'D1']) {
        const refused = generate(`DEVICE UNO\nPIN serial = ${pin} OUTPUT\nWHEN flag clicked:\n  turn on serial\n`, 'atmega328p');
        assert.equal(refused.ok, false);
        assert.match(refused.reasons.join('; '), /reserves D0\/D1/);
    }
    assert.equal(generate('DEVICE UNO\nCLOCK 8000000\nWHEN flag clicked:\n  say 1\n', 'atmega328p').ok, false);
});

test('native helpers preserve block line mappings and default reversible source output', () => {
    const creator = build('GLOBAL n = 7\nWHEN flag clicked:\n  change n by 1\n  say ((n + 2) * (n - 3))\n');
    const result = creator.generateCowgol(undefined, {target: 'dos'});
    assert.equal(result.ok, true, result.reasons.join('; '));
    const lines = result.cowgol.split('\n');
    const blocks = Object.assign({}, ...creator.project.targets.map(target => target.blocks));
    const outputLine = lines.findIndex(line => line.startsWith('bw_print_number(')) + 1;
    assert.equal(blocks[result.lineMap[outputLine]].opcode, 'looks_say');
    assert.match(lines[outputLine - 1], /bw_checked_mul\(bw_checked_add\(bw_v0, 2\), bw_checked_sub\(bw_v0, 3\)\)/);
    const original = creator.generateCowgol();
    assert.equal(original.profile, 'host-int32');
    assert.doesNotMatch(original.cowgol, /bw_checked_/);
    assert.equal(read(original.cowgol).ok, true);
});

test('classic Nano has an explicit board profile with bounded digital pins and waits', () => {
    const source = 'DEVICE NANO\nCLOCK 16000000\nPIN led = D13 OUTPUT ACTIVE LOW\nPIN button = A5 INPUT ACTIVE LOW\nWHEN flag clicked:\n  turn on led\n  wait 0.007 seconds\n  toggle led\n  say read button\n';
    const result = generate(source, 'arduino-nano');
    assert.equal(result.ok, true, result.reasons.join('; '));
    assert.match(result.cowgol, /DEVICE ARDUINO-NANO/);
    assert.match(result.cowgol, /bw_pin_mode\(19, 2\)/);
    assert.match(result.cowgol, /bw_delay\(7\)/);
    assert.match(result.cowgol, /bw_digital_write\(13, 0\)/);
    for (const pin of ['D0', 'D1']) {
        const refused = generate(`DEVICE NANO\nPIN serial = ${pin} OUTPUT\nWHEN flag clicked:\n  say 1\n`, 'arduino-nano');
        assert.equal(refused.ok, false);
        assert.match(refused.reasons.join('; '), /reserves D0\/D1/);
    }
    for (const pin of ['A6', 'A7']) {
        assert.throws(() => build(`DEVICE NANO\nPIN input = ${pin} INPUT\nWHEN flag clicked:\n  say 1\n`), /analog-input only/);
        const refused = generate(`DEVICE NANO\nPIN input = ${pin} ANALOG\nWHEN flag clicked:\n  say 1\n`, 'arduino-nano');
        assert.equal(refused.ok, false);
        assert.equal(refused.cowgol, undefined);
        assert.match(refused.reasons.join('; '), /not a digital mode/);
    }
    assert.equal(generate('DEVICE NANO\nCLOCK 8000000\nWHEN flag clicked:\n  say 1\n', 'arduino-nano').ok, false);
    assert.equal(generate(source, 'atmega328p').ok, false, 'Nano cannot silently inherit the larger Uno flash region');
});
