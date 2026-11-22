---
level: advanced
age: 14+
prereqs: [pc70-schmitt-trigger, pc54-opamp-follower]
teaches: [integrator, schmitt-trigger, hysteresis, oscillator]
---
## What you see
Two LEDs: the red one blinks hard on and off, the yellow one breathes smoothly up and down — at the same rhythm. They show a square wave and a triangle wave from one circuit.

## Try this
1. Click **Sim** and watch both LEDs.
2. Put scope probes on both op-amp outputs. Where does the triangle turn round?
3. Turn the potentiometer. Both waves get faster or slower together.

## What is going on
The first op-amp is an integrator: while its input is low the output climbs steadily, while it is high the output falls. The second op-amp is a Schmitt trigger: it flips only when the triangle reaches an upper or a lower limit, and its output is what drives the integrator. So the triangle climbs until the trigger flips, then falls until it flips back — forever. Every function generator in a lab starts from this pair.

## Go further
- [pc84-led-herz](../pc84-led-herz) — LEDs driven by the same kind of circuit.
- [lab-v-to-f](../lab-v-to-f) — the same pair as a voltage-to-frequency converter.
