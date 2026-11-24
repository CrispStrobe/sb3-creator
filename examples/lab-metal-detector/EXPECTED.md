# lab-metal-detector — expected behaviour

## Circuit
- 9 V supply. Two Colpitts oscillators, each an NPN with its coil from +9 V to the collector, 100 nF from collector to emitter, 1 µF from emitter to ground, 4.7 kΩ in the emitter and the base held by 22 kΩ / 10 kΩ with 1 µF.
- The search oscillator's coil is the hand-wound search coil (`air_coil_3`: 1000 turns of 0.3 mm wire, 10 cm across, ≈ 0.13 H, ≈ 1.5 kHz). The reference oscillator uses a fixed 175 mH coil and runs about 200 Hz lower.
- Each collector reaches a germanium diode through 1 nF and 100 kΩ (100 kΩ to ground at the diode). 22 nF and 100 kΩ after the diode keep the difference frequency, the beat, which a crystal earphone sounds.
- The **Metal** slider in the instruments column sets how far a piece of metal is from the search coil (20 cm: far away; a coin by default, `metalKind: 'ferrous'` for iron).

## Observable behaviour
- No metal: a low tone of about 195 Hz in the earphone, the difference between the two oscillators.
- A coin flat on the search coil: the coil's inductance drops 5 %, the search oscillator rises about 2.5 % (≈ 38 Hz) and the beat with it.
- At one coil radius (5 cm) the effect is an eighth of that; iron moves the beat the other way.

## Measured on the engine
bw-board r4/transducers-20261123, `test/lab-circuits-8.test.mjs`: beat from the earphone's tone edges, ≈ 195 Hz without metal, ≈ 38 Hz higher with the coin.

## What this verifies
1. Two oscillators close in frequency, mixed in a diode, give their difference frequency.
2. Metal changes a coil's inductance (a conductor as a shorted turn lowers it, iron raises it), and an LC oscillator turns that into a frequency change you can hear.

## Simulation notes
Real beat-frequency detectors run their oscillators near 100 kHz; here they run at about 1.5 kHz so the solver can follow every cycle. The principle is unchanged. Metal shifts L by ±5 %·(r²/(r²+d²))³.

```assert
# power-on: supply
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@20c29a7` and `bw-circuit-ui@6ea2239` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **13 of this page's 26** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-metal-detector` prints them one by one.
<!-- engine-provenance -->
