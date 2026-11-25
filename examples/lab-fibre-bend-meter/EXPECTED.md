# lab-fibre-bend-meter — expected behaviour

## Circuit
- 9 V battery. Red LED (led_4) with 1 kΩ feeding 1 m of plastic fibre (light_path_9); its control is the bend radius of one loop (5 cm as built, down to 4 mm).
- At the far end a phototransistor (phototransistor_5), 2.2 kΩ from its emitter to ground, sets the base of an NPN emitter follower.
- The follower drives the moving-coil meter (analog_meter_8: a one-milliamp movement on its 5 V range, five kilohms).

## Observable behaviour
- Gentle loop (5 cm): the meter reads about 3.8 V.
- Bending it tighter, stepped from 2 cm down to 4 mm, lowers the reading: 3.5 V, 3.0 V, then 1.6 V.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10a.test.mjs`: bend radius stepped 5 / 2 / 1 / 0.7 / 0.4 cm: meter 3.78 / 3.50 / 3.04 / 2.64 / 1.65 V.

## What this verifies
1. A tight bend lets light escape from the fibre core: less light at the end.
2. The phototransistor turns light into current, the emitter follower delivers it to the meter without loading the phototransistor's resistor.

## Simulation notes
The phototransistor works in its linear range with 2.2 kΩ; with 100 kΩ it saturates and the meter pegs whatever the bend.

```assert
# 1 ms after switch-on, gentle 5 cm loop
net led_4.anode V 1.73 +-0.03
net phototransistor_5.emitter V 4.46 +-0.1
net npn_7.emitter V 3.78 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@e744ede` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **5 of this page's 11** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-fibre-bend-meter` prints them one by one.
<!-- engine-provenance -->
