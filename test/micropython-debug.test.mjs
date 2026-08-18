/**
 * The micro:bit instrumentation debugger (Path A, MICROBIT-NATIVE.md Stage 3):
 * generateMicroPython(project, {debug:true}) instruments each block with a
 * position marker over serial + returns a block-id map, so the debug host can
 * track position live — the read-position lever, no VM stepping. Release builds
 * must be byte-identical to before (the instrumentation is opt-in).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

function mk() {
    const c = new SB3Creator();
    c.parse('DEVICE MICROBIT:\n  WHEN started:\n    show text "hi"\n    clear display\n    show text "bye"\n');
    return c;
}

test('release build carries no instrumentation (opt-in only)', () => {
    const r = mk().generateMicroPython();
    assert.ok(r.ok);
    assert.ok(!/_bw_pos/.test(r.py), 'no markers in a release build');
    assert.equal(r.positions, undefined, 'no positions map in a release build');
});

test('the instrumentation is purely additive (release is an in-order subsequence)', () => {
    // Every line of the release build must appear, in order, in the debug build:
    // the debug build only ADDS lines (the helper + markers), never rewrites an
    // existing one. Robust to the helper's exact shape.
    const rel = mk().generateMicroPython().py.split('\n');
    const dbg = mk().generateMicroPython(undefined, { debug: true }).py.split('\n');
    let j = 0;
    for (const line of rel) {
        while (j < dbg.length && dbg[j] !== line) j++;
        assert.ok(j < dbg.length, `release line missing from debug (in order): ${JSON.stringify(line)}`);
        j++;
    }
});

test('a breakpoint build emits the halt + resume loop (pause/step/continue)', () => {
    const c = mk();
    const bp = c.generateMicroPython(undefined, { debug: true }).positions[1].block;
    const r = c.generateMicroPython(undefined, { debug: true, breakpoints: [bp] });
    // the halted marker, the spin on serial-in, and both resume commands
    assert.match(r.py, /print\('\\x1e!' \+ str\(n\)\)/, 'halted-at-block marker');
    assert.match(r.py, /while True:[\s\S]*c = input\(\)/, 'spins on serial-in while halted');
    assert.match(r.py, /if c == '\\x1es':[\s\S]*_bw_step = 1/, 'step resume arms the next block');
    assert.match(r.py, /if c == '\\x1ec':/, 'continue resume');
    assert.match(r.py, /except Exception:\n\s*return/, 'no debug host -> logpoint, never hangs');
});

test('a marker precedes every block, in order, mapped to a source block', () => {
    const r = mk().generateMicroPython(undefined, { debug: true });
    assert.match(r.py, /def _bw_pos\(n, bp=0\):/, 'helper emitted');
    const marks = r.py.match(/_bw_pos\((\d+)\)/g) || [];
    assert.equal(marks.length, 3, `three statements → three markers, got ${marks.length}`);
    // indices are 0,1,2 in order
    assert.deepEqual(marks, ['_bw_pos(0)', '_bw_pos(1)', '_bw_pos(2)']);
    // positions map: one entry per marker, each a real block id
    assert.equal(r.positions.length, 3);
    for (const p of r.positions) assert.equal(typeof p.block, 'string');
    // the marker sits immediately before its statement
    const lines = r.py.split('\n').map(l => l.trim());
    const i = lines.indexOf('_bw_pos(0)');
    assert.match(lines[i + 1], /display\.scroll\('hi'\)/, 'marker 0 precedes the first block');
});

test('breakpoints flag their block with the bp marker', () => {
    // Block ids are minted per parse, so the breakpoint id MUST come from the
    // same instance's positions map.
    const c = mk();
    const bpBlock = c.generateMicroPython(undefined, { debug: true }).positions[1].block;
    const r = c.generateMicroPython(undefined, { debug: true, breakpoints: [bpBlock] });
    assert.match(r.py, /_bw_pos\(1, 1\)/, 'the breakpointed block passes bp=1');
    assert.ok(!/_bw_pos\(0, 1\)/.test(r.py), 'non-breakpoint blocks do not');
});

test('the markers use RS (0x1e), which cannot collide with program text', () => {
    const r = mk().generateMicroPython(undefined, { debug: true });
    assert.match(r.py, /print\('\\x1e' \+ str\(n\)\)/, 'position marker is RS-prefixed');
});
