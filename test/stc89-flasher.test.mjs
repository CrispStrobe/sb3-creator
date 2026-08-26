import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    flashStc, readStc89Packet, stc89Baud, stc89Packet, stc89Status,
} from '../src/utils/flasher.js';

const bytes = (hex) => Uint8Array.from(hex.trim().split(/\s+/).map((b) => parseInt(b, 16)));
const hex = (data) => [...data].map((b) => b.toString(16).padStart(2, '0')).join(' ');

// Captured from the physical F002/STC89C52RC now on the YL-39 board. These
// are an independent oracle for the JS implementation: the expected bytes
// came from stcgal's serial capture, not from the packet builder below.
const STATUS = bytes(`
46 b9 68 00 3a 00 0a 79 0a 79 0a 79 0a 79 0a 79 0a 79 0a 79 0a 79
66 43 fd f0 02 82 ef f6 ae f3 ee f1 ca cc 72 1b f3 df fe 8c ed f6 ee e7
ee fb 6a c8 9d 57 df 7f de fd ee 04 aa 16`);

test('STC89 packet builder reproduces physical-chip frames byte for byte', () => {
    assert.equal(hex(stc89Packet([0x8f, 0xff, 0xfd, 0x00, 0x06, 0xa0, 0x81])),
        '46 b9 6a 00 0c 8f ff fd 00 06 a0 81 28 16');
    assert.equal(hex(stc89Packet([0x8e, 0xff, 0xfd, 0x00, 0x06, 0xa0])),
        '46 b9 6a 00 0b 8e ff fd 00 06 a0 a5 16');
    assert.equal(hex(stc89Packet([0x82])), '46 b9 6a 00 06 82 f2 16');
});

test('STC89 greeting identifies the connected F002 and its measured clock', async () => {
    let at = 0;
    const io = { async read(count) { const out = STATUS.subarray(at, at + count); at += count; return out; } };
    const payload = await readStc89Packet(io);
    const info = stc89Status(payload, 2400);
    assert.equal(info.magic, 0xf002);
    assert.equal(info.clockHz, 11_030_400);
    assert.equal(info.bslVersion, 0x66);
    assert.equal(info.option, 0xfd);
    assert.equal(stc89Baud(info.clockHz, 115200), 0xfd);
});

test('STC89 parser rejects a corrupted physical greeting', async () => {
    const bad = STATUS.slice();
    bad[30] ^= 1;
    let at = 0;
    const io = { async read(count) { const out = bad.subarray(at, at + count); at += count; return out; } };
    await assert.rejects(readStc89Packet(io), /checksum mismatch/);
});

function mcu89(data) {
    const body = [0x68, (data.length + 5) >> 8, (data.length + 5) & 0xff, ...data];
    return Uint8Array.from([0x46, 0xb9, ...body,
        body.reduce((a, b) => (a + b) & 0xff, 0), 0x16]);
}

class MockStc89Port {
    constructor() {
        this.opens = [];
        this.commands = [];
        this.queue = [];
        this.waiter = null;
        this.deferred = null;
        this.cancelRead = null;
    }
    enqueue(value) {
        if (this.waiter) { const take = this.waiter; this.waiter = null; take({ value, done: false }); }
        else this.queue.push(value);
    }
    async open(options) {
        this.opens.push(options.baudRate);
        if (this.deferred) { this.queue.push(this.deferred); this.deferred = null; }
    }
    async close() {}
    get writable() {
        return { getWriter: () => ({
            write: async (packet) => {
                if (packet.length === 1 && packet[0] === 0x7f) {
                    this.enqueue(STATUS);
                    return;
                }
                const data = packet.subarray(5, packet.length - 2);
                const cmd = data[0];
                this.commands.push(cmd);
                if (cmd === 0x8f || cmd === 0x8e) this.deferred = mcu89(data);
                else if (cmd === 0x80) this.enqueue(mcu89([0x80]));
                else if (cmd === 0x84) this.enqueue(mcu89([0x80, 0xf0, 0x02, 1, 2, 3, 4, 5]));
                else if (cmd === 0x00) {
                    const block = data.subarray(7);
                    this.enqueue(mcu89([0x80, block.reduce((a, b) => (a + b) & 0xff, 0)]));
                } else if (cmd === 0x8d) this.enqueue(mcu89(data));
            },
            releaseLock() {},
        }) };
    }
    get readable() {
        return { getReader: () => ({
            read: () => {
                if (this.queue.length) return Promise.resolve({ value: this.queue.shift(), done: false });
                return new Promise((resolve) => {
                    this.waiter = resolve;
                    this.cancelRead = () => { this.waiter = null; resolve({ done: true }); };
                });
            },
            cancel: async () => { this.cancelRead?.(); },
        }) };
    }
}

test('complete STC89 session switches baud, erases, writes and runs', async () => {
    const port = new MockStc89Port();
    const result = await flashStc(port, ':0100000002FD\n:00000001FF\n');
    assert.deepEqual(port.opens, [2400, 115200, 2400, 115200]);
    assert.deepEqual(port.commands,
        [0x8f, 0x8e, 0x80, 0x80, 0x80, 0x80, 0x84,
            0x00, 0x00, 0x00, 0x00, 0x8d, 0x82]);
    assert.equal(result.protocol, 'stc89');
    assert.equal(result.bytes, 1);
    assert.equal(result.padded, 512);
});
