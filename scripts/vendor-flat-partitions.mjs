/**
 * Regenerate the flat circuit twins, and vendor the verdict.
 *
 * `circuit-flat.*.json` is a board-free twin of the `circuit.*.json` beside it.
 * `test/flat-variants.test.mjs` proves the relationship that rots — same net
 * partition — but it needs bw-circuit-ui and bw-board to resolve nets, and CI
 * clones only sb3-creator. So in CI it skips, and 1,006 files sit behind a gate
 * that never runs. That is the shape ROADMAP §5 calls the most expensive green.
 *
 * bw-audit's answer for the stc12 gate was to VENDOR WHAT THE SIBLINGS SHIP, so
 * the gate always has its input (test/fixtures/downstream/MANIFEST.json). The
 * input here is a whole circuit engine — too big to vendor. So this vendors the
 * VERDICT instead, with provenance: for every pair, the hash of both files and
 * the partition they were PROVEN to share, plus the engine SHA that proved it.
 *
 * What that buys, stated exactly: CI cannot recompute the partition, but it can
 * prove no one edited either file since a run that did. Edit one and not the
 * other — the rot this gate exists to catch — and CI goes red with no siblings
 * present. Regenerating is then the only way back to green.
 *
 * Usage:
 *   BW_CIRCUIT_UI=… BW_BOARD=… node scripts/vendor-flat-partitions.mjs [--write]
 * Without --write it reports drift and touches nothing.
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { injectEngine, registerSidecars } from './lib/engine-surface.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const SB3 = join(here, '..');
const EXAMPLES = join(SB3, 'examples');
const MANIFEST = join(SB3, 'test', 'fixtures', 'flat-partitions', 'MANIFEST.json');
const WRITE = process.argv.includes('--write');

const CUI = process.env.BW_CIRCUIT_UI || join(SB3, '..', 'bw-circuit-ui');
const BWB = process.env.BW_BOARD || join(SB3, '..', 'bw-board');
for (const [label, p] of [['bw-circuit-ui', join(CUI, 'src/model/circuit.js')],
                          ['bw-board', join(BWB, 'src/board.js')]]) {
  if (!existsSync(p)) throw new Error(
    `${label} not found at ${p}. This script DERIVES the twins, so it cannot run ` +
    `without the engine — set BW_CIRCUIT_UI / BW_BOARD. (The CI gate that consumes ` +
    `its output needs neither.)`);
}

export const sha256 = (s) => createHash('sha256').update(s).digest('hex');

// getMaxCurrent + PORT_LIMITS used to be injected here and are NOT in
// ENGINE_SURFACE, because circuit-tab.jsx does not pass them: with them absent
// bw-circuit-ui's drc.js falls back to `getMaxCurrent: () => null` ("unknown =
// cannot sum"). Injecting them made this generator run a current-budget DRC the
// app does not have. Measured either way when this changed: the manifest is
// byte-identical, because partitioning is a netlist question and the DRC does
// not touch the netlist.
const { Circuit, resetIds } = await injectEngine({ board: BWB, cui: CUI });
await registerSidecars(CUI);

/** Net partition over real terminals, alias-folded — the same shape the
 *  engine-backed gate compares. */
function partition(c) {
  const sets = [];
  for (const n of (c.resolvedNets || [])) {
    const t = n.terminals
      .filter((x) => typeof x.part === 'string' && !x.part.startsWith('@bb:'))
      .map((x) => (x.part + '.' + x.terminal).toLowerCase());
    const u = [...new Set(t)].sort();
    if (u.length > 1) sets.push(u.join('|'));
  }
  return sets.sort().join('\n');
}
const load = (p) => { const j = JSON.parse(readFileSync(p, 'utf8')); return j.circuit || j; };

/** Board removed; every net the engine resolves re-expressed as explicit
 *  part-to-part wires. Flattened by REWIRING, not by dropping hole wires —
 *  dropping them loses every connection a strip was making. */
