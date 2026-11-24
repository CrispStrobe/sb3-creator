# lab-regen-receiver — expected behaviour

## Circuit
- 9 V battery. Antenna (1 m) on the tap of the ferrite-rod coil, the coil's cold end and the earth on ground, the tuning capacitor across the whole coil (authored at 0.50).
- 100 pF from the top of the tank to the transistor's base; 1 MΩ from the base to the wiper of a 100 kΩ regeneration pot across the supply (authored at 0.90).
- Emitter: 1 kΩ to ground, bypassed by 100 nF.
- Collector into the coupling winding (4 % of the main turns), its other end into a magnetic earphone (2 kΩ, 0.1 H) to 9 V, 10 nF from there to ground. The winding sense feeds the RF back in phase.
- The antenna carries its own broadcast: one station at 612 kHz, 5 mV/m, 50 % modulated with 400 Hz.

## Observable behaviour
- Pot at 0.90: the transistor carries about 0.04 mA; the tank holds about 0.24 V of the station and the earphone has no tone.
- Pot at 0.80: past the threshold. The tank's RF is about 0.7 V and the earphone whistles at about 1.1 kHz (the beat between the station and the circuit's own oscillation).
- Pot at 0.75 and 0.70: the whistle rises, about 2.2 kHz and 3.8 kHz: more current, more transistor capacitance, the oscillation pulled further from the station.
- Pot at 0.60: the oscillation has moved about 13 kHz above the station, out of the band where the two beat audibly.

## Measured on the engine
bw-board r4/rf-20261123 (RF envelope front end), `test/lab-circuits-rf.test.mjs`, 20 ms per setting in sequence: 0.90 no tone, tank 0.24 V; 0.80 1087 Hz, tank 0.70 V; 0.75 2248 Hz; 0.70 3814 Hz, tank 1.05 V; 0.60 251 Hz with the band at 625 kHz.

## What this verifies
1. Positive feedback past loop gain one makes a tuned circuit oscillate on its own (from its thermal noise if nothing else).
2. The oscillation beats with a nearby carrier: the heterodyne whistle.

```assert
# supply
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@20c29a7` and `bw-circuit-ui@6ea2239` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **9 of this page's 31** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-regen-receiver` prints them one by one.
<!-- engine-provenance -->
