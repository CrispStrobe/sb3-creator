# Gate audit: tests that cannot fail

Audit date: 2026-08-20. Scope: sb3-creator, bw-circuit-ui, bw-board.
(brickwright-lite: not checked out on this machine.)

## Previously found and fixed (b017648, 06a27da, fbfc822, 6c3bc38)

These are the five gates the campaign already caught:

| # | Category | File | What happened |
|---|----------|------|---------------|
| 1 | reads-removed-property | bench-invariants | Circuit.resolvedNets removed -> 819 benches reported 3288 "violations" that were one bug |
| 2 | reads-removed-property | bench-invariants | Circuit.netlistError removed -> assertions compared undefined to null |
| 3 | skip-masquerading-as-pass | multimeter-chain | `../../bw-board` (two levels up) -> "skipped 2" forever, read as missing toolchain |
| 4 | glob-misses-files | bench-invariants | globbed only `circuit.<device>.json`, never the primary `circuit.json` |
| 5 | tautological-assertion | bench-invariants | MCU invariant applied to benches that deliberately have no MCU |

All five fixed by gate-integrity.test.mjs (b017648).

## New findings — this audit

### CRITICAL

| # | Repo | Category | File:Line | Description |
|---|------|----------|-----------|-------------|
| 6 | sb3-creator | tautological-assertion | gallery-e2e.test.mjs:497 | `assert.ok(true, 'bw_servo_set helper is now defined')` — always passes; a TODO that became permanent. The test documents a gap (servo helper missing from C emitter) but asserts nothing about it. |
| 7 | sb3-creator | tautological-assertion | gallery-e2e.test.mjs:500 | `assert.ok(true, 'bw_servo_set emitted but not defined')` — the else branch also always passes. Both branches of the if/else produce `assert.ok(true)`. |

### MEDIUM

| # | Repo | Category | File:Line | Description |
|---|------|----------|-----------|-------------|
| 8 | sb3-creator | skip-masquerading-as-pass | gallery-e2e.test.mjs:590 | `if (!existsSync(...)) return;` inside test body for z80-bench. The file exists NOW so the test runs, but if removed, the test silently passes instead of failing or skipping loudly. Should use `{ skip }` option. |
| 9 | sb3-creator | skip-masquerading-as-pass | gallery-e2e.test.mjs:603 | Same pattern for eater6502-vdp-hello. |
| 10 | sb3-creator | tautological-assertion | ttl-module-acceptance.test.mjs:77 | `assert.ok(true, 'MILESTONE: ...')` — a documentation marker inside a test. The test has real assertions above it, so this doesn't hide breakage, but it inflates confidence. |
| 11 | bw-board | tautological-assertion | device-motor-servo.test.js:55,81,123,149,175 | Five `assert.ok(true, '... settles without error')` — smoke tests that only verify no-throw. If the code silently returns wrong values, these pass. |
| 12 | bw-board | tautological-assertion | device-relay.test.js:120,164 | Two `assert.ok(true, 'relay settles')` — same pattern. |
| 13 | bw-board | skip-masquerading-as-pass | adapter-contract.test.mjs | `try { factory = await fn(); } catch { it('SKIP', () => assert.ok(true)); return; }` — a factory failure produces a "passing" test named SKIP instead of using node:test's skip mechanism. |

### LOW

| # | Repo | Category | File:Line | Description |
|---|------|----------|-----------|-------------|
| 14 | bw-board | tautological-assertion | current-ratings.test.js:112 | `assert.ok(true, 'current budget check runs without error')` — pure smoke test. |
| 15 | bw-board | tautological-assertion | mosfet-opamp.test.js:106 | `assert.ok(true, ...)` after real voltage assertions — the ok(true) is cosmetic. |
| 16 | bw-circuit-ui | tautological-assertion | 7 files | Scattered `assert.ok(true)` in skip-or-smoke contexts — all intentional, none hiding breakage. |

## Clean repos

- **bw-circuit-ui**: No critical/medium findings. Skip patterns use proper guards. All `netlistError`/`resolvedNets` references are to live properties (they are defined in this repo).
- **bw-board**: No critical findings. The `assert.ok(true)` smoke tests are MEDIUM at worst — they verify no-throw but not correctness.
- **brickwright-lite**: Not checked out; cannot audit.

## Canaries

Canary tests for findings #6–9 are in `test/gate-canary.test.mjs`. Each re-introduces the exact defect the gate exists to catch and asserts it goes red.
