#!/usr/bin/env node
// Compare cToPseudocode results before and after keil2sdcc preprocessing.
// Measures INPUT WIDENING separately from expressibility.

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import cToPseudocode from '../src/utils/cToPseudocode.js';
import SB3Creator from '../src/utils/sb3Creator.js';

const INFERENCE = /^(no clock|no register header|no pins found|polarity of|inferred DEVICE|inferred CLOCK|<stc)/;

const files = execSync('find corpus -name "*.c" -type f', { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean);

const keilMap = JSON.parse(readFileSync('/tmp/keil-translated.json', 'utf8'));

function classify(src) {
    try {
        const { pseudocode, warnings } = cToPseudocode(src);
        const c = new SB3Creator();
        c.parse(pseudocode);
        const realWarn = warnings.filter(w => !INFERENCE.test(w));
        const parseWarn = c.warnings.filter(w => !/Unknown DEVICE/.test(w));
        const allWarn = [...realWarn, ...parseWarn];

        if (allWarn.some(w => /no main/.test(w))) return 'no_main';
        const interesting = allWarn.filter(w => !/Unknown command/.test(w));
        if (interesting.length === 0) return 'clean';

        const cats = new Set();
        for (const w of interesting) {
            if (/bitwise/.test(w)) cats.add('bitwise');
            else if (/break|continue/.test(w)) cats.add('break_cont');
            else if (/goto/.test(w)) cats.add('goto');
            else if (/for loop/.test(w)) cats.add('for');
            else if (/computed value/.test(w)) cats.add('pin');
            else if (/could not parse/.test(w)) cats.add('parse');
            else cats.add('other');
        }
        return [...cats].sort().join('+');
    } catch (e) {
        return 'exception';
    }
}

const before = new Map();
const after = new Map();
const improved = [];

for (const f of files) {
    let src;
    try { src = readFileSync(f, 'utf8'); } catch { continue; }

    const catBefore = classify(src);
    before.set(catBefore, (before.get(catBefore) || 0) + 1);

    const translated = keilMap[f] || src;
    const catAfter = classify(translated);
    after.set(catAfter, (after.get(catAfter) || 0) + 1);

    if (catBefore !== catAfter && catBefore !== 'no_main') {
        improved.push({ f: f.split('/').slice(-2).join('/'), before: catBefore, after: catAfter });
    }
}

const noMain = before.get('no_main') || 0;
const withMain = files.length - noMain;

console.log('=== KEIL2SDCC PREPROCESSING EFFECT ===\n');
console.log(`Library files (no main): ${noMain} — excluded from percentages`);
console.log(`Files with main(): ${withMain}\n`);

console.log('Category counts (files with main() only):');
console.log('                          BEFORE    AFTER    DELTA');
const allCats = new Set([...before.keys(), ...after.keys()].filter(k => k !== 'no_main'));
for (const cat of [...allCats].sort()) {
    const b = before.get(cat) || 0;
    const a = after.get(cat) || 0;
    if (b === a && b === 0) continue;
    const delta = a - b;
    console.log(`  ${cat.padEnd(24)} ${b.toString().padStart(5)}    ${a.toString().padStart(5)}    ${delta >= 0 ? '+' : ''}${delta}`);
}

const cleanBefore = before.get('clean') || 0;
const cleanAfter = after.get('clean') || 0;
const exBefore = before.get('exception') || 0;
const exAfter = after.get('exception') || 0;

console.log(`\n=== SUMMARY ===`);
console.log(`Clean (translates with zero real warnings):`);
console.log(`  Before keil2sdcc: ${cleanBefore} / ${withMain}  (${(cleanBefore/withMain*100).toFixed(1)}%)`);
console.log(`  After keil2sdcc:  ${cleanAfter} / ${withMain}  (${(cleanAfter/withMain*100).toFixed(1)}%)`);
console.log(`  Delta: +${cleanAfter - cleanBefore} files`);
console.log(`\nExceptions: ${exBefore} → ${exAfter}`);

if (improved.length) {
    console.log(`\nFiles that changed category (${improved.length}):`);
    for (const { f, before, after } of improved.slice(0, 30)) {
        console.log(`  ${before.padEnd(20)} → ${after.padEnd(20)} ${f}`);
    }
    if (improved.length > 30) console.log(`  ... and ${improved.length - 30} more`);
}
