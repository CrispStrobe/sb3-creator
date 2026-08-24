#!/usr/bin/env node
/**
 * The per-example claim census: how many numeric claims each EXPECTED.md makes,
 * how many this repo can check, how many it declines and why, and how many the
 * engine contradicts.
 *
 * `node scripts/expected-claim-census.mjs`            the corpus table
 * `node scripts/expected-claim-census.mjs --reasons`  the decline reasons, by count
 * `node scripts/expected-claim-census.mjs <example>`  one example, claim by claim
 *
 * Needs bw-board and bw-circuit-ui beside the repo, or BW_BOARD / BW_CIRCUIT_UI
 * pointing at them; test/fixtures/siblings.json records the revisions CI uses.
 */
import { allClaims, exampleDirs } from '../test/helpers/expected-claims.mjs';
import { loadEngine } from '../test/helpers/bench-measure.mjs';
import { adjudicate } from '../test/helpers/claim-adjudicate.mjs';
import { locate } from '../test/helpers/siblings.mjs';

const paths = Object.fromEntries(['bw-board', 'bw-circuit-ui'].map(n => [n, locate(n).path]));
if (Object.values(paths).some(p => !p)) {
    console.error('needs bw-board and bw-circuit-ui beside this repo (or BW_BOARD / BW_CIRCUIT_UI set)');
    process.exit(2);
}
await loadEngine(paths);

const only = process.argv.slice(2).find(a => !a.startsWith('--'));
const rows = new Map();
const reasons = new Map();
let checked = 0, skipped = 0, mismatched = 0;
const detail = [];

for (const claim of allClaims()) {
    if (only && claim.dir !== only) continue;
    const v = adjudicate(claim);
    const row = rows.get(claim.dir) || { checked: 0, skipped: 0, mismatched: 0 };
    if (v.ok) { row.checked++; checked++; }
    else if (v.skip) { row.skipped++; skipped++; reasons.set(v.skip, (reasons.get(v.skip) || 0) + 1); }
    else { row.mismatched++; mismatched++; }
    rows.set(claim.dir, row);
    if (only) detail.push({ claim, v });
}

if (only) {
    for (const { claim, v } of detail) {
        const mark = v.ok ? 'OK  ' : v.skip ? '--  ' : 'BAD ';
        console.log(`${mark} L${String(claim.lineNo).padStart(3)} ${claim.text.padEnd(26)} ${v.ok ? v.how : v.skip || v.detail}`);
    }
}

if (process.argv.includes('--reasons')) {
    console.log('\n| n | why a claim was not compared |');
    console.log('|---|---|');
    for (const [why, n] of [...reasons].sort((a, b) => b[1] - a[1]))
        console.log(`| ${n} | ${why} |`);
}

if (!only) {
    console.log('| example | claims | checked | skipped | mismatched |');
    console.log('|---|---|---|---|---|');
    for (const dir of exampleDirs()) {
        const r = rows.get(dir);
        if (!r) continue;
        const total = r.checked + r.skipped + r.mismatched;
        console.log(`| ${dir} | ${total} | ${r.checked} | ${r.skipped} | ${r.mismatched} |`);
    }
}

const total = checked + skipped + mismatched;
console.log(`\nTOTAL  claims ${total}  checked ${checked}  mismatched ${mismatched}  `
    + `skipped ${skipped}  |  compared ${checked + mismatched} = ${((checked + mismatched) / total * 100).toFixed(1)} %`);
