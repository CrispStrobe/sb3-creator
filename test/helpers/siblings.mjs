// Locating the sibling checkouts the cross-repo gates consume — and refusing to
// be quiet about it.
//
// THE PROBLEM THIS SOLVES
// -----------------------
// Nine test files need `bw-board` and/or `bw-circuit-ui` beside this repo. Each
// wrote its own `existsSync(...)` guard and passed the result to node:test's
// `skip:`. CI clones sb3-creator alone, so all fifteen of those tests skipped on
// every CI run since they were written — and a skip is indistinguishable from a
// pass in the summary line. That is the same defect that let the stc12 extension
// ship eight opcodes short for five days (test/STC12-CONFORMANCE-FINDING.md), and
// the sweep that found these is test/CROSS-REPO-GATE-AUDIT.md.
//
// THE DISPOSITION
// ---------------
// Both siblings are public repositories of ours — bw-board is MIT, bw-circuit-ui
// is MPL-2.0 — so CI can simply check them out. `.github/workflows/ci.yml` clones
// each at the revision pinned in test/fixtures/siblings.json, which keeps the two
// properties that matter at once: the gates RUN, and this repo's verdict does not
// float with another repo's HEAD. Vendoring was rejected here: unlike an
// extension's getInfo(), these are 5.3 MB of live library that would need
// re-vendoring on every change, and a stale snapshot of a simulator tests the
// snapshot rather than the simulator.
//
// So the guard is asymmetric on purpose:
//
//   in CI          an absent sibling is a FAILURE. CI is configured to have them;
//                  if it does not, the checkout step broke and fifteen gates just
//                  went quiet, which is precisely what must never happen again.
//   locally        an absent sibling is a skip, and the skip message says that CI
//                  covers it, so nobody reads the local skip as a coverage hole.
//
// A NOTE ON READING LIVE SIBLING TREES
// ------------------------------------
// Two instrument failures on 2026-08-22/23 came from this exact area: `/tmp/lego`
// and `/tmp/bw-board` are symlinks into the real checkouts, so a worktree under
// /tmp resolves siblings to live trees and reports coverage CI does not have; and
// a cross-repo run against another session's UNCOMMITTED bw-board tree produced 22
// phantom failures on a green main. `describeSiblings()` therefore reports the
// resolved path, the HEAD sha, and whether the tree is DIRTY, so a run says what
// it actually read instead of leaving it to be assumed.

