# How high can you hear?

An op-amp tone generator whose knob sweeps from a hum-like 660 Hz up to about 14.5 kHz. Somewhere on the way up the tone disappears for you: that is the upper limit of your hearing.

**Teaches:** RC oscillator, frequency, hearing range, slew rate

## What to do

Click **Sim**, listen, and turn the PITCH knob (potentiometer_8) slowly up. Note where you stop hearing anything.

## What you should see

- Knob down: a low tone of about 660 Hz.
- Knob up: about 14.5 kHz. Young ears hear it; many adults do not.

## Why it works

The op-amp charges a capacitor through the knob's resistance until it reaches a threshold, then flips and discharges it to the other threshold. Less resistance means faster charging and a higher tone. At the very top the op-amp cannot swing its output any faster, which caps the pitch.
