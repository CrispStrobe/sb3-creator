/**
 * Pin PWM period, servo pulse, pulse timing and touch mode, and the game's level and
 * stopwatch, as words (brickwright-lite, 2026-11-01): each reads, becomes the MicroPython
 * call it stands for, and is a fixed point through decompile.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const program = (body) => `DEVICE MICROBIT:\n  WHEN started:\n${body.map((l) => `    ${l}`).join('\n')}\n`;
const CASES = [
    ['set analog period of pin P1 to 20000 us', 'pin1.set_analog_period_microseconds(int(20000))'],
    ['servo pulse of pin P2 1500 us', 'pin2.write_analog(int(1500) * 1023 // 20000)'],
    ['set v to pulse in pin P0 high timeout 2000000', '_bw_pulse_in(pin0, 1, int(2000000))'],
    ['touch mode of pin P1 resistive', 'pin1.set_touch_mode(pin1.RESISTIVE)'],
    ['set v to game level', '_bw_game[0]'],
    ['game level up', "display.scroll('LEVEL:', delay=150)"],
    ['game start stopwatch', '_bw_game[1] = running_time()'],
    ['set v to game time', '(running_time() - _bw_game[1])']
];

test('each word becomes the MicroPython call it stands for', () => {
    for (const [line, fragment] of CASES) {
        const set = /^set (\w+) to /.exec(line);
        const c = new SB3Creator();
        c.parse(program(set ? [line, `print ${set[1]}`] : [line]));
        const r = c.generateMicroPython();
        assert.ok(r.ok, `${line}: ${JSON.stringify(r.reasons)}`);
        assert.ok(r.py.includes(fragment), `${line}: wanted ${fragment}`);
    }
});

test('each word is a fixed point through decompile', () => {
    for (const [line] of CASES) {
        const set = /^set (\w+) to /.exec(line);
        const first = new SB3Creator().decompile(new SB3Creator().parse(program(set ? [line, `print ${set[1]}`] : [line])));
        const second = new SB3Creator().decompile(new SB3Creator().parse(first));
        assert.equal(second, first, line);
    }
});
