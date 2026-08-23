# Cross-repo gates: which ones can fire in CI, and which are still skips

Audited 2026-08-23, after `test/stc12-conformance.test.mjs` was found green-by-skipping
while the extension brickwright-lite ships was eight opcodes short
(`test/STC12-CONFORMANCE-FINDING.md`). ROADMAP §5.1 asks whether that gate was the only
one of its shape. It was not.

## Method, and what the numbers do and do not mean

Measured, not read: `npm test` was run in a sandbox laid out like a CI checkout — a
worktree whose parent directory contains no sibling repositories, verified with
`existsSync` on every candidate sibling path before the run rather than assumed.

That verification matters. The first attempt at this sandbox was a worktree under `/tmp`,
where **`/tmp/lego` is a symlink to `/mnt/volume1/code/lego`** (created 2026-08-22 20:23).
Sibling lookups resolved through it to the real checkouts, so the run reported coverage
CI does not have. Any conclusion about "what skips in CI" drawn from a worktree under
`/tmp` on this box is wrong.

```
# tests 5526   # pass 5478   # fail 3   # skipped 45
```

The failures are artefacts, not defects, and both kinds are worth naming:

- `example-corpus-contract` and `generated-bench-layout` are the only two files that call
  `fs.globSync`, which needs Node 22; the sandbox ran Node 20 and `.github/workflows/ci.yml`
  pins Node 22.
- A second run added `registry URL resolves: universalgamepad`, which fetches
  `crispstrobe.github.io/extensions/CrispStrobe/gamepad.js` over the network and got a
  transient `503`. The same test passed in the first run on the same commit, and the URL
  returns `200` on retry. **This is a third shape worth a note:** `ctarget.test.mjs` reaches
  the live network with no retry, so it converts someone else's outage into a red build.
  Not the failure this audit is about, but it will waste someone's afternoon: it wants a
  retry, or to be opt-in the way the `BW_TTL_ORACLE` oracles are.

## The 45 skips, by shape

### A. Cross-repo checkout — the stc12 shape. 15 tests, 9 files. STILL OPEN.

These need `bw-circuit-ui` and/or `bw-board` beside this repo. CI clones sb3-creator
alone, so every one of them skips on every CI run and has done since it was written.

| file | skip reason as written |
|---|---|
| `bench-invariants.test.mjs` | needs bw-circuit-ui/bw-board checkouts |
| `example-corpus-contract.test.mjs` | needs bw-circuit-ui/bw-board checkouts |
| `gate-integrity.test.mjs` | needs bw-circuit-ui/bw-board checkouts |
| `gate-canary.test.mjs` | needs bw-circuit-ui/bw-board |
| `js-driver-oled-chain.test.mjs` | needs bw-circuit-ui/bw-board checkouts beside this repo |
| `gallery-e2e.test.mjs` | needs bw-board checked out beside this repo (6 tests) |
| `assert-physics.test.mjs` | needs bw-board + bw-circuit-ui (set BW_BOARD / BW_CIRCUIT_UI) |
| `generated-bench-layout.test.mjs` | needs a bw-circuit-ui checkout |
| `multimeter-chain.test.mjs`, `pico-oled-chain.test.mjs` | as above, plus a toolchain (see C) |

Two of these deserve emphasis because of what they are:

- **`gate-integrity.test.mjs`** is the file written to stop gates from skipping
  themselves into silence — findings #1–#5 of `GATE-AUDIT-REPORT.md`. Its own
  cross-repo half skips in CI. The gate that guards the gates is subject to the defect
  it guards against.
- **`gate-canary.test.mjs`** holds the canaries that prove those gates can fail. A
  canary that never runs proves nothing.

This is the same shape as the stc12 defect and it is **not fixed by this branch** — the
remedy there was to vendor the compared artefact, and what these need from bw-board and
bw-circuit-ui is a *library*, not a file to compare against. That is a bigger call than
this task, so it is reported rather than guessed at. The options are the same three, and
the honest reading is that (a) — check the siblings out in CI — is the right one here,
because these gates consume behaviour rather than content, and behaviour cannot be
pinned as a snapshot the way an extension's `getInfo()` can.

### B. Vendored-snapshot drift checks — 5 tests. By design, and labelled.

The five `… : vendored snapshot matches the live sibling checkout` tests skip in CI.
That is intended and is not the old shape: the conformance assertion they accompany runs
unconditionally against the vendored snapshot, and each skip message says so. They add a
check where a sibling exists; they are not the check.

### C. External toolchain — 3 tests. Not a cross-repo problem.

