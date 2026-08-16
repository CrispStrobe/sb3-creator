# pc86-led-sanduhr — expected behaviour

## Circuit
555 astable (R₁=10 kΩ, R₂=68 kΩ, C=10 µF) → f ≈ 0.99 Hz. CD4017 q0–q5 → 6 yellow LEDs through 1 kΩ. q6 → reset (6-count wrap). Tilt sensor on counter reset via pull-down.

## Observable behaviour
- **Running:** LEDs fill one per second: q0 → q1 → ... → q5.
- **After 6 s:** all 6 LEDs lit. Counter wraps, starts over.
- **Tilt sensor activated:** all LEDs clear instantly (counter reset). Filling restarts.
- **LED current:** 3 mA each when active.

## What this verifies
1. Accumulating fill pattern (each output stays HIGH as the next lights)
2. Tilt sensor as physical reset trigger
3. 555 ~1 Hz clock for "sand grain" timing
