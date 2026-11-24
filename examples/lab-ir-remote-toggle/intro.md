---
level: advanced
age: 14+
prereqs: [lab-led-sensor-colours, lab-counter-timer]
teaches: [infrared-remote, monoflop, toggle-flip-flop, relay]
---
## What you see
A button flashes an infrared LED. Across the room a phototransistor catches the flash, an op-amp turns it into one clean pulse, and a counter's first stage flips a relay on or off with every press. The relay switches a lamp.

## Try this
1. Click **Sim** and wait a moment. Press the button: the lamp comes on.
2. Press again: the lamp goes off. Press and hold: still only one switch.
3. Move the light path's distance knob from 30 cm to 1 m and press. Out of range: nothing happens.

## What is going on
The flash pulls the receiver transistor low for as long as the button is held. A capacitor only lets the moment of change through, a short dip, and that dip trips the op-amp. Its own capacitor holds it tripped for about 40 milliseconds, then it resets itself: a monoflop, one pulse per flash however long you press. The pulse clocks the first stage of a binary counter, which simply changes state on every pulse: on, off, on, off. That stage drives a transistor and the relay. A TV remote works on the same idea, with coded flashes instead of single ones.

## Go further
- [lab-barrier-counter](../lab-barrier-counter) — count light interruptions and switch a relay after six.
- [lab-toggle-flip-flop](../lab-toggle-flip-flop) — a toggle flip-flop built from two transistors.
