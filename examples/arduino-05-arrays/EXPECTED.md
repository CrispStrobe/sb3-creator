# arduino-05-arrays — expected behaviour

## Circuit

Arduino Uno D2-D7 → 220 ohm resistors → six red LEDs → GND.

## Program

Lights LEDs in a pattern: cycles through the six LEDs (D2, D7, D4, D5, D3, D6), turning each on for 100 ms then off. The order is not sequential — it jumps across the row.

## Observable behaviour

- LEDs light one at a time in a non-sequential pattern across the six pins.
- Each LED is on for 100 ms, then off before the next lights.
- The pattern repeats continuously, creating a bouncing light effect.
- Six LEDs total, all red, one lit at any moment.

## What this verifies

1. Multiple digital outputs on D2-D7
2. Non-sequential LED addressing (simulates array-based indexing)
3. Timed pattern with `wait 0.1 seconds` between transitions

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
