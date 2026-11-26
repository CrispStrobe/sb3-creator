# lab-counter-traffic-lights — expected behaviour

## Circuit
- 5 V supply. 555 astable (timer_555_3): 10 kΩ, 68 kΩ, 4.7 µF: a step about every 0.47 s, into a 4-bit binary counter (74hc93_8, QA into its own second clock input; resets grounded). Only QA and QB are used: four states that repeat.
- RED (led_10, 220 Ω): lit unless an NPN (npn_11), switched by QB through 10 kΩ, shunts it.
- AMBER (led_14, 220 Ω): in the collector of an NPN (npn_15) switched by QA.
- GREEN (led_18, 220 Ω): in the collector of an NPN (npn_19) switched by QB, unless a fourth NPN (npn_21), switched by QA, shorts that NPN's base.

## Observable behaviour
- QB QA = 00: red. 01: red + amber. 10: green. 11: amber. Then red again.
- The sequence over 2.6 s: red from the start, red + amber at 0.42 s, green at 0.88 s, amber at 1.36 s, red at 1.84 s, red + amber at 2.32 s.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10b.test.mjs`, sampled every 20 ms: R-- 0.02 s, RA- 0.42 s, --G 0.88 s, -A- 1.36 s, R-- 1.84 s, RA- 2.32 s.

## What this verifies
1. A binary counter's two lowest outputs count 0, 1, 2, 3 and repeat.
2. Transistors decode them: an inverter (red = not QB), a driver (amber = QA) and an AND with an inverted input (green = QB and not QA).

## Simulation notes
The first step is a little shorter than the rest: the 555's capacitor starts empty and its first charge runs from 0 V instead of from a third of the supply.

```assert
# switch-on: count 0, red lit, amber and green dark
net led_10.anode V 1.829 +-0.05
net led_14.anode V 5.0 +-0.01
net led_18.anode V 5.0 +-0.01
net timer_555_3.control V 3.333 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0f6b38a` and `bw-circuit-ui@42aaddc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 23** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-counter-traffic-lights` prints them one by one.
<!-- engine-provenance -->
