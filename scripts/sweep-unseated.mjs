#!/usr/bin/env node
/**
 * Sweep all example circuits for missing breadboards.
 *
 * Reports circuits that have ZERO breadboard-kind parts
 * (breadboard, mini_breadboard, half_breadboard).
 *
 *   node scripts/sweep-unseated.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const examplesDir = join(root, 'examples');

const BREADBOARD_KINDS = new Set(['breadboard', 'mini_breadboard', 'half_breadboard']);

// Node 20 has no globSync in node:fs — manual glob
const files = [];
for (const d of readdirSync(examplesDir, { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  for (const f of readdirSync(join(examplesDir, d.name))) {
    if (f.startsWith('circuit') && f.endsWith('.json'))
      files.push(join('examples', d.name, f));
  }
}
files.sort();

let count = 0;
for (const rel of files) {
  const abs = join(root, rel);
  let data;
  try {
    data = JSON.parse(readFileSync(abs, 'utf8'));
  } catch (e) {
    console.log(`${rel}: PARSE ERROR — ${e.message}`);
    count++;
    continue;
  }

  const parts = data.parts || [];
  const bbs = parts.filter(p => BREADBOARD_KINDS.has(p.kind));

  if (bbs.length === 0) {
    const partKinds = [...new Set(parts.map(p => p.kind))].join(', ');
    console.log(`${rel}: zero breadboards (parts: ${partKinds})`);
    count++;
  }
}

console.log(`\n--- ${count} circuit(s) with zero breadboards out of ${files.length} total ---`);
