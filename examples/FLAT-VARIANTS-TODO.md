# Flat circuit variants — regenerated and guarded (2026-08-23)

`circuit-flat.*.json` is a derived twin of the `circuit.*.json` beside it: the
breadboard removed, and the connections it was making re-expressed as explicit
part-to-part wires. 1,006 files.

## 1. The 284 drifted twins — regenerated

They were derived under the PRE-canonicalisation engine, where `mcu1.D13` and
`mcu1.d13` were two nodes for one physical leg. bw-circuit-ui `8e666ca` fixed
that, and net resolution legitimately moved underneath these files.

Regenerated against today's engine, not patched into agreement. Measured with an
independent harness before and after:

```
before   pairs=1006 agree=722  drift=284  errors=0
after    pairs=1006 agree=1006 drift=0    errors=0
```

Derived by REWIRING, not by dropping hole wires: each net the engine resolves is
re-expressed as explicit part-to-part wires and then the board is removed. Every
file is verified by re-parsing **the text actually written**, not the object in
hand, and its `seat` is dropped — it named a board that is gone.

20 of the 284 were stale in their PARTS too, not just their wires:
`09-relay-clicker`'s flyback diode `D_relay_ctrl` was in the twin and missing
from the flat file. Deriving wholly from the twin fixes both classes at once;
recomputing wires alone would have left those 20 broken.

The other 722 were left untouched. They already satisfy the invariant, and
rewriting 722 correct files would have added review burden for no proven gain.

## 2. The two board-geometry globs — excluded

`test/generated-bench-layout.test.mjs` globbed `examples/*/circuit*.json` at two
sites and so applied a BOARD invariant — finite, non-overlapping, powered boards,
and seated bodies disjoint in rendered geometry — to files that are board-free on
purpose. Both now use a shared `benchFiles()` that filters `circuit-flat.*`.

The filter is asserted rather than trusted, by a new test in the same file: it
must drop the flat twins, and must not quietly drop everything and leave the two
gates passing over an empty list. Effect, verified by replicating the glob:

```
glob matched        2040
flat twins excluded 1006
kept for board gate 1034     <- exactly the bench count before the twins existed
```

## 3. The gate was dormant in CI — closed

`test/flat-variants.test.mjs` needs bw-circuit-ui and bw-board to resolve nets,
and sb3-creator's CI is a bare `actions/checkout@v4`. So it SKIPPED there, and
1,006 files sat behind a gate that never ran — a skip that reads exactly like a
pass (ROADMAP §5).

bw-audit's answer for the stc12 conformance gate was to **vendor what the
siblings ship**, so the gate always has its input. The input here is a whole
circuit engine, too big to vendor. So `scripts/vendor-flat-partitions.mjs`
vendors the **verdict** instead, with provenance —
`test/fixtures/flat-partitions/MANIFEST.json`: for each of the 1,006 pairs, the
hash of both files and the partition they were proven to share, plus the engine
SHA (`8e666ca`) that proved it.

`test/flat-variants-manifest.test.mjs` consumes it and needs **no siblings**. It
throws rather than skips if the manifest is absent.

**What it proves:** every twin on disk is in the manifest and vice versa; neither
file of any pair has changed since the run that proved them equal; every flat
twin is board-free and carries its twin's parts (both checkable from JSON alone).

**What it does not prove:** it does not recompute the partition — that needs the
engine. It proves nobody edited either side since a run that did. Editing one and
not the other, which is the rot a pair can suffer, turns CI red with no siblings
present.

Mutation-proven on disk, all three RED then restored green:

| mutation | result |
| --- | --- |
| drop a wire from a flat twin | RED — "flat edited since it was proven" |
| append a byte to the twin, leave the flat alone | RED — "twin edited since the pair was proven" |
| delete a flat twin from disk | RED — "manifest entr(ies) name a file that is gone" |

A canary inside the gate re-introduces the wire-drop defect in memory and asserts
the hash check rejects it, so the proof runs in CI too, not only by hand.

## Not verified

`fs.globSync` needs Node 22 and this machine has v20.20.2, so the two
board-geometry tests and `example-corpus-contract` **cannot execute here at all**
— they fail on the import, before any assertion, both before and after this
change. The glob exclusion's effect was verified by replicating the glob
(numbers above); the tests themselves have not been run green on Node 22.
