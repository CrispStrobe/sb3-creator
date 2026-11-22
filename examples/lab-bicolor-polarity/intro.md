---
level: beginner
age: 10+
prereqs: [28-diode-polarity]
teaches: [led-polarity, anti-parallel, polarity-tester]
---
## What you see
A red and a green LED wired back to back behind one resistor, between two test leads. A relay swaps the battery's connections to the leads whenever you hold the button.

## Try this
1. Click **Sim**: the red LED lights — lead A is plus.
2. Hold the **swap leads** button: the relay clicks over and now the green LED lights.
3. Release it and the red one returns.
4. Replace the battery and relay with a function generator at 1 Hz: the colours take turns. At 50 Hz both seem to glow at once.

## What is going on
An LED is a diode: current passes from anode to cathode and not the other way. The two LEDs point in opposite directions, so whichever lead is positive, exactly one of them has a path. The colour therefore tells you the polarity. The dark LED is never in danger: it only sees the small forward voltage of its lit partner in reverse.

## Go further
- [28-diode-polarity](../28-diode-polarity) — a single diode forward and reversed.
