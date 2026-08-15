---
level: beginner
age: 8+
prereqs: []
teaches: [ohms-law, led-basics, current-limiting]
---
## What you see
The simplest possible circuit: a battery (VCC), a resistor, and an LED connected in series to ground. The LED glows steadily. No microcontroller, no code — just components and current.

## Try this
1. Run the simulation and observe the LED glowing.
2. Increase the resistor value and watch the LED dim as less current flows.
3. Remove the resistor entirely and observe what happens — in a real circuit, the LED would burn out.

## What is going on
Current flows from VCC through the resistor and LED to ground. The resistor limits how much current reaches the LED — without it, the full supply voltage would drive too much current and destroy the LED. The amount of current is determined by Ohm's law: I = V / R. A typical LED needs about 10-20 mA and drops around 2 V, so the resistor must absorb the remaining voltage. For a 5 V supply and a 2 V LED drop, a 150 ohm resistor gives about 20 mA — right at the LED's sweet spot.

## Why it matters
Every LED circuit you will ever build contains this pattern. The current-limiting resistor is not optional — it is what keeps the LED alive. Understanding Ohm's law and voltage drops is the foundation of all circuit design, from a single LED to a power supply.

## Go further
- [22-series-parallel](../22-series-parallel) — see what happens when you combine resistors in different ways.
- [01-blink](../01-blink) — add a microcontroller to switch this circuit on and off.
- Experiment: calculate the resistor needed for a 3.3 V supply with a red LED (2 V drop, 15 mA target) and verify in the simulation.
