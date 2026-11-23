# pc67-555-tongenerator — expected behaviour

## Circuit
555 astable. R₁ = 1 kΩ, R₂ = 10 kΩ, C = 100 nF. Output → buzzer.
CONTROL (pin 5) is decoupled to GND through 10 nF, so it sits at 2/3·VCC and the
thresholds stay at 1/3 and 2/3 of the supply. (Tied straight to GND it would pull
the upper threshold to 0 V and the 555 would never oscillate.)

## Observable behaviour
- **Frequency:** f = 1.44 / ((1k + 2·10k) × 100n) = 1.44 / 0.0021 ≈ 686 Hz.
- **t_high:** 0.693 × (1k + 10k) × 100n = 0.762 ms.
- **t_low:** 0.693 × 10k × 100n = 0.693 ms.
- **Duty cycle:** 0.762 / (0.762 + 0.693) ≈ 52.4 % (slightly asymmetric).
- Buzzer produces a steady ~686 Hz tone.
- **Simulated:** the engine runs it at about 680 Hz with the output high 52.8 % of
  the time; the capacitor swings between 1.67 V and 3.33 V.

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
