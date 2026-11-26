# lab-dusk-parking-light — expected behaviour

## Circuit
- 9 V supply. A phototransistor from +9 V into 22 kΩ: its emitter voltage is the light on the bench (light 0.5 as built). 10 kΩ to Q1's base.
- Emitter-coupled Schmitt trigger: Q1 and Q2 share 470 Ω; Q1's collector (4.7 kΩ) feeds Q2's base through 10 kΩ / 22 kΩ; Q2's collector has 4.7 kΩ to +9 V.
- An LM386 as an inverting comparator: + input held at 3 V by 100 kΩ from +9 V (against the chip's internal input resistance), − input from Q2's collector through 22 kΩ. Its output drives the white parking light through 330 Ω.

## Observable behaviour
- Daylight: Q1 conducts, Q2 is off, its collector high, the amplifier output low: light off.
- Dimming: at 0.15 the trigger flips, Q2's collector falls, the amplifier output goes to 8.1 V: light on.
- Brightening: at 0.2 it is still on; it goes off only at 0.25. No flicker at dusk.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs`: light 0.5: phototransistor emitter 2.78 V, Q2 collector 8.45 V, output 0.90 V. Dimming 0.3 → 0.2 → 0.15 → 0.1: off, off, on, on; brightening 0.15 → 0.2 → 0.25 → 0.3: on, on, off, off. Dark: parking light 15.3 mA, − input 0.72 V.

## What this verifies
1. A Schmitt trigger turns a slowly changing light level into a clean switch with two thresholds.
2. A power amplifier used open-loop is a comparator that can drive a lamp.

## Simulation notes
The phototransistor's light is the learner's slider (0..1 of full light).

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net phototransistor_3.emitter V 2.78 +-0.03
net npn_7.collector V 8.45 +-0.05
net lm386_14.inn V 5.87 +-0.05
net lm386_14.vout V 0.90 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0f6b38a` and `bw-circuit-ui@42aaddc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **17 of this page's 21** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-dusk-parking-light` prints them one by one.
<!-- engine-provenance -->
