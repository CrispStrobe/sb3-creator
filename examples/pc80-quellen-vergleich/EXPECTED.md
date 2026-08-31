# pc80-quellen-vergleich — expected behaviour

## Circuit
Battery 1: EMF = 9 V, r_int = 0.5 Ω → 470 Ω → green LED → return.
Battery 2: EMF = 9 V, r_int = 5.0 Ω → 470 Ω → red LED → return.

## Meter readings (measured on the engine)
- **Battery 1 current:** I₁ = (8.9927 − 2.1457) / 470 = 14.57 mA.
- **Battery 1 internal drop:** 0.014568 × 0.5 = 0.0073 V.
- **Battery 1 terminal voltage:** V_t1 = 9 − 0.0073 = 8.9927 V.
- **Battery 2 current:** I₂ = (8.9278 − 2.1443) / 470 = 14.43 mA.
- **Battery 2 internal drop:** 0.014433 × 5.0 = 0.0722 V.
- **Battery 2 terminal voltage:** V_t2 = 9 − 0.0722 = 8.9278 V.
- **Battery 2's terminal sits below battery 1's**, by the difference between
  the two internal drops and nothing else.

## What this verifies
1. Same EMF, different internal R → different terminal voltages under load
2. The difference grows with load current: ten times the internal resistance
   makes ten times the internal drop at the same current
3. Internal resistance is the battery's hidden quality metric

## A note on reading the second loop's node voltages

The two batteries share no conductor, so the second loop has no path to the
node the solver takes as its reference. Its absolute node voltages are
therefore arbitrary — `battery_2.pos` sits wherever the solve happened to
anchor that island — while every DIFFERENCE across it is physical. Read
battery 2 as a terminal voltage (pos minus neg) or as a branch current, never
as a node voltage against ground.

```assert
# Battery 1: low internal R (0.5R) -> terminal near EMF under light load
net battery_1.pos V 8.99 +-0.10
# Battery 2 carries slightly less current through the same 470R load, because
# ten times the internal resistance drops ten times as much inside the cell.
# Asserted as a CURRENT: battery_2's loop shares no node with the reference,
# so its absolute node voltages are an artefact of where the solve anchored it.
current battery_2 mA 14.43 +-0.30
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@338ac5d` and `bw-circuit-ui@14efc75` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **12 of this page's 12** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc80-quellen-vergleich` prints them one by one.
<!-- engine-provenance -->
