# Two-tone horn with a follower amplifier

Two transistors take turns switching on and make a square-wave tone. An LM386 amplifier, wired so that it only copies its input, drives the loudspeaker with it. A button and a slide switch change a timing resistor and the horn jumps between two notes.

**Teaches:** transistor astable multivibrator, timing resistor and pitch, voltage follower as a speaker driver

## What to do

Click **Sim**: the horn sounds. Hold the button (HIGH) and let go a few times. Then flip the slide switch and try the button again.

## What you should see

- About 670 Hz at rest; holding the button raises it to about 900 Hz.
- With the slide switch flipped: about 910 Hz, and about 1380 Hz with the button held.
- The amplifier's output swings as far as its input does, no further.

## Why it works

Each transistor stays off until its base has recharged through its base resistor; a smaller resistor recharges it sooner, so each half of the cycle gets shorter and the pitch rises. The amplifier's − input is tied to its own output, so it can only make the output equal to the + input: a gain of one. What it adds is current: the oscillator's 1 kΩ collector resistors could never push a tenth of an ampere through an 8 Ω speaker, the amplifier can.
