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
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import SB3Creator from '../src/utils/sb3Creator.js';
import { transformAuthored } from './lib/authored-transform.mjs';
import { DEVPART } from './lib/devpart.mjs';
import { injectEngine, registerSidecars, locateSibling } from './lib/engine-surface.mjs';

// The transform dry-run needs the engine + circuit model (same env
// contract as gen-device-benches): a device stays LISTED for an
// authored-circuit example only if its transform succeeds — offering a
// pick whose bench cannot exist sends the app to the authored circuit
// with a retargeted program, the pairing mismatch all over again.
// Resolved the way every gate in this repo resolves them. The defaults used to
// be one machine's home directory and a DEAD agent scratch path under
// ~/.claude/jobs, and the surface was hasDevice-without-getDevice — the exact
// stale pair that collapsed board kinds to a generic 'mcu'.
const BW_BOARD = locateSibling('bw-board');
const CUI = locateSibling('bw-circuit-ui');
const cmod = await injectEngine({ board: BW_BOARD, cui: CUI });
await registerSidecars(CUI);

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'examples');
const indexPath = join(root, 'index.json');
const index = JSON.parse(readFileSync(indexPath, 'utf8'));
const items = Array.isArray(index) ? index : index.examples || [];
// Same universe as test/retarget-gallery.test.mjs: pool membership means
// the PROGRAM retargets; benchability is the app's bar. Re-add a device
// here and in the test together, with DEVPART benches to match.
const UNBENCHABLE = new Set(['eater6502', 'z80']);
const devices = Object.keys(SB3Creator.RETARGET_POOLS)
    .filter((d) => !UNBENCHABLE.has(d));
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
    // Transformability gate + refusal ledger. e.transformRefused is DATA
    // the app and the dry-run test both read: which devices were dropped
    // and why (the ATtiny85 honestly cannot carry a console).
    const authoredCircuit = join(root, e.id, 'circuit.json');
    const refused = {};
    if (existsSync(authoredCircuit)) {
        const circuitData = JSON.parse(readFileSync(authoredCircuit, 'utf8'));
        for (const dev of [...computed]) {
            if (dev === authored) continue; // the authored circuit IS the bench
            if (!DEVPART[dev]) continue;
            const r = SB3Creator.retargetPseudocode(src, dev);
            if (!r.ok) continue; // already filtered above
            const t = transformAuthored(circuitData, DEVPART[dev], r.pinMap || [],
                cmod.Circuit, SB3Creator.RETARGET_POOLS[dev], dev);
            if (!t.ok) {
                refused[dev] = t.reason;
                computed.splice(computed.indexOf(dev), 1);
            }
        }
    }
    const refusedJson = Object.keys(refused).length ? refused : undefined;
    if (JSON.stringify(e.transformRefused) !== JSON.stringify(refusedJson)) {
        if (refusedJson) e.transformRefused = refusedJson;
        else delete e.transformRefused;
        changed++;
        for (const [d, why] of Object.entries(refused)) console.log(`${e.id}: ${d} dropped — ${why}`);
    }
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
