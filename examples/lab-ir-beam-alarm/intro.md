---
level: intermediate
age: 12+
prereqs: [lab-amp-horn, lab-light-link]
teaches: [light-barrier, oscillator, alarm]
---
## What you see
An infrared LED shines across a gap onto a phototransistor. An audio amplifier chip and a loudspeaker wait silently.

## Try this
1. Click **Sim**. Silence: the beam is there.
2. Push the light path's `blocked` slider to 1, as if someone walked through the beam. The loudspeaker blares.
3. Pull the slider back: quiet again.

## What is going on
The amplifier is wired to oscillate: its output kicks its own input through a capacitor, and the kick dies away until the amplifier flips back, over and over, about 176 times a second. While the beam shines, the phototransistor puts a small voltage on the amplifier's other input. The kicks cannot get past that voltage, so the amplifier stays put and stays silent. Break the beam and the voltage is gone: the amplifier oscillates at full power.

## Go further
- [lab-amp-horn](../lab-amp-horn) — the same amplifier oscillator on its own.
- [lab-barrier-counter](../lab-barrier-counter) — count how often a beam is broken.
