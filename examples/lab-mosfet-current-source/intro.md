---
level: intermediate
age: 14+
prereqs: [21-resistor-led]
teaches: [mosfet, depletion-mode, constant-current-source]
---
## What you see
A battery, two LEDs and a MOSFET in one loop, and not a single resistor. Both gates of the MOSFET are wired straight to its source.

## Try this
1. Click **Sim**. Both LEDs light, although the gates get no voltage at all.
2. Compare the two LEDs. Is the one above the transistor brighter than the one below?
3. Turn the battery voltage up to 12 V. An LED without a resistor would burn out. What happens here?
4. Turn it down slowly. At what voltage do the LEDs go dark?

## What is going on
This MOSFET is a depletion type: its channel conducts as soon as there is any voltage across it, even with the gate at the source. But the channel only lets a certain current through, here a few milliamps. Raise the battery voltage and the transistor simply takes the extra voltage across itself, while the current barely changes. That is a constant-current source, and it is exactly what an LED needs. The same current flows everywhere in a single loop, so it makes no difference whether an LED sits on the drain side or on the source side.

## Go further
- [lab-mosfet-vcr](../lab-mosfet-vcr) — what happens when the gate is not at the source.
