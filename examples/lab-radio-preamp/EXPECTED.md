# lab-radio-preamp — expected behaviour

## Circuit
- 9 V battery. A short antenna (0.5 m) on the tap of a ferrite-rod coil, earth, tuning capacitor at 0.50 (the default 612 kHz station, a 400 Hz tone); germanium diode into 47 kΩ ‖ 2.2 nF.
- One-transistor audio stage: the detector drives an NPN's base through 100 nF; 1 MΩ from collector to base sets its bias, 4.7 kΩ collector load from 9 V.
- A slide switch takes the LM386's input (through 100 nF) either straight from the detector (first position) or from the transistor's collector (second position, authored). LM386 at gain 20, 8 Ω speaker through 220 µF.

## Observable behaviour
- The weak station gives only a few millivolts of audio at the detector — the diode works in its square-law region.
- Switch in the first position (detector straight to the LM386): the 400 Hz tone is barely there, about 0.02 V at the amplifier output.
- Switch in the second position (through the transistor stage): about 1.6 V at the amplifier output — some 80 times louder.
- The transistor stage sits at about 6.3 V on its collector either way.

## Measured on the engine
bw-board f4aaec43 (unchanged on b094eb22), `test/lab-circuits-r7b.test.mjs` (10 ms after 40 ms): direct 0.0191 V at 400 Hz; through the transistor 1.599 V; collector 6.33 V.

## What this verifies
1. A small-signal stage ahead of the power amplifier raises the gain of the whole receiver (here by about 80).

```assert
# power-on: supply and the LM386's bias divider at half the supply
net vsource_2.pos V 9.00 +-0.01
net lm386_18.bypass V 4.51 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **9 of this page's 22** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-radio-preamp` prints them one by one.
<!-- engine-provenance -->
