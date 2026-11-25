# lab-npn-and-gate — expected behaviour

## Circuit
9 V. Red LED (`led_12`) with 1 kΩ (`resistor_11`) from +9 V into the collector of `npn_9`; `npn_9`'s emitter into `npn_10`'s collector; `npn_10`'s emitter to ground. Button **A** (`button_3`) feeds `npn_9`'s base through 10 kΩ (`resistor_4`), button **B** (`button_6`) feeds `npn_10`'s base through 10 kΩ (`resistor_7`); 100 kΩ (`resistor_5`, `resistor_8`) holds each base low when its button is up.

## Observable behaviour
| A | B | LED |
|---|---|---|
| up | up | dark |
| down | up | dark |
| up | down | dark |
| down | down | lit, about 7.1 mA |

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6a.test.mjs`: 7.15 mA with both pressed; no measurable current in the other three combinations.

## What this verifies
1. Two switches in series make AND: current flows only if every one of them conducts.
2. A transistor is such a switch, worked by a small base current.

```assert
# t = 1 ms, no button pressed: no current, the LED dark
net vsource_2.pos V 9.00 +-0.01
net npn_9.base V 0.00 +-0.01
net npn_9.emitter V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f4aaec4` and `bw-circuit-ui@141b2cc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **6 of this page's 8** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-npn-and-gate` prints them one by one.
<!-- engine-provenance -->
