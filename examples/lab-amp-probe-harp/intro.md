# Probe tone and touch harp

The pitch of this tone generator is set by the resistance between two probe tips. Bridge them with a chain of resistors and you have a harp; put something unknown between them and the note tells you how well it conducts.

**Teaches:** RC oscillator pitch, resistor chain, continuity testing

## What to do

Click **Sim**. Press the four touch buttons (button_13 to button_16, left to right) one at a time. Then hold the fifth button (button_17, the probes) and turn the knob (potentiometer_18, the test object).

## What you should see

- Each touch point plays its own note; further along the chain, lower.
- With the probes on the object the note falls as its resistance rises, and stops altogether when the knob is at the far end.

## Why it works

The capacitor on the − input charges through the resistance between the probes. More resistance means slower charging, so the amplifier flips less often. With too much resistance the capacitor never gets high enough to flip it at all.
