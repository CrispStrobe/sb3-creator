# Provenance audit: every place this repo asserts what it verified

2026-08-24, branch `test/verified-what-exactly`, from `main` at `4805f32`.

Three defects this campaign found share one root, and it is not "a gate that passes wrongly".
It is **a confident, well-formed, wrong statement of what was verified**:

- an abbreviated pin NAMED a commit that could not be fetched — seven blind CI commits;
- lite's remote sync FETCHED BY BRANCH NAME from a CDN, got stale content, printed
  "synced from bw-board@master", and recorded no sha at all;
- a gate NAMED a property and proved a narrower one — twice.

This sweep applies those three categories to the rest of the tree. Each section states its
**denominator**, because a finding count with no denominator is the same defect one level up.

---

## 1. Fetches and pins

**Denominator: 27 sites in sb3-creator that resolve an external name to content** — every
`uses:`, `ref:`, `npm ci`, `npm install`, `apt-get`, `fetch()`, `git clone` and image/runtime
selector in `.github/workflows/`, `scripts/`, `test/` and `bin/`.

**Before this branch: 13 of 27 named a mutable object while being relied on for content.**
**After: 0.** Six remain mutable by disposition, each with the reason stated below.

### Converted to immutable (13)

| # | site | named before | class | now |
|---|---|---|---|---|
| 1–11 | `.github/workflows/ci.yml` — 11 `uses:` | `actions/checkout@v4`, `setup-node@v4`, `configure-pages@v5`, `upload-pages-artifact@v3`, `deploy-pages@v4` | **mutable tag** — repointed by the publisher | full 40-hex sha, version in a trailing comment |
| 12 | same — `npm install --no-save avr8js@^0.21.0` | caret range, outside the lock | **mutable range**, no integrity | `avr8js@0.21.0` + recorded sha512 |
| 13 | same — `rp2040js@^1.3.3` | caret range, outside the lock | **mutable range**, no integrity | `rp2040js@1.3.3` + recorded sha512 |
| 14 | `scripts/gen-runtime-registry.mjs` fallback | `https://crispstrobe.github.io/extensions/<slug>.js` | **unversioned URL** | `raw.githubusercontent.com/<repo>/<EXTENSIONS_COMMIT>/…` |

(14 rows, 13 sites — the two `--no-save` packages share one workflow step.)

The `uses:` row is the largest and the least visible. `@v4` is a tag its publisher moves, so two
green runs could have executed different code with nothing in this repo recording which — and
the line reads `Lint · test · build` either way. It is also the supply-chain hole GitHub's own
hardening guide names: whoever can move `v4` runs code in a job holding this repo's
`pages: write` and `id-token: write`.

### Already immutable (8)

| site | why it is immutable |
|---|---|
| `ci.yml` sibling `ref:` × 2 | full 40-hex shas — fixed by the blackout postmortem, asserted by `gate-integrity` |
| `npm ci` × 3 | `package-lock.json` v3: **556 packages, 0 without an integrity hash** (verified, not assumed) |
| `test/fixtures/downstream/MANIFEST.json` | records `upstreamCommit` + `sha256` per snapshot |
| `test/fixtures/flat-partitions/MANIFEST.json` | records `engine.sha` + both file hashes per pair |
| `reference/extensions/MANIFEST.json` | **new on this branch** — see §3 |

### Mutable, and why it stays that way (6)

| site | why it cannot be sha-addressed |
|---|---|
| `npx playwright install chromium` | Playwright downloads a browser revision determined by its own version, which IS locked. Bounded by the lock, not independently pinnable. |
| `apt-get install -y gcc-arm-none-eabi` | Ubuntu archive; pinning needs a container image. **The installed version is not recorded** — the one honest gap left here, listed rather than hidden. |
| `runs-on: ubuntu-latest` | deliberate: the runner image is meant to track. |
| `node-version: 22` | deliberate: patch releases of 22.x are wanted. |
| `STC_COMPILER_URL` live oracle (`test/ctarget.test.mjs`) | opt-in, developer-only, a live service by design; skipped unless the env var is set. |
| gallery HEAD probe (`test/ctarget.test.mjs:1500`) | a liveness check that consumes **no content**. |

### brickwright-lite — audited read-only, NOT changed

I do not own lite and its pushes are serialised through a coordinating session, so these are
reported, not fixed. **Denominator: 10 sync/vendor scripts + 47 `uses:` across 6 workflows.**

