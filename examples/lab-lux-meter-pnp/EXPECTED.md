# lab-lux-meter-pnp — expected behaviour

## Circuit
- 9 V supply, two phototransistors with their own light sliders (both start at 0.1).
- PNP version: `phototransistor_3` pulls its current through 4.7 kΩ from +9 V at the base of `pnp_5`; the PNP's emitter has 4.7 kΩ to +9 V, its collector drives a 5 V meter (`analog_meter_7`, 1 mA movement).
- Follower version: `phototransistor_8` works into 4.7 kΩ to ground; an LM358 (`lm358_10`) follower passes that voltage to the second 5 V meter (`analog_meter_11`).

## Observable behaviour
- Both meters rise with the light by about 2.4 V per 0.1 of light.
- The follower starts at zero; the PNP stage only begins once the drop across its base resistor passes about 0.65 V (light above about 0.03).

## Measured on the engine
bw-board d4113b4b / bw-circuit-ui 0b594d6, `test/lab-circuits-r6i.test.mjs`, 2 ms after loading.

| light | PNP meter | follower meter |
|---|---|---|
| 0 | 0 V | 0.005 V |
| 0.02 | 0 V | 0.470 V |
| 0.05 | 0.52 V | 1.175 V |
| 0.1 | 1.745 V | 2.350 V |
| 0.2 | 4.195 V | 4.700 V |

## What this verifies
1. The phototransistor is a light-controlled current source: the follower's reading doubles when the light doubles, exactly in proportion.
2. The PNP stage copies the voltage across its base resistor, less one base-emitter drop, onto its emitter resistor: the same slope, shifted by the threshold.

```assert
# t = 1 ms, both lights at 0.1
net pnp_5.base V 6.666 +-0.03
net pnp_5.emitter V 7.343 +-0.03
net analog_meter_7.a V 1.745 +-0.05
net analog_meter_11.a V 2.350 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **21 of this page's 22** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-lux-meter-pnp` prints them one by one.
<!-- engine-provenance -->
