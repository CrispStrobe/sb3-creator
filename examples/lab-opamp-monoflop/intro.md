---
level: advanced
age: 14+
prereqs: [lab-opamp-blinker]
teaches: [monostable, astable, comparator, diode-clamp, virtual-ground]
---
## What you see
An op-amp, a capacitor, a red and a green LED, a START button and a slide switch that adds one diode.

## What to do
1. Click **Sim**. Red lights once, then green stays on: the circuit waits.
2. Press **START**. Red comes on for a little under half a second, then green again, however long you hold the button.
3. Slide the switch to the left (diode out). Now red and green blink by themselves.

## What is going on
Without the diode this is an op-amp blinker: the capacitor charges up to one level, the output flips, it charges down to another level, the output flips back. The diode stops the capacitor on its way up just short of the upper level, so the blinker stalls and waits. The START button gives it one push and it runs exactly one half-cycle: a monoflop.

## Go further
- [lab-opamp-blinker](../lab-opamp-blinker) — the op-amp astable on its own.
- [lab-two-led-monostable](../lab-two-led-monostable) — a monoflop made from transistors.
