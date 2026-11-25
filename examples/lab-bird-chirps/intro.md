---
level: intermediate
age: 12+
prereqs: [lab-nand-pips, lab-opamp-blinker]
teaches: [schmitt-oscillator, integrator, gated-oscillator, triangle-wave, sound]
---
## What you see
An op-amp, two logic chips with Schmitt NAND gates, and a piezo. Three oscillators, one inside the next, make the twitter of a bird.

## What to do
1. Click **Sim** and listen: short chirps in pairs, then a pause, again and again.
2. Look at the op-amp's output voltage: it rises and falls slowly between about 1.8 V and 2.8 V.

## What is going on
The slowest oscillator is the op-amp wired as an integrator: its output ramps steadily up or down, and a Schmitt gate turns the ramp round each time it reaches one of the gate's two switching levels. That gives the phrases. During a phrase a second gate oscillator runs at about thirty cycles a second and switches the third one, the high voice, on and off: the chirps. When a gate oscillator's second input is low it stops, so each oscillator can start and stop the next.

## Go further
- [lab-nand-pips](../lab-nand-pips) — one gate oscillator switching another.
- [lab-tone-mux](../lab-tone-mux) — two tones taking turns on one line.