function derive(rawTwin) {
  resetIds();
  const c = Circuit.fromJSON(rawTwin);
  const boards = new Set(rawTwin.parts.filter((p) => /^breadboard/.test(p.kind)).map((p) => p.id));
  const byId = new Map(c.parts.map((p) => [p.id, p]));
  const parts = rawTwin.parts.filter((p) => !boards.has(p.id)).map((p) => {
    const resolved = byId.get(p.id);
    const q = { id: p.id, kind: p.kind, params: p.params ?? {} };
    q.terminals = p.terminals ?? (resolved ? [...resolved.terminals] : []);
    q.x = p.x; q.y = p.y;
    if (p.rotation !== undefined) q.rotation = p.rotation;
    return q; // `seat` deliberately dropped: it names a board that is gone
  });
  const keep = new Set(parts.map((p) => p.id));
  const wires = [];
  let n = 0;
  for (const net of (c.resolvedNets || [])) {
    const terms = []; const seen = new Set();
    for (const t of net.terminals) {
      if (typeof t.part !== 'string' || t.part.startsWith('@bb:') || !keep.has(t.part)) continue;
      const k = `${t.part}.${String(t.terminal).toLowerCase()}`;
      if (seen.has(k)) continue;
      seen.add(k); terms.push(t);
    }
    for (let i = 1; i < terms.length; i++) {
      wires.push({ id: `w_flat_${n++}`, netId: net.id,
        from: { part: terms[0].part, terminal: terms[0].terminal },
        to: { part: terms[i].part, terminal: terms[i].terminal } });
    }
  }
  const out = {};
  if (rawTwin.vcc !== undefined) out.vcc = rawTwin.vcc;
  out.parts = parts; out.wires = wires; out.holeWires = [];
  if (rawTwin.generated !== undefined) out.generated = rawTwin.generated;
  return out;
}

const pairs = [];
for (const d of readdirSync(EXAMPLES, { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  for (const fn of readdirSync(join(EXAMPLES, d.name))) {
    if (!fn.startsWith('circuit-flat')) continue;
    const twin = fn === 'circuit-flat.json' ? 'circuit.json' : 'circuit.' + fn.slice('circuit-flat.'.length);
    pairs.push({ dir: d.name, flat: fn, twin });
  }
}
pairs.sort((a, b) => (a.dir + '/' + a.flat).localeCompare(b.dir + '/' + b.flat));
if (pairs.length < 900) throw new Error(`only ${pairs.length} flat twins found — refusing to vendor a manifest over a corpus that shrank`);

const engineSha = (() => {
  try { return execFileSync('git', ['-C', CUI, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); }
  catch { return 'unknown'; }
})();

const entries = [];
let regenerated = 0, alreadyFaithful = 0;
const failures = [];
for (const { dir, flat, twin } of pairs) {
  const fp = join(EXAMPLES, dir, flat), tp = join(EXAMPLES, dir, twin);
  if (!existsSync(tp)) { failures.push(`${dir}/${flat}: no twin ${twin}`); continue; }
  const rawTwin = load(tp);
  resetIds();
  const want = partition(Circuit.fromJSON(rawTwin));

  let text = existsSync(fp) ? readFileSync(fp, 'utf8') : null;
  let faithful = false;
  if (text !== null) {
    try { resetIds(); faithful = partition(Circuit.fromJSON(JSON.parse(text).circuit ?? JSON.parse(text))) === want; }
    catch { faithful = false; }
  }
  if (faithful) alreadyFaithful++;
  else {
    const gen = derive(rawTwin);
    text = JSON.stringify(gen, null, 2) + '\n';
    // Verified from the TEXT ACTUALLY WRITTEN, not the object in hand.
    resetIds();
    if (partition(Circuit.fromJSON(JSON.parse(text))) !== want) {
      failures.push(`${dir}/${flat}: derived twin STILL differs`); continue;
    }
    if (gen.parts.some((p) => /^breadboard/.test(p.kind))) {
      failures.push(`${dir}/${flat}: board survived derivation`); continue;
    }
    if (WRITE) writeFileSync(fp, text);
    regenerated++;
  }
  entries.push({
    dir, flat, twin,
    flatSha: sha256(text),
    twinSha: sha256(readFileSync(tp, 'utf8')),
    partitionSha: sha256(want),
  });
}

if (failures.length) {
  console.error(`${failures.length} failure(s):`);
  for (const f of failures.slice(0, 10)) console.error('  ', f);
  process.exit(1);
}

const manifest = {
  note: 'Vendored VERDICT for the flat circuit twins. CI cannot recompute the net '
      + 'partition (that needs bw-circuit-ui + bw-board), but it can prove neither file '
      + 'of a pair changed since a run that did. Regenerate with '
      + 'scripts/vendor-flat-partitions.mjs --write.',
  engine: { repo: 'bw-circuit-ui', sha: engineSha },
  pairs: entries.length,
  entries,
};
console.log(`pairs=${pairs.length} regenerated=${regenerated} alreadyFaithful=${alreadyFaithful} manifestEntries=${entries.length} engine=${engineSha.slice(0, 7)}`);
if (WRITE) { writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n'); console.log(`wrote ${MANIFEST}`); }
else console.log('(dry run — pass --write to update files and manifest)');
