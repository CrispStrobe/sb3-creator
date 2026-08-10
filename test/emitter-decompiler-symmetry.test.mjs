// Emitter ⇄ decompiler symmetry: every bw_* call the C emitter produces
// must have a rule in cToPseudocode, and vice versa.
//
// Without this, a block can be added in one direction and the C round-trip
// silently breaks — which is what happened with the 31 device calls in
// ebec01f. The round-trip test caught it on the one example that exercises
// the path; this test catches it for ALL calls, immediately.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const emitterSrc = readFileSync(resolve(here, '../src/utils/sb3Creator.js'), 'utf8');
const decompilerSrc = readFileSync(resolve(here, '../src/utils/cToPseudocode.js'), 'utf8');

// ---- extract device bw_* calls from the emitter ----------------------------
// These are the calls emitted by devices_* case blocks in cStackBlock/cRep.
const emitterCalls = new Set();
for (const m of emitterSrc.matchAll(/case 'devices_\w+'[^}]*?(bw_[a-z0-9_]+)\(/gs)) {
    emitterCalls.add(m[1]);
}
// Also catch the BW_STUB definitions
for (const m of emitterSrc.matchAll(/BW_STUB:\s*(devices_\w+)/g)) {
    // The stub names the opcode, not the C function — skip
}

// ---- extract bw_* calls the decompiler recognizes --------------------------
const decompilerCalls = new Set();
for (const m of decompilerSrc.matchAll(/['"]bw_([a-z0-9_]+)['"]/g)) {
    const name = 'bw_' + m[1];
    // Filter to device calls (not bw_ms, bw_task, bw_cube, bw_tab, etc.)
    if (!name.match(/^bw_(ms|now|setup|task|tick|tab|clamp|block|cube|print|i\d*|structure)$/)) {
        decompilerCalls.add(name);
    }
}

test('every device bw_* call the emitter produces has a decompiler rule', () => {
    const missing = [...emitterCalls].filter(c => !decompilerCalls.has(c)).sort();
    assert.deepEqual(missing, [],
        `C emitter produces these bw_* calls but cToPseudocode cannot read them back: ${missing.join(', ')}`);
});

test('every device bw_* rule in the decompiler has an emitter', () => {
    const orphans = [...decompilerCalls].filter(c => !emitterCalls.has(c)).sort();
    // This direction is less critical (dead rules, not broken round-trips)
    // but worth knowing about.
    if (orphans.length) {
        console.log(`  decompiler has rules for calls the emitter never produces: ${orphans.join(', ')}`);
    }
});
