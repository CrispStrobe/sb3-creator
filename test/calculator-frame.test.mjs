/**
 * The calculator's FRAME, executed rather than inspected.
 *
 * oled-flush.test.mjs asserts the emitted code contains one _oled.show() per
 * frame. That is a text claim. This runs the generated MicroPython under a
 * stub framebuf and asserts what is actually DRAWN: the title, both rules,
 * the pending-operation line, and — the thing the owner asked for — an entry
 * that is right-aligned rather than left.
 *
 * The device this targets is currently off the bus, so no panel has been
 * looked at with a human eye. This closes as much of that gap as software
 * can: geometry and blit count are verified; only the glass is unseen.
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import SB3Creator from '../src/utils/sb3Creator.js';

// Stub machine/framebuf, define the program without running its scheduler,
// then drive proc_do_show_screen at chosen states and record every draw.
const PROBE = `
import sys, types, io, json
src = io.open(sys.argv[1], encoding='utf-8').read().split('\\n_run([')[0]
calls = []
m = types.ModuleType('machine')
class Pin:
    IN=0; OUT=1; PULL_DOWN=2; PULL_UP=3
    def __init__(self,*a,**k): pass
    def value(self,*a): return 0
class I2C:
    def __init__(self,*a,**k): pass
    def scan(self): return [0x3C]
    def writeto(self,*a,**k): pass
m.Pin, m.I2C = Pin, I2C
fb = types.ModuleType('framebuf')
class FrameBuffer:
    def __init__(self,*a,**k): pass
    def fill(self,c): calls.append(['fill', c])
    def text(self,s,x,y,*a): calls.append(['text', s, x, y])
    def hline(self,x,y,w,c): calls.append(['hline', x, y, w])
fb.FrameBuffer, fb.MONO_VLSB = FrameBuffer, 1
sys.modules['machine'], sys.modules['framebuf'] = m, fb
import time as _t
_t.sleep_ms = lambda ms: None
_t.ticks_ms = lambda: 0
g = {'__name__': 'calc'}
exec(compile(src, 'gen.py', 'exec'), g)
g['_oled'].show = lambda: calls.append(['show'])
def frame(**st):
    g.update(st); calls.clear(); list(g['proc_do_show_screen']()); return list(calls)
print(json.dumps({
  'boot':  frame(acc=0,  op=0, entry=0,    fresh=1, error=0),
  'typed': frame(acc=0,  op=0, entry=1234, fresh=0, error=0),
  'pend':  frame(acc=12, op=1, entry=3,    fresh=0, error=0),
  'err':   frame(acc=0,  op=4, entry=0,    fresh=1, error=1),
}))
`;

const render = (bwPath) => {
    const c = new SB3Creator();
    c.parse(readFileSync(bwPath, 'utf8'));
    const r = c.generateMicroPython();
    assert.ok(r.ok, `micropython refused: ${(r.reasons || []).join('; ')}`);
    const dir = mkdtempSync(join(tmpdir(), 'frame-'));
    const gen = join(dir, 'gen.py'); const probe = join(dir, 'probe.py');
    writeFileSync(gen, r.py); writeFileSync(probe, PROBE);
    return JSON.parse(execFileSync('python3', [probe, gen], { encoding: 'utf8' }));
};

describe('70-calculator: the frame it actually draws', () => {
    let f;
    before(() => { f = render(join(import.meta.dirname, '..', 'examples/70-calculator/program.bw')); });

    test('exactly ONE blit per frame, in every state', () => {
        for (const [name, calls] of Object.entries(f)) {
            const shows = calls.filter((c) => c[0] === 'show').length;
            assert.equal(shows, 1, `${name}: ${shows} blits — a 128x64 frame is a 1 KB I2C transfer`);
            assert.equal(calls[calls.length - 1][0], 'show', `${name}: the blit must come last`);
            assert.deepEqual(calls[0], ['fill', 0], `${name}: the frame starts cleared`);
        }
    });

    test('title and both rules are drawn', () => {
        for (const [name, calls] of Object.entries(f)) {
            assert.ok(calls.some((c) => c[0] === 'text' && c[1] === 'RECHNER' && c[2] === 0 && c[3] === 0),
                `${name}: RECHNER at the origin`);
            assert.ok(calls.some((c) => c[0] === 'hline' && c[2] === 10 && c[3] === 128), `${name}: rule at y=10`);
            assert.ok(calls.some((c) => c[0] === 'hline' && c[2] === 55 && c[3] === 128), `${name}: rule at y=55`);
        }
    });

    // The complaint that started this: the entry sat on the left.
    test('the entry line is RIGHT-aligned at 128 - 8*len', () => {
        const entryOf = (calls) => calls.filter((c) => c[0] === 'text' && c[3] === 40).pop();
        for (const [name, expected] of [['boot', '0'], ['typed', '1234'], ['err', 'ERROR']]) {
            const e = entryOf(f[name]);
            assert.ok(e, `${name}: something is drawn on the entry row`);
            assert.equal(e[1], expected, `${name}: entry text`);
            assert.equal(e[2], 128 - 8 * expected.length,
                `${name}: "${expected}" must end at the right edge (8px cell, 16 columns)`);
        }
    });

    test('a pending operation shows accumulator and operator on the upper line', () => {
        const upper = f.pend.filter((c) => c[0] === 'text' && c[3] === 16).map((c) => c[1]).join('');
        assert.equal(upper, '12 +', 'pending line reads "<acc> <op>"');
        assert.equal(f.pend.filter((c) => c[0] === 'text' && c[3] === 16)[0][2], 0, 'pending line starts at the left');
    });

    // The two variants are the before/after of the owner's complaint, so the
    // contrast is worth pinning: the simple one flushes per verb and prints
    // from the left, the buffered one blits once and right-aligns.
    test('the simple variant still flushes per verb and prints from the left', () => {
        const s = render(join(import.meta.dirname, '..', 'examples/70-calculator-simple/program.bw'));
        const blits = s.boot.filter((c) => c[0] === 'show').length;
        assert.ok(blits > 1,
            `draw-and-flush expected, got ${blits} blit(s) — this program never says \`oled show\`, `
            + 'so the buffered driver must NOT be imposed on it');
        const entry = s.boot.filter((c) => c[0] === 'text' && c[3] === 40).pop();
        assert.equal(entry[2], 0, 'the original prints the entry from the left edge');
    });
});
