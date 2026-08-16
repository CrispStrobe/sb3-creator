# arduino-05-for-loop — expected behaviour

## Circuit

Arduino Uno D2-D7 → 220 ohm resistors → six red LEDs → GND.

## Program

Lights LEDs in sequence from D2 to D7 (left to right), then reverses from D7 to D2 (right to left). Each LED is on for 100 ms. Repeats forever.

## Observable behaviour

- A single lit LED walks from left (D2) to right (D7), then back from right to left.
- Each step takes 100 ms, full sweep takes ~1.2 s.
- Classic "Knight Rider" / Larson scanner pattern.
- Only one LED is on at a time.

## What this verifies

1. Sequential LED control simulating a for-loop iteration
2. Forward and reverse sweep across six pins
3. Each LED turns off before the next turns on
