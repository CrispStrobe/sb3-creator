# lab-npn-police-siren — expected behaviour

## Circuit
9 V (`vsource_2`). Astable: Q1 `npn_3`, Q2 `npn_4`, collector resistors 2.2 kΩ (`resistor_5`, `resistor_6`), coupling capacitors 22 nF (`capacitor_7` Q1 → Q2, `capacitor_8` Q2 → Q1), Q2's base resistor 47 kΩ (`resistor_9`) from +9 V. Q1's base is fed through 100 kΩ (`resistor_10`) from +9 V; **SIREN** (`button_11`) adds a second resistor in parallel, which the slide switch `slide_switch_12` picks: 47 kΩ (`resistor_13`, position 0) or 15 kΩ (`resistor_14`, position 1). Q3 (`npn_16`) is an emitter follower: base from Q2's collector through 10 kΩ (`resistor_15`), collector on +9 V, the magnetic earphone (`earphone_17`, 2 kΩ, 0.1 H) from emitter to ground with a 1N4148 (`diode_18`) across it. **SOFT** (`switch_19`, open as authored) connects 47 nF (`capacitor_20`) from Q3's base to ground.

## Observable behaviour
- SIREN up: a steady note of about 428 Hz.
- SIREN held, 47 kΩ picked: about 794 Hz (100 kΩ ∥ 47 kΩ = 32 kΩ). With 15 kΩ: about 1050 Hz (13 kΩ): shriller.
- Pressing SIREN on and off makes the two-note siren.
- SOFT closed: the pitch stays, but Q3's base now charges through 10 kΩ into 47 nF (0.47 ms), so the earphone current rises and falls along curves instead of jumping. Its peak drops from about 3.9 mA to about 2.7 mA and it spends most of each cycle between its extremes: a softer, rounder sound.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6a.test.mjs`: 428.0 Hz, 794.3 Hz, 1050.2 Hz. Earphone current sampled every 5 µs for 2.5 ms, share of samples between 10 % and 90 % of its swing: 0.078 with SOFT open, 0.574 with SOFT closed; peak 3.92 mA and 2.70 mA.

## What this verifies
1. Resistors in parallel conduct more than either alone: a shorter R · C and a higher note.
2. An RC low-pass in front of an emitter follower rounds a square wave: fewer sharp edges, a softer tone.

```assert
# t = 1 ms: Q2 on, so the follower's base is low and the earphone carries nothing
net npn_4.base V 0.69 +-0.03
net npn_4.collector V 0.09 +-0.03
net npn_16.emitter V 0.00 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@818e026` and `bw-circuit-ui@659431c` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **14 of this page's 37** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-npn-police-siren` prints them one by one.
<!-- engine-provenance -->
