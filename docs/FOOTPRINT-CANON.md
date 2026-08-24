# Which footprints are canonical — settled by measurement, 2026-08-24

`bw-parts` and `bw-circuit-ui` carried divergent footprints for the same parts.
The ruling was that measurement decides: run the seating suites against each
side, and whichever keeps the corpus green becomes canonical.

**Verdict: `bw-circuit-ui` is canonical.** `bw-parts` should be brought to match
it. Below is what was measured, and — because it matters more than the verdict —
what the measurement could *not* establish.

## The divergence

259 sidecars in `bw-parts`, 245 of which also exist in `bw-circuit-ui`.

| | count |
| --- | --- |
| byte-identical | 195 |
| **differ** | **50** |
| only in bw-parts | 14 |
| only in bw-circuit-ui | 0 |

The differing keys, by frequency: `footprint.refTerminal` (29 files), then lead
`dRow` values across `vcc`, `gnd` and the data pins, and `terminals` in 9.

It is **not one systematic correction**. Classifying all 48 differing footprints
by what actually changed gives seven distinct shapes:

| shape | files | e.g. |
| --- | --- | --- |
| ref changed, rows changed, cols same | 13 | 28c256, 62256, 74hc00, 74hc595 |
| ref same, rows same, cols changed | 10 | capacitor, diode, inductor, ldr |
| ref changed, rows same, cols changed | 9 | char_lcd, ir_receiver, nmos |
| ref same, rows same, cols same (other) | 8 | 74hc73, 74hc74, cd4511 |
| ref changed, rows and cols changed | 4 | 74hc283, attiny2313, attiny88 |
| ref changed, nothing else | 2 | 74hc93, lm7805 |
| ref same, rows and cols changed | 1 | seven_segment |

Only 11 of the 47 comparable ones are a pure MIRROR (rows swapped, columns
kept); **none** is a rotation (rows swapped, columns reversed). A mirror is not a
placement any physical package has, which is the first hint that the `bw-parts`
side is not a uniform re-anchoring.

## The measurement

bw-circuit-ui's seating suites — `board-seating`, `seat-geometry`,
`seat-example-boards`, `footprints`, `infer-seated`, `seating-electrical` — run
three ways at `bw-circuit-ui def49c7`:

| tree | result |
| --- | --- |
| **A** cui master (canon) | **53 / 53 pass** |
| **B** cui + all 50 bw-parts sidecars | 41 / 53 — **12 fail** |
| **C** cui terminals + bw-parts `footprint` only | 43 / 53 — **10 fail** |

C isolates the two variables: 2 of B's failures are the alias loss below, and 10
are the geometry itself. **Both halves of the bw-parts side lose.**

The failures are not coordinate snapshots that would trivially favour whichever
values the tests were written against. They assert physical and electrical
properties:

- `part is seated` — under bw-parts' values the chip does not seat at all
- `only one row occupied in col 9` — `0 !== 1`, a column with no leg in it
- `LED brightness 0.0000 — GPIO PB0 conducts through strip` — an electrical outcome
- `seated 74hc595 has no position for data — it would render at the part origin`
- 16 legs must occupy 16 *distinct* holes, and every alias must share its twin's hole

Affected chips: attiny85, w65c02, w65c22, w65c51, 28c256, 62256, 74hc595,
stc15_mcu.

## The alias loss, which is not a convention question at all

`bw-parts` terminals carry **no `aliases`**. bw-circuit-ui's do:

```
cui   {"name": "qb", "x": 0, "y": 8, "functions": [], "aliases": ["q1", "Q1"]}
parts {"name": "qb", "x": 0, "y": 8, "functions": []}
```

bw-circuit-ui also carries an `_aliases_source` provenance key that `bw-parts`
lacks. Two files would lose aliases outright. Any program or circuit referring to
`data`, `clock`, `latch`, `q0`, `Q0`, `q7` or `Q7` stops resolving — this is
missing data, not a different opinion about geometry.

## What the measurement did NOT establish

Stated plainly, because the verdict is narrower than it looks.

**The shipped corpus does not discriminate.** `generated-bench-layout` and
`bench-invariants` pass on BOTH sides — 8/8 either way — even though 29 of the 48
differing footprints are used by shipped circuits, `mcu` 353 times, `attiny88`
135, `attiny85` 116. The only corpus-level seating gate is
`generated-bench-layout`'s *"all generated seated component bodies are
disjoint"*, and **a body does not move when its legs do**. Nothing in sb3-creator
reads `leadMap`, `_seatTerminals`, `holeWorldPos` or `nearestHole` at all.

