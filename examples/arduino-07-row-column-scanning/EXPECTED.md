# arduino-07-row-column-scanning — expected behaviour

## Circuit

Arduino Uno A0, A1 <- wipers of two 10 kohm pots (VCC to GND). No LEDs — serial output only.

## Program

Reads two pots and maps each to a 0-7 coordinate. Prints the X and Y values to serial every 100 ms.

## Observable behaviour

- **Serial monitor** prints two values per cycle: X coordinate then Y coordinate.
- **Pot X fully CCW:** X = **0**. Fully CW: X = **7**.
- **Pot Y fully CCW:** Y = **0**. Fully CW: Y = **7**.
- Demonstrates the concept of row-column scanning with analog inputs.

## What this verifies

1. Dual analog mapping: `(read potX * 7) / 1023` scales to 0-7 range
2. Two-axis coordinate output simulating a matrix position
3. Simplified from physical LED matrix — concept demonstration via serial
