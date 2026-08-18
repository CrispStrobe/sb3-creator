# arduino-01-read-analog-voltage — expected behaviour

## Circuit

Arduino Uno A0 <- wiper of 10 kohm potentiometer. Pot ends: VCC (5 V) and GND.

## Program

Reads A0 as a 10-bit ADC value, converts to voltage via `sensorValue * (5.0 / 1023)`, and prints the voltage to serial every 100 ms.

## Observable behaviour

- **Serial monitor** prints a decimal voltage value per line, every ~100 ms.
- Pot fully CCW -> prints **0.00**.
- Pot at midpoint -> prints approximately **2.50**.
- Pot fully CW -> prints approximately **5.00**.

## What this verifies

1. ADC reading converted to real voltage using the 5 V / 1023 scale factor
2. Floating-point arithmetic in the voltage conversion expression works
3. `print voltage` outputs a decimal number to the serial monitor

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net pot1.wiper V 2.50 +-0.05
```
