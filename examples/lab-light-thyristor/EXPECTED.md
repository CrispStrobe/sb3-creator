# lab-light-thyristor — expected behaviour

## Circuit
- 9 V supply. A main slide switch (`slide_switch_3`, on as built) feeds 1 kΩ and a red LED (`led_5`) into the anode of a two-transistor thyristor: a PNP (`pnp_6`) and an NPN (`npn_7`) wired into a loop, 22 kΩ from anode to the PNP base and 2.2 kΩ from gate to cathode.
- The gate is driven by a phototransistor (`phototransistor_10`, collector on +9 V) through 10 kΩ. It starts in the dark (light 0).

## Observable behaviour
- Dark: both transistors off, the LED dark.
- A little light (0.05) is not enough to fire it.
- A flash of light (0.3 for 2 ms) fires it: the LED latches on at 6.5 mA and stays on in the dark.
- Only switching the main switch off and on again turns it off.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`.

| state | LED current |
|---|---|
| dark | 0 mA |
| light 0.05 | 0.00006 mA |
| after a flash, dark again | 6.53 mA |
| main switch off and on | 0 mA |

## What this verifies
1. Two complementary transistors in a loop make a four-layer latch: each keeps the other on.
2. The gate only switches it on. Light on a phototransistor is a gate signal like any other: a light-triggered thyristor.

## Simulation notes
The phototransistor's light is the learner's slider (0..1, rated 5 mA at full light). With 2.2 kΩ from gate to cathode, the gate needs about 0.3 mA before the NPN starts, so dim room light does not fire it.

```assert
# t = 1 ms, dark: not fired
net pnp_6.emitter V 9.00 +-0.01
net npn_7.base V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b094eb2` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **9 of this page's 15** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-light-thyristor` prints them one by one.
<!-- engine-provenance -->
