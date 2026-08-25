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
      return { input: s0_when_flag_clicked,
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
    return { h, state };
}

class Done extends Error {}
const KEY = { '3': 0, '7': 1, 'B': 2, 'F': 3, '2': 4, '6': 5, 'A': 6, 'E': 7,
              '1': 8, '5': 9, '9': 10, 'D': 11, '0': 12, '4': 13, '8': 14, 'C': 15 };

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

test('123 + 45 = 168', () => { assert.equal(run(['1','2','3','A','4','5','F']).shown, 168); });
test('chain 2 x 3 x 4 = 24 (left-to-right, no precedence)', () => {
    assert.equal(run(['2','C','3','C','4','F']).shown, 24);
});
test('division by zero is guarded to 0', () => {
    assert.equal(run(['9','D','0','F']).shown, 0);
});
test('K2 backspace: 78 -> 7, then 9 -> 79 (portable floor-division)', () => {
    assert.equal(run(['7','8','k2','9','F']).shown, 79);
});
test('K3/K4 memory survives K1 clear-all', () => {
    assert.equal(run(['4','2','k3','k1','k4']).shown, 42);
});
test('E clears the entry only; F without op starts a fresh entry', () => {
    assert.equal(run(['5','5','E','7','F','7','A','1','F']).shown, 8);
});

test('display uses the A2 decoder and refreshes its right-aligned buffer in Timer 0', () => {
    const c = new SB3Creator();
    c.parse(src);
    const code = c.generateC();
    assert.match(code, /static unsigned char bw_display_fb\[8\]/);
    assert.match(code, /void bw_tick\(void\) __interrupt\(1\)/);
    assert.match(code, /P2_2 = bw_display_cur & 0x01/);
    assert.match(code, /P2_3 = bw_display_cur & 0x02/);
    assert.match(code, /P2_4 = bw_display_cur & 0x04/);
    assert.match(code, /i = 7;[\s\S]*bw_display_fb\[i\] = bw_7seg_font\[u % 10\]/);
    assert.match(code, /bw_display_show_number\(shown\)/);
});
