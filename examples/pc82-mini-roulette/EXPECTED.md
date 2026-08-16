# pc82-mini-roulette — expected behaviour

## Circuit
555 astable (R₁=1 kΩ, R₂=10 kΩ, C=10 µF) + RC on control pin (100 kΩ, 100 µF). Button on reset. CD4017 → 10 LEDs through 1 kΩ each.

## Observable behaviour
- **Button pressed:** 555 runs, ~6.86 Hz initially. LEDs chase fast.
- **Button released:** RC on control pin charges → frequency drops → chase slows → stops.
- **RC slowdown:** τ = 100k × 100µ = 10 s. Chase visibly decays over several seconds.
- **Final position:** determined by release timing. Appears random.

## What this verifies
1. Control voltage modulates 555 frequency
2. RC decay produces gradual slowdown
3. CD4017 holds last active output when clock stops