import { test } from 'node:test';
import { existsSync, readFileSync, lstatSync, realpathSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const SB3_ROOT = resolve(here, '..', '..');

const PINS_PATH = join(SB3_ROOT, 'test', 'fixtures', 'siblings.json');
if (!existsSync(PINS_PATH)) {
    throw new Error('test/fixtures/siblings.json is missing — the sibling pins CI checks out are gone');
}
export const PINS = JSON.parse(readFileSync(PINS_PATH, 'utf8'));

/** True when running in a CI runner (GitHub Actions sets both). */
export const IN_CI = process.env.CI === 'true' || process.env.CI === '1' ||
    Boolean(process.env.GITHUB_ACTIONS);

/** Escape hatch for a CI-like environment that deliberately has no siblings. */
const OPTED_OUT = process.env.BW_ALLOW_MISSING_SIBLINGS === '1';

const ENV_VAR = { 'bw-board': 'BW_BOARD', 'bw-circuit-ui': 'BW_CIRCUIT_UI' };

function gitInfo (path) {
    const run = (...args) => {
        try {
            return execFileSync('git', ['-C', path, ...args], { encoding: 'utf8', stdio: 'pipe' }).trim();
        } catch { return null; }
    };
    return { sha: run('rev-parse', '--short', 'HEAD'), dirty: (run('status', '--porcelain') || '') !== '' };
}

/** Resolve one sibling. Returns {name, path, sha, dirty, viaSymlink, pinned, matchesPin}. */
export function locate (name) {
    const pin = PINS.siblings[name];
    if (!pin) throw new Error(`no pin recorded for sibling "${name}"`);
    // An explicit env pointer WINS ABSOLUTELY — there is no fallback behind it.
    // Falling through to `../<name>` when BW_BOARD does not resolve was a real
    // defect: someone who points it at the wrong path silently measures a
    // different tree than the one they asked for, and their run reports coverage
    // of something they never selected. It also made the mutation proof lie —
    // `BW_BOARD=/nowhere` was a no-op on any machine that happened to have the
    // sibling beside it, so three mutations "passed" while changing nothing
    // (17/20 in a rig with siblings, 20/20 without; the discrepancy is what
    // exposed this).
    const fromEnv = process.env[ENV_VAR[name]];
    const candidates = fromEnv ? [fromEnv] : [join(SB3_ROOT, '..', name)];

    for (const candidate of candidates) {
        if (!existsSync(join(candidate, pin.marker))) continue;
        // Say so when the path went through a symlink. It is legitimate, but it is
        // how two false readings happened this week, so it belongs in the report.
        let viaSymlink = false;
        try { viaSymlink = realpathSync(candidate) !== resolve(candidate) || lstatSync(candidate).isSymbolicLink(); } catch { /* keep false */ }
        const { sha, dirty } = gitInfo(candidate);
        // Either abbreviation may be the shorter one, so compare on the common prefix.
        const n = sha ? Math.min(sha.length, pin.rev.length) : 0;
        const matchesPin = Boolean(sha) && sha.slice(0, n) === pin.rev.slice(0, n);
        return { name, path: candidate, sha, dirty, viaSymlink, pinned: pin.rev, matchesPin };
    }
    return { name, path: null, sha: null, dirty: false, viaSymlink: false, pinned: pin.rev, matchesPin: false };
}

/**
 * The guard every cross-repo gate uses.
 *
 * Returns `{ skip, assert, paths }`. Pass `skip` straight to node:test's options,
 * and call `assert()` as the first line of the test body: locally `skip` is a
 * string and the body never runs; in CI `skip` is false and `assert()` throws
 * with a message naming what is missing and how CI is meant to supply it.
 */
/**
 * The guard every cross-repo gate uses.
 *
 * Returns `{ skip, missing, paths, found }`. Pass `skip` straight to node:test's
 * options — it is a reason string whenever a sibling is absent, so the block
 * skips cleanly in EVERY environment and never produces a cascade of
 * "cannot read properties of undefined" from a half-loaded engine.
 *
 * The teeth are separate, and deliberately so: call `siblingGuardTest()` at the
 * TOP LEVEL of the file. That registers one always-running test which passes
 * locally and FAILS in CI when a sibling is missing. So CI reports exactly one
 * legible failure naming what is absent, instead of fourteen derived ones, and
 * the skip can never be the whole story on its own.
 */
export function requireSiblings (...names) {
    const found = names.map(locate);
    const missing = found.filter((s) => !s.path);
    const paths = Object.fromEntries(found.map((s) => [s.name, s.path]));
    if (missing.length === 0) return { skip: false, missing, paths, found };
    const list = missing.map((s) => `${s.name} (pinned ${s.pinned}, env ${ENV_VAR[s.name]})`).join(' and ');
    return {
        skip: `needs ${list} beside this repo — CI checks these out at the pinned revisions, ` +
            `so this is a local-only skip; see the "cross-repo inputs" test in this file`,
        missing, paths, found, list
    };
}

/**
 * Register the always-running half of the guard. Local: passes, with the skip
 * reason attached for the reader. CI: throws, because CI is configured to have
 * these and their absence means fifteen gates just went quiet.
 */
export function siblingGuardTest (gate, label) {
    test(`cross-repo inputs for ${label}`, () => {
        if (!gate.skip) return;                       // siblings present, nothing to say
        if (!IN_CI || OPTED_OUT) {
            // Not a failure on a developer box, but not silent either: node:test
            // prints this diagnostic, so a local run still says what it did not check.
            return;
        }
        throw new Error(
            `cross-repo gate "${label}" cannot run: ${gate.list} is not beside this repo.\n` +
            `This is a FAILURE rather than a skip because CI checks these out at the ` +
            `revisions pinned in test/fixtures/siblings.json (.github/workflows/ci.yml). ` +
            `Seeing it in CI means the checkout step broke and the cross-repo gates just ` +
            `went silent — the exact defect this guard exists to end. See ` +
            `test/CROSS-REPO-GATE-AUDIT.md.\n` +
            `If an environment genuinely must run without them, set ` +
            `BW_ALLOW_MISSING_SIBLINGS=1 and own that decision explicitly.`);
    });
}

/**
 * Is this a PARTIALLY-visible layout — some siblings resolving and others not?
 *
 * Named as its own case because it is the one that produces a confident wrong
 * answer rather than an obvious one. On this box /tmp/bw-board and /tmp/lego are
 * symlinks into the real checkouts but /tmp/bw-circuit-ui does not exist, so from
 * a worktree under /tmp a gate guarding on BOTH siblings skips while a gate
 * guarding on bw-board ALONE quietly runs against a live, moving tree. Neither
 * "all present" nor "all absent" reasoning covers it. (Raised by bw-cui2, who hit
 * exactly this configuration after being warned about the general case.)
 */
export function partialVisibility () {
    const all = Object.keys(PINS.siblings).map(locate);
    const present = all.filter((s) => s.path);
    if (present.length === 0 || present.length === all.length) return null;
    return {
        present: present.map((s) => s.name),
        absent: all.filter((s) => !s.path).map((s) => s.name),
        message:
            `PARTIAL sibling visibility: ${present.map((s) => s.name).join(', ')} resolved but ` +
            `${all.filter((s) => !s.path).map((s) => s.name).join(', ')} did not. Gates requiring ` +
            `all of them will skip while gates requiring only the present one(s) will RUN — ` +
            `against whatever tree those happen to be. Numbers from this layout are not ` +
            `comparable to CI's. Point BW_BOARD / BW_CIRCUIT_UI at explicit paths.`
    };
}

/** One line per sibling, for a run to state what it actually read. */
export function describeSiblings () {
    return Object.keys(PINS.siblings).map((name) => {
        const s = locate(name);
        if (!s.path) return `  ${name}: not present (pinned ${s.pinned})`;
        return `  ${name}: ${s.path} @ ${s.sha || 'unknown'}` +
            `${s.matchesPin ? ' (matches pin)' : ` (pin is ${s.pinned})`}` +
            `${s.dirty ? '  *** DIRTY WORKING TREE — results are not reproducible ***' : ''}` +
            `${s.viaSymlink ? '  [resolved via symlink]' : ''}`;
    }).join('\n');
}
