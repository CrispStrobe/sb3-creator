# Brush drum: a burst of noise that fades

The noise source hisses all the time, but the output stage only gets power from a capacitor. Press the button and the capacitor is filled; release it and the hiss fades within a few tenths of a second, like a brush on a snare drum.

**Teaches:** envelopes, a capacitor as a short-lived supply, noise source

## What to do

Click **Sim**. Press the button briefly, release it and listen. Press it again.

## What you should see

- Before the first press: silence, the 10 µF capacitor is empty.
- Right after a press: a loud hiss. Then it fades as the capacitor's voltage drops, until it is quiet again.

## Why it works

The output transistor and the earphone take their current from the capacitor. The button charges it to 9 V in an instant through 100 Ω; after that it can only discharge through the earphone and the transistor. As its voltage falls, so does the current that carries the amplified noise, and the hiss dies away: an envelope, the same idea that shapes every drum sound in a synthesizer.
