# lab-schmitt-supply-watch — expected behaviour

## Circuit
- An adjustable battery (authored 9 V). A 10 kΩ pot across it; its wiper reaches Q1's base through a red LED, two diodes and 10 kΩ (about 2.6 V less than the wiper, nearly whatever the battery does).
- Emitter-coupled Schmitt trigger: Q1 and Q2 share 1 kΩ to ground; Q1's collector has 2.2 kΩ to the battery and feeds Q2's base through 10 kΩ / 8.2 kΩ. Q2's collector drives a yellow warning LED through 1 kΩ.

## Observable behaviour
- Fresh battery, pot at 0.6: Q1 conducts, Q2 is off, no warning.
- Turning the pot down: the warning comes on at 0.5. Turning it back up it stays on at 0.55 and goes off only at 0.6 — two clearly different settings.
- At pot 0.6, lowering the battery: the warning comes on at 7.25 V; raising it again, it goes off only at 8.25 V.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs`: Q1 base 2.92 V, shared emitter 2.24 V, Q2 collector 9.00 V at 9 V; warning LED 2.7 mA; pot down 0.55 → off (Q2 collector 7.76 V), 0.5 → on (4.39 V); up 0.55 → still on (4.41 V), 0.6 → off; battery falling: on at 7.25 V; rising: off at 8.25 V.

## What this verifies
1. A shared emitter resistor gives two transistors positive feedback and two thresholds.
2. A nearly fixed drop in the input path makes the trigger watch the supply itself.

## Simulation notes
The battery voltage is the vsource's value, which the learner can change.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net npn_8.base V 2.92 +-0.02
net resistor_13.a V 2.24 +-0.02
net npn_8.collector V 3.68 +-0.03
net npn_9.collector V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **21 of this page's 21** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-schmitt-supply-watch` prints them one by one.
<!-- engine-provenance -->