`sdcc` + a built `emu8051-stc` (2), `arm-none-eabi-gcc` (1). A genuinely absent compiler
is a real environment limit rather than a broken path. Worth installing in CI eventually;
not the failure this audit is about.

### D. Opt-in oracles — 4 tests. Honest.

The `BW_TTL_ORACLE=1` Digital.jar acceptance oracles. Named, deliberate, and off by
default. A reader cannot mistake these for coverage.

### E. Environment — 2 tests.

`littlefs` wasm is not installable in this sandbox.

## What changed on this branch

`stc12-conformance` moved out of category A: it went from **2 tests running and 5
skipping** in CI to **13 running, with 3 additive drift checks skipping**, and it now
carries `test/extension-coverage.test.mjs` (7 tests, all running in CI) approaching the
same property from the gallery's side. Both are mutation-proven —
`scripts/mutation-prove-conformance.mjs`, 12/12, run in CI.

## CLOSED, 2026-08-23 — dispositions, one per gate

Every gate below now has a disposition and it is implemented. The mechanism is
`test/helpers/siblings.mjs`: a shared guard that is **asymmetric on purpose** —
locally an absent sibling is a skip whose message says CI covers it; in CI
(`CI=true`) it is a **failure**, because CI is configured to have them and their
absence means the checkout step broke and the gates just went quiet.

The pins live in `test/fixtures/siblings.json`; `.github/workflows/ci.yml` checks
each sibling out at that exact revision, and a test asserts the two agree.

### (a) CI-runnable — 13 tests in 10 files

| file | tests | what it needed |
|---|---|---|
| `bench-invariants.test.mjs` | 1 | both siblings |
| `example-corpus-contract.test.mjs` | 1 | both |
| `gate-integrity.test.mjs` | 1 | both |
| `gate-canary.test.mjs` | 1 | both |
| `js-driver-oled-chain.test.mjs` | 1 | both |
| `gallery-e2e.test.mjs` | 6 | bw-board |
| `assert-physics.test.mjs` | 1 | both |
| `generated-bench-layout.test.mjs` | 1 | bw-circuit-ui |
| `rail-short.test.mjs` | 1 | both |
| `flat-variants.test.mjs` | 1 | both |
| `pico-oled-chain.test.mjs` | 1 | both **+ arm-none-eabi-gcc** |
| `ctarget.test.mjs` | 1 | bw-board |

Chosen over vendoring, which is what closed the stc12 gate. The property there was
**content** — an extension's `getInfo()` — and a pinned snapshot of content is
exact. These consume 5.3 MB of live simulator as **behaviour**, and a snapshot of a
simulator tests the snapshot. Pinning the revision recovers the one thing vendoring
was for: the gates run, and this repo's verdict still does not float with another
repo's HEAD. Both siblings are ours and permissively licensed (bw-board MIT,
bw-circuit-ui MPL-2.0), so CI may simply clone them; a test asserts that too, because
a pin to something copyleft — or to the ngspice/KLU/CSparse family, which may not be
used or read — would have to be argued rather than slipped in. Neither sibling
depends on any of that family; checked, not assumed.

`pico-oled-chain` needed one extra thing, `arm-none-eabi-gcc`, which is a stock apt
package now installed in CI. It compiles ARM C and runs it under rp2040js; measured
standalone against the pinned siblings it **passes in 41 s**, having never once run
in CI before.

### (b) Fail-not-skip — the guard itself

`ctarget.test.mjs`'s wire-protocol test was the worst shape found. It was not a skip
at all: the bw-board import sat in a `try/catch` whose `catch` did
`console.log(' (bw-board not found, skipping…)'); return;` — so with bw-board absent
it reported a clean **PASS**. A wire-protocol agreement test that silently agrees
with nothing is worse than no test. It now uses the shared guard and its import
failure is a real failure.

### (c) Developer-only, said loudly — 2 tests in 1 file

`multimeter-chain.test.mjs` (`49-lcd-hello`, `76-multimeter`). Its sibling half is
CI-enforced like every other gate; its toolchain half genuinely cannot run in CI
without an **emscripten** build of `emu8051-stc` — hundreds of megabytes for two
tests, and unlike a checkout there is no cheap pinned form. The skip reason now
names which half is missing and is prefixed `DEVELOPER-ONLY:` rather than reading
like a broken path. **These 2 are the count that still cannot fire in CI.**

### Not gates — allowlisted with a reason each

The detector added to `gate-integrity` flags any test file that mentions a sibling
without using the shared guard. Four are legitimate and are listed there with why:
`gate-integrity` itself; `circuit-json-roundtrip` (a comment only);
`device-coverage` (reads bw-board's kinds when present, else a committed snapshot,
and puts "(snapshot)" in the **test name** so a green run cannot be mistaken for the
real check); and `flat-variants-manifest` (a manifest generated beside the siblings
and committed, recording the engine repo it came from). The last two are prior,
honest answers to this same problem and are worth knowing about.

