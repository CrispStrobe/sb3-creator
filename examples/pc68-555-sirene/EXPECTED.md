# pc68-555-sirene — expected behaviour

## Circuit
555 astable. R₁ = 1 kΩ, R₂ = pot (0–47 kΩ), C = 100 nF. Output → 100 Ω → buzzer.

## Observable behaviour
- **Pot at 0:** f = 1.44 / ((1k + 0) × 100n) = 14,400 Hz — high pitch (may be above buzzer range).
- **Pot at 20 kΩ:** f = 1.44 / ((1k + 40k) × 100n) ≈ 351 Hz.
- **Pot at 47 kΩ:** f = 1.44 / ((1k + 94k) × 100n) ≈ 152 Hz — low tone.
- Turning the pot sweeps the pitch continuously — a manual siren.

## What this verifies
1. Variable-frequency astable via potentiometer
2. Pitch range from ~150 Hz to several kHz
3. 100 Ω series resistor limits buzzer current
