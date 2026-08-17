# pc47-555-monostable — expected behaviour

## Circuit

555 monostable (one-shot). Rt = 100 kΩ, Ct = 10 µF. Trigger via button
(normally held high by 10 kΩ pull-up). Output → 1 kΩ → LED.

## Observable behaviour

- **Idle:** output LOW, LED off. Trigger held high by pull-up.
- **Button press:** trigger pulled LOW (< VCC/3), output goes HIGH.
- **Pulse duration:** t = 1.1 × Rt × Ct = 1.1 × 100k × 10µ = **1.1 s**.
- **After pulse:** output returns LOW, LED off. Ignores trigger until
  timing cycle completes (non-retriggerable).

## Assertions

```assert
pulse_duration_ms: 1100 ± 15%
led_during_pulse: on
led_idle: off
audio_context: running
```

## What this verifies

1. Monostable timing: t = 1.1 × R × C
2. Non-retriggerable: trigger during pulse has no effect
3. Pull-up resistor sets idle state for trigger input
