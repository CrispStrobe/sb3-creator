# Noise-level meter: op-amp, LM386 and a transistor rectifier

An earphone used as a microphone gives less than a millivolt. An op-amp and an amplifier chip raise that a couple of thousand times, and a transistor rectifier turns the sound into a steady needle reading.

**Teaches:** microphones, two-stage amplification, decibels, peak rectification

## What to do

Click **Sim** and wait a moment for the meter to settle. Then set the earphone's sound level to 70 dB, then 80 dB, then back to 0.

## What you should see

- Quiet: the needle at zero.
- 70 dB: it barely moves (about 0.16 V).
- 80 dB: about 2.4 V.

## Why it works

Sound moves the earphone's membrane, and its coil gives a tiny voltage. The op-amp amplifies it about 100 times, the LM386 another 20 times. The capacitor and the diode at the transistor's base shift the signal so that it swings up from ground; the transistor then charges the capacitor at the meter to the highest point of each swing. Every 10 dB more is about three times the sound pressure.
