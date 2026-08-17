// MicroPython ↔ pseudocode, Pico flavor — the wiring contract must
// survive the round trip. This is the owner's REAL calculator: the pin
// map is the hardware's, and 'retargetting must NOT disturb the exact
// PIN wirings' extends to the transpilers — emit MicroPython, read it
// back, and every PIN declaration must come home byte-equivalent
// (name, coordinate, direction, polarity).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { join } from 'path';
import SB3Creator from '../src/utils/sb3Creator.js';
import mp2bw from '../src/utils/micropythonToPseudocode.js';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

test('70-calculator: generateMicroPython carries the real build', () => {
    const src = readFileSync(join(EXAMPLES, '70-calculator/program.bw'), 'utf8');
    const c = new SB3Creator();
    c.parse(src);
    const r = c.generateMicroPython();
    assert.equal(r.ok, true, (r.reasons || []).join('; '));
    assert.deepEqual(r.warnings, [], 'every verb lowers — no degradations');
    const py = r.py;
    // The hardware truths, verbatim:
    assert.match(py, /I2C\(0, sda=Pin\(0\), scl=Pin\(1\)/, 'bus on GP0/GP1, I2C0');
    assert.match(py, /_pin_b9 = Pin\(2, Pin\.IN, Pin\.PULL_DOWN\)/,
        'keys to +3V3: internal pull-DOWN, pressed = HIGH');
    assert.match(py, /0xA0, /, '180-degree mount: segment remap off');
    assert.match(py, /0xC0, /, '180-degree mount: COM scan normal');
    assert.match(py, /0x8D, 0x14, /, 'charge pump on');
    assert.match(py, /COL_OFFSET = 2/, 'SH1106 page-mode window');
    assert.match(py, /def proc_do_show_screen/, 'DEFINEs lower to generators');
    assert.match(py, /yield from proc_do_apply_pending\(\)/, 'calls thread the scheduler');
    assert.match(py, /def _eq\(/, 'shared helpers are emitted, not assumed');
});

test('70-calculator: MicroPython → pseudocode round-trips every PIN', () => {
    const src = readFileSync(join(EXAMPLES, '70-calculator/program.bw'), 'utf8');
    const c = new SB3Creator();
    c.parse(src);
    const authored = c.project.stc.pins.map((p) => ({
        name: p.name, where: p.where, direction: p.direction, activeLow: !!p.activeLow,
    }));
    const r = c.generateMicroPython();
    assert.equal(r.ok, true);

    const back = mp2bw(r.py);
    const c2 = new SB3Creator();
    c2.parse(back.pseudocode);
    const returned = new Map(c2.project.stc.pins.map((p) => [p.name,
        { where: p.where, direction: p.direction, activeLow: !!p.activeLow }]));

    for (const p of authored) {
        const q = returned.get(p.name);
        assert.ok(q, `pin ${p.name} survives the round trip`);
        assert.equal(q.where, p.where, `${p.name} stays on ${p.where}`);
        assert.equal(q.direction, p.direction, `${p.name} keeps its direction`);
        assert.equal(q.activeLow, p.activeLow, `${p.name} keeps its polarity`);
    }
});
