# lab-bias-drift — expected behaviour

## Circuit
- 9 V battery. One NPN with a 2.2 kΩ collector load; its emitter goes to ground through 1 kΩ (bypassed by 100 µF), which the second slide switch shorts in its first position.
- Base divider: 4.7 kΩ in series with a 100 kΩ bias pot (rheostat, authored at 0.51) on top, 4.7 kΩ to ground. The first slide switch hangs the top of the divider from 9 V (fixed bias) or from the collector (collector-to-base feedback).
- The transistor sits in its own surroundings (`surroundC`, the Temperature slider; it follows with a 1 s time constant).

## Observable behaviour
- Fixed bias, no emitter resistor, pot 0.51: at 25 °C the collector sits near 6.6 V; warmed to 70 °C (a hair dryer) its base–emitter voltage falls by about 90 mV, the current grows several times and the collector drops to about 2.3 V — almost saturated, so it would distort badly.
- Emitter resistor in (second switch over), pot 0.90: about 5.84 V at 25 °C, 5.66 V at 70 °C — a fifth of a volt.
- Collector-to-base feedback (first switch over), no emitter resistor, pot 0.70: about 6.08 V at 25 °C, 5.46 V at 70 °C.

## Measured on the engine
bw-board f4aaec43 (unchanged on b094eb22), `test/lab-circuits-r7b.test.mjs` (0.5 s at 25 °C, then 3 s at 70 °C): fixed 6.606 → 2.283 V; emitter resistor 5.838 → 5.655 V; collector feedback 6.085 → 5.459 V. At power-on (1 ms) with the authored settings: base 0.678 V, collector 6.66 V.

## What this verifies
1. A junction's forward voltage falls about 2 mV/K; a stiffly biased transistor turns that into an exponential rise in current.
2. Negative feedback — through an emitter resistor or from the collector to the base — holds the operating point.

```assert
# power-on, fixed bias, pot at 0.51, 25 °C
net npn_7.base V 0.678 +-0.02
net npn_7.collector V 6.66 +-0.15
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@e744ede` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **18 of this page's 33** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-bias-drift` prints them one by one.
<!-- engine-provenance -->
