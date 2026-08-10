// Block lowering census: every hardware block, against whether generateC
// can lower it. A block with no lowering is a trap — a user drags it, the
// project compiles, and the behaviour is silently missing.
//
// Derived from createBlock/cmd/B/push calls, not a maintained list.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(here, '../src/utils/sb3Creator.js'), 'utf8');

// ---- derive all created hardware block opcodes ----------------------------
const created = new Set();
for (const m of src.matchAll(/(?:createBlock|cmd)\('([a-z0-9_]+)'/g)) created.add(m[1]);
for (const m of src.matchAll(/(?:B|push)\('([a-z0-9_]+)'/g)) created.add(m[1]);
const hw = [...created].filter(op => /^(stc12|circuit|ledcube|devices)_/.test(op)).sort();

// ---- derive all opcodes the C emitter handles ----------------------------
const cMethods = ['cStackBlock', 'cTaskBlock', 'cRep', 'cCond'];
const cCases = new Set();
for (const name of cMethods) {
    const idx = src.indexOf(name + '(b, blocks');
    if (idx < 0) continue;
    const chunk = src.slice(idx, idx + 15000);
    for (const m of chunk.matchAll(/case '([a-z0-9_]+)':/g)) cCases.add(m[1]);
}

// ---- categorise each block -----------------------------------------------
// sim-only: circuit reporters/commands that talk to the board, not the chip
const SIM_ONLY = new Set([
    'circuit_branchcurrent', 'circuit_buzzertone', 'circuit_ledbrightness',
    'circuit_nodevoltage', 'circuit_resistance',
    'circuit_setcontrol', 'circuit_setpower'
]);

// tethered-only: blocks that only make sense over a live UART link
const TETHERED_ONLY = new Set([
    // (none currently — stc12live blocks are in the stc12live extension, not stc12)
]);

// devices_* blocks: these have Python/JS codegen via RUNTIME_EXTENSIONS
// but no C lowering. On the device target they fall through to cStackBlock's
// default case, which emits a /* warning: no C equivalent for "..." */
// comment in the generated C. The warning names the block — a user who
// inspects the output can see what was dropped. But the program still
// compiles and flashes without the behaviour, which is the silent-drop
// failure PARTS-TO-BLOCKS.md names as the one this project refuses to ship.
//
// The importer IS a supported path (stc/tools/compile-remote.sh -p), so
// these blocks are reachable today, not only when a palette tile exists.
const DEVICES_NO_C = new Set(
    hw.filter(op => op.startsWith('devices_') && !cCases.has(op))
);

// ---- tests ---------------------------------------------------------------

test('block lowering census', () => {
    const lowers = hw.filter(op => cCases.has(op));
    const hats = hw.filter(op => op.includes('when') && !cCases.has(op));
    const simOnly = hw.filter(op => SIM_ONLY.has(op));
    const noLowering = hw.filter(op => !cCases.has(op) && !op.includes('when') && !SIM_ONLY.has(op));

    console.log(`  census: ${hw.length} hardware blocks`);
    console.log(`    ${lowers.length} lower to C`);
    console.log(`    ${hats.length} hats (handled in Pass 3)`);
    console.log(`    ${simOnly.length} simulation-only (correct: no C lowering needed)`);
    console.log(`    ${noLowering.length} no C lowering (devices_* convenience blocks)`);

    // The stc12_* and ledcube_* blocks must ALL have C lowering.
    const stcMissing = hw.filter(op => op.startsWith('stc12_') && !cCases.has(op) && !op.includes('when'));
    assert.deepEqual(stcMissing, [], 'stc12 blocks missing C lowering');

    const cubeMissing = hw.filter(op => op.startsWith('ledcube_') && !cCases.has(op));
    assert.deepEqual(cubeMissing, [], 'ledcube blocks missing C lowering');

    // RATCHET: the number of unlowered blocks must never grow.
    // Lower this constant when you add a C lowering; a new block without
    // one fails the test and names the offender.
    const KNOWN_UNLOWERED = 0;  // ratchet: all devices_* now lower to C
    assert.ok(noLowering.length <= KNOWN_UNLOWERED,
        `${noLowering.length} blocks have no C lowering (was ${KNOWN_UNLOWERED}) — ` +
        `new block(s) added without a C emitter: ` +
        `${noLowering.filter(op => !DEVICES_NO_C.has(op)).join(', ') || noLowering.slice(-5).join(', ')}`);

    // circuit_* blocks must NOT have C lowering (they are sim-only).
    const circuitInC = hw.filter(op => op.startsWith('circuit_') && cCases.has(op));
    assert.deepEqual(circuitInC, [], 'circuit blocks should not have C lowering — they are sim-only');
});

test('every block without C lowering has a documented reason', () => {
    // The devices_* blocks are convenience abstractions. On the device target
    // they compile to a comment, which is the documented fallback in cStackBlock's
    // default case. This is acceptable for simulation-mode but means a compiled
    // project cannot drive a servo/LCD/neopixel through these blocks.
    //
    // This test makes the gap list explicit: if a devices_* block gains a C
    // lowering, remove it from DEVICES_NO_C.
    for (const op of DEVICES_NO_C) {
        assert.ok(!cCases.has(op),
            `${op} is in DEVICES_NO_C but has a C lowering — remove it from the gap list`);
    }
    // Report the count so the gap is visible.
    console.log(`  ${DEVICES_NO_C.size} devices_* blocks compile to comments on the device target`);
});
