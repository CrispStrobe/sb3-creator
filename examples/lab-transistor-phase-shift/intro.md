# A phase-shift oscillator from a single transistor

A transistor amplifier turns its signal upside down. Send it back to the input through three small capacitor-resistor steps, which together turn it round once more at one particular frequency, and the amplifier keeps itself going at exactly that frequency.

**Teaches:** phase shift, RC networks, feedback oscillator

## What to do

Click **Sim** and listen to the earphone. On the oscilloscope compare the collector (channel 1) with the base (channel 2).

## What you should see

- A tone of about 670 Hz.
- The base signal is small, the collector signal large.

## Why it works

Each capacitor-resistor step lets the signal through a little early and a little weaker. Three of them shift it by half a cycle at one frequency. The transistor shifts by another half cycle (it inverts) and makes up for the loss, so after one round trip the signal is back in step with itself: an oscillator.