### The audit undercounted, and the detector is why

This document originally said 15 tests in 9 files, measured by observing skips. That
missed `rail-short`, `flat-variants` and `ctarget` — the first two landed in main
after the sweep, and `ctarget`'s never appeared because it reported as a pass. The
static detector does not depend on a gate producing an observable skip, which is why
it is now the instrument of record. Final tally: **20 tests in 13 files**; 18
CI-runnable, 2 developer-only.

## The measurement that matters

Two rigs, both with sibling visibility verified by `existsSync` before the run rather
than assumed, and both on Node 22 (`fs.globSync` needs it; two files use it).

**Rig A — siblings pinned and present**, `bw-board@50c3bf7` + `bw-circuit-ui@d754cfc`
checked out as detached worktrees so no other session can move them mid-run, with
bw-board's `avr8js`/`rp2040js` installed:

```
before   6387 / 6270 / 0        (the recorded baseline)
after    6403 / 6286 / 0        exit 0
```

`+16` tests, `+16` passing, no failures and no regressions. The sixteen are the
thirteen `cross-repo inputs for …` guards plus three new assertions in
`gate-integrity` (pins agree with ci.yml, pins are permissively licensed, no gate
rolls its own skip). The skip count is unchanged at 117, and that is the expected
result rather than a disappointing one: with the siblings present these gates were
already running, so nothing here was ever going to move. The whole defect was
about CI, which is where they were not.

**Rig B — the CI-without-a-checkout case**, no siblings reachable, `CI=true`, running
only the thirteen cross-repo files:

```
before   213 pass / 0 fail / 5 skipped     ← green, and the gates were not running
after    215 pass / 13 fail / 6 skipped    ← one named failure per gate
```

That is the property, stated as a measurement: an environment that cannot run these
gates can no longer report success. Each of the thirteen failures is the guard itself
naming what is absent — not a cascade of derived errors from a half-loaded engine,
which is why the guard's teeth are a separate always-running test rather than the
`skip:` option.

Note `before` shows only **5** skips for thirteen gates. That is the ctarget shape:
several of those tests were not skipping at all, they were passing while doing nothing.

## Mutation proof

`scripts/mutation-prove-conformance.mjs` now covers these too — **20/20**, run in CI.
Seven are new and, crucially, the cross-repo ones are proven by changing the
ENVIRONMENT rather than by editing a file: the property under test is what happens
when the siblings are absent, so editing a file would prove the edit, not the guard.
Both directions are proven, because a guard that failed everywhere would "catch"
everything and be worthless:

```
RED   CI runs a cross-repo gate with no sibling checkout
GREEN the same run on a developer box (CI unset) skips instead of failing
GREEN the BW_ALLOW_MISSING_SIBLINGS opt-out still works in CI
RED   ci.yml stops checking out a sibling
RED   ci.yml pins a different revision than test/fixtures/siblings.json
RED   a cross-repo gate drops the shared guard and rolls its own skip
RED   a sibling is pinned to a forbidden or non-permissive licence
```

## A third instrument case: partial visibility

`partialVisibility()` in `test/helpers/siblings.mjs` names the configuration that
produces a confident wrong answer rather than an obvious one: **some** siblings
resolving and others not. On this box `/tmp/bw-board` and `/tmp/lego` are symlinks
into the real checkouts while `/tmp/bw-circuit-ui` does not exist, so from a
worktree under `/tmp` a gate needing both skips while a gate needing only bw-board
runs against a live, moving tree. Neither "all present" nor "all absent" reasoning
covers it. Raised by bw-cui2 after hitting it.

Relatedly, containment is now decided on the **real** path, not the spelling.
`resolve()` does not follow symlinks, so a literal `/tmp` check is wrong in both
directions — it rejects a symlinked path that lands inside this very checkout, and
accepts one that resolves into a different tree. (Refinement from bw-lessons, who
mutation-proved both cases.)

## Recommendation, in priority order

1. ~~Check out the siblings in `ci.yml`~~ — **done above.**
2. **Install `sdcc` + an emscripten build of `emu8051-stc` in CI** if the two
   developer-only tests are ever judged worth the runner minutes. Until then they are
   labelled, not hidden.
3. Leave the toolchain, opt-in-oracle and environment skips as they are; they are
   named and honest. The network-dependent `registry URL resolves:` tests still want a
   retry — someone else's outage should not redden this build.
