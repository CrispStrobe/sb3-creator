# lab-npn-fade — expected behaviour

## Circuit
9 V. **UP** (`button_3`) charges the timing capacitor through 10 kΩ (`resistor_4`); **DOWN** (`button_5`) empties it through 10 kΩ (`resistor_6`). The **FAST** slide switch (`slide_switch_7`) picks 470 µF (`polarized_cap_8`, position 0) or 100 µF (`polarized_cap_9`, position 1). `npn_10` is an emitter follower from the capacitor: emitter → 1 kΩ (`resistor_11`) → red LED (`led_12`). `npn_13` gets the capacitor's voltage through 100 kΩ (`resistor_14`) and sits as a shunt across the green LED (`led_16`), which is fed from +9 V through 2.2 kΩ (`resistor_15`).

## Observable behaviour
- Start: capacitor empty; green about 3.2 mA, red dark.
- Hold UP: the capacitor charges, green fades out (gone once the capacitor passes approximately 3.8 V) while red fades in (from approximately 2.5 V).
- Release: the level stays, sinking slowly as the two bases draw on it.
- Hold DOWN: the reverse.
- FAST: the same crossfade about 4.7 times quicker.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6a.test.mjs`. The rows are one run, each stepped from the one before (470 µF unless stated):

| moment | capacitor | red | green |
|---|---|---|---|
| start | 0 V | 0 | 3.21 mA |
| UP held 2 s | 3.07 V | 0.84 mA | 0.85 mA |
| UP held 4 s | 4.9 V | 2.63 mA | 0 |
| released 2 s | 4.66 V | | |
| DOWN held 3 s | | 0.15 mA | 1.61 mA |
| new run, 100 µF, UP held 1 s | 5.40 V | 3.08 mA | |

## What this verifies
1. An RC charge is slow and smooth; an emitter follower makes a capacitor's voltage visible without emptying it quickly.
2. A transistor across an LED steals its current: the second transistor inverts the fade.
3. A smaller capacitor changes faster.

```assert
# t = 1 ms: capacitor empty, green fully lit, red dark
net npn_10.base V 0.00 +-0.01
net npn_10.emitter V 0.00 +-0.01
net npn_13.collector V 1.95 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2965782` and `bw-circuit-ui@e3441d2` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 31** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-npn-fade` prints them one by one.
<!-- engine-provenance -->
