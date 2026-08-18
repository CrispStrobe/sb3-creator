# arduino-05-switch-case-2 — expected behaviour

## Circuit

Arduino Uno D2-D6 → 220 ohm resistors → five red LEDs → GND. Also a sixth LED on D7.

## Program

Cycles through five LED patterns: each LED turns on for 500 ms, then off, in sequence from D2 to D6. Repeats forever.

## Observable behaviour

- LEDs light one at a time: D2 → D3 → D4 → D5 → D6, each for 500 ms.
- After D6, the cycle restarts at D2.
- Each LED is on alone — the others are off.
- Full cycle takes ~2.5 s (5 LEDs x 500 ms).

## What this verifies

1. Sequential LED cycling simulating switch/case with multiple outputs
2. Each case activates one LED and deactivates the rest
3. Adapted from serial-input original — cycles automatically instead

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
