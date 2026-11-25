# lab-opamp-touch-latch — expected behaviour

## Circuit
- 9 V supply. One op-amp of the LM324 is a comparator: its − input sits at a third of the supply (200 kΩ from +9 V, 100 kΩ to ground).
- Its + input hangs on its own output through 10 MΩ, with 10 MΩ to ground: a high output (7.24 V) holds + at 3.62 V, above the threshold; a low output holds it near 0. The decision holds itself.
- Two touch plates. Each is a button standing for the plates bridged by a fingertip, in series with 1 MΩ, the finger's resistance: **SET** connects + to +9 V, **RESET** connects + to ground.
- Red LED (1 kΩ, output to ground) lit while set; green LED (1 kΩ, +9 V into the output) lit while reset. The other three op-amps are parked.

## Observable behaviour
- Power-on: reset, green lit.
- Touch SET: red lit, and it stays lit after the finger lifts.
- Touch RESET: green again, held.

## Measured on the engine
`test/lab-circuits-r6e.test.mjs`: power-on output 0.36 V with the − input at 3.00 V; after SET the output is 7.24 V and holds the + input at 3.62 V; after RESET 0.36 V again.

## What this verifies
1. Positive feedback turns a comparator into a memory (a bistable): the output keeps the input on its own side of the threshold.
2. An op-amp input draws almost no current, so even a finger's megohm can push it over.

## Simulation notes
The finger is a fixed 1 MΩ behind a push button; real skin is anything from a few hundred kΩ to several MΩ, which still works here because the feedback path is 10 MΩ.

```assert
# power-on: reset; the threshold sits at a third of 9 V
net lm324_3.1_out V 0.355 +-0.03
net lm324_3.1_pos V 0.178 +-0.02
net lm324_3.1_neg V 3.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2965782` and `bw-circuit-ui@e3441d2` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **16 of this page's 20** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-touch-latch` prints them one by one.
<!-- engine-provenance -->
