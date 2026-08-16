# pc81-led-lauflicht — expected behaviour

## Circuit
555 astable (R₁=1 kΩ, R₂=47 kΩ, C=10 µF) → CD4017 decade counter clock. 10 LEDs on q0–q9, each through 1 kΩ → GND.

## Observable behaviour
- **Frequency:** f = 1.44 / ((1k + 94k) × 10µ) = 1.44 / 0.95 ≈ 1.52 Hz.
- **Pattern:** one LED at a time, cycling q0→q1→...→q9→q0.
- **LED current (when active):** (5 − 2) / 1000 = 3 mA per LED.
- **Period:** ~660 ms per step. Full cycle (10 LEDs) ≈ 6.6 s.

## What this verifies
1. 555 astable clocking a CD4017 decade counter
2. One-hot sequential output pattern
3. Counter wraps from q9 back to q0
