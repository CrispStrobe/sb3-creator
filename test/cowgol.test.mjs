import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import read from '../src/utils/cowgolToPseudocode.js';
import {cowgolPinId} from '../src/utils/cowgol.js';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const build = code => { const c = new SB3Creator(); c.parse(code); return c; };
const roundtrip = code => {
    const c = build(code), result = c.generateCowgol();
    assert.equal(result.ok, true, result.reasons.join('; '));
    const back = read(result.cowgol);
    assert.equal(back.ok, true, back.reasons.join('; '));
    const again = build(back.pseudocode);
    assert.deepEqual(again.checkIntegrity(), []);
    return {c, result, back, again};
};

test('integer loops and conditions become real Cowgol and read back', () => {
    const {result, again} = roundtrip('GLOBAL total\nSPRITE Cow:\n  WHEN flag clicked:\n    set total to 0\n    REPEAT 4:\n      change total by 2\n    IF total > 3 THEN:\n      say total\n    ELSE:\n      say "none"\n');
    assert.match(result.cowgol, /while bw_repeat0 > 0 loop/);
    assert.match(result.cowgol, /if \(bw_v0 > 3\) then/);
    assert.match(again.decompile(), /say total/);
});

test('strings preserve quotes, backslashes, delimiters, Unicode and numeric text', () => {
    for (const value of ['001', '# ; := and then', 'quote " and slash \\', 'München 🌱', 'two\nlines']) {
        const {result, back} = roundtrip(`SPRITE Cow:\n  WHEN flag clicked:\n    say ${JSON.stringify(value)}\n`);
        assert.match(result.cowgol, /bw_print_text\(/);
        assert.ok(back.pseudocode.includes(`say ${JSON.stringify(value)}`));
    }
});

test('text variable initializers keep numeric spelling and empty text', () => {
    for (const value of ['001', '', '+3', ' 3 ', '0', '1e3']) {
        const {result, again} = roundtrip(`GLOBAL text = ${JSON.stringify(value)}\nWHEN flag clicked:\n  say text\n`);
        assert.match(result.cowgol, /bw_print_text\(bw_v0\)/);
        const stage = again.project.targets.find(target => target.isStage);
        assert.equal(Object.values(stage.variables)[0][1], value);
        const initialize = Object.values(stage.blocks).find(block => block.opcode === 'data_setvariableto');
        assert.deepEqual(initialize.inputs.VALUE[1], [10, value]);
    }
    const c = build('GLOBAL value = 0\nWHEN flag clicked:\n  say value\n');
    for (const invalid of [null, false, {}, []]) {
        Object.values(c.project.targets[0].variables)[0][1] = invalid;
        const result = c.generateCowgol();
        assert.equal(result.ok, false);
        assert.match(result.reasons.join('; '), /not a number or text/);
    }
});

test('turtle canvas operations round-trip through explicit callbacks', () => {
    const {result, back} = roundtrip('SPRITE Cow:\n  WHEN flag clicked:\n    clear\n    set pen color to #123456\n    set pen size to 2\n    pen down\n    go to x: 12 y: -4\n    move 10 steps\n    turn right 90 degrees\n    pen up\n');
    assert.match(result.cowgol, /bw_go_to\(12, -4\)/);
    assert.match(back.pseudocode, /set pen color to #123456/);
});

test('digital pins preserve declared device, polarity, levels and latch toggle', () => {
    const {result, back, again} = roundtrip('DEVICE ARDUINO-UNO\nPIN led = D13 OUTPUT ACTIVE LOW\nPIN button = D2 INPUT ACTIVE LOW\nWHEN flag clicked:\n  turn on led\n  toggle led\n  IF read button = 1 THEN:\n    set led high\n  wait 0.025 seconds\n');
    assert.match(result.cowgol, /bw_digital_write\(13, 0\)/);
    assert.match(result.cowgol, /bw_digital_toggle\(13\)/);
    assert.match(result.cowgol, /bw_delay\(25\)/);
    assert.match(back.pseudocode, /wait 0\.025 seconds/);
    assert.equal(again.project.stc.pins.length, 2);
});

test('pin map only exposes known host terminals', () => {
    assert.equal(cowgolPinId('arduino-uno', 'D13'), 13);
    assert.equal(cowgolPinId('arduino-mega', 'A15'), 69);
    assert.equal(cowgolPinId('pico', 'GP24'), null);
    assert.equal(cowgolPinId('pico', 'GP28'), 28);
    assert.equal(cowgolPinId('stc89c52rc', 'P1.4'), 12);
    assert.equal(cowgolPinId('unknown', 'D13'), null);
});

test('authored source supports semicolon statements, comments, integer vars and elseif', () => {
    const r = read('include "cowgol.coh"; var n: int32 := 4; # safe ;\nif n > 3 then bw_print_number(n); elseif n == 0 then bw_print_text("zero # ;"); else bw_print_text("low"); end if;');
    assert.equal(r.ok, true, r.reasons.join('; '));
    assert.match(r.pseudocode, /IF \(n > 3\) THEN:/);
    assert.match(r.pseudocode, /say "zero # ;"/);
    assert.deepEqual(build(r.pseudocode).checkIntegrity(), []);
});

test('unsupported source refuses without partial executable pseudocode', () => {
    for (const source of ['var n: uint8 := 255; n := n + 1;', '@asm "system(cmd)";',
        'include "unknown.coh";', 'var n: int32 := 3 / 2;', 'mystery();',
        'bw_digital_write(13, 1);', 'bw_print_text("unfinished);', 'loop break; end loop;']) {
        const r = read(source);
        assert.equal(r.ok, false, source); assert.equal(r.pseudocode, '');
        assert.ok(r.diagnostics.length); assert.ok(r.preview.includes('# Cowgol:'));
    }
});

test('an empty or comment-only Cowgol program produces a valid empty script', () => {
    for (const source of ['', '# comment only', 'include "cowgol.coh";']) {
        const result = read(source);
        assert.equal(result.ok, true, result.reasons.join('; '));
        assert.deepEqual(build(result.pseudocode).checkIntegrity(), []);
    }
});

test('generation refuses unsupported float math and concurrent scripts', () => {
    for (const source of ['WHEN flag clicked:\n  move 0.5 steps\n',
        'WHEN flag clicked:\n  say (3 / 2)\n',
        'WHEN flag clicked:\n  say 1\nWHEN flag clicked:\n  say 2\n',
        'WHEN flag clicked:\n  broadcast "hello"\n']) {
        const r = build(source).generateCowgol();
        assert.equal(r.ok, false, source); assert.equal(r.cowgol, undefined);
        assert.ok(r.diagnostics.length); assert.ok(r.preview.length);
    }
});

test('edits to generated code are read from the executable source', () => {
    const r = build('WHEN flag clicked:\n  say 42\n').generateCowgol();
    const back = read(r.cowgol.replace('bw_print_number(42)', 'bw_print_number(73)'));
    assert.equal(back.ok, true); assert.match(back.pseudocode, /say 73/); assert.doesNotMatch(back.pseudocode, /say 42/);
});

test('every newly mapped machine round-trips its canonical digital pins', () => {
    const fixtures = [
        ['atmega168p', 'D13', 'D2', 13, 2], ['atmega328p', 'A5', 'D3', 19, 3],
        ['attiny85', 'PB1', 'PB2', 9, 10], ['attiny88', 'PD7', 'PC7', 31, 23],
        ['eater6502', 'PA0', 'PB6', 0, 14], ['z80', 'OUT0', 'IN0', 0, 8],
        ['i8086', 'P1.0', 'P2.1', 0, 9], ['stm32f030', 'PA7', 'PB1', 7, 17],
        ['stm32g030', 'PB9', 'PC14', 25, 46], ['stm32f103', 'PC13', 'PB15', 45, 31],
        ['microbit', 'P0', 'P2', 0, 2], ['calliopemini', 'P1', 'P2', 1, 2],
        ['esp8266', 'GP15', 'GP12', 15, 12]
    ];
    for (const [device, output, input, outId, inId] of fixtures) {
        assert.equal(cowgolPinId(device, output), outId, device);
        assert.equal(cowgolPinId(device, input), inId, device);
        const {result, again} = roundtrip(`DEVICE ${device}\nPIN led = ${output} OUTPUT\nPIN button = ${input} INPUT\nWHEN flag clicked:\n  turn on led\n  IF read button = 1 THEN:\n    turn off led\n`);
        assert.ok(result.cowgol.includes(`bw_digital_write(${outId}, 1)`), device);
        assert.equal(again.project.stc.device, device);
    }
    for (const [device, pin] of [['eater6502', 'PB7'], ['attiny85', 'PB5'], ['attiny88', 'PC6'],
        ['z80', 'MK0'], ['i8086', 'P4.0'], ['stm32f030', 'PB9'], ['stm32f103', 'PC12'],
        ['microbit', 'P18'], ['esp8266', 'GP6'], ['stc12fake', 'P1.0']]) assert.equal(cowgolPinId(device, pin), null, `${device} ${pin}`);
});

test('int32 minimum, typed inference and runtime initializers preserve execution', () => {
    const r = read('var low: int32 := -2147483648; var a: int32 := 1; var b: int32 := a + 2; var c := b + 1; bw_print_number(c);');
    assert.equal(r.ok, true, r.reasons.join('; '));
    assert.match(r.pseudocode, /GLOBAL low = -2147483648/);
    assert.match(r.pseudocode, /GLOBAL b = 0/);
    assert.match(r.pseudocode, /set b to \(a \+ 2\)/);
    const c = build(r.pseudocode), output = [];
    new Function('console', c.generateJavaScript())({log: value => output.push(String(value))});
    assert.deepEqual(output, ['4']);
    assert.ok(r.warnings.some(w => w.includes('int32')));
});

test('invalid Cowgol types, truthiness, calls, initialization and provable overflow refuse', () => {
    for (const source of ['var n := 255;', 'var n: int32;', 'var n:int32:=2147483647; n:=n+1;',
        'var n:int32:=-(-2147483648);', 'var n:int32:=0; while n loop end loop;',
        'if 1 then end if;', 'var n:int32:=(1==1)+2;',
        'sub f(x:int32) is bw_print_number(x);end sub; f("oops");',
        'sub f(x:int32) is x:=x+1; bw_print_number(x); end sub; f(4);',
        'sub f() is f();end sub; f();', 'sub f() is var local:int32:=3;end sub; bw_print_number(local);']) {
        const r = read(source); assert.equal(r.ok, false, source); assert.equal(r.pseudocode, '');
    }
});

test('procedure locals and names that overlap canvas commands keep scalar behavior', () => {
    const source = 'var x:int32:=2; x:=x+1; bw_print_number(x); sub g() is var t:int32:=9; bw_print_number(t); end sub; sub f() is var t:int32:=3; g(); bw_print_number(t); end sub; f();';
    const r = read(source); assert.equal(r.ok, true, r.reasons.join('; '));
    const c = build(r.pseudocode), output = [];
    new Function('console', c.generateJavaScript())({log: value => output.push(String(value))});
    assert.deepEqual(output, ['3', '9', '3']);
});

test('constant analysis does not leak between branches or procedure definitions/calls', () => {
    for (const source of [
        'var n:int32:=0; if n==0 then n:=2147483647; else n:=n+1; end if;',
        'var n:int32:=0; sub f() is n:=2147483647;end sub; n:=n+1;',
        'var n:int32:=2147483647; sub f() is n:=0;end sub; f(); n:=n+1;'
    ]) assert.equal(read(source).ok, true, source);
});

test('Cowgol string limits and escape vocabulary refuse unsupported data', () => {
    for (const source of ['bw_print_text("\\b");', 'bw_print_text("\\f");', 'bw_print_text("\\u0061");',
        `bw_print_text("${'é'.repeat(64)}");`, 'bw_print_text("\ud800");']) assert.equal(read(source).ok, false, source);
    for (const value of ['\b', '\f', '\u0000', '\ud800', 'x'.repeat(128), '🌱'.repeat(32)]) {
        const c = build('WHEN flag clicked:\n  say "placeholder"\n');
        const block = Object.values(c.project.targets[0].blocks).find(b => b.opcode === 'looks_say');
        block.inputs.MESSAGE[1][1] = value;
        assert.equal(c.generateCowgol().ok, false, JSON.stringify(value));
    }
    assert.equal(read(`bw_print_text("${'🌱'.repeat(31)}abc");`).ok, true);
});

test('line mappings identify generated pin and nested control statements', () => {
    const {c, result} = roundtrip('DEVICE ARDUINO-UNO\nPIN led = D13 OUTPUT\nWHEN flag clicked:\n  REPEAT 2:\n    toggle led\n');
    const lines = result.cowgol.split('\n'), all = Object.assign({}, ...c.project.targets.map(t => t.blocks));
    const toggleLine = lines.findIndex(line => line.includes('bw_digital_toggle')) + 1;
    assert.equal(all[result.lineMap[toggleLine]].opcode, 'stc12_toggle');
});

test('CLI exports/reads Cowgol and preserves output files when conversion refuses', () => {
    const dir = fs.mkdtempSync(path.join(process.cwd(), '.cowgol-cli-'));
    try {
        const bw = path.join(dir, 'input.bw'), cow = path.join(dir, 'output.cow'), back = path.join(dir, 'back.bw');
        fs.writeFileSync(bw, 'WHEN flag clicked:\n  say 42\n');
        let r = spawnSync(process.execPath, ['bin/bw.mjs', 'transpile', bw, '--to', 'cowgol', '-o', cow], {encoding:'utf8'});
        assert.equal(r.status, 0, r.stderr); assert.match(fs.readFileSync(cow, 'utf8'), /bw_print_number\(42\)/);
        r = spawnSync(process.execPath, ['bin/bw.mjs', 'read', cow, '-o', back], {encoding:'utf8'});
        assert.equal(r.status, 0, r.stderr); assert.match(fs.readFileSync(back, 'utf8'), /say 42/);
        fs.writeFileSync(cow, 'unsupported();'); fs.writeFileSync(back, 'keep this existing program');
        r = spawnSync(process.execPath, ['bin/bw.mjs', 'read', cow, '-o', back], {encoding:'utf8'});
        assert.notEqual(r.status, 0); assert.equal(fs.readFileSync(back, 'utf8'), 'keep this existing program');
    } finally { fs.rmSync(dir, {recursive:true, force:true}); }
});
