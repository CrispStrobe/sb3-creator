// The micro:bit device verbs — display, tone, radio — lift back to the dialect
// instead of riding along as grey blocks.
//
// The L3 reader-coverage audit's largest remaining degraded bucket was device
// verbs the reader kept verbatim: display.scroll/show/clear, music.pitch (the
// tone), and radio.config/on/send. Each is emitted by the scheduler backend and
// each now round-trips byte-for-byte. (The Pico OLED family — _oled.* — is a
// separate, larger I2C-driver shape and is not covered here.)
import {test} from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import micropythonToPseudocode from '../src/utils/micropythonToPseudocode.js';

const roundtrips = (prog) => {
    const c0 = new SB3Creator();
    c0.parse(prog);
    const src0 = c0.generateMicroPython().py;
    const {pseudocode, warnings} = micropythonToPseudocode(src0);
    const c1 = new SB3Creator();
    c1.parse(pseudocode);
    return {src0, src1: c1.generateMicroPython().py, pseudocode, warnings};
};

const DISPLAY = {
    'display "hi"': /display "hi"/,
    'clear display': /clear display/,
    'show text "yo"': /show text "yo"/,
    'scroll text "go" delay 100 ms': /scroll text "go" delay 100 ms/,
    'show pattern 0900909009000090000900000': /show pattern 0900909009000090000900000/
};

for (const [verb, re] of Object.entries(DISPLAY)) {
    test(`display verb round-trips: ${verb}`, () => {
        const r = roundtrips(`DEVICE MICROBIT\nWHEN flag clicked:\n  ${verb}\n`);
        assert.ok(!r.warnings.some(w => /grey block/.test(w)), `grey-blocked: ${JSON.stringify(r.warnings)}`);
        assert.match(r.pseudocode, re, 'the verb was not lifted to its dialect form');
        assert.equal(r.src1, r.src0, 'emit -> read -> emit was not identical');
    });
}

test('a tone (music.pitch wrapped in int()) round-trips — the old bare-digit match missed it', () => {
    const r = roundtrips('DEVICE MICROBIT\nWHEN flag clicked:\n  set buzzer to 440 hz\n');
    assert.ok(!r.warnings.some(w => /grey block/.test(w)), 'the tone was grey-blocked');
    assert.match(r.pseudocode, /set buzzer to 440 hz/, 'the tone was not lifted');
    assert.equal(r.src1, r.src0, 'tone emit -> read -> emit was not identical');
});

test('radio verbs round-trip: on (config+on), send number, send text', () => {
    const r = roundtrips('DEVICE MICROBIT\nWHEN flag clicked:\n  radio on group 1 power 6\n  radio send number 5\n  radio send text "hi"\n');
    assert.ok(!r.warnings.some(w => /grey block/.test(w)), `grey-blocked: ${JSON.stringify(r.warnings)}`);
    assert.match(r.pseudocode, /radio on group 1 power 6/);
    assert.match(r.pseudocode, /radio send number 5/);
    assert.match(r.pseudocode, /radio send text "hi"/);
    assert.equal(r.src1, r.src0, 'radio emit -> read -> emit was not identical');
});

test('a lone radio.on() with no config is NOT dropped — it stays a grey block', () => {
    // The pair lifts as `radio on group G power P`; an on() with no config has
    // no dialect verb, so it must survive as a grey block, not vanish. A reader
    // that deletes a statement it cannot lift is worse than one that keeps it.
    const src = 'from microbit import *\nimport radio\n\ndef bw_script():\n    radio.on()\n    display.clear()\n\nbw_script()\n';
    const {pseudocode, warnings} = micropythonToPseudocode(src);
    assert.ok(warnings.some(w => /grey block: "radio\.on\(\)/.test(w)), `not grey-blocked: ${JSON.stringify(warnings)}`);
    assert.match(pseudocode, /radio\.on\(\)/, 'the statement is gone from the pseudocode');
});
