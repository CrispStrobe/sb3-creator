/**
 * The ```assert grammar (scripts/lib/assert-blocks.mjs) and its agreement with
 * the other readers of the same fenced blocks.
 *
 * The gap this closes: `net out V -4.5 +-0.1` — a node below ground on a split
 * supply — matched no grammar, because every value was read as `[\d.]+`. It
 * fell through to `unknown`, and assert-physics SKIPS unknown kinds, so the
 * claim was never compared and the run stayed green. A line that names a known
 * kind and cannot be read is now `malformed`, and assert-physics fails on it.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseAssertions, assertBlocks, hasAssertBlock } from '../scripts/lib/assert-blocks.mjs';
import { exampleDirs, EXAMPLES, claimsOfText } from './helpers/expected-claims.mjs';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { loadEngine, registerBench, solveBench } from './helpers/bench-measure.mjs';

const block = (...lines) => ['# page', '', '```assert', ...lines, '```', ''].join('\n');
const only = (line) => parseAssertions(block(line));

describe('the ```assert grammar', () => {
    test('a net voltage may be negative, in either minus sign', () => {
        assert.deepEqual(only('net out V -4.5 +-0.1'),
            [{ kind: 'net', label: 'out', unit: 'V', expected: -4.5, tolerance: 0.1, raw: 'net out V -4.5 +-0.1' }]);
        assert.equal(only('net out V −4.5 +-0.1')[0].expected, -4.5, 'U+2212 MINUS SIGN, as the corpus writes it');
        assert.equal(only('net out V +3.3 +-0.1')[0].expected, 3.3);
        assert.equal(only('net vee V -9 +-0.05')[0].expected, -9);
    });

    test('mV scales value and tolerance, sign included', () => {
        const [a] = only('net vbe mV -650 +-20');
        assert.equal(a.kind, 'net');
        assert.ok(Math.abs(a.expected - -0.65) < 1e-12);
        assert.ok(Math.abs(a.tolerance - 0.02) < 1e-12);
    });

    test('± is accepted beside +-, as the period grammars already accept it', () => {
        assert.equal(only('net out V -4.5 ± 0.1')[0].tolerance, 0.1);
    });

    test('a negative tolerance is not a tolerance', () => {
        assert.equal(only('net out V 4.5 +--0.1')[0].kind, 'malformed');
    });

    test('a current may be negative', () => {
        assert.equal(only('current q1 mA -2.5 +-0.1')[0].expected, -2.5);
    });

    test('a known kind that cannot be read is malformed, not unknown', () => {
        assert.deepEqual(only('net out V about -4.5'), [{ kind: 'malformed', keyword: 'net', raw: 'net out V about -4.5' }]);
        assert.equal(only('current q1 A 0.002 +-0.001')[0].kind, 'malformed');
        // A kind this grammar never heard of stays an explicit skip.
        assert.equal(only('audio_context: running')[0].kind, 'unknown');
    });

    test('every assertion line in the corpus still parses as before', () => {
        // Widening the number grammar must not reclassify a line that was read.
        const bad = [];
        let nets = 0;
        for (const dir of exampleDirs()) {
            const p = join(EXAMPLES, dir, 'EXPECTED.md');
            if (!existsSync(p)) continue;
            for (const a of parseAssertions(readFileSync(p, 'utf8'))) {
                if (a.kind === 'malformed') bad.push(`${dir}: ${a.raw}`);
                if (a.kind === 'net') nets++;
            }
        }
        assert.deepEqual(bad, []);
        // MEASURED 2026-11-23: 332 net assertions across the corpus.
        assert.ok(nets >= 300, `only ${nets} net assertions parsed — the grammar has stopped reading the corpus`);
    });
});

describe('the readers of ```assert blocks agree', () => {
    test('enrolment and the parser see the same blocks', () => {
        const disagree = [];
        for (const dir of exampleDirs()) {
            const p = join(EXAMPLES, dir, 'EXPECTED.md');
            if (!existsSync(p)) continue;
            const md = readFileSync(p, 'utf8');
            if (hasAssertBlock(md) !== (assertBlocks(md).length > 0)) disagree.push(dir);
        }
        assert.deepEqual(disagree, []);
    });

    test('no census claim is read from inside an assert block', () => {
        // The census leaves fenced blocks to assert-physics. A number on an
        // assert line counted as a prose claim as well would be checked twice
        // under two tolerances; one missed by both would be checked by nobody.
        const md = ['## Observable behaviour', '', '- The rail is 9 V.', '', '```assert',
            'net vee V -9.00 +-0.05', 'net vcc V 9.00 +-0.05', '```', ''].join('\n');
        assert.deepEqual(claimsOfText('__fixture', md).map(c => c.text), ['9 V']);
        const overlap = [];
        for (const dir of exampleDirs()) {
            const p = join(EXAMPLES, dir, 'EXPECTED.md');
            if (!existsSync(p)) continue;
            const md2 = readFileSync(p, 'utf8');
            if (!hasAssertBlock(md2)) continue;
            const assertLines = new Set();
            const lines = md2.split('\n');
            let inside = false;
            lines.forEach((l, i) => {
                if (/^```assert\s*$/.test(l)) { inside = true; return; }
                if (inside && /^```/.test(l)) { inside = false; return; }
                if (inside) assertLines.add(i + 1);
            });
            for (const c of claimsOfText(dir, md2)) if (assertLines.has(c.lineNo)) overlap.push(`${dir}#${c.lineNo}`);
        }
        assert.deepEqual(overlap, []);
    });
});

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'negative net assertions against the engine');

describe('a negative net assertion is compared, not skipped', { skip: gate.skip || false }, () => {
    test('a node below ground solves negative and the assertion holds it', async () => {
        await loadEngine(gate.paths);
        // A 9 V battery with its + terminal on ground: the - terminal is -9 V,
        // and a 1 k / 1 k divider from it puts the midpoint at -4.5 V.
        registerBench('__split', {
            vcc: 5,
            parts: [{ id: 'gnd1', kind: 'gnd', params: {} }, { id: 'bat', kind: 'battery', params: { volts: 9 } },
                { id: 'r1', kind: 'resistor', params: { ohms: 1000 } }, { id: 'r2', kind: 'resistor', params: { ohms: 1000 } }],
            wires: [
                { from: 'bat', fromTerminal: 'pos', to: 'gnd1', toTerminal: 'gnd' },
                { from: 'gnd1', fromTerminal: 'gnd', to: 'r1', toTerminal: 'a' },
                { from: 'r1', fromTerminal: 'b', to: 'r2', toTerminal: 'a' },
                { from: 'r2', fromTerminal: 'b', to: 'bat', toTerminal: 'neg' },
            ],
        });
        const s = solveBench('__split');
        assert.ok(!s.error, s.error);
        const mid = s.nets.find(n => n.terminals.some(t => t.part === 'r1' && t.terminal === 'b'));
        const v = s.voltage.get(mid.id || mid.name);
        const [a] = only('net r1.b V -4.50 +-0.05');
        assert.equal(a.kind, 'net');
        // The comparison assert-physics makes.
        assert.ok(Math.abs(v - a.expected) <= a.tolerance, `solved ${v}, asserted ${a.expected} +-${a.tolerance}`);
        const [wrongSign] = only('net r1.b V 4.50 +-0.05');
        assert.ok(Math.abs(v - wrongSign.expected) > wrongSign.tolerance, 'the sign is load-bearing');
    });
});
