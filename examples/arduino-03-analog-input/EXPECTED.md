# arduino-03-analog-input — expected behaviour

## Circuit

Arduino Uno A0 <- wiper of 10 kohm pot (VCC to GND). D13 → 220 ohm → red LED → GND.

## Program

Reads pot on A0 and uses the value to set the blink rate: both on-time and off-time equal `sensorValue / 1000` seconds.

## Observable behaviour

- **Pot fully CCW (~0):** LED blinks extremely fast — appears as constant dim glow.
- **Pot at midpoint (~512):** LED blinks with ~0.5 s on, ~0.5 s off — about 1 Hz.
- **Pot fully CW (~1023):** LED blinks with ~1 s on, ~1 s off — about 0.5 Hz.
- Turning the pot changes blink speed in real time.

## What this verifies

1. Analog reading controls timing: `wait (sensorValue / 1000) seconds`
2. Variable blink rate from potentiometer position
3. Division produces fractional seconds for the delay

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net pot1.wiper V 2.50 +-0.05
```
