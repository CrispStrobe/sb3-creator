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
 *   diverged     — BOTH sides have content the other lacks. Refreshing loses
 *                  the local half; not refreshing forgoes the upstream half.
 *                  Neither is a default; a human picks, per file.
 *   not-upstream — no such file upstream. The origin line does not apply.
 *
 * WHY `diverged` EXISTS (added 2026-09-20)
 * ----------------------------------------
 * The relationship used to be decided by BYTE LENGTH alone: longer local meant
 * `local-ahead`. That is a proxy, and on 2026-09-20 it was wrong in the exact
 * direction that loses work. Upstream's stc12.js had grown to 26,799 bytes
 * against the local 24,467, so the heuristic would have flipped the file to
 * `local-behind` — "upstream caught up, refresh away". It had not caught up.
 * Upstream gained multi-family device support (6502 / pico / mega / avr) that
 * local lacks, while local still holds the five-site live-tethering bridge
 * (`_live()` -> drivePin / togglePin / ...) that upstream does not have and
 * whose call sites upstream deleted. Each side is ahead of the other. A
 * one-dimensional label cannot say so, and the one it picks is an instruction.
 *
 * So the relationship is now computed from LINE SETS, whitespace-normalised so
 * that a prettier pass upstream does not read as substance, and the counts are
 * recorded beside the label. Over-reporting is the safe direction: `diverged`
 * says "look before refreshing", which is the doctrine this file was written to
 * enforce. Under-reporting deletes a bridge.
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
import { join, dirname, resolve } from 'node:path';
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

/**
 * How many lines each side holds that the other does not, comparing SETS of
 * whitespace-normalised lines.
 *
 * Normalising is what keeps a reformat from reading as substance: when devices.js
 * was upstreamed it went through prettier, and a raw line diff called 201 local
 * lines "missing" when every opcode and every argument name was still there.
 * Set semantics also mean a line that merely MOVED counts as neither side's.
 */
export function exclusiveLines (localBuf, upstreamBuf) {
    const lines = (buf) => new Set(
        buf.toString('utf8').split('\n').map((l) => l.trim()).filter(Boolean));
    const L = lines(localBuf);
    const U = lines(upstreamBuf);
    let localOnly = 0;
    let upstreamOnly = 0;
    for (const l of L) if (!U.has(l)) localOnly++;
    for (const u of U) if (!L.has(u)) upstreamOnly++;
    return [localOnly, upstreamOnly];
}

/**
 * Everything below TOUCHES THE FILESYSTEM and needs the upstream checkout, so it
 * runs only when this file is executed. The classifier above is a pure function
 * and test/reference-extensions-provenance.test.mjs imports it directly — a gate
 * that needs a checkout to test the thing that decides whether a checkout is safe
 * would be the same circularity the README had.
 */
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
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
            const [localOnly, upstreamOnly] = exclusiveLines(local, up);
            e.localOnlyLines = localOnly;
            e.upstreamOnlyLines = upstreamOnly;
            e.relationship = up.equals(local) ? 'identical'
                : localOnly && upstreamOnly ? 'diverged'
                : localOnly ? 'local-ahead'
                : upstreamOnly ? 'local-behind'
                // Not byte-equal, yet neither side holds a line the other lacks:
                // ordering or whitespace only. Naming it `local-behind` keeps the
                // safe instruction (upstream's copy is the one to take) without
                // claiming a substantive difference that is not there.
                : 'local-behind';
        }
        entries.push(e);
    }

    const manifest = {
        note: 'Provenance for reference/extensions/. Regenerate with '
            + 'scripts/vendor-reference-extensions.mjs --write. `sha256` is the in-repo copy and is '
            + 'checked by test/reference-extensions-provenance.test.mjs WITHOUT any upstream '
            + 'checkout, so editing a file here without re-recording it goes red. `relationship` '
            + 'says whether re-fetching from upstream is safe: only `identical` is a no-op. A '
            + '`local-ahead` file has work upstream does not, and re-fetching DELETES it. A '
            + '`diverged` file has work on BOTH sides — the label is deliberately not an '
            + 'instruction, because neither refreshing nor leaving it is free. '
            + '`localOnlyLines`/`upstreamOnlyLines` are the counts the label is derived from, '
            + 'over whitespace-normalised line sets, so a reformat does not read as substance.',
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
}
