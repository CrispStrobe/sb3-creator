/**
 * generateBASIC lineMap: emitted line → Scratch block id, the bridge that
 * lets BBC BASIC's TRACE output (line numbers on the serial stream) glow
 * the owning block in the editor. Golden-tested for the two properties
 * that matter: statements map to their own block, and a control block's
 * TAIL line (NEXT/UNTIL/ENDWHILE) maps to the CONTROL block, not to the
 * last statement inside it.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import examples from '../src/utils/examples.js';

const build = (src) => { const c = new SB3Creator(); c.parse(src); return c; };

const SRC = `WHEN flag clicked:
  set counter to 0
  REPEAT 4:
    change counter by 1
  say "done"
`;

const blockIdsByOpcode = (c) => {
    const byOp = {};
    for (const t of c.project.targets) {
        for (const [id, b] of Object.entries(t.blocks || {})) {
            (byOp[b.opcode] = byOp[b.opcode] || []).push(id);
        }
    }
    return byOp;
};

describe('lineMap: numbered mode', () => {
    const c = build(SRC);
    const r = c.generateBASIC(undefined, { lineNumbers: true });
    assert.ok(r.ok, (r.reasons || []).join('; '));
    const byOp = blockIdsByOpcode(c);
    const lines = new Map(r.basic.trim().split('\n')
        .map((l) => [Number(l.match(/^\d+/)[0]), l.replace(/^\d+\s*/, '')]));

    test('every mapped line number exists in the emitted text', () => {
        for (const key of Object.keys(r.lineMap)) {
            assert.ok(lines.has(Number(key)), `line ${key} missing from output`);
        }
    });

    test('statements map to their own blocks', () => {
        const findLine = (substr) => {
            for (const [n, text] of lines) if (text.includes(substr)) return n;
            return null;
        };
        const inc = findLine('+1');
        assert.ok(inc, 'the change-by line exists');
        assert.ok(byOp.data_changevariableby.includes(r.lineMap[inc]),
            'change counter by 1 maps to its block');
        const print = findLine('PRINT');
        assert.ok(byOp.looks_say.includes(r.lineMap[print]),
            'say maps to its block');
    });

    test('the loop tail line maps to the control block', () => {
        let tail = null;
        for (const [n, text] of lines) {
            if (/^(NEXT|UNTIL|ENDWHILE)/.test(text.trim())) tail = n;
        }
        assert.ok(tail, 'a loop tail line exists');
        assert.ok(byOp.control_repeat.includes(r.lineMap[tail]),
            `tail line ${tail} maps to control_repeat, got block ${r.lineMap[tail]}`);
    });

    test('the loop header line also maps to the control block', () => {
        let head = null;
        for (const [n, text] of lines) {
            if (/^\s*FOR |^\s*REPEAT\b/.test(text)) head = n;
        }
        assert.ok(head, 'a loop head line exists');
        assert.ok(byOp.control_repeat.includes(r.lineMap[head]));
    });
});

describe('lineMap: structured mode keys are 1-based output lines', () => {
    const c = build(SRC);
    const r = c.generateBASIC(undefined, { lineNumbers: false });
    assert.ok(r.ok);
    const lines = r.basic.trimEnd().split('\n');

    test('keys index real lines; values are real blocks', () => {
        const byOp = blockIdsByOpcode(c);
        const allIds = new Set(Object.values(byOp).flat());
        for (const [key, id] of Object.entries(r.lineMap)) {
            const idx = Number(key);
            assert.ok(idx >= 1 && idx <= lines.length, `index ${idx} in range`);
            assert.ok(allIds.has(id), `block ${id} exists`);
        }
    });
});

describe('lineMap: sweep property over the gallery', () => {
    for (const key of Object.keys(examples).slice(0, 12)) {
        test(`${key}: mapped ids are real blocks, keys are real lines`, () => {
            const c = build(examples[key]);
            const r = c.generateBASIC(undefined, { lineNumbers: true });
            if (!r.ok) return;                    // sweep covers ok-ness elsewhere
            const allIds = new Set();
            for (const t of c.project.targets) {
                for (const id of Object.keys(t.blocks || {})) allIds.add(id);
            }
            const nums = new Set(r.basic.trim().split('\n')
                .map((l) => Number(l.match(/^\d+/)[0])));
            for (const [n, id] of Object.entries(r.lineMap)) {
                assert.ok(nums.has(Number(n)), `${key}: line ${n} exists`);
                assert.ok(allIds.has(id), `${key}: block ${id} exists`);
            }
            assert.ok(Object.keys(r.lineMap).length > 0, `${key}: map is not empty`);
        });
    }
});
