/**
 * Radio off and band, the serial port's pins and rate, reset, panic, compass calibration and the
 * accelerometer range, as words (brickwright-lite, 2026-11-01): each reads, becomes the MicroPython
 * call it stands for, and is a fixed point through decompile.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const program = (body) => `DEVICE MICROBIT:\n  WHEN started:\n${body.map((l) => `    ${l}`).join('\n')}\n`;
const CASES = [
    ['radio off', 'radio.off()'],
    ['radio frequency band 7', 'radio.config(channel=int(7))'],
    ['serial redirect tx P0 rx P1 baud 9600', 'uart.init(baudrate=int(9600), tx=pin0, rx=pin1)'],
    ['serial baud rate 115200', 'uart.init(baudrate=int(115200))'],
    ['reset micro:bit', 'reset()'],
    ['panic with code 7', 'panic(int(7))'],
    ['calibrate compass', 'compass.calibrate()'],
    ['set accelerometer range 4', 'accelerometer.set_range(int(4))']
];

test('each word becomes the MicroPython call it stands for', () => {
    for (const [line, fragment] of CASES) {
        const c = new SB3Creator();
        c.parse(program([line]));
        const r = c.generateMicroPython();
        assert.ok(r.ok, `${line}: ${JSON.stringify(r.reasons)}`);
        assert.ok(r.py.includes(fragment), `${line}: wanted ${fragment}`);
    }
});

test('each word is a fixed point through decompile', () => {
    for (const [line] of CASES) {
        const first = new SB3Creator().decompile(new SB3Creator().parse(program([line])));
        assert.equal(new SB3Creator().decompile(new SB3Creator().parse(first)), first, line);
    }
});
