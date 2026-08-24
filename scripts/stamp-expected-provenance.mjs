#!/usr/bin/env node
/**
 * Stamp engine provenance onto every EXPECTED.md whose numbers came out of a
 * solve.
 *
 * WHY
 * ---
 * Twenty-seven pages in this corpus say "measured on the engine" or quote an
 * `audit-solve` invocation, and until this script not one of them said WHICH
 * engine. A measured number without a revision is a number that cannot be
 * reproduced or falsified: when pc32-pnp-high-side's V_EB drifts, nobody can
 * tell whether the document was wrong or the engine moved. The lesson ledger
 * already records the revision it was derived against; these pages now do too.
 *
 * The block also carries the per-page census — how many of that page's claims
 * `test/expected-quantities-hold.test.mjs` actually compares — so a reader can
 * see the coverage of the page in front of them rather than a corpus average.
 *
 * `node scripts/stamp-expected-provenance.mjs`          rewrite the blocks
 * `node scripts/stamp-expected-provenance.mjs --check`  fail if any is missing
 *                                                       or stale (CI/gate use)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { allClaims, exampleDirs, EXAMPLES } from '../test/helpers/expected-claims.mjs';
import { loadEngine } from '../test/helpers/bench-measure.mjs';
import { adjudicate } from '../test/helpers/claim-adjudicate.mjs';
import { locate, PINS } from '../test/helpers/siblings.mjs';
import { MARK, isDerived } from '../test/helpers/expected-provenance.mjs';

const paths = Object.fromEntries(['bw-board', 'bw-circuit-ui'].map(n => [n, locate(n).path]));
if (Object.values(paths).some(p => !p)) {
    console.error('needs bw-board and bw-circuit-ui beside this repo (or BW_BOARD / BW_CIRCUIT_UI set)');
    process.exit(2);
}
await loadEngine(paths);

const short = (n) => PINS.siblings[n].rev.slice(0, 7);
const stamp = (checked, mismatched, total) => [
    MARK,
    `> **Engine provenance.** The measured numbers on this page were last held against`,
    `> \`bw-board@${short('bw-board')}\` and \`bw-circuit-ui@${short('bw-circuit-ui')}\` — the revisions pinned in`,
    `> \`test/fixtures/siblings.json\`. \`test/expected-quantities-hold.test.mjs\` compares`,
    `> **${checked + mismatched} of this page's ${total}** numeric claims against that engine`,
    `> (${mismatched} of them disagreeing) and declines the rest with a stated reason;`,
    `> \`node scripts/expected-claim-census.mjs ${'%DIR%'}\` prints them one by one.`,
    MARK,
].join('\n');

const rows = new Map();
for (const claim of allClaims()) {
    const r = rows.get(claim.dir) || { checked: 0, skipped: 0, mismatched: 0 };
    const v = adjudicate(claim);
    if (v.ok) r.checked++; else if (v.skip) r.skipped++; else r.mismatched++;
    rows.set(claim.dir, r);
}

const check = process.argv.includes('--check');
const problems = [];
let written = 0;
for (const dir of exampleDirs()) {
    const path = join(EXAMPLES, dir, 'EXPECTED.md');
    if (!existsSync(path)) continue;
    const text = readFileSync(path, 'utf8');
    if (!isDerived(text)) continue;
    const r = rows.get(dir) || { checked: 0, skipped: 0, mismatched: 0 };
    const want = stamp(r.checked, r.mismatched, r.checked + r.skipped + r.mismatched).replaceAll('%DIR%', dir);
    const has = text.includes(MARK);
    const body = has
        ? text.replace(new RegExp(`${MARK}[\\s\\S]*?${MARK}`), () => want)
        : text.replace(/\n*$/, '\n\n') + want + '\n';
    if (body === text) continue;
    if (check) { problems.push(`${dir}/EXPECTED.md: ${has ? 'provenance block is stale' : 'quotes a solve but names no engine revision'}`); continue; }
    writeFileSync(path, body);
    written++;
}

if (check) {
    if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
    console.log('every engine-derived EXPECTED.md names the pinned revisions');
} else {
    console.log(`stamped ${written} EXPECTED.md files`);
}
