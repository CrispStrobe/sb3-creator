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

## Recommendation, in priority order

1. **Check out `bw-board` and `bw-circuit-ui` in `ci.yml`.** Fifteen tests, including
   both gate-integrity halves and every canary, have never run in CI. This is the
   largest single block of unexecuted verification in the repo.
2. **Until then, stop the count from reading as coverage.** A CI step that asserts the
   *expected* number of skips would make a new silent skip visible immediately; today a
   46th skip would look exactly like the 45.
3. Leave B, C, D and E as they are; they are labelled and honest.
