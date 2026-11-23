# lab-direction-finder — expected behaviour

## Circuit
- 9 V battery. No long-wire antenna and no earth: the ferrite rod is the antenna (its `rodHeightM` 0.05 m effective height at 1 MHz, scaled with frequency).
- The rod's main winding with the tuning capacitor across it (authored at 0.40, the 700 kHz station); the tap is unused.
- The coupling winding (a quarter of the main turns) feeds the transistor's base; its other end is biased from 9 V through 2.2 MΩ and held still by 10 nF.
- Collector through an analog meter in current mode (full scale one milliampere) to 9 V, 10 nF from collector to ground. Emitter on ground.
- The rod carries its own broadcast (its `stations` parameter): two strong local stations, "north" 700 kHz (bearing 0°, 400 Hz tone) and "east" 1000 kHz (bearing 70°, 800 Hz tone), both at a field of three tenths of a volt per metre.
- The rod's angle is a control (the dial above the coil while simulating): 0..1 is 0..360°, authored at 0°.

## Observable behaviour
All of these need the stations, which arrive over tens of milliseconds of simulated time; a DC operating-point solve does not see them, so the readings are stated as fractions of the meter's full scale and checked by `test/lab-circuits-rf.test.mjs` instead.
- Rod at 0°, tuned to the north station: the needle at about 0.52 of full scale; at rest (no signal) the transistor's current puts it at about 0.38.
- Turning the rod: at 45° about 0.47, at 90° back to the resting 0.38 (the null: the RF in the tank falls by five orders of magnitude), at 180° 0.52 again, at 270° the second null.
- Tuned to the east station (knob about 0.19), the rod at 270° gives about 0.74 (the rod picks up more at 1 MHz than at 700 kHz) and at 160° (90° from the station's bearing) the needle is back at 0.38.

## Measured on the engine
bw-board r4/rf-20261123, `test/lab-circuits-rf.test.mjs` (after the 2.2 MΩ / 10 nF bias has settled, about 60 ms), as fractions of full scale: north, rod 0° 0.515, 45° 0.471, 90° 0.378, 180° 0.515; east, rod 270° 0.735, 160° 0.378. The tank's RF envelope (700 kHz, rod 0°) is about a fifth of a volt; at 90° a few microvolts.

## What this verifies
1. A ferrite rod is a directional antenna: its pickup follows |cos(angle − bearing)|, broad maxima and sharp nulls 180° apart.
2. The null, not the maximum, gives the bearing, with a 180° ambiguity.

```assert
# supply, and the top of the tank: the coil shorts it to ground for DC
net vsource_2.pos V 9.00 +-0.01
net tuning_cap_5.a V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@a685b22` and `bw-circuit-ui@df78c46` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **6 of this page's 18** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-direction-finder` prints them one by one.
<!-- engine-provenance -->
