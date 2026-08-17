# 01-blink — expected behaviour

## Circuit

VCC (5 V) → 1 kΩ resistor → red LED (Vf = 2.0 V) → MCU P1.0 (active-low).

## Program

Toggles P1.0 at 1 Hz: 500 ms on, 500 ms off, forever.

## Observable behaviour

| time (ms) | P1.0 level | LED state | LED current |
|---|---|---|---|
| 0 | low (0) | ON | (5.0 − 2.0) / 1000 = 3.0 mA |
| 500 | high (1) | OFF | 0 mA |
| 1000 | low (0) | ON | 3.0 mA |

- **Frequency:** 1 Hz (period = 1000 ms)
- **Duty cycle:** 50%
- **LED brightness:** 100% during on phase (no PWM dimming)
- **Voltage at LED anode (when on):** VCC − I×R = 5.0 − 3.0×10⁻³ × 1000 = 2.0 V
- **Voltage at P1.0 (when on):** 0 V (quasi-bidirectional pin sinking)

## What this verifies

1. Active-low wiring: `turn on led1` drives P1.0 LOW (= 0), not HIGH
2. Timer-based wait: 500 ms from Timer 0 at FOSC/12, not a cycle-counted loop
3. The LED is in the VCC→R→LED→pin path, not pin→LED→GND (which would need push-pull)

```assert
# MCU supply: VCC = 5.000V
net MCU.VCC V 5.00 +-0.01
```
