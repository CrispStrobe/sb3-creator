#!/usr/bin/env node
/**
 * Prove a breadboard layout pass left every lab bench's nets exactly as they were.
 *
 * For each examples/lab-* /circuit.json this loads the file at a git revision
 * (default: origin/main) and the file in the working tree, each through
 * Circuit.fromJSON exactly as the gates load them (injectEngine only — no extra
 * sidecars, so a seat only the browser would honour shows up as a lost net),
 * and compares the two engine net partitions: every multi-terminal net, as a
 * sorted set of part.terminal names. Any difference fails, and is printed.
 * It also refuses a bench whose part ids, kinds or params changed.
 *
 *   BW_BOARD=… BW_CIRCUIT_UI=… node scripts/prove-lab-nets.mjs [--base=REV] [lab-id …]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectEngine } from './lib/engine-surface.mjs';
import { netPartition, partitionDiff } from './lib/bench-layout.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = await injectEngine();
const args = process.argv.slice(2);
const base = (args.find(a => a.startsWith('--base=')) || '--base=origin/main').slice(7);
let ids = args.filter(a => !a.startsWith('--'));
if (!ids.length) ids = readdirSync(join(ROOT, 'examples')).filter(d => d.startsWith('lab-')).sort();

const identity = (json) => JSON.stringify(json.parts.filter(p => p.kind !== 'breadboard')
    .map(p => [p.id, p.kind, p.params || {}]).sort((a, b) => a[0] < b[0] ? -1 : 1));

let same = 0, changed = 0, fresh = 0, bad = 0;
for (const id of ids) {
    const rel = `examples/${id}/circuit.json`;
    if (!existsSync(join(ROOT, rel))) continue;
    let old;
    try {
        old = JSON.parse(execFileSync('git', ['show', `${base}:${rel}`], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
    } catch { console.log(`  new  ${id} (not at ${base})`); fresh++; continue; }
    const now = JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
    const problems = partitionDiff(netPartition(E, old), netPartition(E, now));
    if (identity(old) !== identity(now)) problems.push('part ids, kinds or params differ');
    const moved = JSON.stringify(old) !== JSON.stringify(now);
    if (problems.length) {
        console.log(`  FAIL ${id}:\n    ${problems.join('\n    ')}`);
        bad++;
    } else {
        console.log(`  ${moved ? 'same nets, new layout' : 'unchanged'}  ${id}  (${netPartition(E, now).length} nets)`);
        moved ? changed++ : same++;
    }
}
console.log(`\n${changed} re-laid out with identical nets, ${same} untouched, ${fresh} not at ${base}, ${bad} FAILED`);
process.exitCode = bad ? 1 : 0;
