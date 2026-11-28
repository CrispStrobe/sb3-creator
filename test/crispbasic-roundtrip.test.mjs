import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import SB3Creator from '../src/utils/sb3Creator.js';
import basicToPseudocode from '../src/utils/basicToPseudocode.js';

const portable = {profile: 'bbc', mode: 'crispbasic', lineNumbers: false};
const header = 'REM @bw device arduino-uno\nREM @bw pin led D13 output\nREM @bw pin button D2 input active-low\nPROCpinMode(13,"output")\nPROCpinMode(2,"input-pullup")\n';
function generate(source, lineNumbers = false) {
    const creator = new SB3Creator();
    creator.parse(source);
    assert.deepEqual(creator.warnings, [], 'canonical portable output must never degrade expressions into text');
    const result = creator.generateBASIC(undefined, {...portable, lineNumbers});
    assert.equal(result.ok, true, JSON.stringify(result));
    return {creator, ...result};
}
function accepted(source) {
    const result = basicToPseudocode(source, {mode: 'crispbasic'});
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.capabilities.requiredRuntime, 'crispbasic');
    assert.equal(result.capabilities.blocks, false, 'source conversion does not qualify the generic VM');
    assert.deepEqual(result.diagnostics, []);
    const generated = generate(result.pseudocode);
    return {...result, basic: generated.basic, creator: generated.creator};
}
function declined(source, code) {
    const result = basicToPseudocode(source, {mode: 'crispbasic'});
    assert.equal(result.ok, false, JSON.stringify(result));
    assert.equal(result.pseudocode, '');
    assert.ok(result.diagnostics.some(diagnostic => diagnostic.code === `crispbasic-read-${code}`), JSON.stringify(result));
    return result;
}

for (const lineNumbers of [false, true]) {
    test(`portable pin/time program is reversible in ${lineNumbers ? 'numbered' : 'structured'} form`, () => {
        const generated = generate(`DEVICE ARDUINO-UNO
PIN led = D13 OUTPUT ACTIVE LOW
PIN button = D2 INPUT ACTIVE LOW
GLOBAL count
WHEN flag clicked:
  set count to 2
  turn on led
  REPEAT 3:
    toggle led
    wait 0.025 seconds
    change count by 1
  set led to read button
  IF read button THEN:
    print count
  ELSE:
    print 0
  print timer`, lineNumbers);
        const result = accepted(generated.basic);
        assert.match(result.pseudocode, /PIN led = D13 OUTPUT ACTIVE LOW/);
        assert.match(result.pseudocode, /wait 0\.025 seconds/);
        assert.match(result.pseudocode, /toggle led/);
        assert.match(result.pseudocode, /round \(timer \* 1000\)/);
        assert.equal((result.basic.match(/PROCdigitalToggle/g) || []).length, 1);
        assert.equal((result.basic.match(/FNdigitalRead/g) || []).length, 2, 'each original read is evaluated once');
        accepted(result.basic);
        assert.equal(basicToPseudocode(generated.basic).ok, false, 'ordinary Blocks conversion remains closed');
    });

    test(`repeat-until and nested conditions retain fresh reporter evaluation (${lineNumbers})`, () => {
        const source = generate(`DEVICE ARDUINO-UNO
PIN led = D13 OUTPUT
PIN button = D2 INPUT
WHEN flag clicked:
  REPEAT UNTIL read button:
    toggle led
    wait 0.001 seconds
  IF read button THEN:
    IF read button THEN:
      set led high
    ELSE:
      set led low
  ELSE:
    print 0`, lineNumbers).basic;
        const result = accepted(source);
        assert.match(result.pseudocode, /REPEAT UNTIL/);
        assert.equal((result.basic.match(/FNdigitalRead/g) || []).length, 3);
        assert.doesNotMatch(result.pseudocode, /GLOBAL cb_truth/, 'loop conditions are reevaluated, never hoisted to stale scalar snapshots');
    });

    test(`integer pen canvas program retains its actual VDU-producing statements (${lineNumbers})`, () => {
        const source = generate(`WHEN flag clicked:
  clear
  set pen color to 3
  pen up
  go to x: -10 y: 20
  pen down
  go to x: 100 y: 30
  set x to 12
  set y to -5`, lineNumbers).basic;
        const result = accepted(source);
        const executable = value => value.trim().split('\n').map(line => line.replace(/^\d+\s+/, '').trim())
            .filter(line => line !== 'END' && !line.startsWith('REM'));
        assert.deepEqual(executable(result.basic), executable(source), 'generated canvas byte commands, helper and coordinate transforms are preserved');
        accepted(result.basic);
    });
}

