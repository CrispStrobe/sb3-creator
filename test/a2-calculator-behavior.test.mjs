// Functional drive of examples/78-a2-calculator: the generated JS is run
// headlessly with a pin-level keypad simulation (rows driven by the program,
// columns read back through a scripted press), and the arithmetic, edit keys
// and display multiplex are asserted on absolute expected values — not trace
// identity (the fake-verification trap). This is the harness that caught the
// int-vs-float division divergence: C divides longs, JS divides floats, so
// portable programs must spell floor-division as (x - x mod 10) / 10.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import SB3Creator from '../src/utils/sb3Creator.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = readFileSync(join(root, 'examples/78-a2-calculator/program.bw'), 'utf8');

function buildHarness() {
    const c = new SB3Creator();
    c.parse(src);
    assert.equal((c.warnings || []).length, 0, JSON.stringify(c.warnings));
    let js = c.generateJavaScript();
    js = js.slice(0, js.indexOf('// run'));   // drop the auto-start tail
    const h = new Function(js + `
      return { input: s0_when_flag_clicked_2, display: s0_when_flag_clicked,
               vars: () => ({ shown, entry, acc, mem, op }), _stc12, scratch };
    `)();
    const rowState = { row0: false, row1: false, row2: false, row3: false };
    const state = { pressed: null, black: null };
    h._stc12.setPin = (name, v) => { if (name in rowState) rowState[name] = (v === 'on'); };
    h._stc12.readPin = (name) => {
        if (/^col[0-3]$/.test(name)) {
            if (state.pressed === null) return 0;
            const r = Math.floor(state.pressed / 4), col = state.pressed % 4;
            return rowState['row' + r] && name === 'col' + col ? 1 : 0;
        }
        if (/^k[1-4]$/.test(name)) return name === state.black ? 1 : 0;
        return 0;
    };
    const TAB = { font: [0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F],
                  walk: [1, 2, 4, 8, 16, 32, 64, 128] };
    h._stc12.tableIndex = (t, i) =>
        TAB[t][Math.max(0, Math.min(TAB[t].length - 1, Math.floor(i)))];
    const portWrites = [];
    h._stc12.setPort = (p, v) => portWrites.push([p, v]);
    return { h, state, portWrites };
}

class Done extends Error {}
const KEY = { '1': 0, '2': 1, '3': 2, 'A': 3, '4': 4, '5': 5, '6': 6, 'B': 7,
              '7': 8, '8': 9, '9': 10, 'C': 11, '*': 12, '0': 13, '#': 14, 'D': 15 };

function run(seq) {
    const { h, state } = buildHarness();
    const script = [];
    for (const k of seq) script.push(k, null);   // release between presses
    let tick = 0;
    h.scratch.wait = () => {
        tick++;
        if (tick <= script.length) {
            const s = script[tick - 1];
            if (typeof s === 'string' && /^k[1-4]$/.test(s)) { state.black = s; state.pressed = null; }
            else { state.black = null; state.pressed = s === null ? null : KEY[s]; }
        } else if (tick > script.length + 2) throw new Done();
    };
    try { h.input(); } catch (e) { if (!(e instanceof Done)) throw e; }
    return h.vars();
}

test('123 + 45 = 168', () => { assert.equal(run(['1','2','3','A','4','5','#']).shown, 168); });
test('chain 2 x 3 x 4 = 24 (left-to-right, no precedence)', () => {
    assert.equal(run(['2','C','3','C','4','#']).shown, 24);
});
test('division by zero is guarded to 0', () => {
    assert.equal(run(['9','D','0','#']).shown, 0);
});
test('K2 backspace: 78 -> 7, then 9 -> 79 (portable floor-division)', () => {
    assert.equal(run(['7','8','k2','9','#']).shown, 79);
});
test('K3/K4 memory survives K1 clear-all', () => {
    assert.equal(run(['4','2','k3','k1','k4']).shown, 42);
});
test('* clears the entry only; = without op starts a fresh entry', () => {
    assert.equal(run(['5','5','*','7','#','7','A','1','#']).shown, 8);
});

test('display boots to "0": font[0] on digit 0, digits 1-7 blank, walk select', () => {
    const { h, portWrites } = buildHarness();
    let dticks = 0;
    // MEASURED 2026-08-23 (scripts/threshold-probe.mjs --margin): the display
    // routine calls wait() exactly 8 times, so this bound has ZERO headroom —
    // green at 8, red at 7. That is the right state for a fixed sequence: one
    // extra wait is a behaviour change and should be seen, not absorbed.
    h.scratch.wait = () => { if (++dticks > 8) throw new Done(); };
    try { h.display(); } catch (e) { if (!(e instanceof Done)) throw e; }
    const segs = portWrites.filter(w => w[0] === 'segments').map(w => w[1]).slice(0, 8);
    const sels = portWrites.filter(w => w[0] === 'select').map(w => w[1]);
    assert.equal(segs[0], 0x3F, 'digit 0 shows font[0]');
    assert.ok(segs.slice(1).every(s => s === 0), 'leading digits blank: ' + JSON.stringify(segs));
    assert.deepEqual(sels.filter(v => v !== 0).slice(0, 8), [1, 2, 4, 8, 16, 32, 64, 128]);
    // the harness aborts inside the 9th wait (after its select-on), so pair
    // on/off over the 8 completed digits only
    for (let i = 0; i + 1 < 16; i += 2) {
        assert.notEqual(sels[i], 0, 'select on at ' + i);
        assert.equal(sels[i + 1], 0, 'select released at ' + (i + 1));
    }
});
