# lab-fibre-proximity — expected behaviour

## Circuit
- 9 V supply. A red LED (`led_4`, 1 kΩ) shines into a light guide that is cut in two; the gap between the two ends is the knob of the light path (`light_path_13`, 0 to 5 mm, 0.2 mm as built). The far end lights a phototransistor (`phototransistor_5`, collector on +9 V).
- Its emitter drives an NPN (`npn_8`) through 22 kΩ, with 4.7 kΩ from base to emitter. A relay (`relay_9`, 200 Ω coil, pull-in 3.7 V, drop-out 1.5 V) with a flyback diode sits in the collector. Its contact lights a yellow LED (`led_12`) through 1 kΩ.

## Observable behaviour
- Ends close together: the relay is in and the yellow LED on.
- Pulling them apart: the relay drops out between 1.5 and 2 mm.
- Bringing them together again: it pulls in only between 1.5 and 1 mm. Between 1 and 1.5 mm it keeps whatever state it had.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`.

| gap | opening | closing |
|---|---|---|
| 0.2 mm | in | in |
| 1.0 mm | in | in |
| 1.5 mm | in | out |
| 2.0 mm | out | out |
| 5.0 mm | out | — |

The phototransistor emitter sits at 8.97 V with the ends touching (the transistor saturated).

## What this verifies
1. Light leaves a fibre end in a cone; the further away the second end, the less of the cone it catches.
2. A relay pulls in at a higher coil voltage than it lets go at. That gap gives the switch hysteresis: it does not chatter when the ends hover near the switching point.

## Simulation notes
The coupling across the joint is the overlap of the spreading exit cone with the second core (bw-board optics.js, joint gap).

```assert
# as built: ends 0.2 mm apart, phototransistor saturated, relay in
net phototransistor_5.emitter V 8.97 +-0.03
net led_4.anode V 1.73 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 10** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-fibre-proximity` prints them one by one.
<!-- engine-provenance -->
