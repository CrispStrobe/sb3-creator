# arduino-03-fading — expected behaviour

## Circuit

Arduino Uno D9 (PWM) → 220 ohm → blue LED → GND. VCC = 5 V.

## Program

Sweeps PWM from 0 to 255 in steps of 5 every 30 ms, then back from 255 to 0. Repeats forever.

## Observable behaviour

- **Blue LED fades in** from off to full brightness over ~1.56 s (52 steps x 30 ms).
- **Blue LED fades out** from full brightness to off over ~1.56 s.
- Full breathing cycle is approximately **3.1 s**.
- The effect is smooth and continuous.

## What this verifies

1. PWM fade on D9 with explicit `repeat` loops
2. `set pwm led to fadeValue` maps 0-255 to visible brightness
3. Symmetric fade-in and fade-out timing
