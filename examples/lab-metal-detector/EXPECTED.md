# lab-metal-detector — expected behaviour

## Circuit
- 9 V supply. Two Colpitts oscillators, each an NPN with its coil from +9 V to the collector, 22 nF from collector to emitter, 220 nF from emitter to ground, 4.7 kΩ in the emitter and the base held by 22 kΩ / 10 kΩ with 1 µF.
- The search oscillator's coil is the hand-wound search coil (`air_coil_3`: 30 turns of 0.5 mm wire, 10 cm across, 2 cm long, ≈ 137 µH, ≈ 96 kHz). The reference oscillator uses a fixed 140 µH coil on a small ferrite core (`ferrite_coil_11`, its tap and coupling winding unused) and runs about 0.8 kHz lower.
- Each collector reaches a germanium diode through 1 nF and 100 kΩ (100 kΩ to ground at the diode). 1 nF and 100 kΩ after the diode keep the difference frequency, the beat (they pass a few kHz and stop the 100 kHz), which a crystal earphone sounds.
- The **Metal** slider in the instruments column sets how far a piece of metal is from the search coil (20 cm: far away; a coin by default, `metalKind: 'ferrous'` for iron).

## Observable behaviour
- No metal: a tone of about 800 Hz in the earphone, the difference between the two oscillators.
- A coin at 5 cm: the search coil's inductance drops about 0.6 %, the beat rises to about 1.1 kHz.
- A coin flat on the search coil: the inductance drops 5 %, the search oscillator rises about 2.5 % (≈ 2.5 kHz) and the beat to about 3.3 kHz. Iron moves the beat the other way.

## Measured on the engine
bw-board RF envelope front end (the coils are RF windings, both oscillators run in one band near 96 kHz), `test/lab-circuits-8.test.mjs`: beat from the earphone's tone edges, ≈ 800 Hz without metal, ≈ 2.5 kHz higher with the coin. The two oscillators' offset in the band: 779 Hz without metal, 3229 Hz with the coin. About 210 solves per simulated millisecond.

## What this verifies
1. Two oscillators close in frequency, mixed in a diode, give their difference frequency.
2. Metal changes a coil's inductance (a conductor as a shorted turn lowers it, iron raises it), and an LC oscillator turns that into a frequency change you can hear.

## Simulation notes
The oscillators run at a realistic ~96 kHz: the hand-wound coil and the ferrite coil are RF windings of the engine's envelope front end, so the solver follows the oscillations' envelopes rather than every cycle. Metal shifts L by ±5 %·(r²/(r²+d²))³.

```assert
# power-on: supply
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **15 of this page's 32** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-metal-detector` prints them one by one.
<!-- engine-provenance -->
