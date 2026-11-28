# lab-transistor-phase-shift — expected behaviour

## Circuit
- 9 V supply. One NPN (current gain 250, exponential junctions): 4.7 kΩ collector resistor, 470 kΩ from collector to base for its bias, emitter on ground.
- From the collector back to the base: three RC sections, 10 nF / 10 kΩ, 10 nF / 10 kΩ, 10 nF into the base (the third resistor is the base's own input resistance in parallel with the bias).
- A crystal earphone on the collector through 100 nF; the oscilloscope shows collector and base.

## Observable behaviour
- A tone of about 670 Hz, on its own.

## Measured on the engine
`test/lab-circuits-r6e.test.mjs`, 20 ms after switch-on: 670 Hz ±30 from the collector's crossings over 6 ms, the collector swinging about 7.8 V.

## What this verifies
1. Each RC section shifts the phase; three of them reach 180° at one frequency, and there the transistor's own inversion closes the loop in phase.
2. The ladder loses signal (about 1/29 for equal sections), so the transistor must amplify more than that: one transistor with a high current gain is enough.

## Simulation notes
The textbook estimate with the collector resistor loading the ladder, f = 1/(2π·R·C·√(6 + 4·Rc/R)), gives 566 Hz; the measured frequency is higher because the third "resistor" is the base's input resistance, lower than 10 kΩ. The oscillation grows until it clips.

```assert
# 1 ms after switch-on: the base already near one diode drop
net npn_3.base V 0.665 +-0.03
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **10 of this page's 16** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-transistor-phase-shift` prints them one by one.
<!-- engine-provenance -->
