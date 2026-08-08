#!/usr/bin/env node
// Measure cToPseudocode over every .c file in corpus/.
// Reports: pass (pseudocode accepted by parse()), warn (translated with warnings),
// fail (threw or produced unparseable output), and groups failures by cause.

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import cToPseudocode from '../src/utils/cToPseudocode.js';
import SB3Creator from '../src/utils/sb3Creator.js';

const files = execSync('find corpus -name "*.c" -type f', { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean);

console.log(`Found ${files.length} .c files`);

let pass = 0, warnOnly = 0, fail = 0;
// "translates" = cToPseudocode does not throw AND produces a non-trivial
// pseudocode body (not just DEVICE/CLOCK/stop).
let translates = 0;
const failReasons = new Map();   // reason → [file, …]
const warnReasons = new Map();
// Inference warnings that are expected for hand-written firmware.
const INFERENCE = /^(no clock|no register header|no pins found|polarity of|inferred DEVICE|inferred CLOCK|<stc)/;

for (const f of files) {
    let src;
    try { src = readFileSync(f, 'utf8'); } catch { fail++; continue; }
    try {
        const { pseudocode, warnings } = cToPseudocode(src);
        // "translates" = produces at least one non-trivial pseudocode line
        // (not just DEVICE/CLOCK/PIN/stop/WHEN flag clicked).
        const bodyLines = pseudocode.split('\n')
            .filter(l => l.trim() && !/^(DEVICE|CLOCK|PIN|WHEN flag clicked:|  stop)$/.test(l.trim()));
        const hasBody = bodyLines.length > 0;

        // Separate inference warnings (expected for hand-written) from real problems.
        const realWarnings = warnings.filter(w => !INFERENCE.test(w));

        // Try to reparse the pseudocode.
        const c = new SB3Creator();
        c.parse(pseudocode);
        const parseWarnings = c.warnings.filter(w => !/Unknown DEVICE/.test(w));

        if (hasBody) translates++;

        if (realWarnings.length === 0 && parseWarnings.length === 0) {
            pass++;
        } else {
            warnOnly++;
            for (const w of [...realWarnings, ...parseWarnings]) {
                const key = w.replace(/".+?"/g, '"…"').replace(/\d+/g, 'N').slice(0, 80);
                if (!warnReasons.has(key)) warnReasons.set(key, []);
                warnReasons.get(key).push(f);
            }
        }
    } catch (e) {
        fail++;
        const reason = String(e.message || e).replace(/".+?"/g, '"…"').replace(/\d+/g, 'N').slice(0, 80);
        if (!failReasons.has(reason)) failReasons.set(reason, []);
        failReasons.get(reason).push(f);
    }
}

console.log(`\n=== BASELINE ===`);
console.log(`Total: ${files.length}`);
console.log(`Translates (non-trivial body):  ${translates}`);
console.log(`Clean (no real warnings):       ${pass}`);
console.log(`Warns (real warnings):          ${warnOnly}`);
console.log(`Fail (exception):               ${fail}`);
console.log(`\nTranslate rate: ${(translates / files.length * 100).toFixed(1)}%`);
console.log(`Clean rate: ${(pass / files.length * 100).toFixed(1)}%`);

console.log(`\n--- Failure reasons (top 20) ---`);
const sortedFail = [...failReasons.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 20);
for (const [reason, files] of sortedFail) {
    console.log(`  ${files.length}x  ${reason}`);
    if (files.length <= 3) for (const f of files) console.log(`        ${f}`);
}

console.log(`\n--- Warning reasons (top 20) ---`);
const sortedWarn = [...warnReasons.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 20);
for (const [reason, files] of sortedWarn) {
    console.log(`  ${files.length}x  ${reason}`);
}
