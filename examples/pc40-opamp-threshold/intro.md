---
level: advanced
age: 14+
prereqs: [pc02-voltage-divider, pc37-selectable-reference]
teaches: [op-amp, comparator, threshold-detection]
---
## What you see
An op-amp comparing two voltages: a potentiometer sets one input, and a resistor divider sets the other at 2.5 V. When the pot crosses the threshold, the output flips and the LED responds.

## Try this
1. Click **Sim** with the pot at 50%. Both inputs are at 2.5 V, the output is near 0 V, and the LED is dark.
2. Turn the pot above 50%. The non-inverting input exceeds the reference, the output goes high, and the LED lights.
3. Turn it below 50%. The output goes low again.

## What is going on
An op-amp in open-loop mode acts as a comparator: it drives its output high when the non-inverting input (+) is above the inverting input (−), and low when it is below. The transition is sharp — even a few millivolts of difference saturates the output. Here the reference is fixed at 2.5 V by two equal resistors, and the pot sweeps the sensing input from 0 to 5 V.

## Why it matters
Threshold detection turns an analogue signal into a digital decision: is the temperature above the setpoint? Is the battery voltage too low? Is it light or dark? Op-amp comparators are the simplest way to make that call, and they are inside almost every control loop.

## Go further
- [pc48-ldr-comparator](../pc48-ldr-comparator) — a light sensor feeding a comparator.
- [pc41-zener-reference](../pc41-zener-reference) — a more stable voltage reference.
- Experiment: move the reference to 3.3 V by changing the divider resistors and predict at what pot position the LED will switch.
