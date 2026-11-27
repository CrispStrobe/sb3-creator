# lab-pll-jar-level — expected behaviour

## Circuit
- 9 V supply. A 4046 (`cd4046_3`) used for its VCO only: 100 kΩ, 2.2 nF, control input at half supply (10 kΩ / 10 kΩ): a 1.1 kHz square wave.
- The jar: 1 nF (empty) from the VCO output to the sense node, plus 2.2 nF for each level switch closed (`slide_switch_9`, `_11`, `_13`); 22 kΩ from the sense node to ground.
- LM358 (`lm358_16`): op-amp 1 with a 1N4148 in its feedback loop rectifies the pulses onto 10 kΩ; 10 kΩ / 220 nF average them; op-amp 2 amplifies the average ×4.6 against a 0.19 V offset (36 kΩ / 10 kΩ to a 10 kΩ / 220 Ω divider).
- CD4093 (`cd4093_25`): NAND 1 (inputs on the amplifier output) lights the green "half" LED; NAND 2 (through 10 kΩ / 47 kΩ) lights the red "full" LED and, while not full, turns on `npn_33`, which holds the LM386 beeper's 22 nF timing capacitor at ground.
- LM386 (`lm386_34`) relaxation beeper (1 MΩ / 1 MΩ, 220 kΩ / 22 nF) into a piezo through 220 Ω.

## Observable behaviour
- Level 1: both LEDs dark, silent.
- Level 2: green lit.
- Full: red lit too, and the piezo beeps at about 1.1 kHz.

## Measured on the engine
bw-board r9/engine-robust-20261125 / bw-circuit-ui e3441d2, `test/lab-circuits-r9.test.mjs` (40 ms after the switches).

| level | amplifier output | half | full | beeper |
|---|---|---|---|---|
| 1 | 3.26 V | dark | dark | silent |
| 2 | 5.57 V | lit | dark | silent |
| 3 | 7.28 V | lit | lit | 1092 Hz |

## What this verifies
1. The current a square wave pushes through a capacitor grows with its capacitance: a level sensor without contact.
2. A precision rectifier and Schmitt NAND thresholds turn it into a level bar and an alarm.

```assert
# t = 1 ms, empty
net cd4046_3.vco_in V 4.50 +-0.01
net resistor_23.b V 0.19 +-0.01
net npn_33.collector V 0.02 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **27 of this page's 31** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-pll-jar-level` prints them one by one.
<!-- engine-provenance -->
