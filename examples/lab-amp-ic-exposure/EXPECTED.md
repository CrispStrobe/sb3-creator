# lab-amp-ic-exposure — expected behaviour

## Circuit
- 9 V battery, one LM386 (pins 1, 7 and 8 open) used as a one-shot, as in lab-amp-ic-pedestrian.
- −IN (pin 2) held low by 100 kΩ from the battery and 33 kΩ to ground.
- A 47 µF electrolytic from the output (+) to +IN (−).
- The timing resistance is a phototransistor from +IN (collector) to ground (emitter), with the chip's own input resistance in parallel. The phototransistor passes a current proportional to the light on it (1 mA at full light, `iMax`).
- A button connects +IN to the battery through 2.2 kΩ.
- Red LED (ready): battery + → 1 kΩ → red → output. Green LED (exposing): output → 1 kΩ → green → ground.

## Observable behaviour
- At rest: red.
- A press starts the exposure: green. The phototransistor drains the capacitor; the more light, the faster, so the brighter the scene, the shorter the green time.
- In darkness only the chip's own input resistance drains it: several seconds.

## Measured on the engine
Button held 100 ms, then released; green time after the release (to 10 ms):

| light | green time |
|---|---|
| 0.2 | 1.07 s |
| 0.6 | 0.43 s |
| 1 | 0.25 s |

## What this verifies
1. A light-controlled current replaces the timing resistor of a one-shot.
2. More light gives a shorter time, which is what an exposure timer must do: the same amount of light reaches the paper or film.

## Simulation notes
`test/lab-circuits-r6b.test.mjs` sets the light slider, presses the button and times the green phase.

```assert
# t = 1 ms, dark, at rest.
net lm386_3.vout V 0.901 +-0.03
net lm386_3.inn V 1.492 +-0.03
net lm386_3.inp V 0.901 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 13** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-ic-exposure` prints them one by one.
<!-- engine-provenance -->