test('electrical reads are inverted only to undo a logical ACTIVE LOW declaration', () => {
    const result = accepted(header + 'PRINT FNdigitalRead(2)\nPROCdigitalWrite(13,FNdigitalRead(2))\nEND');
    assert.match(result.pseudocode, /print \(1 - \(read button\)\)/);
    assert.match(result.pseudocode, /set led to \(1 - \(read button\)\)/);
    assert.equal((result.basic.match(/FNdigitalRead/g) || []).length, 2);
});

test('BBC -1 comparison values become explicit numeric assignments, not strings', () => {
    const result = accepted(header + 'truth_0=8\nPRINT FNdigitalRead(2)=1\nPRINT ABS(FNdigitalRead(2)=0)\nEND');
    assert.match(result.pseudocode, /set cb_truth_1 to -1/);
    assert.match(result.pseudocode, /set cb_truth_2 to 1/);
    assert.match(result.pseudocode, /set cb_truth_0 to 8/, 'user scalar and generated condition temporaries never collide');
    assert.equal((result.basic.match(/FNdigitalRead/g) || []).length, 2);
});

test('literal direct canvas coordinates and colours use the reversible renderer grid', () => {
    const result = accepted('CLG\nGCOL 0,4\nMOVE 640,512\nDRAW 680,552\nEND');
    assert.match(result.pseudocode, /set pen color to 3/);
    assert.match(result.pseudocode, /pen up\n  go to x: 0 y: 0\n  pen down\n  go to x: 10 y: 10/);
});

test('REM, colon statements and quoted operation names remain ordinary data', () => {
    const result = accepted(header + 'REM fake: PROCtone(13,440)\nPRINT "FNdigitalRead(2):don\'t run"\nPROCdigitalToggle(13):PROCdelay(1)\nEND');
    assert.match(result.pseudocode, /print "FNdigitalRead\(2\):don't run"/);
    assert.equal((result.basic.match(/PROCdigitalToggle/g) || []).length, 1);
});

for (const [source, code] of [
    ['PROCdigitalWrite(13,7)', 'digital-value'],
    ['PROCdigitalWrite(13,n)', 'digital-value'],
    ['PROCdigitalWrite(2,1)', 'pin-mode'],
    ['PROCdigitalToggle(99)', 'pin'],
    ['PROCdigitalToggle(n)', 'statement'],
    ['PROCpinMode(13,"input")', 'pin-mode'],
    ['PROCdelay(1.5)', 'delay'],
    ['PROCdelay(-1)', 'delay'],
    ['PROCdelay(n)', 'delay'],
    ['PROCdelay(2147483648)', 'delay'],
    ['PRINT NOT FNdigitalRead(2)', 'bitwise'],
    ['PRINT FNdigitalRead(2) AND 1', 'bitwise'],
    ['PRINT (FNdigitalRead(2)=1)+1', 'boolean-value'],
    ['PRINT ABS(FNdigitalRead(2)=1)>=0', 'constant-predicate'],
    ['PRINT (FNdigitalRead(2)=1)>0', 'constant-predicate'],
    ['n%=1.5', 'statement'],
    ['UPPER=1', 'statement'],
    ['PRINT RND(2)', 'expression'],
    ['INPUT a$', 'statement'],
    ['MODE 1', 'statement'],
    ['FOR loop=1 TO 0\nPRINT 1\nNEXT loop', 'for'],
    ['FOR loop=1 TO 3\nPRINT loop\nNEXT loop', 'for'],
    ['FOR loop=1 TO 3\nPRINT 1\nNEXT wrong', 'for'],
    ['WHILE 1\nPRINT 1', 'structure'],
    ['IF FNdigitalRead(2) THEN\nPRINT 1', 'structure'],
    ['REPEAT\nPRINT 1\nUNTIL TRUE', 'structure'],
    ['GOTO 100', 'statement'],
    ['DRAW 641,512', 'canvas'],
    ['DRAW 999999999999999999999,512', 'canvas'],
    ['PROCpen_colour(3)', 'canvas'],
    ['bw_x%=1\nbw_y%=1\nIF bw_pen% THEN DRAW bw_x%*4+640,bw_y%*4+512 ELSE MOVE bw_x%*4+640,bw_y%*4+512', 'canvas']
]) test(`portable reverse refuses unsafe or unqualified source: ${source.split('\n')[0]}`, () => declined(header + source, code));

