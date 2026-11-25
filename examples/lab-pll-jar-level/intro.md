# Capacitive level meter: a PLL oscillator, a jar and a light bar

Two foil strips stuck on the outside of a jar form a capacitor: the more water inside, the larger it gets. The oscillator of a PLL chip drives a square wave through that capacitor; an op-amp rectifies what gets through, and Schmitt NAND gates light a green "half" and a red "full" LED. When the jar is full an amplifier chip beeps.

**Teaches:** capacitive level sensing, a precision rectifier, Schmitt-trigger thresholds

## What to do

Click **Sim**. Switch the jar's level switches on one after another (each adds the capacitance of more water), then off again.

## What you should see

- Empty and the first level: both LEDs dark, silent.
- Second level: the green LED lights.
- Full: the red LED lights as well and the piezo beeps.

## Why it works

Every edge of the 1.1 kHz square wave pushes a charge proportional to the jar's capacitance through 22 kΩ. Op-amp 1 with a diode in its feedback passes only the positive pulses, without losing a diode drop; 10 kΩ and 220 nF average them, and op-amp 2 amplifies that against a small offset. NAND gate 1's Schmitt input switches at about 5.2 V, gate 2 sees the voltage through a divider and so needs a higher level. Gate 2's output also drives a transistor that holds the LM386 beeper's capacitor at 0 V until the jar is full.
