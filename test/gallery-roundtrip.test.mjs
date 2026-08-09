// Gallery round-trip: every example must survive blocks → pseudocode → blocks.
//
// Scans examples/ as a directory, so new examples are covered the moment they
// are committed — no hardcoded list to forget to update.
//
// Comment-only files (standalone circuits with no program) are valid: the
// circuit is in circuit.json, not in program.bw. They round-trip as empty,
// which is correct.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import SB3Creator from '../src/utils/sb3Creator.js';

const here = dirname(fileURLToPath(import.meta.url));
const examplesDir = resolve(here, '../examples');

let exampleDirs;
try {
    exampleDirs = readdirSync(examplesDir)
        .filter(d => !d.endsWith('.json') && !d.startsWith('.'))
        .sort();
} catch { exampleDirs = []; }

// Classify examples: those with real pseudocode vs comment-only (standalone circuits).
function isCommentOnly(src) {
    return src.split('\n').every(l => !l.trim() || l.trim().startsWith('#'));
}

for (const name of exampleDirs) {
    const bwPath = resolve(examplesDir, name, 'program.bw');
    let bw;
    try { bw = readFileSync(bwPath, 'utf8'); } catch { continue; }

    if (isCommentOnly(bw)) {
        // Standalone circuit: no program to round-trip. Assert it parses without error.
        test(`gallery: ${name} (standalone circuit — comment-only)`, () => {
            const c = new SB3Creator();
            const project = c.parse(bw);
            assert.ok(project.targets.length > 0, 'parsed to at least one target');
            // The decompile should produce only whitespace/empty.
            const dc = c.decompile(project);
            assert.ok(dc.trim() === '' || dc.trim().length < 5,
                'comment-only file decompiles to near-empty');
        });
    } else {
        // MCU program: must round-trip to a fixed point.
        test(`gallery: ${name} round-trips`, () => {
            const c1 = new SB3Creator();
            const dc1 = c1.decompile(c1.parse(bw));
            const c2 = new SB3Creator();
            const dc2 = c2.decompile(c2.parse(dc1));
            assert.equal(dc1, dc2, `${name} is not a fixed point`);
        });
    }
}

test('gallery has at least 40 examples', () => {
    assert.ok(exampleDirs.length >= 40,
        `expected >= 40 gallery examples, found ${exampleDirs.length}`);
});
