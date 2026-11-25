# lab-bird-chirps — expected behaviour

## Circuit
- 5 V supply, an LM358 and two 74HC132 quad Schmitt NAND gates.
- Phrase oscillator: half of the LM358 integrates (150 kΩ into its - input, 1 µF from output to - input, + input at half the supply from 10 kΩ / 10 kΩ). Gate 4 of the first 74HC132 and gate 1 of the second, both wired as inverters, follow the op-amp's output; the second one's output feeds the 150 kΩ.
- Chirp oscillator: gate 2 of the first chip with 100 kΩ / 470 nF, enabled by the phrase square wave (gate 4's output).
- Gate 3 inverts the chirp oscillator and enables gate 1 (4.7 kΩ / 100 nF), the voice. The voice drives a piezo through 1 kΩ.
- The second LM358 half and three gates of the second chip are unused.

## Observable behaviour
- The op-amp's output is a triangle between the gate's two switching levels, a little under a volt apart; it never comes near the supply rails. Gate 4 turns it into a square wave: phrases about 117 ms apart, each lasting about half of that.
- During a phrase the chirp oscillator runs and opens the voice twice; in between the voice is silent.
- The voice is about 2.6 kHz.

## Measured on the engine
Over the first 240 ms (20 µs steps): voice 2615 Hz; the voice comes in 4 bursts, two in each phrase; the triangle spans exactly the gate's two switching levels; phrase square wave rising at 43.5 ms and 160.6 ms; no voice edge while the phrase is off. `test/lab-circuits-r6d.test.mjs` holds these.

## Why
An integrator ramps at a steady rate while its input sits on one side of the reference and turns round when the input flips; letting a Schmitt gate do the flipping at its own two thresholds gives a triangle and a square wave from one loop. A Schmitt NAND oscillator with its second input low stops with its output high, so one oscillator can switch another on and off: three oscillators stacked give a voice, chirps and phrases.

## Simulation notes
The phrase oscillator is an integrator rather than an op-amp comparator astable: with the LM358's output swinging into its own limits while the gates switched, the engine's step controller ran out of attempts (step-attempt-budget-exceeded) within the first 100 ms (found while building this bench; reported).

## What this verifies
1. An op-amp integrator and a Schmitt gate make a triangle/square oscillator.
2. Gated gate oscillators build a sound from three time scales.

```assert
# t = 1 ms: integrator at the reference, phrase off, voice gated off
net vsource_2.pos V 5.00 +-0.01
net lm358_3.1_pos V 2.500 +-0.01
net lm358_3.1_out V 2.48 +-0.03
net 74hc132_8.4y V 0.00 +-0.05
net 74hc132_8.1y V 4.99 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b094eb2` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 19** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-bird-chirps` prints them one by one.
<!-- engine-provenance -->
