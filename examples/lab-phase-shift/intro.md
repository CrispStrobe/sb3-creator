---
level: advanced
age: 15+
prereqs: [lab-opamp-gain, pc50-two-stage-rc]
teaches: [phase-shift-oscillator, barkhausen-criterion, RC-phase, sine-oscillator, feedback]
---
## What you see
An amplifier that turns its signal upside down, fed back to itself through three resistor-capacitor pairs. Turn the GAIN knob past a certain point and it starts to sing a steady tone of about 650 Hz; below that point it stays quiet.

## Try this
1. Start the simulation with GAIN at 50 % and watch the output on the scope. A tiny wobble grows into a full-size wave within a few tens of milliseconds.
2. Turn GAIN down to 10 % and restart. The wobble dies out instead.
3. Find the setting where it only just keeps going. Work out R_f / R3 there: it should be close to 29.
4. Turn GAIN to the top and look at the wave shape. The tops flatten as the amplifier runs out of voltage.

## What is going on
Each RC pair delays the signal a little. At one particular frequency the three pairs together delay it by half a cycle (180°), and the amplifier, which inverts, adds another half. The signal arrives back at the input exactly in step with itself, so it reinforces itself, but only at that frequency. The three pairs also shrink the signal 29 times on the way round, so the amplifier must give at least 29 to make up for it. Less, and the ring fades; more, and it grows until the amplifier's limits stop it. That balance (in step, and gain of at least one around the loop) is the recipe for every sine-wave oscillator.

## Go further
- [lab-opamp-blinker](../lab-opamp-blinker): an oscillator that flips between two states instead of making a sine.
- [pc50-two-stage-rc](../pc50-two-stage-rc): RC sections and what they do to a signal.
