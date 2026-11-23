# Amplifier as horn: an LM386 drives a speaker

An audio amplifier is built to make a quiet signal loud. Feed part of its output back to its input through a capacitor and it stops waiting for a signal: it makes its own tone. A large capacitor then carries that tone to a speaker, and a button gives the horn a second, higher note.

**Teaches:** oscillation from positive feedback, AC coupling, why a speaker needs a capacitor, the RC time constant sets the pitch

## What to do

Click **Sim** and listen: a low tone. Hold the button for a higher one. Open the scope and compare its two channels, before and after the large capacitor.

## What you should see

- A steady tone of about 175 Hz, about 440 Hz while the button is held.
- Channel 1 (before the capacitor) swings around 4.5 V, half the battery voltage.
- Channel 2 (at the speaker) is centred on 0 V: at every flip it jumps to about +4 V or −4 V and then dies away within about a millisecond, because the 8 Ω voice coil drains the large capacitor quickly (8 Ω × 100 µF = 0.8 ms). Each flip is a push on the speaker cone.
- The speaker plays at full volume: its coil carries about 0.29 A rms.

## Why it works

The amplifier multiplies the voltage at its input by 20. Each time its output swings, the small capacitor pushes the input the same way, so the amplifier swings even harder. The push fades through the resistor to ground, the amplifier lets go, and it flips to the other side: an oscillator. A smaller resistance makes the push fade sooner, so the button, which adds a second resistor, raises the note. The amplifier's output rests at half the supply; the large capacitor lets only the changes through, so the speaker gets the tone but no steady current.
