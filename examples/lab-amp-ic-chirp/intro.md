# Bird chirps from a kicked tone

A slow pair of transistors flips every couple of seconds. At each flip a capacitor gives a short kick to a tone generator built from an LM386 amplifier: the tone starts high and slides down as the kick fades, then falls silent. A short falling whistle, again and again, like a bird.

**Teaches:** a capacitor turning an edge into a decaying pulse, gating an oscillator with a diode, a falling pitch from a falling charging current

## What to do

Click **Sim** and listen. Turn the pitch pot between chirps.

## What you should see

- A chirp right after switch-on, then silence, then another chirp after about a third of a second, and then one every couple of seconds.
- Each chirp rises quickly to about 2.5 to 3.3 kHz and slides down to about 1.1 kHz in under a tenth of a second.

## Why it works

While the kick node is low, a diode holds the tone generator's timing capacitor down and nothing sounds. When the slow transistor pair flips, a capacitor lifts that node by several volts: the diode lets go, and a second diode feeds extra current into the timing capacitor, so the tone runs fast. The kick fades as its capacitor charges, the tone slows, and when the node is low again the diode stops the tone.
