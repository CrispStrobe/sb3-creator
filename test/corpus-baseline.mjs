#!/usr/bin/env node
/**
 * corpus-baseline.mjs — Phase 2 baseline measurement.
 *
 * Runs cToPseudocode over every .c file in corpus/, then attempts
 * parse() on the result. Reports:
 *   - translate: files that produce pseudocode (with or without warnings)
 *   - reparse:   of those, files whose pseudocode re-parses clean
 *   - warn:      files that translate but with warnings
 *   - fail:      files that throw during translation
 *
 * Failure causes are grouped and counted.
 *
 * Usage: node test/corpus-baseline.mjs [--top N] [--verbose]
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = join(fileURLToPath(import.meta.url), '..');
const root = join(__dirname, '..');

// Dynamic import of the modules under test
const { default: cToPseudocode } = await import(join(root, 'src/utils/cToPseudocode.js'));
const { default: SB3Creator } = await import(join(root, 'src/utils/sb3Creator.js'));

const corpusDir = join(root, 'corpus');
const topN = process.argv.includes('--top') ? parseInt(process.argv[process.argv.indexOf('--top') + 1]) || 20 : 20;
const verbose = process.argv.includes('--verbose');

// Collect all .c files
const files = execSync(`find ${corpusDir} -name '*.c'`, { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean);

console.log(`corpus: ${files.length} .c files\n`);

const results = { translate: 0, reparse: 0, warn: 0, fail: 0 };
const failReasons = new Map();   // reason → count
const warnReasons = new Map();   // warning text → count
const failFiles = [];
const warnFiles = [];

for (const file of files) {
    const rel = relative(corpusDir, file);
    let source;
    try {
        source = readFileSync(file, 'utf8');
    } catch {
        results.fail++;
        const reason = 'read error';
        failReasons.set(reason, (failReasons.get(reason) || 0) + 1);
        continue;
    }

    // Skip very large files (>100KB) — likely auto-generated
    if (source.length > 100_000) {
        results.fail++;
        const reason = 'too large (>100KB)';
        failReasons.set(reason, (failReasons.get(reason) || 0) + 1);
        continue;
    }

    let pseudocode, warnings;
    try {
        const result = cToPseudocode(source);
        pseudocode = result.pseudocode;
        warnings = result.warnings;
    } catch (e) {
        results.fail++;
        const reason = e.message.split('\n')[0].slice(0, 80);
        failReasons.set(reason, (failReasons.get(reason) || 0) + 1);
        if (verbose) failFiles.push({ file: rel, reason });
        continue;
    }

    if (!pseudocode || pseudocode.trim() === '') {
        results.fail++;
        const reason = 'empty pseudocode';
        failReasons.set(reason, (failReasons.get(reason) || 0) + 1);
        continue;
    }

    results.translate++;

    if (warnings && warnings.length > 0) {
        results.warn++;
        for (const w of warnings) {
            const key = w.slice(0, 80);
            warnReasons.set(key, (warnReasons.get(key) || 0) + 1);
        }
        if (verbose) warnFiles.push({ file: rel, warnings });
    }

    // Try to re-parse the pseudocode
    try {
        const c = new SB3Creator();
        c.parse(pseudocode);
        results.reparse++;
    } catch (e) {
        // Translates but doesn't re-parse — still counts as translate
        if (verbose) console.log(`  reparse-fail: ${rel}: ${e.message.slice(0, 60)}`);
    }
}

console.log('=== BASELINE ===');
console.log(`  total:     ${files.length}`);
console.log(`  translate: ${results.translate} (${(100 * results.translate / files.length).toFixed(1)}%)`);
console.log(`  reparse:   ${results.reparse} (${(100 * results.reparse / files.length).toFixed(1)}%)`);
console.log(`  warn:      ${results.warn}`);
console.log(`  fail:      ${results.fail}`);
console.log();

console.log(`=== TOP ${topN} FAILURE CAUSES ===`);
const sortedFails = [...failReasons.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN);
for (const [reason, count] of sortedFails) {
    console.log(`  ${String(count).padStart(4)}  ${reason}`);
}
console.log();

console.log(`=== TOP ${topN} WARNING CAUSES ===`);
const sortedWarns = [...warnReasons.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN);
for (const [reason, count] of sortedWarns) {
    console.log(`  ${String(count).padStart(4)}  ${reason}`);
}

// Write machine-readable results
const output = {
    date: new Date().toISOString().slice(0, 10),
    total: files.length,
    translate: results.translate,
    reparse: results.reparse,
    warn: results.warn,
    fail: results.fail,
    failReasons: Object.fromEntries(sortedFails),
    warnReasons: Object.fromEntries(sortedWarns),
};
writeFileSync(join(root, 'test', 'corpus-baseline.json'), JSON.stringify(output, null, 2) + '\n');
console.log('\nWrote test/corpus-baseline.json');
