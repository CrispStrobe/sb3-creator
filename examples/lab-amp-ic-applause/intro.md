# Applause meter with a power amplifier

A loudspeaker is the microphone, an LM386 amplifies what it hears, and the peaks of the sound are collected in a capacitor. A transistor lights a green LED from that capacitor: it stays on while the applause lasts and fades slowly when it stops.

**Teaches:** loudspeaker as microphone, peak detector, charging fast and discharging slowly, transistor LED driver

## What to do

Click **Sim**. In the instruments column push the **Sound** slider at the loudspeaker to 110 (loud applause) and hold it there for a moment, then back to 0. Try 80 (talking) too. Flip the HOLD slide switch and clap again.

## What you should see

- Talking: the LED stays dark.
- Applause: the LED lights and stays lit; after the applause it fades within about half a second.
- With HOLD switched to the big capacitor it fills more slowly and glows on for more than a second.

## Why it works

The amplified sound swings up and down around half the supply. Two diodes let only the upward swings push charge into the hold capacitor, a little at every peak; nothing lets it flow back. The capacitor empties only slowly, through a large resistor and the transistor's base, so the transistor and the LED follow the average loudness of the last moments. A bigger capacitor needs more peaks to fill and takes longer to empty.
