#!/usr/bin/env node
/**
 * Sweep all example circuits for dangling wires and unwired parts.
 *
 * Dangling wire: `from` or `to` references a part ID not in the parts array.
 * Unwired part:  a part that is neither `from` nor `to` of any wire.
 *                Excluded from the unwired check: breadboards, gnd, vcc,
 *                seven_seg, seven_seg_hex (legitimately unwired).
 *
 *   node scripts/sweep-dangling-wires.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const examplesDir = join(root, 'examples');

const EXCLUDE_UNWIRED = new Set([
  'breadboard', 'mini_breadboard', 'half_breadboard',
  'gnd', 'vcc',
  'seven_seg', 'seven_seg_hex',
]);

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

let danglingCount = 0;
let unwiredCount = 0;
let filesWithIssues = 0;

for (const rel of files) {
  const abs = join(root, rel);
  let data;
  try {
    data = JSON.parse(readFileSync(abs, 'utf8'));
  } catch (e) {
    console.log(`${rel}: PARSE ERROR — ${e.message}`);
    filesWithIssues++;
    continue;
  }

  const parts = data.parts || [];
  const wires = data.wires || [];
  const partIds = new Set(parts.map(p => p.id));
  const issues = [];

  // Helper: extract part ID from a wire endpoint.
  // Formats: string "MCU" | {part:"MCU", terminal:"d13"} | {board:"bb1", hole:"a5"} (hole-wire, no part ref)
  const endpointId = (ep) =>
    typeof ep === 'string' ? ep :
    (ep && typeof ep === 'object' && ep.part) ? ep.part :
    null;

  // --- dangling wires ---
  for (let i = 0; i < wires.length; i++) {
    const w = wires[i];
    const bad = [];
    const fromId = endpointId(w.from);
    const toId = endpointId(w.to);
    if (fromId && !partIds.has(fromId)) bad.push(`from="${fromId}"`);
    if (toId && !partIds.has(toId)) bad.push(`to="${toId}"`);
    if (bad.length) {
      issues.push(`  wire[${i}]: dangling ${bad.join(', ')}`);
      danglingCount++;
    }
  }

  // --- unwired parts ---
  const wiredIds = new Set();
  for (const w of wires) {
    const fromId = endpointId(w.from);
    const toId = endpointId(w.to);
    if (fromId) wiredIds.add(fromId);
    if (toId) wiredIds.add(toId);
  }
  for (const p of parts) {
    if (EXCLUDE_UNWIRED.has(p.kind)) continue;
    // Seated parts connect through the breadboard's internal traces — not unwired.
    if (p.seat) continue;
    if (!wiredIds.has(p.id)) {
      issues.push(`  part "${p.id}" (${p.kind}): zero wires`);
      unwiredCount++;
    }
  }

  if (issues.length) {
    console.log(`${rel}:`);
    for (const line of issues) console.log(line);
    filesWithIssues++;
  }
}

console.log(`\n--- Summary: ${danglingCount} dangling wire(s), ${unwiredCount} unwired part(s) across ${filesWithIssues} file(s) out of ${files.length} total ---`);