| site | class | note |
|---|---|---|
| `scripts/sync-bw-board.mjs` | **immutable** | already fixed: resolves ref→sha via the API, fetches sha-addressed, records the sha. The precedent the rest should copy. |
| `scripts/vendor.mjs` | **immutable** | `GUI_COMMIT` is a full 40-hex sha. |
| `scripts/build-library-pack.mjs` | **immutable** | fetches by `md5ext` — a content hash. |
| `scripts/sync-sb3creator.mjs` | **mutable** | `REF = 'main'`, `raw.githubusercontent/…/main/…`. Exactly the sync-bw-board defect, unfixed. |
| `scripts/sync-examples.mjs` | **mutable** | `REF = 'main'`, same shape. |
| `scripts/vendor-forward.mjs` | **mutable** | `git clone --depth 1` with no ref — whatever the default branch is today. |
| `scripts/sync-emu8051-wasm.mjs` | **weak pin** | `PIN = '2f1855a'` — a **7-character abbreviated sha**. `raw.githubusercontent` happens to resolve short shas, so it works today; it is nonetheless the exact shape that produced the seven blind CI commits, and a 7-hex prefix is not collision-proof as a repo grows. |
| 6 workflows, **47 `uses:`, 0 sha-pinned** | **mutable** | includes `dtolnay/rust-toolchain@stable` — a tag explicitly named "stable" that moves. |

---

## 2. What a green run claims

**Denominator: 99 test files, 825 tests at the base commit `4805f32`. 53 tests have a NAME
that is a universal claim**
("every X", "all Y", "no Z", "never W").

Of those 53, **7 consult a non-empty exemption table**. I verified all 7 by reading them rather
than trusting the scan, and **4 were false positives** — recording that is the point of the
exercise:

| flagged | verdict |
|---|---|
| `no circuit declares a param no engine code mentions` | **false positive** — its table is `KNOWN_UNREAD`, an EMPTY Map. The scan attributed `KNOWN_INERT` to it because that constant appears later in the same file. |
| `every sibling this repo pins is one we are allowed to vendor or clone` | **false positive** — `ALLOWED` is the licence CRITERION, not an exemption list. |
| `no unlisted file reads endpoint fields directly` | **false positive** — the name already says "**unlisted**". Honest as written. |
| (one duplicate of the first) | **false positive** |

**Three real over-claims, all corrected on this branch** to the `device-coverage` pattern — the
scope goes in the TEST NAME, so a green run cannot be mistaken for the whole claim:

| gate | hidden | name now |
|---|---|---|
| `every declared (kind, key) changes something in some bench` | 27 | `… (${KNOWN_INERT.size} exempt, listed in KNOWN_INERT)` |
| `no gate opens a corpus without a measured floor under it` | 2 | `… (${WAIVED.size} waived, listed in WAIVED)` |
| `every cross-repo test routes its skip through the shared sibling guard` | 5 | `… (${NOT_A_CROSS_REPO_GATE.size} files classified not-cross-repo)` |

The counts are **interpolated from the table, not written out**, so the name cannot drift from
the thing it describes. `WAIVED` was hoisted out of its test body to make that possible.

### The remaining 50, and one number I got wrong first

All counts above are measured at the **base commit `4805f32`**: 99 test files, 825 tests, 53
universal-named. At this branch's HEAD they read 100 / 832 / 57, because four of the gates added
here are themselves universal-named — stating both denominators rather than quietly reporting
the one that flatters the sweep.

Of the 53, a crude scan flags **32** for a narrowing construct (`continue`, `existsSync`,
`.slice`, an allowlist). **Only 10 of those 32 carry a detectable floor assertion** — the
`assert.ok(scanned >= 40, 'the walk is broken and this assertion is vacuous')` shape that is
already this repo's convention. **22 do not.**

I first wrote that sentence with the ratio the other way up (21 of 32 having floors) and caught
it by re-running the scan against what the document claimed. The honest reading is less
comfortable: floors are the established pattern here, but two thirds of the narrowing
universal-named gates do not have one that a regex can see.

Two caveats, because 22 is not a defect count:

- **The detector is crude.** It looks for a comparison against a collected length. A gate whose
  floor is expressed differently reads as having none. "No floor detected by a regex" is not
  "no floor" — this is a shortlist to review, not a verdict.
- **`continue` is usually innocent.** Skipping non-`.json` entries in a `readdir` narrows
  nothing that the name quantified over.

So this is left as a stated, sized shortlist rather than 22 corrections made on a heuristic. The
four gates added on this branch each carry a floor, mutation-proven in §4.