So the corpus has **no seating-geometry coverage**. A footprint change that
relocates every leg of a part used 353 times is invisible to all 6483 tests. The
evidence above comes entirely from bw-circuit-ui's own unit suites, which cover
8 parts; for the other ~40 differing footprints **there is no evidence either
way**, and aligning them to bw-circuit-ui is a consistency decision, not a
measured one.

## attiny88 — checked against the datasheet, and BOTH sides are wrong

This began as "the corpus and the footprint disagree for 110 circuits, and I
cannot say which is right without the datasheet". Checked. The ATtiny88 PDIP-28
pin order is:

```
 1 PC6   2 PD0   3 PD1   4 PD2   5 PD3   6 PD4   7 VCC   8 GND
 9 PB6  10 PB7  11 PD5  12 PD6  13 PD7  14 PB0  15 PB1  16 PB2
17 PB3  18 PB4  19 PB5  20 AVCC 21 PC7  22 GND  23 PC0  24 PC1
25 PC2  26 PC3  27 PC4  28 PC5
```

A DIP puts pin 1 at one end of the bottom row and counts up to 14, then crosses
to the top row at pin 15 and counts back: at column *c*, the bottom row is pin
*c+1* and the top row is pin *28−c*.

**The bottom row is right in both**: `PC6 PD0 PD1 PD2 PD3 PD4 VCC GND PB6 PB7 PD5
PD6 PD7 PB0` — pins 1–14 exactly.

**The top row is wrong in both**, and not in the same way:

| col | should be | bw-circuit-ui | the corpus |
| --- | --- | --- | --- |
| 0 | PC5 (28) | **PC7** | **PB1** |
| 1 | PC4 (27) | **PC5** | **PB2** |
| 5 | PC0 (23) | **PC1** | **AVCC** |
| 6 | GND (22) | **PC0** | **PA0** |
| 7 | PC7 (21) | **PA0** | **PC0** |
| 8 | AVCC (20) | AVCC | **PC1** |
| 13 | PB1 (15) | PB1 | **PC7** |

- **bw-circuit-ui: 8 of 14 cells wrong.** Its top row is the right sequence
  shifted one place — `PC7` prepended at pin 28's column, pushing `PC5`…`PC0`
  each one along — and correct again from `AVCC` (col 8) onward.
- **The corpus: 14 of 14 wrong.** It runs the top row in the opposite direction,
  putting pin 15 at the left end where pin 28 belongs.

Two errors are shared and are the root of it: **`PC7` is pin 21, not pin 28**,
and **`PA0` does not exist on the PDIP-28 at all** — pin 22 is a second GND, and
port A is only bonded out on the 32-pin QFN. Somebody needed a name for the
second ground and invented a pin.

**The correct top row, dCol 0→13 (pins 28→15):**

```
PC5 PC4 PC3 PC2 PC1 PC0 GND PC7 AVCC PB5 PB4 PB3 PB2 PB1
```

Not fixed here. Correcting it moves legs in 110 shipped circuits, which then need
re-seating through `gen-device-benches.mjs seat`, and it needs a second ground
name the model accepts. That is seating-model work and it is handed over with the
answer already established, rather than left as a question.

## A gate was attempted and withdrawn

A corpus gate comparing each saved `leadMap` against its sidecar footprint was
built and then **withdrawn as vacuous**, because it could not catch the drift it
existed for.

Three successive designs failed, each measured rather than reasoned about:

1. recompute holes from the footprint's reference terminal → 929 false
   violations; the reference terminal's saved hole is in the bottom block for
   some parts and `computeLeadMap` then walks `dRow=5` off the board
2. anchor the row on `straddleRefRow()` instead → 6571 false violations; a DIP
   can legitimately be seated rotated 180°, so there is no single canonical
   orientation to compare against
3. compare RELATIVE geometry, allowing rotation but not mirroring → green, and
   **provably useless**: swapping 74hc595 for the mirrored bw-parts footprint
   (verified live in the loaded sidecar; 18 seated instances in scope) left the
   gate green, because a coordinated flip of the reference terminal AND every
   `dRow` satisfies a purely relative check.

The instrument was verified before the gate was blamed: the mutated file was the
one the registry loads, and the part was in scope. It genuinely cannot see the
defect. **A gate that cannot fail for its own purpose is worse than no gate**, so
it is not shipped. What would work is a chirality check — traversing the pins in
footprint order and requiring the saved holes to trace the same rotational sense —
and that belongs with whoever owns the seating model.
