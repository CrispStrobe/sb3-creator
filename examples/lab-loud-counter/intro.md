---
level: intermediate
age: 12+
prereqs: [lab-counter-timer, lab-listening-amp]
teaches: [microphone, amplifier, threshold, counter]
---
## What you see
An earphone that works as a microphone, an op-amp and a counter with four LEDs. A steady tone is reaching the earphone, and the LEDs count fast.

## Try this
1. Click **Sim**: the LEDs flicker through the binary count, 200 steps a second.
2. In the inspector, turn the earphone's `soundDb` down from 90 to 80. The counter stops.
3. Back at 90, turn the sensitivity pot down to half. It stops again: now the sound is not loud enough.

## What is going on
The earphone's coil, moved by sound, makes a few millivolts. The op-amp amplifies them about 300 times. Its output sits at the voltage of the sensitivity pot, a little below the level where the counter switches, and the sound swings it up and down around that. Only when the swing is big enough, the sound loud enough, does the output cross the counter's level, once per sound wave, and each crossing is a count. Turning the pot down moves the resting point further away, so a louder sound is needed.

## Go further
- [lab-octave-divider](../lab-octave-divider) — the counter as a frequency divider.
- [lab-schmitt-clap](../lab-schmitt-clap) — a clap switch with a Schmitt trigger.
