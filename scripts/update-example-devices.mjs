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
    const computed = devices.filter((d) => SB3Creator.retargetPseudocode(src, d).ok);
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
