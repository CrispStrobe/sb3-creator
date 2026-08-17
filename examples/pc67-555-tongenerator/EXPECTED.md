# pc67-555-tongenerator — expected behaviour

## Circuit
555 astable. R₁ = 1 kΩ, R₂ = 10 kΩ, C = 100 nF. Output → buzzer.

## Observable behaviour
- **Frequency:** f = 1.44 / ((1k + 2·10k) × 100n) = 1.44 / 0.0021 ≈ 686 Hz.
- **t_high:** 0.693 × (1k + 10k) × 100n = 0.762 ms.
- **t_low:** 0.693 × 10k × 100n = 0.693 ms.
- **Duty cycle:** 0.762 / (0.762 + 0.693) ≈ 52.4 % (slightly asymmetric).
- Buzzer produces a steady ~686 Hz tone.

## Assertions

```assert
buzzer_tone_hz: 685.7 ± 15%
duty_percent: 52.4 ± 5%
audio_context: running
```

## What this verifies
1. Audible frequency from 555 astable with small C
2. Asymmetric duty cycle: charge through R₁+R₂, discharge through R₂ only
3. Hand-computed frequency matches simulation
