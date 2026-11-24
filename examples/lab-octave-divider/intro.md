---
level: intermediate
age: 12+
prereqs: [lab-counter-timer]
teaches: [frequency-divider, binary-counter, octave, mixing]
---
## What you see
A 555 oscillator, a chain of counter stages and an earphone. Seven resistors mix the counter outputs into one sound.

## Try this
1. Click **Sim** and listen: a deep, buzzy chord.
2. Put a scope probe on the 555 output, then on each counter output in turn. Every one is half as fast as the one before.
3. Remove some of the 47 kΩ mixing resistors and listen to how the chord thins out.

## What is going on
A counter stage changes state once for every two pulses it receives, so its output runs at half its input frequency. Halving a frequency lowers a note by exactly one octave. Seven stages in a row give seven octaves from one oscillator, from about 2.2 kHz down to about 35 Hz, and they are always perfectly in tune with each other because one clock drives them all. Early electronic organs made their lower octaves exactly like this.

## Go further
- [lab-counter-timer](../lab-counter-timer) — the same counter as a timer that stops itself.
- [lab-loud-counter](../lab-loud-counter) — a counter clocked by sound.
