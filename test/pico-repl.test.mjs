// picoRepl protocol against a scripted MicroPython raw-REPL mock —
// the same framing mpremote speaks, verified without a device so the
// app's USB path has a tested core before it ever touches WebSerial.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPicoRepl, pyBytesLiteral } from '../src/utils/picoRepl.js';

/** A mock device: answers the raw-REPL dance the way MicroPython does. */
function mockDevice() {
    const files = new Map();
    let inbox = '';
    let outbox = '';
    let raw = false;
    let resets = 0;
    const respond = (t) => { outbox += t; };
    const feed = (text) => {
        inbox += text;
        for (;;) {
            if (!raw) {
                const i = inbox.indexOf('\x01');
                if (i < 0) { inbox = ''; return; }
                inbox = inbox.slice(i + 1);
                raw = true;
                respond('raw REPL; CTRL-B to exit\r\n>');
                continue;
            }
            if (inbox.startsWith('\x02')) { raw = false; inbox = inbox.slice(1); respond('\r\n>>> '); continue; }
            const d = inbox.indexOf('\x04');
            if (d < 0) return;
            const code = inbox.slice(0, d);
            inbox = inbox.slice(d + 1);
            // "execute": emulate the handful of programs deployMainPy sends
            let stdout = '';
            if (/^f = open\("main\.py", "wb"\)$/.test(code)) files.set('main.py', Buffer.alloc(0));
            else if (/^f\.write\((b".*")\)$/s.test(code)) {
                const lit = /^f\.write\((b".*")\)$/s.exec(code)[1];
                // eslint-disable-next-line no-eval — the mock decodes its own literal
                const bytes = Buffer.from(eval(lit.slice(1)), 'latin1'); // bytes literal: byte-per-char
                files.set('main.py', Buffer.concat([files.get('main.py'), bytes]));
            } else if (/os\.stat\("main\.py"\)/.test(code)) stdout = String(files.get('main.py').length) + '\r\n';
            else if (/machine\.reset\(\)/.test(code)) resets++;
            respond('OK' + stdout + '\x04' + '\x04' + '>');
        }
    };
    return {
        files, resetCount: () => resets,
        transport: {
            async write(t) { feed(t); },
            async read() {
                if (!outbox) return new Promise((r) => setTimeout(() => r(''), 5));
                const t = outbox; outbox = ''; return t;
            },
        },
    };
}

test('pyBytesLiteral: escapes and non-ASCII round-trip as UTF-8', () => {
    const lit = pyBytesLiteral('a"b\\c\nä');
    // decodes in JS the same way python would
    // eslint-disable-next-line no-eval
    const bytes = Buffer.from(eval(lit.slice(1)), 'latin1');
    assert.equal(bytes.toString('utf8'), 'a"b\\c\nä');
});

test('deployMainPy: raw REPL dance, chunked write, size check, reset', async () => {
    const dev = mockDevice();
    const repl = createPicoRepl(dev.transport, { timeoutMs: 2000 });
    const py = '# calculator\nprint("Taschenrechner laeuft.")\n' + 'x = 1\n'.repeat(300);
    const written = await repl.deployMainPy(py);
    assert.equal(written, Buffer.byteLength(py, 'utf8'), 'device confirms every byte');
    assert.equal(dev.files.get('main.py').toString('utf8'), py, 'the file IS the program');
    assert.equal(dev.resetCount(), 1, 'rebooted into the stored program');
});

test('a device traceback surfaces as an error, not a silent success', async () => {
    const dev = mockDevice();
    // sabotage: stat answers with a traceback on the error channel
    const t = dev.transport;
    const origWrite = t.write.bind(t);
    t.write = async (text) => {
        if (/os\.stat/.test(text)) {
            await origWrite('\x01'); // keep the framing alive
            // fake: OK, empty stdout, traceback on err channel
            dev.transport.read = async () => 'OK\x04Traceback (most recent call last): boom\x04>';
            return;
        }
        return origWrite(text);
    };
    const repl = createPicoRepl(t, { timeoutMs: 1000 });
    await assert.rejects(() => repl.deployMainPy('x = 1\n'), /device error|timeout/);
});
