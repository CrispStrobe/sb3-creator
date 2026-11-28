# lab-ptc-window-blink — expected behaviour

## Circuit
- 9 V supply. 6.8 kΩ from +9 V over a PTC sensor (`ptc_sensor_4`, silicon, thermal time constant 50 ms) gives about 2.05 V at 25 °C.
- LM324 (`lm324_5`): op-amp 1 amplifies it ×3 (20 kΩ / 10 kΩ). The limits come from 30 kΩ, 4.3 kΩ and 68 kΩ in series from +9 V: 6.36 V (upper, op-amp 3's + input) and 5.98 V (lower, op-amp 2's − input). Op-amp 2 is high above the lower limit, op-amp 3 below the upper one.
- CD4093 (`cd4093_11`): NAND 1 of the two comparator outputs is low only inside the window; NAND 2 inverts it. Its output lights the green LED through 1 kΩ and, through 10 kΩ, turns on `npn_15`, which holds the LM386 blinker's 2.2 µF timing capacitor at ground.
- LM386 (`lm386_16`) relaxation blinker: 1 MΩ / 1 MΩ positive feedback, 220 kΩ / 2.2 µF timing. Its output drives a PNP (`pnp_23`, 10 kΩ base resistor, 10 kΩ base-emitter) whose collector lights the red LED through 1 kΩ.

## Observable behaviour
- 25 °C (inside the window): green lit, red dark and steady.
- 15 °C or 35 °C (outside): green dark; the red LED flashes about twelve times a second.

## Measured on the engine
bw-board r9/engine-robust-20261125 / bw-circuit-ui e3441d2, `test/lab-circuits-r9.test.mjs`.

| surroundings | amplified sensor | green | red |
|---|---|---|---|
| 25 °C | 6.17 V | lit (0.33) | dark, no change in 300 ms |
| 15 °C | 5.79 V | dark | 10 changes in 400 ms |
| 35 °C | above 6.36 V | dark | 10 changes in 400 ms |

## What this verifies
1. A window comparator: two op-amp comparators against a lower and an upper limit.
2. Two Schmitt NAND gates combine the conditions and enable the blinker only outside the window.

```assert
# t = 1 ms, 25 C
net ptc_sensor_4.a V 2.05 +-0.03
net lm324_5.1_out V 6.14 +-0.05
net lm324_5.3_pos V 6.36 +-0.02
net lm324_5.2_neg V 5.98 +-0.02
net npn_15.collector V 0.02 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **24 of this page's 36** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ptc-window-blink` prints them one by one.
<!-- engine-provenance -->
