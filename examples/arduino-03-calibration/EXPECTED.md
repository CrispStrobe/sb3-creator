# arduino-03-calibration — expected behaviour

## Circuit

Arduino Uno A0 <- wiper of 10 kohm pot. D9 → 220 ohm → green LED → GND. D13 → 220 ohm → red status LED → GND.

## Program

Phase 1 (5 s): status LED on D13 is ON while sensor min/max are recorded. Phase 2 (run): status LED OFF, readings mapped from calibrated range to a 0-100 percent PWM duty on green LED.

## Observable behaviour

- **First 5 seconds:** red status LED on D13 is **ON**. Move the pot through its range to calibrate.
- **After calibration:** status LED turns **OFF**. Green LED on D9 responds to pot:
  - At calibrated minimum -> LED OFF.
  - At calibrated maximum -> LED full brightness.
  - Between -> proportional brightness.

## What this verifies

1. Auto-calibration: recording min and max over a timed window
2. Constrained mapping: values below min clamp to 0, above max clamp to 100 percent
3. Status LED indicates calibration phase

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net pot1.wiper V 2.50 +-0.05
```
