# arduino-sk-p06-light-theremin — expected behaviour

## Circuit

Arduino Uno A0 <- wiper of 10 kohm pot (simulating LDR). D8 → buzzer → GND.

## Program

Phase 1 (5 s): calibrates sensor range by recording min/max over 100 readings. Phase 2: maps sensor reading from calibrated range to buzzer frequency and plays the tone.

## Observable behaviour

- **First 5 seconds (calibration):** move the pot to set the sensor range. No sound yet.
- **After calibration:** buzzer pitch tracks the pot position:
  - Pot at calibrated minimum -> low pitch.
  - Pot at calibrated maximum -> high pitch.
  - Smooth pitch changes as pot is turned — like a theremin.

## What this verifies

1. Auto-calibration: recording min/max over a 5-second window
2. Sensor-to-frequency mapping within calibrated range
3. Continuous tone modulation on the buzzer

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net pot1.wiper V 2.50 +-0.05
```
