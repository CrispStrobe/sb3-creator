# lab-steered-toggle-toss — expected behaviour

## Circuit
- 9 V supply. Flip-flop: Q1 (red LED, 1 kΩ) and Q2 (green LED, 1 kΩ), cross-coupled through 22 kΩ and 27 kΩ with 1 nF speed-up capacitors.
- Steering: the trigger line reaches each base through 10 nF and a diode (anode at the base); 47 kΩ ties each diode's cathode to its own transistor's collector. 47 nF on the trigger line keeps its edges from being instantaneous.
- STEP pulls the trigger line to ground by hand.
- An LM386 relaxation oscillator (47 kΩ / 100 kΩ, 1 nF, 10 kΩ and 1 µF, about 55 Hz) drives the trigger line through 1 kΩ. A kill NPN on its − input (47 kΩ from +9 V) holds it still with the output high; TOSS grounds that NPN's base.

## Observable behaviour
- At switch-on Q2 conducts (green).
- Each STEP press toggles the flip-flop once (red, green, red …); letting go does nothing.
- While TOSS is held the flip-flop toggles about 55 times a second — too fast to follow; let go and it stays where it was: heads or tails.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs`: start Q1 collector 7.20 V, Q2 0.09 V; four presses toggled red, green, red, green; TOSS held 100 ms: 6 toggles; released, the state held 40 ms later; oscillator parked at 8.10 V.

## What this verifies
1. Steering diodes route a falling edge to the conducting side only: one edge, one toggle (divide by two).
2. A fast astable stopped by a human release is a fair random source.

## Simulation notes
Without the 47 nF the trigger line jumps instantly when STEP is released and the solver can land on the other state of the flip-flop; with it the edge takes tens of microseconds, as a real line with some capacitance does.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net npn_3.collector V 7.20 +-0.03
net npn_4.collector V 0.090 +-0.02
net lm386_22.vout V 8.10 +-0.02
net lm386_22.inn V 0.050 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **19 of this page's 24** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-steered-toggle-toss` prints them one by one.
<!-- engine-provenance -->