test('metadata is checked against executable modes, aliases and supported maps', () => {
    declined(header.replace('PROCpinMode(13,"output")\n', ''), 'pin-mode');
    declined(header.replace('D13 output', 'D99 output'), 'pin');
    declined(header.replace('D2 input', 'D13 input'), 'pin');
    declined(header.replace('arduino-uno', 'made-up-board'), 'device');
    declined(header.replace('REM @bw pin led', 'REM @bw pin led weird'), 'pin');
    declined(header + 'REM @bw device pico', 'device');
    declined('PROCpinMode(13,"output")\nPROCdigitalToggle(13)', 'pin');
});

test('numbered source refuses reordering and reports the physical unsupported line', () => {
    declined('20 PRINT 1\n10 PRINT 2', 'line-order');
    declined('10 PRINT 1\nPRINT 2', 'line-order');
    declined('10 PRINT 1\n10 PRINT 2', 'line-order');
    const result = declined('10 REM example\n30 PROCdelay(1.5)', 'delay');
    assert.equal(result.diagnostics[0].line, 2);
    assert.equal(result.diagnostics[0].basicLine, 30);
});

test('dynamic BASIC and unsupported adjacent APIs remain refused in explicit mode', () => {
    for (const source of ['PRINT EVAL("1")', 'PROCtone(13,440)', 'DEF PROCdigitalWrite(p,v)\nENDPROC']) {
        const result = basicToPseudocode(source, {mode: 'crispbasic'});
        assert.equal(result.ok, false, source);
        assert.equal(result.pseudocode, '');
    }
});

for (const [device, terminal, id] of [
    ['MICROBIT', 'P0', 0], ['MICROBIT', 'P16', 16], ['CALLIOPEMINI', 'P3', 3],
    ['CPX', 'A0', 0], ['CIRCUIT_PLAYGROUND_EXPRESS', 'A7', 7],
    ['ATTINY85', 'PB4', 12], ['ATTINY88', 'PC7', 23], ['ATTINY88', 'PD7', 31],
    ['STM32F030', 'PA10', 10], ['STM32F030', 'PB1', 17],
    ['ESP8266', 'GP12', 12], ['EATER6502', 'PA7', 7], ['EATER6502', 'PB7', 15]
]) test(`${device} ${terminal} uses logical ${id} in both portable directions`, () => {
    const generated = generate(`DEVICE ${device}\nPIN led = ${terminal} OUTPUT\nWHEN flag clicked:\n  turn on led\n  toggle led\n  wait 0.002 seconds`);
    assert.match(generated.basic, new RegExp(`PROCpinMode\\(${id},"output"\\)`));
    assert.match(generated.basic, new RegExp(`PROCdigitalToggle\\(${id}\\)`));
    const result = accepted(generated.basic);
    assert.match(result.basic, new RegExp(`PROCpinMode\\(${id},"output"\\)`));
    assert.match(result.basic, new RegExp(`PROCdigitalToggle\\(${id}\\)`));
});

test('unsupported package pads, unknown STCs and custom machine layouts never gain a fabricated map', () => {
    for (const [device, terminal] of [['microbit', 'P20'], ['calliopemini', 'P8'], ['attiny85', 'PB5'],
        ['attiny88', 'PA0'], ['attiny88', 'PC6'], ['stm32f030', 'PA13'], ['esp8266', 'GP6'],
        ['eater6502', 'MK0'], ['stc12invented', 'P1.0']]) {
        const source = `REM @bw device ${device}\nREM @bw pin led ${terminal} output\nPROCpinMode(0,"output")`;
        const result = basicToPseudocode(source, {mode: 'crispbasic'});
        assert.equal(result.ok, false, source);
        assert.equal(result.pseudocode, '');
    }
    const creator = new SB3Creator();
    creator.parse('DEVICE EATER6502\nCHIP via = W65C22 AT $6000\nPIN led = PA0 OUTPUT\nWHEN flag clicked:\n  turn on led');
    const result = creator.generateBASIC(undefined, portable);
    assert.equal(result.ok, false);
    assert.ok(result.diagnostics.some(diagnostic => diagnostic.code === 'crispbasic-machine'));
});

