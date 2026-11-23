# Pips from logic gates

A NAND gate with a Schmitt-trigger input, one resistor and one capacitor is already an oscillator. Use one slowly and one fast, and let the slow one switch the fast one on and off: the steady tone turns into pips, like a time signal or a busy tone.

**Teaches:** gate oscillators, gating (one signal switching another), RC timing

## What to do

Click **Sim** and listen. Watch the yellow LED. Then move the slide switch to the right.

## What you should see

- The yellow LED blinks about two and a half times a second.
- A short tone of about 570 Hz with every blink, silence in between.
- With the switch to the right: a continuous tone.

## Why it works

The gate's output charges the capacitor through the resistor. When the capacitor reaches the gate's upper switching point, the output flips and starts to discharge it, until the lower switching point flips it back. The gap between the two switching points (the hysteresis) is what keeps it going. A NAND gate only passes this on while its other input is high, so the slow oscillator acts as an on/off switch for the fast one.
