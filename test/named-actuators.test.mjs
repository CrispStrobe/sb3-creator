/**
 * Blocks must be able to point AT a part.
 *
 * Every device kind in this language is declared with a name and addressed by
 * it — 74HC595, LCD1602, LEDBANK8, MATRIX8X8, SEVENSEG8, KEYPAD4X4 all resolve
 * `fields.PART` through stcPart(). Servos and motors were the exception: they
 * took a bare channel number, so there was nothing to point at, and
 * `set myservo angle to 90` compiled `myservo` as an ordinary variable. The
 * emitter then declared `static long myservo = 0;` and bw_servo_set opens with
 * `if (servo < 1 || servo > 2) return;` — three shipped examples drove a servo
 * that never moved, and nothing anywhere said so.
 *
 * A servo's pin is owned by its driver (OCR1A for channel 1, OCR1B for 2), so
 * unlike every other PART this one declares a CHANNEL rather than pins.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import cToPseudocode from '../src/utils/cToPseudocode.js';

const HEAD = 'DEVICE STC12C5A60S2\nCLOCK 11059200\n';
const compile = body => { const c = new SB3Creator(); c.parse(HEAD + body); return c.generateC(); };
const callsIn = (code, fn) => code.split('\n')
    .filter(l => l.includes(`${fn}(`) && !/^\s*static/.test(l) && !l.includes('#'))
    .map(l => l.trim());

describe('named servos and motors', () => {
    test('a declared name addresses its channel', () => {
        const code = compile('PART arm = SERVO 2\n\nWHEN flag clicked:\n  set arm angle to 90\n');
        assert.ok(callsIn(code, 'bw_servo_set').some(l => /bw_servo_set\(2,\s*90\)/.test(l)),
            callsIn(code, 'bw_servo_set').join(' | '));
    });

    test('and is NOT emitted as a variable, which is the whole defect', () => {
        // `static long arm = 0;` plus a driver that refuses anything outside
        // 1..2 is how a servo call became a silent no-op.
        const code = compile('PART arm = SERVO 1\n\nWHEN flag clicked:\n  set arm angle to 90\n');
        assert.doesNotMatch(code, /static long arm\b/);
        assert.doesNotMatch(code, /bw_servo_set\(arm/);
    });

    test('an undeclared name still lowers to a variable — the old behaviour is untouched', () => {
        // Deliberately NOT made an error here: the name may be a real variable
        // holding a computed channel. The examples gate refuses the literal
        // zero case; this proves the language did not quietly change meaning.
        // A PIN is present because a program that declares NOTHING has no body
        // to emit at all — that is pre-existing and not what this checks.
        const code = compile('PIN servo = P1.1 OUTPUT\n\nWHEN flag clicked:\n  set myservo angle to 90\n');
        assert.match(code, /bw_servo_set\(myservo/);
    });

    test('a literal channel keeps working', () => {
        const code = compile('PIN servo = P1.1 OUTPUT\n\nWHEN flag clicked:\n  set 1 angle to 90\n');
        assert.ok(callsIn(code, 'bw_servo_set').some(l => /bw_servo_set\(1,\s*90\)/.test(l)));
    });

    test('motors get the same treatment', () => {
        const code = compile('PART wheel = MOTOR 1\n\nWHEN flag clicked:\n  set wheel speed to 200\n  set wheel direction reverse\n');
        assert.ok(callsIn(code, 'bw_motor_speed').some(l => /bw_motor_speed\(1,\s*200\)/.test(l)));
        assert.ok(callsIn(code, 'bw_motor_dir').some(l => /bw_motor_dir\(1,\s*1\)/.test(l)));
        assert.doesNotMatch(code, /static long wheel\b/);
    });

    test('the whole program survives a C round trip, names included', () => {
        const src = 'PART arm = SERVO 1\nPART wheel = MOTOR 1\n\nWHEN flag clicked:\n'
            + '  set arm angle to 90\n  set wheel speed to 200\n  set wheel direction forward\n';
        const { pseudocode, warnings } = cToPseudocode(compile(src));
        assert.deepEqual((warnings || []).filter(w => /no pseudocode for the call/.test(w)), []);
        for (const line of ['PART arm = SERVO 1', 'PART wheel = MOTOR 1',
            'set arm angle to 90', 'set wheel speed to 200', 'set wheel direction forward']) {
            assert.ok(pseudocode.includes(line), `round trip lost: ${line}\n${pseudocode}`);
        }
    });

    test('an unnamed channel still reads back as its number', () => {
        const { pseudocode } = cToPseudocode(compile('PIN servo = P1.1 OUTPUT\n\nWHEN flag clicked:\n  set 2 angle to 45\n'));
        assert.match(pseudocode, /set 2 angle to 45/);
    });

    test('two names cannot claim one channel, and one name cannot be reused', () => {
        const dup = new SB3Creator();
        dup.parse(HEAD + 'PART a = SERVO 1\nPART b = SERVO 1\n\nWHEN flag clicked:\n  stop\n');
        assert.ok((dup.warnings || []).some(w => /already declared/.test(String(w))),
            JSON.stringify(dup.warnings));
        const same = new SB3Creator();
        same.parse(HEAD + 'PART a = SERVO 1\nPART a = MOTOR 1\n\nWHEN flag clicked:\n  stop\n');
        assert.ok((same.warnings || []).some(w => /already a declared part/.test(String(w))),
            JSON.stringify(same.warnings));
    });

    test('a servo name does not address a motor block, or the reverse', () => {
        // The resolver is typed: pointing a motor block at a servo must fall
        // through to the ordinary value path rather than silently take its
        // channel.
        const code = compile('PART arm = SERVO 2\n\nWHEN flag clicked:\n  set arm speed to 100\n');
        assert.match(code, /bw_motor_speed\(arm/, 'a servo name is not a motor channel');
    });
});
