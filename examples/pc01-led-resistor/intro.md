---
level: beginner
age: 8+
prereqs: []
teaches: [led, resistor, current-limiting]
---
## What you see
A red LED lights up, powered by a 5 V supply through a 220 Ω resistor. The resistor limits the current so the LED glows without burning out.

## Try this
1. Click **Sim** to start the simulation and watch the LED turn on.
2. Look at the voltage across the LED — it settles near 2 V, not 5 V.
3. Change the resistor to 1 kΩ and notice how the LED gets dimmer.

## What is going on
An LED needs a certain voltage to turn on (around 2 V for red). The rest of the supply voltage drops across the resistor. The current through the circuit is roughly (5 V − 2 V) / 220 Ω ≈ 13 mA. Without the resistor the current would be far too high and the LED would burn out almost instantly.

## Why it matters
Every LED circuit you will ever build needs a current-limiting resistor. Forgetting it is the number-one beginner mistake, and it destroys the LED in milliseconds.

## Go further
- [pc03-series-resistors](../pc03-series-resistors) — add a second resistor in series and see the current drop.
- [pc09-direct-led](../pc09-direct-led) — the same circuit without a breadboard.
- Experiment: swap the red LED for one with a different Vf and predict the new current before you simulate.
