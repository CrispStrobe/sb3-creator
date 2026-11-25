# lab-one-transistor-radio — expected behaviour

## Circuit
- 9 V battery. Antenna on the tap of the ferrite-rod coil, the coil's cold end and the earth on ground, the tuning capacitor across the whole coil (authored at 0.50, the 612 kHz station).
- The coil's small coupling winding (a tenth of the main turns) feeds the transistor: one end on the base, the other end biased from 9 V through 1 MΩ and held still by 100 nF to ground.
- Emitter on ground. A magnetic earphone (2 kΩ, 0.1 H) from 9 V to the collector, with 10 nF from the collector to ground to bypass what is left of the carrier.
- No diode: the transistor's own base-emitter junction is the detector.

## Observable behaviour
- The 612 kHz station's 400 Hz tone in the earphone, about 0.75 mA rms through it: much louder than the crystal set, because the transistor amplifies the detected audio.
- Knob near 0.265: the 810 kHz station, 600 Hz (then 900 Hz).
- Knob at 0.10: the far 1215 kHz station's 1 kHz tone, about 0.25 mA rms.
- Between stations (knob at 0.8) the earphone current falls to below 0.1 mA rms once the base bias has settled (the 1 MΩ and 100 nF take about 0.1 s).

## How the transistor detects
The base-emitter junction is a diode. The carrier from the coupling winding swings the base back and forth; the junction conducts more on the positive peaks than it gives back on the negative ones, so the average base current rises with the carrier's strength and falls with it. The collector current is that, times the gain, and follows the station's sound. The 1 MΩ bias keeps the transistor just at the edge of conduction, where this effect is strongest.

## Measured on the engine
bw-board 0bc7baf, `test/lab-circuits-7.test.mjs`: 400 Hz at 0.745 mA rms (knob 0.50), 600 Hz at 0.61 mA rms (knob 0.265), 1 kHz at 0.25 mA rms (knob 0.10), 0.084 mA rms 80 ms after turning to 0.8.

```assert
# supply, and the top of the tank: the coil shorts it to ground for DC
net vsource_2.pos V 9.00 +-0.01
net ferrite_coil_6.b V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2c62bd5` and `bw-circuit-ui@15b936d` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **6 of this page's 31** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-one-transistor-radio` prints them one by one.
<!-- engine-provenance -->
