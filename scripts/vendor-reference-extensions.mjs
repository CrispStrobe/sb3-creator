#!/usr/bin/env node
/**
 * Record what reference/extensions/ actually IS, per file.
 *
 * WHY THIS EXISTS
 * ---------------
 * reference/extensions/README.md called these files "Pinned extension sources",
 * "canonical copies", the "source of truth", and told the next reader:
 *
 *     Origin: github.com/CrispStrobe/extensions -> extensions/CrispStrobe/*.js
 *     To refresh: re-fetch from the repo above. Do not edit these by hand.
 *
 * Nothing in the directory recorded a commit, a hash or a date, so "pinned" was
 * a word rather than a fact — the same shape as fetching a branch and reporting
 * it as a pin. And the instruction was worse than imprecise, it was destructive:
 * reference/extensions/stc12.js is 24,467 bytes where the file it names upstream
 * is 10,335. The local copy is AHEAD. It carries the `keypad` reporter and the
 * whole SEVENSEG8 surface (`seg_shownum`, `seg_showdigit`, ...) that upstream
 * does not have yet. Re-fetching, as instructed, would silently delete them —
 * and test/stc12-conformance.test.mjs, whose entire job is to notice the emitter
 * and the extension disagreeing about opcodes, treats THIS file as canonical.
 * So the README pointed the repair at the thing being repaired.
 *
 * WHAT THIS RECORDS
 * -----------------
 * Per file: the sha256 of the in-repo copy, and its RELATIONSHIP to the named
 * upstream, stated rather than assumed:
 *
 *   identical    — byte-equal to upstream at `upstreamCommit`. Re-fetching is
 *                  a no-op, which is the only case where it is safe.
 *   local-ahead  — this repo has work upstream does not. Re-fetching DESTROYS
 *                  it. The manifest records upstream's own sha256 too, so
 *                  "upstream caught up" is checkable rather than assumed.
 *   local-behind — upstream has work this repo does not; refresh deliberately.
 *   not-upstream — no such file upstream. The origin line does not apply.
 *
 * THE SPLIT, AS THE REST OF THIS REPO DOES IT
 * -------------------------------------------
 * Generating needs the upstream checkout. CHECKING does not: the hashes are
 * committed, so test/reference-extensions-provenance.test.mjs runs anywhere and
 * fails when a file is edited without updating its record. That is the same
 * arrangement as vendor-flat-partitions.mjs / flat-variants-manifest.test.mjs.
 *
 * Usage:
 *   node scripts/vendor-reference-extensions.mjs [--write]
 *   BW_EXTENSIONS=/path/to/extensions node scripts/vendor-reference-extensions.mjs --write
 * Without --write it reports drift and touches nothing.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SB3 = join(here, '..');
const REF = join(SB3, 'reference', 'extensions');
const MANIFEST = join(REF, 'MANIFEST.json');
const WRITE = process.argv.includes('--write');

const UPSTREAM = process.env.BW_EXTENSIONS || join(SB3, '..', 'extensions');
const UPSTREAM_SUBDIR = 'extensions/CrispStrobe';

export const sha256 = (b) => createHash('sha256').update(b).digest('hex');
export const jsFiles = () => readdirSync(REF).filter((f) => f.endsWith('.js')).sort();

if (!existsSync(join(UPSTREAM, UPSTREAM_SUBDIR))) {
    throw new Error(
        `upstream not found at ${join(UPSTREAM, UPSTREAM_SUBDIR)}. This script DERIVES the\n` +
        'relationship to upstream, so it cannot run without the checkout — set BW_EXTENSIONS.\n' +
        '(The gate that consumes its output needs no checkout at all.)');
}

const head = execFileSync('git', ['-C', UPSTREAM, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

const entries = [];
for (const file of jsFiles()) {
    const local = readFileSync(join(REF, file));
    const upPath = join(UPSTREAM, UPSTREAM_SUBDIR, file);
    const e = { file, bytes: local.length, sha256: sha256(local) };
    if (!existsSync(upPath)) {
        e.relationship = 'not-upstream';
        e.why = 'no file of this name in ' + UPSTREAM_SUBDIR + '; the origin line does not apply to it';
    } else {
        const up = readFileSync(upPath);
        e.upstreamCommit = execFileSync(
            'git', ['-C', UPSTREAM, 'log', '-1', '--format=%H', '--', `${UPSTREAM_SUBDIR}/${file}`],
            { encoding: 'utf8' }).trim() || null;
        e.upstreamSha256 = sha256(up);
        e.upstreamBytes = up.length;
        e.relationship = up.equals(local) ? 'identical'
            : local.length > up.length ? 'local-ahead' : 'local-behind';
    }
    entries.push(e);
}

const manifest = {
    note: 'Provenance for reference/extensions/. Regenerate with '
        + 'scripts/vendor-reference-extensions.mjs --write. `sha256` is the in-repo copy and is '
        + 'checked by test/reference-extensions-provenance.test.mjs WITHOUT any upstream '
        + 'checkout, so editing a file here without re-recording it goes red. `relationship` '
        + 'says whether re-fetching from upstream is safe: only `identical` is a no-op. A '
        + '`local-ahead` file has work upstream does not, and re-fetching DELETES it.',
    upstream: { repo: 'CrispStrobe/extensions', subdir: UPSTREAM_SUBDIR, headAtRecording: head },
    files: entries.length,
    entries,
};

const next = JSON.stringify(manifest, null, 2) + '\n';
const prev = existsSync(MANIFEST) ? readFileSync(MANIFEST, 'utf8') : null;
if (prev === next) { console.log(`reference/extensions: ${entries.length} files, manifest current.`); process.exit(0); }
if (!WRITE) {
    console.error(`reference/extensions: MANIFEST.json is ${prev === null ? 'MISSING' : 'STALE'}. Re-run with --write.`);
    for (const e of entries) console.error(`  ${e.file.padEnd(22)} ${e.relationship}`);
    process.exit(1);
}
writeFileSync(MANIFEST, next);
console.log(`reference/extensions: wrote ${entries.length} entries (upstream HEAD ${head.slice(0, 12)}).`);
for (const e of entries) console.log(`  ${e.file.padEnd(22)} ${e.relationship}`);
