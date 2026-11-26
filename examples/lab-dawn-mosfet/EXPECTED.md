# lab-dawn-mosfet — expected behaviour

## Circuit
- 9 V battery. Receiver front end: wire antenna on the tap of a ferrite-rod coil, earth, tuning capacitor at 0.50 across the main winding (the default 612 kHz station, a 400 Hz tone).
- Detector: an n-MOSFET (threshold 2 V) whose gate the coupling winding drives; the winding's cold end sits on the wiper of a 100 kΩ pot at 0.25 (2.25 V, held by 100 nF), so the MOSFET is biased just past its threshold and conducts on one half of the RF only. Drain load 10 kΩ with 10 nF across for the RF; audio through 100 nF to the LM386 (gain 20) and an 8 Ω speaker through 220 µF.
- The MOSFET's source returns to ground through a phototransistor (the light slider).

## Observable behaviour
- Dark: no current can flow through the source path; the source and drain float up to 9 V and the speaker is silent (400 Hz at the amplifier output below 1 mV).
- Light: the phototransistor pulls the source to ground (about 3 mV), the MOSFET carries about 0.13 mA, its square law detects the station and the speaker plays the 400 Hz programme (about 0.85 V at the amplifier output).

## Measured on the engine
bw-board f4aaec43 (unchanged on b094eb22), `test/lab-circuits-r7b.test.mjs` (10 ms after 60 ms): dark 400 Hz 0.45 mV, drain 9.000 V; light 400 Hz 0.852 V, drain 7.73 V, source 0.0026 V, speaker tone 400 Hz.

## What this verifies
1. A MOSFET biased at its threshold detects AM by its square law.
2. A light-dependent switch in its source path turns the radio on at first light.

```assert
# power-on: supply; the gate bias still charging its 100 nF towards 2.25 V
net vsource_2.pos V 9.00 +-0.01
net potentiometer_8.wiper V 0.93 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 29** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-dawn-mosfet` prints them one by one.
<!-- engine-provenance -->
