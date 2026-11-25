# Active bass and treble control

Turn the bass up and the drums get louder; turn the treble up and the cymbals sparkle. Here one op-amp with two pots does it, and two signal generators play a bass note and a treble note so you can see each one change.

**Teaches:** frequency-dependent feedback, tone control (Baxandall), capacitors at different frequencies

## What to do

Click **Sim** and open the oscilloscope (channel 1 input, channel 2 output). Turn **BASS** up and down, then **TREBLE**. To look at one note at a time, set the other generator's amplitude to zero.

## What you should see

- Middle positions: the output looks like the input.
- BASS up: the slow 100 Hz wave grows about five times, the fast one stays.
- TREBLE up: the fast 5 kHz wave grows about ten times.

## Why it works

The op-amp's gain is set by the resistance of the network in its feedback against the network at its input. Capacitors change that with frequency: for the slow bass note the 22 nF are almost open and the bass pot decides; for the fast treble note they are almost a short circuit, the bass pot no longer matters and the 4.7 nF connect the treble pot instead.
