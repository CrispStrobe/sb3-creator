---
level: intermediate
age: 12+
prereqs: [pc47-555-monostable]
teaches: [555-audio, pulse-generation, frequency-control]
---
## What you see
A 555 timer configured as an astable oscillator producing audio-frequency pulses. A speaker or buzzer connected to the output produces an audible tone whose pitch depends on the resistor and capacitor values.

## Try this
1. Run the simulation and listen to the tone produced by the 555.
2. Change the timing resistor to a larger value and hear the pitch drop as the frequency decreases.
3. Replace the fixed resistor with a potentiometer and sweep the pitch continuously.

## What is going on
In astable mode, the 555 charges a capacitor through two resistors until it hits 2/3 of the supply voltage, then discharges it through one resistor until it hits 1/3. This cycle repeats indefinitely, producing a square wave at the output. The frequency is set by the resistor and capacitor values: f = 1.44 / ((R1 + 2*R2) * C). With values chosen to produce hundreds or thousands of hertz, the square wave is audible as a tone.

## Why it matters
The 555 timer is one of the most produced integrated circuits in history. Generating a precise frequency with just two resistors and a capacitor — no microcontroller, no software — makes it ideal for alarms, buzzers, and simple tone generators. Understanding it opens the door to countless classic circuits.

## Go further
- [pc47-555-monostable](../pc47-555-monostable) — the 555 in one-shot mode instead of continuous oscillation.
- [pc53-buzzer-switch](../pc53-buzzer-switch) — a simpler sound circuit without frequency control.
- Experiment: add a second 555 running at a low frequency (a few hertz) and use its output to gate the audio 555 on and off, creating a pulsing alarm sound.
