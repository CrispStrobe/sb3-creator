#!/usr/bin/env node
/**
 * Regenerate every gallery example's computed `devices` list by dry-running
 * retargetPseudocode against every device that has retarget pools — the
 * single command that widening the device family requires. The
 * retarget-gallery test enforces agreement between index.json and these
 * dry-runs; when a new device axis lands, run this and commit the diff.
 *
 *   node scripts/update-example-devices.mjs          # write index.json
 *   node scripts/update-example-devices.mjs --check  # exit 1 on drift
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import SB3Creator from '../src/utils/sb3Creator.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'examples');
const indexPath = join(root, 'index.json');
const index = JSON.parse(readFileSync(indexPath, 'utf8'));
const items = Array.isArray(index) ? index : index.examples || [];
const devices = Object.keys(SB3Creator.RETARGET_POOLS);
const checkOnly = process.argv.includes('--check');

let changed = 0;
for (const e of items) {
    if (!e.files || !e.files.program || !Array.isArray(e.devices)) continue;
    const src = readFileSync(join(root, e.files.program), 'utf8');
    // Machine-authored examples (6502/Z80 computers) load AS AUTHORED:
    // the circuit IS the computer, retargeting the program to an stc12
    // is meaningless there — and the chooser it produced offered every
    // chip EXCEPT the machine itself (owner report, 2026-08-17).
    const authored = ((src.match(/^DEVICE\s+([\w-]+)/im) || [])[1] || '').toLowerCase();
    const DEVPART_KNOWN = new Set(devices.concat([authored]));
    if (/^(eater6502|6502|z80|zx)/.test(authored)) {
        if (e.devices) { console.log(`${e.id}: machine-authored — devices list removed`); delete e.devices; delete e.benches; changed++; }
        continue;
    }
    // The AUTHORED device is always offered, FIRST, and untested: an
    // example runs on its own chip by definition — pool canonicalization
    // refusing its 27 pins is a statement about RETARGETING, not about
    // the authored pairing. Its absence made the chooser offer every
    // chip EXCEPT the right one (retro console: only stc12+mega, and a
    // single-entry ['arduino-mega'] list silently retargeted the
    // self-test to Mega — the owner's 'Simulated ATmega, not STC').
    const computed = [
        ...(authored && DEVPART_KNOWN.has(authored) ? [authored] : []),
        ...devices.filter((d) => d !== authored && SB3Creator.retargetPseudocode(src, d).ok),
    ];
    if (authored && e.authored !== authored && DEVPART_KNOWN.has(authored)) { e.authored = authored; changed++; }
    if (JSON.stringify(computed) !== JSON.stringify(e.devices)) {
        console.log(`${e.id}: ${JSON.stringify(e.devices)} -> ${JSON.stringify(computed)}`);
        e.devices = computed;
        changed++;
    }
}
if (changed && !checkOnly) {
    writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n');
    console.log(`updated ${changed} entries`);
} else if (changed && checkOnly) {
    console.error(`${changed} entries drifted — run scripts/update-example-devices.mjs`);
    process.exit(1);
} else {
    console.log('index.json agrees with the dry-runs');
}
