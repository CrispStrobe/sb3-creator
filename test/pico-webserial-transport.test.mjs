// Exercise the actual WebSerial adapter with real streams: serial packets may
// split a UTF-8 character, and a caller may need EOF to fail a pending session.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ReadableStream, WritableStream} from 'node:stream/web';
import {webSerialTransport} from '../src/utils/picoRepl.js';

const encoder = new TextEncoder();

function portWith(chunks = [], {ended = false, cancelError = null} = {}) {
    const events = [];
    const writes = [];
    const readable = new ReadableStream({
        start(controller) {
            for (const chunk of chunks) controller.enqueue(chunk);
            if (ended) controller.close();
        },
        cancel() {
            events.push('cancel');
            if (cancelError) throw cancelError;
        }
    });
    const writable = new WritableStream({
        write(bytes) { writes.push(Uint8Array.from(bytes)); }
    });
    return {
        readable, writable, events, writes,
        async close() {
            assert.equal(readable.locked, false, 'release the reader before closing the port');
            assert.equal(writable.locked, false, 'release the writer before closing the port');
            events.push('close');
        }
    };
}

test('UTF-8 output survives every serial split through two-, three- and four-byte characters', async () => {
    const text = 'Aä€🧱Z';
    const bytes = encoder.encode(text);
    for (let split = 1; split < bytes.length; split++) {
        const port = portWith([bytes.slice(0, split), bytes.slice(split)]);
        const transport = webSerialTransport(port);
        try {
            const output = await transport.read() + await transport.read();
            assert.equal(output, text, `serial split at byte ${split} must not replace characters`);
        } finally {
            await transport.close();
        }
    }
});

test('EOF remains an empty string by default and when explicitly requested', async () => {
    for (const options of [undefined, {throwOnEof: false}]) {
        const port = portWith([encoder.encode('ready>')], {ended: true});
        const transport = webSerialTransport(port, options);
        try {
            assert.equal(await transport.read(), 'ready>');
            assert.equal(await transport.read(), '');
            assert.equal(await transport.read(), '', 'repeated EOF keeps the compatible result');
        } finally {
            await transport.close();
        }
    }
});

test('opt-in EOF rejects with a disconnect error after delivering preceding output', async () => {
    const port = portWith([encoder.encode('ready>')], {ended: true});
    const transport = webSerialTransport(port, {throwOnEof: true});
    try {
        assert.equal(await transport.read(), 'ready>');
        await assert.rejects(transport.read(), {
            name: 'Error', message: 'The serial adapter disconnected.'
        });
    } finally {
        await transport.close();
    }
});

test('writes preserve UTF-8 and close releases a pending read and both stream locks', async () => {
    const port = portWith();
    const transport = webSerialTransport(port);
    assert.equal(port.readable.locked, true);
    assert.equal(port.writable.locked, true);
    const pendingRead = transport.read();
    await transport.write('ä🧱\n');
    await transport.close();
    assert.equal(await pendingRead, '');
    assert.deepEqual(port.writes, [encoder.encode('ä🧱\n')]);
    assert.deepEqual(port.events, ['cancel', 'close']);
    assert.equal(port.readable.locked, false);
    assert.equal(port.writable.locked, false);
});

test('a failed reader cancellation still releases the locks and closes the port', async () => {
    const port = portWith([], {cancelError: new Error('adapter already gone')});
    const transport = webSerialTransport(port);
    await transport.close();
    assert.deepEqual(port.events, ['cancel', 'close']);
    assert.equal(port.readable.locked, false);
    assert.equal(port.writable.locked, false);
});
