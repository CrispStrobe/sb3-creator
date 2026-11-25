# Triangle, sawtooth and a diode

An op-amp integrator and an op-amp Schmitt trigger chase each other: a triangle and a square. One diode makes the integrator run back much faster, and the triangle turns into a sawtooth.

**Teaches:** integrator, Schmitt trigger, waveform shaping with a diode

## What to do

Click **Sim**. Watch the yellow LED (led_16, the triangle) and the red LED (led_14, the square). Close SHAPE (switch_7) and watch again; probe the integrator output with the scope if you like.

## What you should see

- SHAPE open: a triangle at about 23 Hz between 3.3 V and 6.5 V; the red LED flickers.
- SHAPE closed: the ramp now jumps back in under a millisecond and climbs slowly: a sawtooth. The square becomes short pulses.

## Why it works

The integrator's output moves at a speed set by the current into its capacitor. The diode adds a second, much smaller resistor for one direction of current only, so one slope gets steep and the other stays as it was.
