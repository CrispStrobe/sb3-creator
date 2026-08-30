# pc20-rgb-mix — colour mixing with three LEDs

## Circuit
Three parallel branches off one 5 V supply: 330 Ω + red, 330 Ω + green,
470 Ω + blue. Three **discrete** LEDs sitting side by side — not a
single-package RGB LED (see the note at the end).

## Expected (measured, `audit-solve pc20-rgb-mix`)

| branch | LED anode | current | brightness |
|---|---|---|---|
| 330 Ω, red | 2.0882 V | **8.82 mA** | **0.4412** |
| 330 Ω, green | 2.0882 V | **8.82 mA** | **0.4412** |
| 470 Ω, blue | 2.0625 V | **6.25 mA** | **0.3125** |

Supply total: 23.9 mA. No DRC warnings.

Red and green are matched to the last decimal — identical resistor, identical
LED model, and parallel branches that never interact. Blue is deliberately run
about 30 % lower: it is the channel a real builder pulls back, because blue and
white LEDs read as brighter to the eye at the same current.

The ideal-drop estimate (5.0 − 2.0) / 330 = 9.1 mA is 3 % high; the LED's real
drop at 9 mA is 2.088 V.

## Note — discrete vs. composite

This circuit uses three discrete LEDs, not a single `rgb_led` composite part.
The engine now expands `rgb_led` into `<id>_r` / `_g` / `_b` sub-LEDs with
real diode drops, so a composite version would also work — but the three-branch
layout is the cleaner teaching circuit because each path is visible and
independent.

```assert
# Three parallel LED branches: 330R/330R/470R from 5V
net vsource_1.pos V 5.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@6571648` and `bw-circuit-ui@14efc75` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **12 of this page's 19** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc20-rgb-mix` prints them one by one.
<!-- engine-provenance -->
