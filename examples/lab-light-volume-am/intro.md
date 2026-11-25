---
level: advanced
age: 14+
prereqs: [lab-phase-shift, lab-meissner-am]
teaches: [phase-shift-oscillator, amplitude-modulation, gain-control, phototransistor, infrared]
---
## What you see
A one-transistor tone generator, an LM386 amplifier with a loudspeaker, and a phototransistor in the amplifier's gain network. An op-amp flashes an infrared LED at the phototransistor.

## What to do
1. Click **Sim** and listen: the tone throbs, loud and soft, about thirty times a second.
2. Move the light path's **distance** knob: further away, the loud parts get softer.
3. Raise the phototransistor's **light** slider (room light): the soft parts get louder too.

## What is going on
The transistor and three resistor-capacitor sections make a sine wave of about 1.1 kHz. The LM386's gain depends on what is connected between two of its pins; there sits the phototransistor, so light turns the volume up. The op-amp switches the infrared LED on and off, and every flash turns the tone up. The tone's loudness now carries the flashing pattern: amplitude modulation, as in an AM radio transmitter.

## Go further
- [lab-phase-shift](../lab-phase-shift) — the phase-shift oscillator on its own.
- [lab-meissner-am](../lab-meissner-am) — amplitude modulation of a radio-frequency carrier.
