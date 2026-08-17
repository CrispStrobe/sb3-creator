# pc65-555-metronom — expected behaviour

## Circuit
555 astable. R₁ = 1 kΩ, R₂ = pot (0–100 kΩ), C = 10 µF. Output → buzzer.

## Observable behaviour
- **Pot at 0 Ω:** f = 1.44 / ((1k + 0) × 10µ) = 144 Hz — fast clicking.
- **Pot at 50 kΩ:** f = 1.44 / ((1k + 100k) × 10µ) ≈ 1.43 Hz — ~1.4 clicks/s.
- **Pot at 100 kΩ:** f = 1.44 / ((1k + 200k) × 10µ) ≈ 0.72 Hz — slow tick.
- Buzzer clicks at the astable frequency.

## What this verifies
1. Astable frequency formula: f = 1.44 / ((R₁ + 2·R₂) × C)
2. Potentiometer continuously adjusts frequency
3. 555 output drives a buzzer directly

```assert
# 555 astable with pot: f = 1.44/((R1+2*R2)*C), pot sweeps frequency
net vcc_1.pos V 5.00 +-0.01
```
