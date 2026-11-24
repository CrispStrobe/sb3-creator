# lab-regen-receiver — expected behaviour

## Circuit
- 9 V battery. Antenna (1 m) on the tap of the ferrite-rod coil, the coil's cold end and the earth on ground, the tuning capacitor across the whole coil (authored at 0.50).
- 100 pF from the top of the tank to the transistor's base; 1 MΩ from the base to the wiper of a 100 kΩ regeneration pot across the supply (authored at 0.90).
- Emitter: 1 kΩ to ground, bypassed by 100 nF.
- Collector into the coupling winding (4 % of the main turns), its other end into a magnetic earphone (2 kΩ, 0.1 H) to 9 V, 10 nF from there to ground. The winding sense feeds the RF back in phase.
- The antenna carries its own broadcast: one station at 612 kHz, 5 mV/m, 50 % modulated with 400 Hz.

## Observable behaviour
- Pot at 0.90: the transistor carries about 0.04 mA; the tank holds about 0.24 V of the station and the earphone has no tone.
- Pot at 0.80: past the threshold. The tank's RF averages about 0.6 V and the earphone whistles at about 1.6 kHz (the beat between the station and the circuit's own oscillation: without the station the line is a seventh as strong).
- Pot at 0.75: the whistle rises, to about 2.8 kHz: more current, more transistor capacitance, the oscillation pulled further from the station.
- Pot at 0.60: the oscillation has moved about 13 kHz above the station, out of the band where the two beat audibly.

## Measured on the engine
bw-board with bit-reproducible transcendentals (src/det-math.js), `test/lab-circuits-rf.test.mjs`: tank RF as a mean over a window, the whistle as the strongest line of the earphone's voltage over 10 ms (the instantaneous pitch tracker wanders on the beat's irregular envelope). 0.90: no tone, tank 0.24 V; 0.80 (10 ms later): tank 0.60 V, line at 1575 Hz; 0.75: line at 2825 Hz. The same on macOS and Linux, and under 1-ulp changes of the station's field.

## What this verifies
1. Positive feedback past loop gain one makes a tuned circuit oscillate on its own (from its thermal noise if nothing else).
2. The oscillation beats with a nearby carrier: the heterodyne whistle.

```assert
# supply
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@5c83e54` and `bw-circuit-ui@089ee40` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **9 of this page's 27** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-regen-receiver` prints them one by one.
<!-- engine-provenance -->
