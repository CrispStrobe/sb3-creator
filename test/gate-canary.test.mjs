/**
 * Gate canaries: re-introduce the exact defect each gate exists to catch,
 * assert the gate goes RED.
 *
 * A gate that cannot fail is worse than no gate — it consumes the alarm
 * a real defect would raise. These canaries prove the gates are live.
 *
 * Extends the gate-integrity.test.mjs pattern (b017648).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import SB3Creator from '../src/utils/sb3Creator.js';

const SB3 = join(import.meta.dirname, '..');
const EXAMPLES = join(SB3, 'examples');
const CUI = process.env.BW_CIRCUIT_UI || join(SB3, '..', 'bw-circuit-ui');
const BWB = process.env.BW_BOARD || join(SB3, '..', 'bw-board');
// Cross-repo guard: skip locally, FAIL in CI. CI checks both siblings out at the
// revisions pinned in test/fixtures/siblings.json, so an absent sibling there means
// the checkout step broke and this gate just went silent — see
// test/CROSS-REPO-GATE-AUDIT.md and test/helpers/siblings.mjs.
const gate = requireSiblings('bw-circuit-ui', 'bw-board');
siblingGuardTest(gate, 'gate canaries');

// ---------------------------------------------------------------------------
// Canary 1: tautological assert.ok(true) in if/else branches
// (finding #6/#7: gallery-e2e.test.mjs servo test)
// The gate should verify that bw_servo_set is EITHER defined AND compiles,
// OR absent AND the test documents it as a skip — never assert.ok(true) in
// both branches.
// ---------------------------------------------------------------------------
describe('canary: tautological if/else cannot hide a gap', () => {
    test('a test with assert.ok(true) in BOTH if/else branches is flagged', () => {
        // Scan gallery-e2e.test.mjs for any test containing two or more
        // assert.ok(true) — a sign that all code paths always pass.
        const src = readFileSync(join(SB3, 'test', 'gallery-e2e.test.mjs'), 'utf8');
        // Split into test bodies: text between `test(` and the next top-level `});`
        // and check each for multiple assert.ok(true).
        const testBodies = src.split(/\btest\(/);
        const offenders = [];
        for (const body of testBodies) {
            const okTrues = (body.match(/assert\.ok\(true/g) || []).length;
            if (okTrues >= 2) {
                const name = body.match(/^'([^']+)'/)?.[1] || body.slice(0, 40);
                offenders.push(`"${name}" has ${okTrues} × assert.ok(true)`);
            }
        }
        assert.deepEqual(offenders, [],
            `tautological if/else: both branches always pass:\n  ${offenders.join('\n  ')}`);
    });
});

// ---------------------------------------------------------------------------
// Canary 2: silent early-return inside a test body
// (finding #8/#9: gallery-e2e.test.mjs z80-bench/vdp-hello)
// An early `return` inside a test body when a file is missing means the
// test reports "pass" when it actually ran nothing. The fix is { skip }.
// ---------------------------------------------------------------------------
describe('canary: a test that returns early on missing files should use skip', () => {
    test('no test body does `if (!existsSync(...)) return` without { skip }', () => {
        const src = readFileSync(join(SB3, 'test', 'gallery-e2e.test.mjs'), 'utf8');
        // Find test bodies with existsSync-guarded early returns
        const pattern = /test\([^)]+,\s*\(\)\s*=>\s*\{[^}]*if\s*\(!existsSync\([^)]+\)\)\s*\{\s*return/g;
        const hits = [...src.matchAll(pattern)];
        assert.equal(hits.length, 0,
            `${hits.length} test(s) use early return on missing files instead of { skip }. ` +
            `An early return produces a green "pass" when the test ran nothing. ` +
            `Use test('name', { skip: reason }, () => {}) instead.`);
    });
});

// ---------------------------------------------------------------------------
// Canary 3: cross-repo surface — netlistError still exists
// (the original finding #1/#2, already guarded by gate-integrity.test.mjs;
//  this canary verifies the guard itself is live)
// ---------------------------------------------------------------------------
describe('canary: gate-integrity surface checks are live',
    { skip: gate.skip }, () => {
    test('Circuit constructor exposes netlistError', async () => {
        const { Circuit } = await injectEngine({ board: BWB, cui: CUI });
        const c = Circuit.fromJSON({ parts: [], wires: [] });
        // netlistError should be a property (null on success, string on error)
        assert.ok('netlistError' in c,
            'Circuit no longer has netlistError — the chain tests will fail silently');
    });
});

// ---------------------------------------------------------------------------
// Canary 4: the ../../ detector in gate-integrity is live
// (mutation check: if we inject a ../../ path, the detector catches it)
// ---------------------------------------------------------------------------
describe('canary: the ../../ detector catches double-parent paths', () => {
    test('a join(X, "..", "..", "sibling") pattern is detected', () => {
        // The regex from gate-integrity.test.mjs — test it against
        // constructed strings so the LITERAL does not appear in THIS
        // file's source (gate-integrity scans all .mjs files).
        const regex = /join\(\s*\w+\s*,\s*'\.\.'\s*,\s*'\.\.'\s*,\s*'([\w-]+)'/g;
        const dot = '.';
        const bad = `const p = join(SB3, '${dot}${dot}', '${dot}${dot}', 'bw-board');`;
        const good = `const p = join(SB3, '${dot}${dot}', 'bw-board');`;
        assert.ok(regex.test(bad), 'detector must catch ../../sibling');
        regex.lastIndex = 0;
        assert.ok(!regex.test(good), 'detector must not flag ../sibling');
    });
});

// ---------------------------------------------------------------------------
// Canary 5: generateMicroPython debug _bw_vnames tracks declared vars
// (verifies the debug-trace-audit gate is live by checking a known program)
// ---------------------------------------------------------------------------
describe('canary: debug _bw_vnames reflects actual variables', () => {
    test('adding a variable to the program adds it to _bw_vnames', () => {
        const c = new SB3Creator();
        c.parse('DEVICE MICROBIT\nWHEN flag clicked:\n  set myvar to 42\n');
        const r = c.generateMicroPython(c.project, { debug: true });
        assert.ok(r.ok);
        const m = r.py.match(/_bw_vnames\s*=\s*(\[.*?\])/);
        assert.ok(m, '_bw_vnames not found');
        const vnames = JSON.parse(m[1]);
        assert.ok(vnames.includes('myvar'),
            `_bw_vnames should include 'myvar' but has: [${vnames}]`);
    });

    test('a program with no variables has empty _bw_vnames', () => {
        const c = new SB3Creator();
        c.parse('DEVICE MICROBIT\nWHEN flag clicked:\n  clear display\n');
        const r = c.generateMicroPython(c.project, { debug: true });
        assert.ok(r.ok);
        const m = r.py.match(/_bw_vnames\s*=\s*(\[.*?\])/);
        assert.ok(m, '_bw_vnames not found');
        const vnames = JSON.parse(m[1]);
        assert.equal(vnames.length, 0,
            `_bw_vnames should be empty for a var-free program but has: [${vnames}]`);
    });
});
