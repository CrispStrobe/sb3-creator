# arduino-01-fade — expected behaviour

## Circuit

Arduino Uno D9 (PWM) → 220 ohm resistor → green LED → GND. VCC = 5 V.

## Program

Sweeps PWM duty on D9 from 0 to 100 percent in steps of 2 every 30 ms, then reverses. Continuous breathing effect.

## Observable behaviour

- **LED fades in** from off to full brightness over ~1.5 s (51 steps x 30 ms).
- **LED fades out** from full brightness to off over ~1.5 s.
- Full cycle (in + out) takes approximately **3 s**.
- The brightness change is linear in PWM duty, perceived as a smooth fade.

| PWM value | LED brightness | approximate current |
|---|---|---|
| 0 | OFF | 0 mA |
| 128 | ~50 % | ~6.8 mA average |
| 255 | 100 % | ~13.6 mA |

## What this verifies

1. `set pwm led to brightness` writes an 8-bit PWM value to D9
2. PWM duty maps to visible LED brightness
3. Variable arithmetic (direction reversal at bounds) works correctly

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
