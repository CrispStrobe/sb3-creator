# Flat circuit variants — rebased, assessed, NOT landed on main

`circuit-flat.*.json` is a derived twin of the `circuit.*.json` beside it: the
breadboard removed, and the connections it was making re-expressed as explicit
part-to-part wires. 1,006 files. The idea is good — a "pure circuit" lesson
reads better without a board under it — and `test/flat-variants.test.mjs`
guards the part that can rot: a twin must carry no board and must resolve to
the SAME net partition as its original.

That gate is real. Mutation-proven on 2026-08-23: dropping one wire from
`01-blink/circuit-flat.arduino-uno.json` takes it red, restoring returns green.

## Why it is not on main

Measured after rebasing onto 5a8d35a, with bw-circuit-ui and bw-board siblings
present so nothing skips:

1. **284 of 1,006 twins have drifted** — "net partition differs from" their
   original, across essentially every device variant of 01-blink, 02-dimmer,
   03-night-light and onward. The twins were derived under the PRE-
   canonicalisation engine. bw-circuit-ui 8e666ca then fixed a real bug: pin
   spellings were case-split, so `mcu1.D13` and `mcu1.d13` were two nodes for
   one physical leg. Net resolution legitimately changed underneath these
   files. They must be REGENERATED against the current engine, not patched.
2. **Two sibling gates fail on them by construction**: "all controller benches
   have finite, non-overlapping, powered boards" and "all generated seated
   component bodies are disjoint in rendered geometry". Both glob `circuit*.json`
   and now match board-free twins, so they apply a board invariant to files that
   deliberately have no board. This is the same false positive that widening the
   `bench-invariants` glob once produced — an invariant applied where it cannot
   apply. Those globs must exclude `circuit-flat.*`.

Baseline for comparison: plain `origin/main` at 5a8d35a runs 6113 tests, 5980
pass, **0 fail**. The three failures above are introduced by this branch and are
not pre-existing.

## To finish

- Regenerate all 1,006 twins from today's `circuit.json` with today's engine.
- Exclude `circuit-flat.*` from the two board-geometry globs.
- Re-run: the flat gate green, and the full suite back to 0 fail.
- Note the gate SKIPS without bw-circuit-ui/bw-board checkouts, so in
  sb3-creator CI it does not run — see `ROADMAP.md` section 5 in brickwright-lite.
  Landing 1,006 files behind a gate that is dormant in CI is the thing to avoid;
  resolve that first or the corpus is unguarded where it matters.

The commit that empties the bench-invariants ledger was dropped during the
rebase: main already has the healed, empty form.