---

## 3. Recorded provenance

**Denominator: 7 generated or vendored artifacts committed to this repo.**
**Before: 3 recorded a producing sha. After: 5. Two remain partial, listed.**

| artifact | records | verdict |
|---|---|---|
| `test/fixtures/downstream/MANIFEST.json` | `upstreamCommit`, `sha256`, `bytes`, `expectedMissing` | ✅ the model |
| `test/fixtures/flat-partitions/MANIFEST.json` | `engine.sha`, `flatSha`, `twinSha`, 1006 pairs | ✅ |
| `examples/*/circuit-flat*.json` | covered by the manifest above | ✅ |
| `src/utils/runtimeRegistry.generated.js` | **was: `(source: github.com/CrispStrobe/extensions)`** — a repository name, no revision | ❌ → ✅ fixed |
| `reference/extensions/` (8 files) | **was: nothing at all**, while the README called them "pinned" | ❌ → ✅ fixed |
| `docs/GATE-INVENTORY.md`, `docs/MEASURED-THRESHOLDS.md` | a date and a campaign, no producing sha | ⚠️ partial |
| `test/COVERAGE-ASSERT-PHYSICS.md` | `Generated: 2026-08-18` — a date, no producer named, no sha | ⚠️ weakest |

### The two findings worth reading in full

**`src/utils/runtimeRegistry.generated.js` named a repository, not a revision.** Its banner said
`source: github.com/CrispStrobe/extensions`. Of the 16 hardware slugs the generator walks, only 4
have an in-repo copy — so **twelve** of the seventeen registry entries were fetched from
`crispstrobe.github.io/extensions/<slug>.js`, a Pages URL with no version in it, at whatever that
host served that day. Now pinned via `EXTENSIONS_COMMIT`, fetched sha-addressed, with the
resolved commit and a `sha256` per slug written into the output as `RUNTIME_EXTENSION_SOURCES`.

**Stated plainly: pinning did not REVEAL drift.** `RUNTIME_EXTENSIONS` and
`RUNTIME_EXTENSION_URLS` regenerated **byte-identical**, so the CDN was serving the pinned
content on 2026-08-24. What changed is that a future divergence becomes a diff instead of
passing unnoticed. Reporting this as "found and fixed stale content" would be the exact defect
this audit is about.

**`reference/extensions/` said "pinned" and recorded nothing — and its refresh instruction
would have deleted work.** The README called its eight files "Pinned extension sources",
"canonical copies", the "source of truth", with no commit, hash or date for any of them, and
told the reader: *"To refresh: re-fetch from the repo above. Do not edit these by hand."*

Measured against that named upstream, of 8 files: **6 identical, 1 not present upstream at all
(`devices.js`), 1 local-AHEAD.** `reference/extensions/stc12.js` is **24,467 bytes against
upstream's 10,335** — it carries the `keypad` reporter and the entire SEVENSEG8 surface
(`seg_shownum`, `seg_showdigit`, …) that upstream has not received. And
`test/stc12-conformance.test.mjs`, the gate whose whole job is to catch the emitter and the
extension disagreeing about opcodes, treats **that file** as canonical.

So following the README would have silently deleted the opcodes the conformance gate exists to
track. The repair instruction pointed at the thing being repaired. `MANIFEST.json` now records
per file the in-repo `sha256`, the `upstreamCommit`, upstream's own `sha256`, and the
**relationship** — `identical` / `local-ahead` / `local-behind` / `not-upstream` — so "is
re-fetching safe here?" is a lookup rather than a guess. Only `identical` is a no-op.

---

## 4. New gates, and the mutations that prove them

Five gates added, **15 mutations, every one RED, tree restored green after each**. Every gate
carries a floor assertion so a broken scan reports itself instead of a clean sweep.

