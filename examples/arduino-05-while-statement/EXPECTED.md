# arduino-05-while-statement — expected behaviour

## Circuit

Arduino Uno D2 <- button with 10 kohm pull-down. A0 <- LDR with 10 kohm pull-down. D9 → 220 ohm → green LED → GND. D13 → 220 ohm → red status LED → GND.

## Program

While button is held: calibrates LDR (records min/max) with status LED on. When released: maps LDR reading from calibrated range to LED brightness on D9.

## Observable behaviour

- **Button not pressed:** green LED brightness responds to light level (mapped through last calibration). Status LED OFF.
- **Button held:** red status LED on D13 is **ON**. Move a light source to calibrate the LDR range.
- **After releasing:** green LED brightness tracks light level proportionally within the calibrated range.

## What this verifies

1. While-loop calibration: `repeat until not read btn` runs calibration as long as button is held
2. Dynamic min/max tracking during calibration window
3. Mapped PWM output from calibrated sensor range

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
