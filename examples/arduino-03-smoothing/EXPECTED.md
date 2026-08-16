# arduino-03-smoothing — expected behaviour

## Circuit

Arduino Uno A0 <- wiper of 10 kohm pot (VCC to GND). No LEDs — serial output only.

## Program

Maintains a running average of the last 10 ADC readings from A0. Prints the smoothed average to serial every 10 ms.

## Observable behaviour

- **Serial monitor** prints one number per line — the rolling average of the last 10 readings.
- **Pot stationary:** output is stable, close to the true ADC value.
- **Pot moved quickly:** output ramps smoothly toward the new position over ~100 ms (10 readings x 10 ms).

## What this verifies

1. Circular buffer using a Scratch list with `replace item` and `item of`
2. Running average: `total / numReadings` produces a smooth output
3. Index wrapping: `if readIndex >= numReadings then: set readIndex to 0`