| gate | mutation | result |
|---|---|---|
| `every \`uses:\` in ci.yml names a 40-hex action sha` | M1 revert one action to `@v4` | RED, names `actions/checkout@v4` |
| | M2 abbreviate a sha to 7 chars | RED, names `actions/setup-node@49933ea` |
| | M4 delete every `uses:` line | RED **on the floor**: "only 0 … expected at least 11" |
| `the two --no-save installs name exact versions` | M3 restore `^0.21.0` | RED, names `avr8js@^0.21.0` |
| `reference/extensions provenance` | M1 edit a file, do not re-record | RED on sha256 mismatch |
| | M2 add an unrecorded extension | RED, names the new file |
| | M3 delete a manifest entry | RED + floor: "only 7 entries" |
| | M4 strip `upstreamSha256` | RED: "has upstream caught up?" unanswerable |
| | M5 empty the manifest | RED on the floor, not "clean" |
| `the generated runtime registry names a revision` | M6 put a BRANCH in `commit` | RED: `"master"` is not a 40-char sha |
| | M7 one source back to the Pages URL | RED, does not name the pinned commit |
| | M8 drop `RUNTIME_EXTENSION_SOURCES` | RED: "back to naming a repository" |
| | M9 empty the slug map | RED on the floor: "only 0 slugs" |
| scope-corrected names | M10 add a waiver | RED, name moves to "(3 waived)" |
| | M11 strip `siblingGuardTest()` from a real cross-repo test | RED, names `flat-variants.test.mjs` |
| `every string-literal mutation target in the prover still occurs in the tree` | M12 re-anchor a target on vanished text | RED — **and GREEN on the first version of the gate, which is how the vacuity below was found** |
| | M13 break the target extractor | RED on the floor: "only 0 … extracted" |

### The same defect three times, and the third one was in a gate I wrote to catch it

**A mutation that does not mutate returns the reassuring answer.** That happened three times on
this branch, each with a different mechanism, and it is the most transferable thing here.

**(a) By hand — M10's first attempt.** Hoisting `WAIVED` out of the test body changed its
indentation; my replace target still carried the old 8-space form, so nothing was edited — and
the *unchanged* test name read exactly like "the count is hardcoded, the fix does not work".
Redone asserting the edit landed (`assert s2 != s`) before believing the result.

**(b) In CI — the same hoist, 25 minutes later.** `scripts/mutation-prove-conformance.mjs` had a
mutation anchored on `"        const WAIVED = new Map([\n"`. My hoist moved it to column 0, so
the prover's own no-op guard fired:

    Error: mutation was a no-op — the WAIVED map was not found

**I pushed `458416f` on a run that then went red, and this is what did it.** Twenty-three
mutations ran correctly before it; lint, the suite and the build all passed. The target is now
indentation-agnostic (`/^(\s*)const WAIVED = new Map\(\[\n/m`) so a reindent cannot disarm it.

**(c) In the gate written to catch (b).** A prover target that stops matching costs a 25-minute
CI cycle to discover, so I added a gate asserting every string-literal target still occurs in the
tree. **Its first version could never fail.** It walked the whole tree *including the prover* —
where every target is, by construction, a string literal — so each target matched itself. M12
landed its edit, the gate stayed green, and that was the tell. The prover file is now excluded,
and that exclusion is the entire substance of the check.

The general rule, now in the repo's own conventions: **whenever a check searches a corpus for
text drawn from one file, that file must be excluded** — otherwise the check is a tautology
wearing a gate's name, which is this audit's subject exactly.

### The audit's own instrument

The instrument-before-subject rule this repo already learned twice (the uninitialised device
registry; the mutation that went through a symlink) applies to this audit's own tooling:

- **4 of the 7 gates my scan flagged in §2 were false positives** — reported, with the reason
  for each, rather than counted as findings.
- **A ratio in this document was upside down** on first writing (§2). Caught by re-running the
  scan against what the document claimed.
- **The gate in (c) above was vacuous** until a mutation said so.

An audit that does not check its own instrument is one more confident, well-formed, wrong
statement about what was verified.

---

## What this branch does NOT establish

- **lite is unfixed.** Four mutable sites and 47 unpinned `uses:` are reported in §1, not
  repaired — not my repo, and its pushes are serialised elsewhere.
- **`reference/extensions` drift vs upstream is only checked WITH the checkout.** The committed
  gate proves the in-repo hashes, which needs nothing; it cannot prove the recorded
  *relationship* is still true, because upstream may have moved since `headAtRecording`. That
  half lives in `scripts/vendor-reference-extensions.mjs`, which refuses to run without the
  checkout rather than guessing. `upstreamSha256` is recorded per file so "has upstream caught
  up?" is a comparison, not a memory.
- **The apt-installed `gcc-arm-none-eabi` version is still unrecorded.** Listed in §1 as the one
  remaining gap of its kind rather than quietly omitted.
- **`docs/GATE-INVENTORY.md`, `docs/MEASURED-THRESHOLDS.md` and
  `test/COVERAGE-ASSERT-PHYSICS.md` still record a date and no producing sha.** Known, listed,
  not fixed on this branch.
