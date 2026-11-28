import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import read from '../src/utils/cowgolToPseudocode.js';
import {cowgolPinId} from '../src/utils/cowgol.js';

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
