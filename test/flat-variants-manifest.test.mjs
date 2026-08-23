/**
 * Flat twins, guarded WITHOUT the siblings — the CI half of the flat gate.
 *
 * `test/flat-variants.test.mjs` proves the property that matters: a flat twin
 * resolves to the same net partition as the circuit beside it. But it needs
 * bw-circuit-ui and bw-board to resolve nets, and sb3-creator's CI clones one
 * repo, so there it SKIPS. 1,006 files would sit behind a gate that never runs,
 * and a skip reads exactly like a pass (ROADMAP §5).
 *
 * bw-audit's answer for the stc12 conformance gate was to vendor what the
 * siblings ship, so the gate always has its input. The input here is a whole
 * circuit engine, too big to vendor. So `scripts/vendor-flat-partitions.mjs`
 * vendors the VERDICT instead, with provenance: for each pair, the hash of both
 * files and the partition they were proven to share, plus the engine SHA.
 *
 * WHAT THIS GATE PROVES, exactly — no more:
 *   - every flat twin on disk is in the manifest and vice versa;
 *   - neither file of any pair has changed since the run that proved them equal;
 *   - every flat twin really is board-free, and carries the same parts as its
 *     twin (both checkable from the JSON alone).
 *
 * WHAT IT DOES NOT PROVE: it does not recompute the partition. It cannot —
 * that needs the engine. It proves nobody edited either side since a run that
 * did. Editing one and not the other, which is the rot the pair can suffer,
 * turns this red in CI with no siblings present.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const EXAMPLES = join(here, '..', 'examples');
const MANIFEST_PATH = join(here, 'fixtures', 'flat-partitions', 'MANIFEST.json');
const sha256 = (s) => createHash('sha256').update(s).digest('hex');

// No skip branch: a missing manifest is a failure, not an excuse to do less.
if (!existsSync(MANIFEST_PATH)) {
  throw new Error(
    `${MANIFEST_PATH} is missing. The flat twins are guarded in CI by a vendored `
    + `verdict; without it 1,006 files would be unguarded wherever the sibling `
    + `checkouts are absent. Regenerate beside bw-circuit-ui/bw-board with `
    + `\`node scripts/vendor-flat-partitions.mjs --write\`.`);
}
const MANIFEST = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

function flatTwinsOnDisk() {
  const found = [];
  for (const d of readdirSync(EXAMPLES, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    for (const fn of readdirSync(join(EXAMPLES, d.name))) {
      if (fn.startsWith('circuit-flat')) found.push(`${d.name}/${fn}`);
    }
  }
  return found.sort();
}

describe('flat twins are guarded without sibling checkouts', () => {
  test('the manifest is attributed to a real engine revision', () => {
    assert.equal(MANIFEST.engine?.repo, 'bw-circuit-ui');
    assert.match(MANIFEST.engine?.sha ?? '', /^[0-9a-f]{40}$/,
      'engine SHA must be recorded — an unattributed verdict cannot be re-derived');
    assert.ok(Array.isArray(MANIFEST.entries) && MANIFEST.entries.length > 900,
      `only ${MANIFEST.entries?.length} entries — refusing to pass over a shrunken corpus`);
  });

  test('the manifest covers exactly the flat twins on disk', () => {
    const disk = flatTwinsOnDisk();
    const listed = MANIFEST.entries.map((e) => `${e.dir}/${e.flat}`).sort();
    const unlisted = disk.filter((f) => !listed.includes(f));
    const vanished = listed.filter((f) => !disk.includes(f));
    assert.deepEqual(unlisted.slice(0, 10), [],
      `${unlisted.length} flat twin(s) on disk are not in the manifest — regenerate it`);
    assert.deepEqual(vanished.slice(0, 10), [],
      `${vanished.length} manifest entr(ies) name a file that is gone`);
    assert.equal(disk.length, listed.length);
  });

  test('neither file of any pair changed since the partition was proven', () => {
    const drifted = [];
    for (const e of MANIFEST.entries) {
      const fp = join(EXAMPLES, e.dir, e.flat), tp = join(EXAMPLES, e.dir, e.twin);
      if (!existsSync(fp)) { drifted.push(`${e.dir}/${e.flat}: missing`); continue; }
      if (!existsSync(tp)) { drifted.push(`${e.dir}/${e.twin}: missing twin`); continue; }
      if (sha256(readFileSync(fp, 'utf8')) !== e.flatSha) drifted.push(`${e.dir}/${e.flat}: flat edited since it was proven`);
      else if (sha256(readFileSync(tp, 'utf8')) !== e.twinSha) drifted.push(`${e.dir}/${e.twin}: twin edited since the pair was proven`);
    }
    assert.deepEqual(drifted.slice(0, 15), [],
      `${drifted.length} pair(s) changed since the vendored verdict. Re-derive with `
      + `\`node scripts/vendor-flat-partitions.mjs --write\` beside the engine, or the `
      + `pair is no longer known to be electrically identical.`);
  });

  test('every flat twin is board-free and carries its twin\'s parts', () => {
    const problems = [];
    for (const e of MANIFEST.entries) {
      const load = (p) => { const j = JSON.parse(readFileSync(p, 'utf8')); return j.circuit || j; };
      const flat = load(join(EXAMPLES, e.dir, e.flat));
      const twin = load(join(EXAMPLES, e.dir, e.twin));
      if ((flat.parts || []).some((p) => /^breadboard/.test(p.kind))) {
        problems.push(`${e.dir}/${e.flat}: still has a breadboard`); continue;
      }
      const f = new Set((flat.parts || []).map((p) => p.id));
      const t = new Set((twin.parts || []).filter((p) => !/^breadboard/.test(p.kind)).map((p) => p.id));
      const missing = [...t].filter((id) => !f.has(id));
      const extra = [...f].filter((id) => !t.has(id));
      if (missing.length || extra.length) {
        problems.push(`${e.dir}/${e.flat}: parts differ (missing ${missing.slice(0,3)}, extra ${extra.slice(0,3)})`);
      }
    }
    assert.deepEqual(problems.slice(0, 15), [], `${problems.length} flat twin(s) are structurally wrong`);
  });

  // A gate that cannot fail consumes the alarm a real defect would raise.
  // This canary runs in CI, with no siblings, like the gate it proves.
  test('CANARY: the drift check rejects an edited pair', () => {
    const e = MANIFEST.entries[0];
    const text = readFileSync(join(EXAMPLES, e.dir, e.flat), 'utf8');
    assert.equal(sha256(text), e.flatSha, 'baseline: the real file matches its recorded hash');

    // Re-introduce the exact defect: one wire removed from the flat twin.
    const mutated = JSON.parse(text);
    assert.ok(mutated.wires.length > 0, 'fixture must have a wire to drop');
    mutated.wires.pop();
    const mutatedText = JSON.stringify(mutated, null, 2) + '\n';
    assert.notEqual(sha256(mutatedText), e.flatSha,
      'dropping a wire MUST break the recorded hash — otherwise this gate checks nothing');

    // And an edit to the OTHER side must be caught too, which is the asymmetric
    // case the pair can rot into: twin rewired, flat left behind.
    const twinText = readFileSync(join(EXAMPLES, e.dir, e.twin), 'utf8');
    assert.equal(sha256(twinText), e.twinSha, 'baseline: the twin matches too');
    assert.notEqual(sha256(twinText + '\n'), e.twinSha, 'a changed twin MUST break its hash');
  });
});
