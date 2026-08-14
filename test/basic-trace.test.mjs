/**
 * TRACE decoder goldens: token extraction, chunk-split reassembly, text
 * passthrough, and the end-to-end join with generateBASIC's lineMap —
 * a synthetic TRACE stream glows the blocks the emitter mapped.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import createTraceDecoder from '../src/utils/basicTrace.js';
import SB3Creator from '../src/utils/sb3Creator.js';

const run = (lineMap, chunks) => {
    const blocks = [];
    const linesSeen = [];
    let text = '';
    const d = createTraceDecoder(lineMap, {
        onBlock: (id, line) => blocks.push([id, line]),
        onLine: (l) => linesSeen.push(l),
        onText: (t) => { text += t; },
    });
    for (const c of chunks) d.feed(c);
    d.flush();
    return { blocks, linesSeen, text };
};

describe('trace decoder', () => {
    test('tokens strip, blocks resolve, unmapped lines still strip', () => {
        const r = run({ 20: 'blkA', 30: 'blkB' },
            ['[10] [20] HELLO\n[30] WORLD\n']);
        assert.equal(r.text, 'HELLO\nWORLD\n');
        assert.deepEqual(r.blocks, [['blkA', 20], ['blkB', 30]]);
        assert.deepEqual(r.linesSeen, [10, 20, 30], 'scaffolding line 10 seen but unglowed');
    });

    test('a token split across chunks reassembles', () => {
        const r = run({ 120: 'blk' }, ['abc[1', '2', '0]def']);
        assert.equal(r.text, 'abcdef');
        assert.deepEqual(r.blocks, [['blk', 120]]);
    });

    test('a dangling partial flushes as plain text', () => {
        const r = run({}, ['value [12']);
        assert.equal(r.text, 'value [12');
        assert.deepEqual(r.linesSeen, []);
    });

    test('brackets that cannot be tokens pass through untouched', () => {
        const r = run({}, ['array[i] and [x2] stay\n']);
        assert.equal(r.text, 'array[i] and [x2] stay\n');
    });

    test('a token ending one chunk eats its trailing space from the next', () => {
        const r = run({ 50: 'b' }, ['[50]', ' OK']);
        assert.equal(r.text, 'OK');
        assert.deepEqual(r.blocks, [['b', 50]]);
        // But only ONE space, and only when it is really there.
        const r2 = run({ 50: 'b' }, ['[50]', 'OK']);
        assert.equal(r2.text, 'OK');
        const r3 = run({ 50: 'b' }, ['[50]', '  OK']);
        assert.equal(r3.text, ' OK');
    });

    test('byte input decodes like string input', () => {
        const bytes = new TextEncoder().encode('[40] OK');
        const r = run({ 40: 'b' }, [bytes]);
        assert.equal(r.text, 'OK');
        assert.deepEqual(r.blocks, [['b', 40]]);
    });

    test('end to end: generateBASIC lineMap + synthetic TRACE glows the say block', () => {
        const c = new SB3Creator();
        c.parse(`WHEN flag clicked:
  set counter to 0
  say "hi"
`);
        const r = c.generateBASIC(undefined, { lineNumbers: true });
        assert.ok(r.ok);
        // Find the PRINT line's number, then fake the TRACE stream for it.
        const printLine = r.basic.trim().split('\n')
            .find((l) => l.includes('PRINT'));
        const n = Number(printLine.match(/^\d+/)[0]);
        const out = run(r.lineMap, [`[${n}] hi\n`]);
        assert.equal(out.blocks.length, 1);
        const [id, line] = out.blocks[0];
        assert.equal(line, n);
        const allBlocks = c.project.targets.flatMap((t) => Object.entries(t.blocks || {}));
        const [, blk] = allBlocks.find(([bid]) => bid === id);
        assert.equal(blk.opcode, 'looks_say', 'the say block glows');
        assert.equal(out.text, 'hi\n');
    });
});
