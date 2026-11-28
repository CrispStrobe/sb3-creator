import test from 'node:test';
import assert from 'node:assert/strict';
import {webSerialTransport} from '../src/utils/picoRepl.js';

function port(chunks) {
    return {
        readable: {getReader: () => ({read: async () => chunks.length ? {done: false, value: chunks.shift()} : {done: true}})},
        writable: {getWriter: () => ({write: async () => {}})}
    };
}

test('WebSerial preserves UTF-8 split between reads', async () => {
    const bytes = new TextEncoder().encode('🌱');
    const transport = webSerialTransport(port([bytes.slice(0, 2), bytes.slice(2)]));
    assert.equal(await transport.read(), '');
    assert.equal(await transport.read(), '🌱');
    assert.equal(await transport.read(), '');
});

test('WebSerial opts in to a distinct disconnection failure', async () => {
    const transport = webSerialTransport(port([]), {throwOnEof: true});
    await assert.rejects(transport.read(), /serial adapter disconnected/);
    assert.equal(await webSerialTransport(port([])).read(), '', 'legacy EOF behavior remains available');
});
