/**
 * Radio events as words (brickwright-lite, 2026-11-01): `radio raise event S V` sends a frame of the
 * event protocol (header 01 00 02, then CODAL's uint16 source, uint16 value, uint32 time) and a
 * receiver raises it on its own event bus; `radio listen for events` starts that receiver.
 * The layout is CODAL's MicroBitRadioEvent as recalled, NOT measured: pxsim's radio event is a
 * message between simulators with no byte layout.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const program = (body) => `DEVICE MICROBIT:\n  WHEN started:\n${body.map((l) => `    ${l}`).join('\n')}\n`;

test('raise sends the event frame, and the receiver raises what it hears', () => {
    const c = new SB3Creator();
    c.parse(program(['radio on group 1 power 6', 'radio raise event 2000 3']));
    const r = c.generateMicroPython();
    assert.ok(r.ok, JSON.stringify(r.reasons));
    assert.ok(r.py.includes("radio.send_bytes(b'\\x01\\x00\\x02' + struct.pack('<HHI', int(2000), int(3), running_time() & 0xffffffff))"));
    assert.ok(r.py.includes("_bw_raise(*struct.unpack('<HH', f[0][3:7]))"));
});

test('listening alone starts the receiver; both words are fixed points through decompile', () => {
    for (const line of ['radio listen for events', 'radio raise event 2000 3']) {
        const first = new SB3Creator().decompile(new SB3Creator().parse(program([line])));
        assert.equal(new SB3Creator().decompile(new SB3Creator().parse(first)), first, line);
    }
    const c = new SB3Creator();
    c.parse(program(['radio on group 1 power 6', 'radio listen for events']));
    assert.ok(c.generateMicroPython().py.includes('def _bw_radio_rx'));
});
