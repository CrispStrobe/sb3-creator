// The vendored flasher and the node port adapter that lets `bw flash`
// use it. The flash PROTOCOL is proven byte-exactly upstream
// (stc-compiler scripts/test-flash.mjs, mock bootloaders); here we
// confirm two things that could break in the vendoring/wiring:
//   1. the vendored flasher.js still drives a port through the exact
//      surface nodeSerialPort presents (synchronous in-memory port —
//      no sockets, no hang), and
//   2. nodeSerialPort exposes that surface and, crucially, does NOT
//      expose setSignals (the contract flashAvr reads to decide whether
//      it can pulse DTR).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flashStm32 } from '../src/utils/flasher.js';
import { nodeSerialPort } from '../src/utils/nodeSerialPort.js';

/** A synchronous mock STM32 ROM behind the Web-Serial port shape. */
function mockStm32Port () {
    const flash = new Map();
    let erased = false, state = 'reset', pending = 0, out = [], inbox = [];
    const log = [];
    const say = (b) => { for (const x of b) out.push(x); };
    const take = (n) => inbox.splice(0, n);
    function pump () {
        for (;;) {
            if (state === 'reset') {
                if (!inbox.length) return;
                const [b] = take(1);
                if (b !== 0x7f) { say([0x1f]); continue; }
                say([0x79]); state = 'idle';
            } else if (state === 'idle') {
                if (inbox.length < 2) return;
                const [cmd, comp] = take(2);
                if (((~cmd) & 0xff) !== comp) { log.push('badcomp'); say([0x1f]); continue; }
                say([0x79]);
                if (cmd === 0x02) say([1, 0x04, 0x44, 0x79]);
                else if (cmd === 0x44) state = 'erase';
                else if (cmd === 0x31) state = 'waddr';
                else if (cmd === 0x21) state = 'goaddr';
                else { log.push('unknown'); say([0x1f]); }
            } else if (state === 'erase') {
                if (inbox.length < 3) return;
                const f = take(3);
                if ((f[0] ^ f[1]) !== f[2]) say([0x1f]);
                else { erased = true; flash.clear(); log.push('erase'); say([0x79]); }
                state = 'idle';
            } else if (state === 'waddr' || state === 'goaddr') {
                if (inbox.length < 5) return;
                const f = take(5);
                if ((f[0] ^ f[1] ^ f[2] ^ f[3]) !== f[4]) { log.push('badaddrcs'); say([0x1f]); state = 'idle'; continue; }
                const addr = ((f[0] << 24) | (f[1] << 16) | (f[2] << 8) | f[3]) >>> 0;
                if (state === 'goaddr') { log.push('go:' + addr.toString(16)); say([0x79]); state = 'idle'; continue; }
                pending = addr; say([0x79]); state = 'wdata';
            } else if (state === 'wdata') {
                if (!inbox.length) return;
                const need = inbox[0] + 1;
                if (inbox.length < 1 + need + 1) return;
                const f = take(1 + need + 1);
                const head = f[0], data = f.slice(1, 1 + need);
                const cs = data.reduce((a, b) => a ^ b, head);
                if (cs !== f[f.length - 1]) { log.push('baddatacs'); say([0x1f]); }
                else { data.forEach((b, i) => flash.set(pending + i, b)); say([0x79]); }
                state = 'idle';
            }
        }
    }
    return {
        log, flash,
        port: {
            async open () {}, async close () {},
            get writable () { return { getWriter: () => ({ async write (bytes) { for (const b of bytes) inbox.push(b); pump(); }, releaseLock () {} }) }; },
            get readable () {
                return { getReader: () => ({
                    async read () {
                        // Wait a tick for pump() output, like a real port's
                        // async delivery; resolves as soon as bytes exist.
                        for (let i = 0; i < 200 && !out.length; i++) await new Promise((r) => setTimeout(r, 1));
                        if (!out.length) return { value: undefined, done: true };
                        return { value: Uint8Array.from(out.splice(0, out.length)), done: false };
                    },
                    async cancel () {}, releaseLock () {},
                }) };
            },
        },
    };
}

test('the vendored flasher drives the port surface: STM32 byte-for-byte', async () => {
    const m = mockStm32Port();
    const image = Uint8Array.from({ length: 513 }, (_, i) => (i * 5 + 1) & 0xff);
    const done = await flashStm32(m.port, image, { log: () => {} });
    assert.equal(done.productId, 0x444);
    assert.equal(done.bytes, 516, 'padded to a word multiple');
    for (let i = 0; i < image.length; i++) {
        assert.equal(m.flash.get(0x08000000 + i), image[i], `byte ${i}`);
    }
    assert.ok(m.log.includes('erase') && m.log.some((l) => l === 'go:8000000'));
    assert.ok(!m.log.some((l) => l.startsWith('bad')), 'no framing rejections');
});

test('nodeSerialPort exposes the flasher surface and withholds setSignals', () => {
    const p = nodeSerialPort('/dev/null');
    assert.equal(typeof p.open, 'function');
    assert.equal(typeof p.close, 'function');
    assert.equal(typeof p.writable.getWriter, 'function');
    assert.equal(typeof p.readable.getReader, 'function');
    // The load-bearing absence: flashAvr checks `if (port.setSignals)` to
    // decide whether it can pulse DTR. A no-op here would lie.
    assert.equal(p.setSignals, undefined, 'setSignals must be ABSENT, not a no-op');
});
