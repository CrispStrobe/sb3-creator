---
level: beginner
age: 12+
prereqs: [pc08-diode-polarity]
teaches: [diode-clamp, voltage-limiting, signal-protection]
---
## What you see
A signal source drives a voltage through a pair of diodes that clamp it between ground and the supply rail. When the input swings beyond those limits, the diodes conduct and hold the output steady.

## Try this
1. Run the simulation and observe the output voltage on the probe — it stays within the clamped range even as the input swings widely.
2. Remove one of the clamp diodes and watch the output clip on only one side.
3. Change the input amplitude and confirm that the clamp voltage does not change.

## What is going on
Each diode turns on when the voltage across it exceeds about 0.7 V in the forward direction. One diode connects to ground and catches negative swings; the other connects to the supply and catches positive swings. Between those two thresholds the diodes are off and the signal passes unchanged. This creates a safe voltage window for whatever comes next in the circuit.

## Why it matters
Clamping protects sensitive inputs — microcontroller pins, op-amp inputs, measurement circuits — from voltages that would damage them. It is one of the simplest and most common protection techniques in electronics.

## Go further
- [pc08-diode-polarity](../pc08-diode-polarity) — understand how a diode conducts in one direction only.
- [pc61-diode-or](../pc61-diode-or) — diodes used for logic instead of protection.
- Experiment: add a series resistor before the clamp and measure how it limits the current through the diodes when they conduct.
