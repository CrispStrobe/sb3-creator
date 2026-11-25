---
level: advanced
age: 14+
prereqs: [lab-toggle-flip-flop, lab-amp-horn]
teaches: [infrared-remote, monoflop, toggle-flip-flop]
---
## What you see
A button flashes an infrared LED. A phototransistor catches the flash, an audio amplifier chip turns it into one clean pulse, and a flip-flop made of two transistors switches between a red and a green LED with every press.

## Try this
1. Click **Sim** and wait a moment: red is lit.
2. Press the button: green. Press again: red. Press and hold: it still flips only once.
3. Move the light path's distance knob from 30 cm to 1 m and press. Out of range: nothing happens.

## What is going on
The flash lifts the phototransistor's output, and a capacitor passes just the moment of change to the amplifier. The amplifier normally rests low; the jump tips it high, and a second capacitor from its output back to its input holds it there for a few hundredths of a second before it drops back. That is a monoflop: one pulse per flash, however long you press. When the pulse ends, its falling edge reaches both transistors of the flip-flop, but a diode lets it through only to the one that is on, which switches off. The other takes over, until the next pulse.

## Go further
- [lab-toggle-flip-flop](../lab-toggle-flip-flop) — the same flip-flop worked by a push button.
- [lab-ir-beam-alarm](../lab-ir-beam-alarm) — the same amplifier as a loud alarm.
