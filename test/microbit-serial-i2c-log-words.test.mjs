/**
 * The serial, I2C, SPI, buffer, sound and log words added for brickwright-lite's
 * micro:bit namespace sweep (2026-11-01): each reads, becomes the MicroPython
 * module call it stands for, and is a fixed point through decompile. The lines
 * are the ones lite's importer writes for MakeCode's calls.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const program = (body) => `DEVICE MICROBIT:\n  WHEN started:\n${body.map((l) => `    ${l}`).join('\n')}\n`;
const CASES = [
    ['serial write text "ab"', "print(\"ab\", end='')"],
    ['serial write number 3', "print(3, end='')"],
    ['set b to create buffer 2', 'bytearray('],
    ['serial write buffer b', 'uart.write(bytes(b))'],
    ['set v to serial read buffer 2', '_bw_ser_buf(2)'],
    ['set s to serial read string', '_bw_ser_all()'],
    ['set s to serial read until comma', '_bw_ser_until(",")'],
    ['set b to i2c read buffer at 30 size 2', 'i2c.read(int(30), int(2))'],
    ['i2c write buffer b to 30', 'i2c.write(int(30), bytes(b))'],
    ['set n to i2c read uint16le at 30', "_bw_buf_get(bytearray(i2c.read(int(30), 2)), 'uint16le', 0)"],
    ['i2c write uint16le 513 to 30', "_bw_i2c_wn(int(30), 'uint16le', 513, 2)"],
    ['spi frequency 500000', '_bw_spi_set(baudrate=int(500000))'],
    ['spi format 8 mode 3', '_bw_spi_set(bits=int(8), mode=int(3))'],
    ['spi pins mosi P15 miso P14 sck P13', '_bw_spi_set(mosi=pin15, miso=pin14, sclk=pin13)'],
    ['set r to spi transfer 7', '_bw_spi_byte(7)'],
    ['spi transfer buffer b into c', 'spi.write_readinto(bytes(b), c)'],
    ['set n to size of float64be', '8'],
    ['set b to buffer from text "hi"', 'bytearray(str("hi").encode())'],
    ['set volume to 100', 'set_volume(_bw_vol[0])'],
    ['speaker off', 'speaker.off()'],
    ['set log columns "a" and "b"', "_bw_log_cfg([\"a\", \"b\"])"],
    ['log timestamp seconds', '_bw_log_cfg(None, log.SECONDS)'],
    ['log mirror on', 'log.set_mirroring(True)'],
    ['delete log', 'log.delete()'],
    ['delete log fully', 'log.delete(full=True)']
];

test('each word becomes the MicroPython call it stands for', () => {
    for (const [line, fragment] of CASES) {
        const c = new SB3Creator();
        // a reporter's value is used (print), or the variable it is set to would be dropped
        const set = /^set (\w+) to /.exec(line);
        c.parse(program(set ? [line, `print ${set[1]}`] : [line]));
        const r = c.generateMicroPython();
        assert.ok(r.ok, `${line}: ${JSON.stringify(r.reasons)}`);
        assert.ok(r.py.includes(fragment), `${line}: wanted ${fragment}\n${r.py.split('\n').filter((l) => /_task_0|^    /.test(l)).join('\n')}`);
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

test('radio packets are MakeCode\'s (radio.ts), behind MicroPython\'s 01 00 01 header', () => {
    const c = new SB3Creator();
    c.parse(program(['radio on group 1 power 6', 'radio send value "k" = 5']));
    const r = c.generateMicroPython();
    assert.ok(r.ok);
    assert.match(r.py, /radio\.config\(group=int\(1\), power=int\(6\), length=35\)/);
    assert.match(r.py, /radio\.send_bytes\(_bw_pkt\(1, 5, 'k'\)\)/);
    assert.match(r.py, /struct\.pack\('<BBBBIi', 1, 0, 1, t,/);
});