test('portable source requirement survives parse, serialization and decompile and refuses other runtime generators', async () => {
    const source = accepted(header + 'PROCdigitalToggle(13)\nPROCdelay(1)\nEND').pseudocode;
    assert.match(source, /^# @crispbasic-portable 1\n/);
    const creator = new SB3Creator(); creator.parse(source);
    assert.deepEqual(creator.project.crispbasicSource, {schemaVersion: 1, requiredRuntime: 'crispbasic'});
    const clone = JSON.parse(JSON.stringify(creator.project));
    const decompiled = creator.decompile(clone);
    assert.match(decompiled, /^# @crispbasic-portable 1\n/);
    assert.equal((decompiled.match(/@crispbasic-portable/g) || []).length, 1, 'reserved metadata is not duplicated as a block comment');
    const reparsed = new SB3Creator(); reparsed.parse(decompiled);
    assert.deepEqual(reparsed.project.crispbasicSource, clone.crispbasicSource);
    for (const method of ['generatePython', 'generateJavaScript', 'generateHostC', 'generateMicroPython', 'generateC']) {
        assert.throws(() => creator[method](clone), error => error.code === 'crispbasic-runtime-required', method);
    }
    await assert.rejects(() => creator.generateSB3(), error => error.code === 'crispbasic-runtime-required');
    assert.equal(creator.generateBASIC(clone).ok, false);
    assert.equal(creator.generateBASIC(clone, portable).ok, true);
    const previous = creator.project;
    for (const marker of ['# @crispbasic-portable 2', '# @crispbasic-portable 1\n# @crispbasic-portable 1', '# @crispbasic-portable 1 extra']) {
        assert.throws(() => creator.parse(marker + '\nWHEN flag clicked:\n  print 1'), error => error.code === 'crispbasic-source-version');
        assert.equal(creator.project, previous, 'invalid requirement refuses before parser reset');
    }
});

test('lightweight marker guard covers unknown versions without matching ordinary text', async () => {
    const {isCrispBasicPseudocode, validateCrispBasicPseudocode} = await import('../src/utils/crispBasicMode.js');
    for (const source of ['# @crispbasic-portable 1', '  #  @crispbasic-portable 2', '# @crispbasic-portable']) {
        assert.equal(isCrispBasicPseudocode(source), true);
    }
    for (const source of ['print "# @crispbasic-portable 1"', '# ordinary source']) {
        assert.equal(isCrispBasicPseudocode(source), false);
        assert.equal(validateCrispBasicPseudocode(source), false);
    }
});

test('CLI converts portable source only through an explicit mode and preserves output on refusal', () => {
    const directory = mkdtempSync(join(tmpdir(), 'crispbasic-roundtrip-'));
    try {
        const input = join(directory, 'input.bas'), pseudo = join(directory, 'source.bw'), output = join(directory, 'output.txt');
        writeFileSync(input, header + 'PROCdigitalToggle(13)\nPROCdelay(25)\nEND\n');
        const cli = (...args) => spawnSync(process.execPath, ['bin/bw.mjs', ...args], {encoding: 'utf8'});
        let result = cli('read', input, '--crispbasic', '-o', pseudo);
        assert.equal(result.status, 0, result.stderr);
        assert.match(readFileSync(pseudo, 'utf8'), /^# @crispbasic-portable 1\n/);
        result = cli('transpile', pseudo, '--to', 'crispbasic', '--numbered', '-o', output);
        assert.equal(result.status, 0, result.stderr);
        assert.match(readFileSync(output, 'utf8'), /^10 REM/);
        for (const args of [
            ['transpile', pseudo, '--to', 'python'], ['transpile', pseudo, '--to', 'c'],
            ['transpile', pseudo, '--to', 'micropython'], ['transpile', pseudo, '--to', 'sb3'],
            ['compile', pseudo], ['retarget', pseudo, 'pico'], ['flash', pseudo]
        ]) {
            writeFileSync(output, 'KEEP EXISTING OUTPUT\n');
            result = cli(...args, '-o', output);
            assert.notEqual(result.status, 0, args.join(' '));
            assert.match(result.stderr, /requires CrispBASIC/);
            assert.equal(readFileSync(output, 'utf8'), 'KEEP EXISTING OUTPUT\n');
        }
    } finally { rmSync(directory, {recursive: true, force: true}); }
});


test('portable PRINT preserves embedded quotes and literal backslashes through both directions', () => {
    const original = 'PRINT "Aa""BB"\nPRINT "C:\\tmp\\x"\nEND\n';
    const converted = accepted(original);
    assert.match(converted.basic, /^PRINT "Aa""BB"$/m);
    assert.match(converted.basic, /^PRINT "C:\\tmp\\x"$/m);
});


test('negative literal math operands remain operands, never a variable named abs-of', () => {
    const result = accepted('PRINT ABS(-1)\nPRINT INT(-1.5)\nEND');
    assert.match(result.basic, /^PRINT ABS\(-1\)$/m);
    assert.match(result.basic, /^PRINT INT\(-1.5\)$/m);
    assert.doesNotMatch(result.basic, /abs_of|floor_of/);
});
