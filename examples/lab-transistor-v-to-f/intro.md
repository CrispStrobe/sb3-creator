---
level: advanced
age: 14+
prereqs: [lab-v-to-f, lab-diff-pair]
teaches: [voltage-to-frequency, integrator, schmitt-trigger, reset-transistor]
---
## What you see
A knob (INPUT), an op-amp integrator, a trigger built from two transistors, a reset transistor and a piezo. The piezo's pitch follows the knob.

## What to do
1. Click **Sim**. The piezo ticks at about 72 times a second.
2. Turn **INPUT** towards ground: the pitch rises. Turn it towards the top: it falls.
3. Watch the integrator's output voltage: it climbs and drops back again and again, between about 5.05 V and 6.42 V.

## What is going on
The integrator's output ramps up at a speed proportional to the input voltage (how far the wiper sits below 4.5 V). Two transistors with a shared emitter resistor form a Schmitt trigger: when the ramp reaches its upper threshold, the second transistor switches off, and its rising collector turns on a third transistor that empties the integrator's capacitor in an instant. Then the next ramp starts. Twice the input means ramps twice as steep, so twice as many per second: a voltage-to-frequency converter.

## Go further
- [lab-v-to-f](../lab-v-to-f) — the same converter with an op-amp trigger.
- [lab-diff-pair](../lab-diff-pair) — two transistors sharing an emitter resistor.
