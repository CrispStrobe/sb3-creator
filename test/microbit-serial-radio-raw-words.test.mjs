/**
 * Serial polling, buffer concat, raw radio packets and the bluetooth uart's buffer, as words
 * (brickwright-lite, 2026-11-01): each reads, becomes the MicroPython it stands for, and is a fixed
 * point through decompile; the serial reads share one input buffer.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const program = (body) => `DEVICE MICROBIT:\n  WHEN started:\n${body.map((l) => `    ${l}`).join('\n')}\n`;
const CASES = [
    ['set v to serial has data until comma', '_bw_ser_has(",")'],
    ['set v to concat buffers a and b', '(bytearray(a) + bytearray(b))'],
    ['radio send raw packet b', "radio.send_bytes(b'\\x01\\x00\\x01' + bytes(b)[:32])"],
    ['set v to read raw radio packet', '_radio_last_raw'],
    ['set v to bluetooth uart read buffer', 'bytearray(0)']
];

test('each word becomes the MicroPython it stands for', () => {
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
        assert.equal(new SB3Creator().decompile(new SB3Creator().parse(first)), first, line);
    }
});

test('a program that reads the raw packet gets the receiver that keeps it, and the serial reads share one buffer', () => {
    const c = new SB3Creator();
    c.parse(program(['set v to read raw radio packet', 'print v', 'set s to serial read string', 'print s']));
    const r = c.generateMicroPython();
    assert.ok(r.ok);
    assert.match(r.py, /_radio_last_raw = bytearray\(p\) \+ struct\.pack\('<i', f\[1\]\)/);
    assert.match(r.py, /def _bw_ser_pump\(\)/);
    assert.match(r.py, /_bw_sbuf\[0\] \+= c/);
});
