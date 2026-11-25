# lab-trf-mosfet — expected behaviour

## Circuit
- 9 V battery. A short antenna (2 m effective height, 50 pF) with two stations: local 700 kHz (400 Hz tone) and a neighbour at 740 kHz (1 kHz tone), both 5 mV/m; earth. A slide switch connects the antenna straight to the top of the tank (first position, authored) or through 4.7 pF (second position). Tank: ferrite-rod main winding and the tuning capacitor (authored 0.30, on the local station).
- RF stage: the coupling winding drives an n-MOSFET's gate; its cold end sits on a 100 kΩ / 47 kΩ divider held by 10 nF (2.88 V). Drain load 4.7 kΩ; the RF goes through 1 nF to a germanium diode (100 kΩ DC return) into 47 kΩ ‖ 2.2 nF.
- Audio: 100 nF into an NPN stage (1 MΩ collector-to-base, 4.7 kΩ load), 100 nF into the LM386 (gain 20), 8 Ω speaker through 220 µF.

## Observable behaviour
- Tight coupling, tuned (0.30): the tank carries 0.17 V of the local station and 0.024 V of the neighbour; the MOSFET's gate swings 16 mV, its drain 0.23 V — about 15 times more — and the speaker plays the 400 Hz tone loudly (about 4 V at the amplifier output).
- Loose coupling (4.7 pF, retuned to 0.40): about a ninth as much RF reaches the tank (0.019 V), and the neighbour is held further down (9.2 : 1 against 7.1 : 1) — quieter but sharper.

## Measured on the engine
bw-board f4aaec43 (unchanged on b094eb22), `test/lab-circuits-r7b.test.mjs`: per-station tank RF tight 0.1725 / 0.0245 V, loose 0.0191 / 0.00208 V; playing (10 ms after 60 ms): gate 0.0155 V, drain 0.231 V, 400 Hz 4.03 V, speaker tone 400 Hz.

## What this verifies
1. An RF amplifier ahead of the diode lifts a weak station far above the diode's threshold.
2. Loose antenna coupling loads the tuned circuit less: less signal, better selectivity.

```assert
# power-on: supply and the LM386's bias divider at half the supply
net vsource_2.pos V 9.00 +-0.01
net lm386_25.bypass V 4.51 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b094eb2` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **18 of this page's 40** numeric claims against that engine
> (1 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-trf-mosfet` prints them one by one.
<!-- engine-provenance -->
