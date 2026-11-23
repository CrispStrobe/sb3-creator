---
level: intermediate
age: 12+
prereqs: [lab-touch-darlington]
teaches: [darlington, shunt-switching, inverting, touch-switch]
---
## What you see
A yellow LED glows as soon as you start the simulation. A Darlington pair sits right across it, and a touch button (with a resistor standing in for your finger) feeds the pair's base.

## Try this
1. Click **Sim**: the LED is on.
2. Press the touch button: the LED goes out at once.
3. Watch the supply current while you touch. Does it go down when the light goes off?

## What is going on
The transistors are not in series with the LED, they are in parallel with it. Untouched, they are off and the LED takes all the current from the 1 kΩ resistor. A touch lets a few microamps into the pair, it saturates and pulls the LED's top end below one volt — too little for the LED to conduct. The current now flows through the transistors instead, so the circuit keeps drawing power while the lamp is dark. That is the price of switching by shunting.

## Go further
- [lab-touch-darlington](../lab-touch-darlington) — the same pair switching a lamp on.
- [lab-shunt-gates](../lab-shunt-gates) — shunting with plain buttons to build logic gates.
