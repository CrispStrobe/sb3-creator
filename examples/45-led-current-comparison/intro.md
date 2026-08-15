---
level: beginner
age: 8+
prereqs: []
teaches: [current-comparison, ohms-law, brightness]
---
## What you see
Three LEDs side by side, each with a different resistor value. The LED with the smallest resistor glows brightest, the one with the largest resistor glows dimmest. Same supply voltage, same LEDs — only the resistors differ, and the brightness tells you which carries more current.

## Try this
1. Run the simulation and compare the brightness of the three LEDs.
2. Check the current through each LED — the one with the smallest resistor carries the most.
3. Swap two resistor values and predict which LED will now be brightest before running the simulation.

## What is going on
Each LED circuit is a series loop: supply, resistor, LED, ground. The resistor sets the current according to Ohm's law: I = (VCC - Vled) / R. A smaller resistance means more current and a brighter LED. The LED voltage drop is roughly constant (about 2 V for red), so the resistor absorbs the remaining voltage. This is a direct, visual demonstration that resistance controls current, and current controls brightness.

## Why it matters
Choosing the right resistor for an LED is one of the first real calculations any electronics builder makes. This example builds intuition for Ohm's law without a formula — you see the result directly.

## Go further
- [21-resistor-led](../21-resistor-led) — study the single-LED version in detail, including what happens without a resistor.
- [34-ohms-law](../34-ohms-law) — explore the relationship between voltage, current, and resistance more formally.
- Experiment: calculate the exact current for each LED using Ohm's law and compare your numbers with the simulation's readings.
