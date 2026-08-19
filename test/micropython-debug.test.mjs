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
    // The sim strips the RS prefix before input() returns; compare the last char.
    assert.match(r.py, /c = c\[-1:\]/, 'compares the RS-stripped command char');
    assert.match(r.py, /if c == 's':[\s\S]*_bw_step = 1/, 'step resume arms the next block');
    assert.match(r.py, /if c == 'c':/, 'continue resume');
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

// ---- state inspection on halt: the 8051-parity panes (variables, board) ----

function mkVars() {
    const c = new SB3Creator();
    c.parse('DEVICE MICROBIT:\n  WHEN started:\n    set score to 0\n    set score to score + 1\n    show number score\n');
    return c;
}

test('the debug build lists the user variables for readback (the memory pane)', () => {
    const r = mkVars().generateMicroPython(undefined, { debug: true });
    assert.match(r.py, /_bw_vnames = \["score"\]/, 'user variable names captured');
    assert.match(r.py, /def _bw_dump\(\):/, 'dump helper emitted');
    // \x1eV prefixes a JSON object of {name: value} — serialized by the
    // emitted _bw_json, not the json module: the sim firmware ships without
    // json (measured 2026-08-19; the import made the dump silently vanish).
    assert.match(r.py, /print\('\\x1eV' \+ _bw_json\(v\)\)/, 'variables serialized as \\x1eV+json');
    assert.ok(!/import json/.test(r.py), 'no json dependency in the debug harness');
});

test('halting dumps state; a plain marker does not (dump only on pause)', () => {
    const r = mkVars().generateMicroPython(undefined, { debug: true });
    // _bw_dump() is called inside the halt branch, right after the \x1e! marker
    assert.match(r.py, /print\('\\x1e!' \+ str\(n\)\)\n\s*_bw_dump\(\)/, 'dump fires on halt');
    // exactly one call site (the halt), not per-marker
    const calls = (r.py.match(/^\s*_bw_dump\(\)$/gm) || []).length;
    assert.equal(calls, 1, `_bw_dump called once (on halt), got ${calls}`);
});

test('micro:bit debug build snapshots the board (the pin/sensor-status pane)', () => {
    const r = mkVars().generateMicroPython(undefined, { debug: true });
    assert.match(r.py, /print\('\\x1eB' \+ _bw_json\(d\)\)/, 'board serialized as \\x1eB+json');
    assert.match(r.py, /display\.get_pixel\(x, y\)/, 'display grid snapshot');
    assert.match(r.py, /button_a\.is_pressed\(\)/, 'button state snapshot');
    assert.match(r.py, /accelerometer\.get_values\(\)/, 'accelerometer snapshot');
});

test('a Pico debug build inspects variables but no micro:bit board', () => {
    const c = new SB3Creator();
    c.parse('DEVICE PICO:\n  WHEN started:\n    set score to 0\n    say score\n');
    const r = c.generateMicroPython(undefined, { debug: true });
    assert.match(r.py, /_bw_vnames = /, 'variables still captured on Pico');
    assert.ok(!/display\.get_pixel/.test(r.py), 'no micro:bit display API on Pico');
    assert.ok(!/accelerometer/.test(r.py), 'no micro:bit accelerometer on Pico');
});

test('state inspection stays opt-in: release build has no dump/vnames', () => {
    const r = mkVars().generateMicroPython();
    assert.ok(!/_bw_dump/.test(r.py), 'no dump helper in release');
    assert.ok(!/_bw_vnames/.test(r.py), 'no variable list in release');
    assert.ok(!/\\x1eV/.test(r.py) && !/\\x1eB/.test(r.py), 'no state markers in release');
});

// ---- call stack: proc enter/exit markers (the stack pane) ----

function mkProc() {
    const c = new SB3Creator();
    c.parse('DEVICE MICROBIT:\n  DEFINE flash box:\n    show text "x"\n    clear display\n  WHEN started:\n    flash box\n    show text "done"\n');
    return c;
}

test('debug build brackets each procedure with enter/exit markers (the stack)', () => {
    const r = mkProc().generateMicroPython(undefined, { debug: true });
    assert.match(r.py, /def _bw_enter\(k\):/, 'enter helper');
    assert.match(r.py, /def _bw_exit\(\):/, 'exit helper');
    assert.match(r.py, /print\('\\x1e>' \+ str\(k\)\)/, 'enter marker is RS> + index');
    assert.match(r.py, /print\('\\x1e<'\)/, 'exit marker is RS<');
    // the proc body is wrapped: enter, then try:, then the body, then finally: exit
    assert.match(r.py, /_bw_enter\(0\)\n\s*try:[\s\S]*finally:\n\s*_bw_exit\(\)/,
        'proc body wrapped in try/finally with enter/exit');
});

test('procNames maps each proc index to its display name', () => {
    const r = mkProc().generateMicroPython(undefined, { debug: true });
    assert.deepEqual(r.procNames, ['flash box'], 'proccode with %s/%b stripped');
});

test('release build has no call-stack instrumentation (opt-in)', () => {
    const r = mkProc().generateMicroPython();
    assert.ok(!/_bw_enter/.test(r.py) && !/_bw_exit/.test(r.py), 'no enter/exit in release');
    assert.equal(r.procNames, undefined, 'no procNames in release');
    // the release proc is the bare generator, no try/finally wrapper
    assert.ok(!/finally:\n\s*_bw_exit/.test(r.py));
});

test('the call-stack wrap keeps the procedure a valid generator (yield survives)', () => {
    // The dead yield must stay inside the function so it is still a generator
    // (calls are `yield from`). It moves under try:, not out.
    //
    // The guard is `if _bw_false:`, NOT `if False:` — this test asserted the
    // literal `if False:` until b6eb09b, which is precisely the idiom that does
    // not work: MicroPython constant-folds `if False:` away, the body keeps no
    // yield, the function compiles as an ordinary one returning None, and the
    // `yield from` on it raises "'NoneType' object isn't iterable". Measured on
    // a stock RPI_PICO build, v1.28.0, sys.settrace absent.
    const r = mkProc().generateMicroPython(undefined, { debug: true });
    assert.match(r.py, /try:[\s\S]*if _bw_false:\n\s*yield 0[\s\S]*finally:/,
        'the generator-forcing yield stays inside the try body');
});
