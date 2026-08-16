# pc74-ldr-555-blinker — expected behaviour

## Circuit
555 astable. R₁ = 1 kΩ, R₂ = LDR (1 kΩ–100 kΩ), C = 10 µF. Output → 1 kΩ → red LED → GND.

## Observable behaviour
- **Bright (LDR ≈ 1 kΩ):** f = 1.44 / ((1k + 2k) × 10µ) = 48 Hz — fast blink (appears steady).
- **Medium (LDR ≈ 10 kΩ):** f = 1.44 / ((1k + 20k) × 10µ) ≈ 6.86 Hz.
- **Dark (LDR ≈ 100 kΩ):** f = 1.44 / ((1k + 200k) × 10µ) ≈ 0.72 Hz — slow blink (~1.4 s period).
- LED blink rate tracks light level continuously.

## What this verifies
1. LDR replaces fixed R₂ in astable timing
2. Frequency changes ~100× across LDR range
3. Combines analog light sensing with 555 oscillator
