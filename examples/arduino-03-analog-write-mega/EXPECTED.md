# arduino-03-analog-write-mega — expected behaviour

## Circuit

Arduino Mega D2, D3, D4 → 220 ohm resistors → red, green, blue LEDs → GND.

## Program

Fades three LEDs in sequence: each sweeps 0-255 brightness (steps of 5, every 30 ms), then back to 0, before the next starts.

## Observable behaviour

- **LED 1 (red, D2)** fades in over ~1.5 s, then fades out over ~1.5 s.
- **LED 2 (green, D3)** fades in and out next.
- **LED 3 (blue, D4)** fades in and out last.
- Cycle repeats: red -> green -> blue -> red -> ...
- Each full cycle is ~9 s total.

## What this verifies

1. PWM output on multiple Mega pins (D2, D3, D4)
2. Sequential fading using repeat loops
3. Arduino Mega device works as a target

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
