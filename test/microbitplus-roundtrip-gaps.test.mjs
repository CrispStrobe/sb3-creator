/**
 * Reporters the DECOMPILER emitted that the PARSER could not read back.
 *
 * `decompile()` has always written `shake happening`, `pin P0 touched`
 * and `pin P0 is high`, and `parse()` had no rule for any of them. Fed
 * back in, each fell through to the variable rule and became a
 * comparison against an undefined name: a program that compiles, runs,
 * and does nothing — the failure this project's transparency tests exist
 * to prevent, hiding in the one direction they did not cover.
 *
 * `show text` had the mirror-image problem. The block's TEXT is an INPUT
 * and can hold a reporter, but only the quoted form parsed, so
 * `show text count` produced no block at all; and the decompiler
 * force-quoted whatever it found, so a computed value came back out as
 * the literal word.
 *
 * Found while translating MakeCode micro:bit projects into pseudocode:
 * the translator had to REFUSE gestures and touch, and route
 * `basic.showNumber(x)` through `display` instead, because these
 * spellings compiled to silence.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const opcodesOf = source => {
    const creator = new SB3Creator();
    const project = creator.parse(source);
    const ops = new Set();
    for (const target of project.targets) {
        for (const block of Object.values(target.blocks || {})) {
            if (block && block.opcode) ops.add(block.opcode);
        }
    }
    return {ops, project};
};

const program = body => `DEVICE MICROBIT\n\nWHEN flag clicked:\n  set count to 1\n  ${body}\n`;

test('the three boolean reporters parse into their own blocks', () => {
    for (const [line, opcode] of [
        ['IF shake happening THEN:\n    clear display', 'microbitplus_isgesture'],
        ['IF tilt left happening THEN:\n    clear display', 'microbitplus_isgesture'],
        ['IF face up happening THEN:\n    clear display', 'microbitplus_isgesture'],
        ['IF pin P1 touched THEN:\n    clear display', 'microbitplus_istouch'],
        ['IF pin P2 is high THEN:\n    clear display', 'microbitplus_ispinhigh']
    ]) {
        const {ops} = opcodesOf(program(line));
        assert.ok(ops.has(opcode), `${line.split('\n')[0]} produced no ${opcode}`);
    }
});

test('their fields carry what the spelling said', () => {
    const {project} = opcodesOf(program('IF tilt left happening THEN:\n    clear display'));
    const blocks = project.targets.flatMap(t => Object.values(t.blocks || {}));
    const gesture = blocks.find(b => b && b.opcode === 'microbitplus_isgesture');
    assert.equal(gesture.fields.GESTURE[0], 'tilt left');

    const touch = opcodesOf(program('IF pin P12 touched THEN:\n    clear display'))
        .project.targets.flatMap(t => Object.values(t.blocks || {}))
        .find(b => b && b.opcode === 'microbitplus_istouch');
    assert.equal(touch.fields.PIN[0], 'P12');
});

test('a gesture that is not on the menu is still just a variable', () => {
    // The rule must not swallow ordinary prose: `wobble happening` is not
    // a gesture, and turning it into one would be worse than refusing it.
    const {ops} = opcodesOf(program('IF wobble happening THEN:\n    clear display'));
    assert.ok(!ops.has('microbitplus_isgesture'));
});

test('show text takes an expression, not only a literal', () => {
    for (const [line, expected] of [
        ['show text "hi"', 'microbitplus_showtext'],
        ['show text count', 'microbitplus_showtext'],
        ['show text analog value of pin P0', 'microbitplus_analogread']
    ]) {
        const {ops} = opcodesOf(program(line));
        assert.ok(ops.has(expected), `${line} produced no ${expected}`);
        assert.ok(ops.has('microbitplus_showtext'), `${line} produced no show-text block`);
    }
});

test('every one of them is a fixed point through decompile', () => {
    // The property that was actually broken: what comes out must go back
    // in unchanged. `show text count` decompiled to `show text "count"`,
    // which reads as the literal word — a construct that never converges.
    for (const body of [
        'show text "hi"',
        'show text count',
        'show text analog value of pin P0',
        'IF shake happening THEN:\n    clear display',
        'IF pin P1 touched THEN:\n    clear display',
        'IF pin P2 is high THEN:\n    clear display'
    ]) {
        const first = new SB3Creator().decompile(new SB3Creator().parse(program(body)));
        const second = new SB3Creator().decompile(new SB3Creator().parse(first));
        assert.equal(second, first, `${body.split('\n')[0]} does not converge`);
    }
});

test('a computed show text lowers to MicroPython that stringifies it', () => {
    const creator = new SB3Creator();
    creator.parse(program('show text count'));
    const micropython = creator.generateMicroPython();
    assert.ok(micropython.ok, JSON.stringify(micropython.reasons || []));
    assert.match(micropython.py, /display\.scroll\(str\(count\)\)/);

    const literal = new SB3Creator();
    literal.parse(program('show text "hi"'));
    assert.match(literal.generateMicroPython().py, /display\.scroll\('hi'\)/,
        'and a literal stays a literal');
});

test('gesture names reach MicroPython in the spelling it accepts', () => {
    // `accelerometer.is_gesture()` accepts exactly up, down, left, right,
    // face up, face down, freefall, 3g, 6g, 8g and shake; anything else
    // raises ValueError("invalid gesture") — see gesture_from_obj in
    // bbcmicrobit/micropython. Four of the block menu's labels carry a
    // "tilt " the runtime has never known, so those four programs crashed
    // the moment the block ran.
    const ACCEPTED = new Set(['up', 'down', 'left', 'right', 'face up',
        'face down', 'freefall', '3g', '6g', '8g', 'shake']);

    for (const label of ['shake', 'tilt up', 'tilt down', 'tilt left', 'tilt right',
        'face up', 'face down', 'freefall', '3g', '6g', '8g']) {
        const creator = new SB3Creator();
        creator.parse(program(`IF ${label} happening THEN:\n    clear display`));
        const py = creator.generateMicroPython();
        assert.ok(py.ok, `${label}: ${JSON.stringify(py.reasons || [])}`);
        const call = /accelerometer\.is_gesture\('([^']*)'\)/.exec(py.py);
        assert.ok(call, `${label} produced no is_gesture call`);
        assert.ok(ACCEPTED.has(call[1]),
            `${label} lowers to is_gesture('${call[1]}'), which raises ValueError on a micro:bit`);
    }
});
