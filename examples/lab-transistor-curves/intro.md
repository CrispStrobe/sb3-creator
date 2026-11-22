---
level: advanced
age: 14+
prereqs: [lab-base-current]
teaches: [characteristic-curves, beta, saturation, operating-point]
---
## What you see
A transistor measured like in a lab: an adjustable supply on the collector, meters for base current, collector current and collector–emitter voltage. A potentiometer sets the base current.

## Try this
1. Click **Sim** and note base current, collector current and V_CE.
2. Change the collector supply to 2 V, then 8 V. The collector current hardly moves.
3. Lower the collector supply to 0.6 V. Now the current drops — the transistor is saturated.
4. Pick another base current with the potentiometer and repeat. Draw each set of points on paper: you get the family of curves from a datasheet.

## What is going on
In the active region the collector behaves like a current source set by the base current: I_C = beta × I_B, whatever the voltage. Only when V_CE gets very small does the transistor run out of room and the current falls. Draw a load line for a collector resistor across your curves and you can read off where a real amplifier stage will sit.

## Go further
- [lab-base-current](../lab-base-current) — beta with an LED.
- [lab-ce-vs-follower](../lab-ce-vs-follower) — the operating point in a real stage.
