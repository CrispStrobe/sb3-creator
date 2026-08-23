#!/usr/bin/env node
// Vendor the downstream copies of our extensions into test/fixtures/downstream/.
//
// WHY THIS EXISTS
// ---------------
// The conformance gate compares the opcodes sb3Creator.js emits against every
// copy of the extension that a host might load. Two of those copies live in
// other repositories:
//
//   brickwright-lite   overlay/scratch-vm/src/extensions/crispstrobe/<slug>/index.js
//   extensions         extensions/CrispStrobe/<slug>.js
//
// sb3-creator's CI clones sb3-creator and nothing else, so before this script
// those comparisons found no file and SKIPPED — and a skip is indistinguishable
// from a pass in the summary line. That is how a shipped extension went eight
// opcodes short for five days with a green CI. See test/STC12-CONFORMANCE-FINDING.md.
//
// Vendoring a pinned snapshot makes the comparison possible in every
// environment, because the property under test is a property of CONTENT, not of
// the filesystem layout of somebody's laptop.
//
// The obvious objection to vendoring is drift: you end up testing the snapshot
// instead of what ships. That is answered two ways, and both are enforced:
//
//   1. MANIFEST.json records, per snapshot, the exact set of emitted opcodes the
//      snapshot does NOT define (`expectedMissing`). The gate asserts that set
//      EXACTLY. A new gap fails, and so does a gap that has been fixed upstream
//      without refreshing the snapshot — so the exemption cannot outlive its cause.
//   2. When the live sibling IS present (a developer box), a drift test compares
//      it against the snapshot and fails if they disagree.
//
// Run this after landing an extension change in a sibling repo:
//     node scripts/vendor-downstream-extensions.mjs
// It refuses to write a snapshot it cannot attribute to a commit.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '..', 'test', 'fixtures', 'downstream');

// Sibling checkouts are not laid out the same way on every machine, so each
// source lists every layout we have actually seen, and an env var wins.
export const SOURCES = [
    {
        name: 'lite-stc12',
        repo: 'brickwright-lite',
        env: 'BW_LITE_STC12',
        repoPath: 'overlay/scratch-vm/src/extensions/crispstrobe/stc12/index.js',
        wrapper: 'makeExt',
        why: 'the extension brickwright-lite bundles; what the desktop/mobile app loads'
    },
    {
        name: 'lite-stc12live',
        repo: 'brickwright-lite',
        env: 'BW_LITE_STC12LIVE',
        repoPath: 'overlay/scratch-vm/src/extensions/crispstrobe/stc12live/index.js',
        wrapper: 'makeExt',
        why: 'bundled tethered-hardware driver; runtime-only, no emitter'
    },
    {
        name: 'gallery-stc12',
        repo: 'extensions',
        env: 'BW_GALLERY',
        repoPath: 'extensions/CrispStrobe/stc12.js',
        wrapper: null,
        why: 'deployed to crispstrobe.github.io; what web Brickwright fetches at runtime'
    },
    {
        name: 'gallery-stc12live',
        repo: 'extensions',
        env: 'BW_GALLERY_STC12LIVE',
        repoPath: 'extensions/CrispStrobe/stc12live.js',
        wrapper: null,
        why: 'deployed tethered-hardware driver'
    },
    {
        name: 'gallery-ledcube',
        repo: 'extensions',
        env: 'BW_GALLERY_LEDCUBE',
        repoPath: 'extensions/CrispStrobe/ledcube.js',
        wrapper: null,
        why: 'deployed LED-cube extension; sb3-creator emits ledcube_* opcodes'
    }
];

// Every sibling-checkout layout this repo has been run beside. Paths are
// relative to the REPO ROOT, and there is a test that at least one of them
// resolves on a machine that has the sibling: an off-by-one here would make the
// drift check skip everywhere, which is the exact failure this file exists to end.
const ROOTS = {
    'brickwright-lite': ['../lego/brickwright-lite', '../bw-bundle/lite', '../brickwright-lite'],
    extensions: ['../extensions', '../lego/extensions']
};
const REPO_ROOT = resolve(here, '..');

export function locateLive (source) {
    if (process.env[source.env]) {
        const path = process.env[source.env];
        // An explicit pointer that does not resolve is an error, not a fallback:
        // someone set it meaning to read that file.
        if (!existsSync(path)) throw new Error(`${source.env}=${path} does not exist`);
        return path;
    }
    for (const root of ROOTS[source.repo]) {
        const path = resolve(REPO_ROOT, root, source.repoPath);
        if (existsSync(path)) return path;
    }
    return null;
}

export const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

function upstreamCommit (path) {
    try {
        return execFileSync('git', ['-C', dirname(path), 'log', '-1', '--format=%H', '--', path],
            { encoding: 'utf8' }).trim() || null;
    } catch { return null; }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    mkdirSync(OUT, { recursive: true });
    const manifestPath = join(OUT, 'MANIFEST.json');
    const prev = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { snapshots: {} };
    const manifest = { ...prev, snapshots: { ...prev.snapshots } };
    let wrote = 0, skipped = 0;

    for (const source of SOURCES) {
        const live = locateLive(source);
        if (!live) { console.log(`  ·  ${source.name}: no live checkout, keeping existing snapshot`); skipped++; continue; }
        const text = readFileSync(live, 'utf8');
        const commit = upstreamCommit(live);
        if (!commit) throw new Error(`${source.name}: cannot attribute ${live} to a commit; refusing to vendor an unattributable snapshot`);
        writeFileSync(join(OUT, `${source.name}.js`), text);
        manifest.snapshots[source.name] = {
            ...(manifest.snapshots[source.name] || {}),
            repo: source.repo,
            path: source.repoPath,
            wrapper: source.wrapper,
            why: source.why,
            upstreamCommit: commit,
            sha256: sha256(text),
            bytes: text.length
        };
        console.log(`  ✓  ${source.name}  ${commit.slice(0, 9)}  ${text.length} B`);
        wrote++;
    }

    manifest.note = 'Written by scripts/vendor-downstream-extensions.mjs. `expectedMissing` is ' +
        'maintained by hand and asserted EXACTLY by test/stc12-conformance.test.mjs: it records ' +
        'emitted opcodes a snapshot does not define, so a known cross-repo gap is visible here ' +
        'rather than hidden in a skipped test. Empty is the goal.';
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`\n${wrote} snapshot(s) written, ${skipped} kept. Review MANIFEST.json's expectedMissing before committing.`);
}
