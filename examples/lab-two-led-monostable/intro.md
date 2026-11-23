---
level: intermediate
age: 12+
prereqs: [pc06-rc-charge, pc40-opamp-threshold]
teaches: [monostable, comparator, rc-time-constant]
---
## What you see
A red and a green LED like a pedestrian light. Red is the resting state. Press the button and it turns green — for about eleven seconds — then goes back to red by itself.

## Try this
1. Click **Sim**. Red is on.
2. Press the button briefly and start counting.
3. Hold the button down for a few seconds. When does the counting really start?
4. Imagine a capacitor twice as big. How long would green last?

## What is going on
The button fills the capacitor to 9 V in an instant. The op-amp compares the capacitor voltage with a fixed 3 V: above it, the output is high and green lights; below it, the output is low and red lights through the other LED. The capacitor drains slowly through the 470 kΩ resistor, and the time until it crosses 3 V sets how long green lasts. Bigger resistor or bigger capacitor, longer green.

## Go further
- [pc47-555-monostable](../pc47-555-monostable) — the same job with a 555.
- [lab-delay-off-timer](../lab-delay-off-timer) — a timer without a comparator, which fades out.
