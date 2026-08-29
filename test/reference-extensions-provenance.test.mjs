/**
 * reference/extensions/ says what it is, and is what it says.
 *
 * THE DEFECT
 * ----------
 * This directory described itself as "Pinned extension sources", "canonical
 * copies", the "source of truth", and recorded no commit, no hash and no date
 * for any of its eight files. "Pinned" was a word, not a fact. The README then
 * told the next reader how to maintain it:
 *
 *     Origin: github.com/CrispStrobe/extensions -> extensions/CrispStrobe/*.js
 *     To refresh: re-fetch from the repo above. Do not edit these by hand.
 *
 * Following that would have destroyed work. reference/extensions/stc12.js is
 * 24,467 bytes; the file it names upstream is 10,335. The local copy is AHEAD —
 * it carries the `keypad` reporter and the entire SEVENSEG8 surface that
 * upstream has not received. And test/stc12-conformance.test.mjs, the gate whose
 * whole purpose is to catch the emitter and the extension disagreeing about
 * opcodes, treats this very file as canonical. The repair instruction pointed at
 * the thing being repaired.
 *
 * WHAT THIS GATE ESTABLISHES, EXACTLY
 * -----------------------------------
 * That every .js file here is RECORDED in MANIFEST.json and still hashes to what
 * was recorded. It needs no upstream checkout and so runs everywhere, always.
 *
 * What it does NOT establish, and cannot without a checkout: that the recorded
 * relationship to upstream is still true. Upstream may have moved since
 * `headAtRecording`. That is why `upstreamSha256` is recorded per file — it
 * makes "has upstream caught up?" a comparison rather than a memory — and why
 * the drift half lives in scripts/vendor-reference-extensions.mjs, which
 * refuses to run without the checkout instead of guessing.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const REF = join(import.meta.dirname, '..', 'reference', 'extensions');
const MANIFEST = join(REF, 'MANIFEST.json');
const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const RELATIONSHIPS = new Set(['identical', 'local-ahead', 'local-behind', 'not-upstream']);

describe('reference/extensions provenance (in-repo hashes; upstream drift needs the checkout)', () => {
    test('the manifest exists and the walk found the files it is about', () => {
        // The instrument before the subject. Every assertion below is a
        // comparison between two lists, and both are empty if this directory
        // stops being readable — which is a clean sweep over nothing.
        assert.ok(existsSync(MANIFEST),
            'reference/extensions/MANIFEST.json is missing. Generate it with ' +
            'BW_EXTENSIONS=… node scripts/vendor-reference-extensions.mjs --write');
        const onDisk = readdirSync(REF).filter((f) => f.endsWith('.js'));
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53):
        // onDisk.length >= 8 -> observed 8.
        assert.ok(onDisk.length >= 8,
            `only ${onDisk.length} .js files found in reference/extensions — expected at least 8. ` +
            'The scan is broken and the comparisons below would pass over an empty set.');
    });

    test('every .js file here is recorded, and every record names a file that exists', () => {
        const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
        const onDisk = readdirSync(REF).filter((f) => f.endsWith('.js')).sort();
        const recorded = manifest.entries.map((e) => e.file).sort();

        assert.deepEqual(
            onDisk.filter((f) => !recorded.includes(f)), [],
            'these files sit in reference/extensions with no provenance record at all — the ' +
            'state the whole directory was in. Re-run scripts/vendor-reference-extensions.mjs --write.');
        assert.deepEqual(
            recorded.filter((f) => !onDisk.includes(f)), [],
            'MANIFEST.json records files that are no longer on disk; the record outlived its subject.');
        assert.equal(manifest.files, manifest.entries.length,
            'MANIFEST.json `files` disagrees with the number of entries it carries.');
    });

    test('every recorded sha256 still matches the file on disk', () => {
        const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
        const drifted = [];
        for (const e of manifest.entries) {
            const actual = sha256(readFileSync(join(REF, e.file)));
            if (actual !== e.sha256) drifted.push(`${e.file}: recorded ${e.sha256.slice(0, 12)}, on disk ${actual.slice(0, 12)}`);
        }
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53):
        // manifest.entries.length >= 8 -> observed 8.
        assert.ok(manifest.entries.length >= 8,
            `the manifest carries only ${manifest.entries.length} entries — too few to be the ` +
            'whole directory, so an empty drift list below means nothing.');
        assert.deepEqual(drifted, [],
            'these files were edited without re-recording their provenance. That is how "pinned" ' +
            'became a word rather than a fact. Re-run scripts/vendor-reference-extensions.mjs --write.');
    });

    test('every entry carries a relationship, and every local-ahead one records what it is ahead OF', () => {
        const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
        for (const e of manifest.entries) {
            assert.ok(RELATIONSHIPS.has(e.relationship),
                `${e.file} records relationship "${e.relationship}", which is not one of ` +
                `${[...RELATIONSHIPS].join(', ')}. An unclassified file is the original defect.`);
            if (e.relationship === 'not-upstream') continue;
            assert.match(e.upstreamCommit ?? '', /^[0-9a-f]{40}$/,
                `${e.file} claims a relationship to upstream but records no full-sha commit for it.`);
            assert.match(e.upstreamSha256 ?? '', /^[0-9a-f]{64}$/,
                `${e.file} records no upstream hash, so "has upstream caught up?" is unanswerable ` +
                'without re-deriving it — which is the state this manifest exists to end.');
        }
        // The one that would delete work if the README's old advice were followed.
        const ahead = manifest.entries.filter((e) => e.relationship === 'local-ahead');
        assert.ok(ahead.some((e) => e.file === 'stc12.js'),
            'stc12.js is no longer recorded as local-ahead. If upstream really has caught up that ' +
            'is good news and this expectation should be updated in the same commit that proves ' +
            'it — but a silent flip means the manifest was regenerated against the wrong tree.');
    });
});

describe('the generated runtime registry names a revision, not a repository', () => {
    // src/utils/runtimeRegistry.generated.js used to say, in full:
    //   "(source: github.com/CrispStrobe/extensions)"
    // A repository name is not provenance. Twelve of its seventeen entries were
    // fetched from https://crispstrobe.github.io/extensions/<slug>.js — a Pages
    // URL with no version in it — so two regenerations a week apart could have
    // produced different block surfaces with nothing recording which was which.
    //
    // Note what this gate does NOT claim: pinning did not REVEAL drift. The
    // registry regenerated byte-identical from the pinned sha, so the CDN was
    // serving that same content on 2026-08-24. What changed is that a future
    // divergence now shows up as a diff instead of passing unnoticed.
    const GEN = join(import.meta.dirname, '..', 'src', 'utils', 'runtimeRegistry.generated.js');

    test('it records a full-sha upstream commit and a sha256 for every slug it parsed', async () => {
        const mod = await import(GEN);
        const src = mod.RUNTIME_EXTENSION_SOURCES;
        assert.ok(src, 'runtimeRegistry.generated.js exports no RUNTIME_EXTENSION_SOURCES — the ' +
            'registry has gone back to naming a repository instead of a revision.');
        assert.match(src.commit, /^[0-9a-f]{40}$/,
            `RUNTIME_EXTENSION_SOURCES.commit is "${src.commit}", not a full 40-character sha. ` +
            'A branch or tag here quotes a freshness the file does not have.');

        const slugs = Object.entries(src.slugs ?? {});
        // Floor: an empty slug map makes every check below vacuous.
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53):
        // slugs.length >= 17 -> observed 17.
        assert.ok(slugs.length >= 17,
            `only ${slugs.length} slugs recorded, expected at least 17 — either the generator ` +
            'stopped recording provenance or the walk is broken; both make the checks below ' +
            'a clean sweep over nothing.');
        assert.equal(slugs.length, Object.keys(mod.RUNTIME_EXTENSIONS).length,
            'every extension in the registry must have a recorded source, and vice versa.');

        const unversioned = [];
        for (const [slug, p] of slugs) {
            assert.match(p.sha256 ?? '', /^[0-9a-f]{64}$/,
                `${slug} records no sha256 of the bytes that were parsed.`);
            const local = p.from.startsWith('reference/extensions/');
            // A network source must be sha-addressed. The Pages host has no
            // version in its path, which is exactly the shape being retired.
            if (!local && !new RegExp(`/${src.commit}/`).test(p.from)) unversioned.push(`${slug} <- ${p.from}`);
        }
        assert.deepEqual(unversioned, [],
            'these sources were fetched from a URL that does not name the pinned commit, so the ' +
            'bytes behind them can change without any diff here:\n  ' + unversioned.join('\n  '));
    });
});
