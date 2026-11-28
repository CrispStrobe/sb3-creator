# lab-colour-amp-comparator — expected behaviour

## Circuit
- 9 V supply. A red LED (`led_4`, 470 Ω) lights a surface 1 cm away; a phototransistor (`phototransistor_5`) beside it catches the reflection (`light_path_15`, medium reflect, surface red; its knob moves the surface from 0.3 to 5 cm).
- The phototransistor's emitter works into 10 kΩ and reaches the LM386's (`lm386_10`) + input through 100 kΩ (the LM386's own input resistance to ground divides it by three).
- The − input takes the threshold from a 10 kΩ pot (`potentiometer_9`) under 47 kΩ from +9 V. GAIN pins joined: gain 200, a comparator.
- Output high: the red LED (`led_12`, 1 kΩ to ground) lights. Output low: the green LED (`led_14`, 1 kΩ from +9 V) lights.

## Observable behaviour
- Red or white surface: the red LED lights.
- Green or black surface: the green LED lights.
- Pull the red surface back past about 2 cm: too little light returns and the green LED lights.

## Measured on the engine
bw-board d4113b4b / bw-circuit-ui 0b594d6, `test/lab-circuits-r6i.test.mjs`, 3 ms after loading.

| surface | + input | output | lit |
|---|---|---|---|
| red | 1.357 V | 8.10 V | red (1.71 V across it) |
| white | 1.527 V | 8.10 V | red |
| green | — | 0.90 V | green (2.01 V across it) |
| black | — | 0.90 V | green |

Threshold on the − input: 0.723 V.

## What this verifies
1. A red surface returns far more red light than a green one: the + input sits well above the threshold for red and well below it for green.
2. The LM386 with gain 200 acts as a comparator between its two ground-referenced inputs and drives a two-LED indicator from one output.

## Simulation notes
Both LM386 inputs stay between 0.07 and 1.53 V, inside the range where its ground-referenced input stage works.

```assert
# t = 1 ms, red surface at 1 cm
net lm386_10.inp V 1.357 +-0.03
net lm386_10.inn V 0.723 +-0.02
net lm386_10.vout V 8.10 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@818e026` and `bw-circuit-ui@659431c` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **18 of this page's 21** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-colour-amp-comparator` prints them one by one.
<!-- engine-provenance -->
