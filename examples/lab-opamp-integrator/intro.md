---
level: advanced
age: 14+
prereqs: [lab-opamp-gain, pc06-rc-charge]
teaches: [integrator, op-amp, virtual-ground, constant-current, ramp]
---
## What you see
An op-amp with a capacitor in its feedback path, a RUN switch and a meter. Close RUN and the needle moves steadily upwards, almost exactly 0.9 V every second, like the hand of a stopwatch. Open RUN and it stops; press RESET and it returns to zero.

## Try this
1. Close RUN and hold your breath. Open RUN when you have to breathe and read the meter: divide by 0.9 to get your time in seconds.
2. Compare the climb with an ordinary RC charge: here the line stays straight until the very top.
3. Predict how fast the needle would move with R_in = 200 kΩ, or C = 47 µF.

## What is going on
The op-amp holds its inverting input at 0 V. With RUN closed, a fixed current of 9 V / 100 kΩ = 90 µA flows out through R_in, and the only place it can come from is the capacitor. A capacitor charged with a constant current gains the same voltage every second: I / C = 0.9 V/s. An ordinary RC circuit slows down because its charging current shrinks as the capacitor fills; here the op-amp keeps the current constant, so the ramp stays straight. Integrators like this are inside ramp generators, analogue-to-digital converters and every analogue computer.

## Go further
- [lab-staircase](../lab-staircase): the same integrator, fed with charge packets.
- [lab-opamp-gain](../lab-opamp-gain): op-amp feedback with resistors only.
