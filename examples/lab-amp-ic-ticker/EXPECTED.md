# lab-amp-ic-ticker — expected behaviour

## Circuit
- The blinker of lab-amp-ic-blinker with its 10 µF capacitor: LM386 (pins 1, 7, 8 open, −IN grounded), output → 10 µF (+) → +IN, 10 kΩ from +IN to ground.
- Red LED from the output to ground (1 kΩ), green LED from the battery to the output (1 kΩ): a double warning blinker.
- The output also feeds a loudspeaker (8 Ω) through 47 µF (+ on the output side) and 47 Ω.

## Observable behaviour
- Red and green alternate about 1.6 times a second.
- The speaker ticks at every change, once for each LED: a turn-signal reminder.
- Between the edges the speaker is silent: the capacitor passes only the jump. Each jump puts about 0.8 V across the speaker, which dies away within a few milliseconds (47 µF × 55 Ω = 2.6 ms).

## Measured on the engine
- Output edges at 318 ms and 623 ms.
- Speaker swing 0, 1, 2 ms after the falling edge: −0.76, −0.51, −0.35 V; after the rising edge: +0.83, +0.57, +0.39 V.
- Halfway between the edges: 0.000 V.

## What this verifies
1. The blinker's output swings carry a click to a speaker through a coupling capacitor.
2. A capacitor passes a change and blocks a steady voltage: a tick per edge, silence in between.

## Simulation notes
`test/lab-circuits-r6b.test.mjs` watches the first two edges and the speaker voltage around them.

```assert
# t = 1 ms: output high, the coupling capacitor still charging through the speaker.
net lm386_3.inp V 7.977 +-0.05
net led_9.cathode V 8.073 +-0.05
net resistor_11.b V 0.793 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **10 of this page's 18** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-ic-ticker` prints them one by one.
<!-- engine-provenance -->
