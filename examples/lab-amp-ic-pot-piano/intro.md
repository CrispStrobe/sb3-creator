# Pot piano with a power-amplifier oscillator

An LM386 is wired as a tone oscillator. The button is the piano key: the note sounds while you hold it. The knob tunes the note, one slide switch drops it by an octave, the other changes how far the knob can tune.

**Teaches:** relaxation oscillator, pitch and RC, octave as double the capacitance, range resistor

## What to do

Click **Sim**. Hold the button (KEY) and turn the TUNE pot while it sounds; let go and press again to play a tune. Flip OCTAVE and play again. Flip RANGE and turn the knob through its whole sweep.

## What you should see

- Button up: silence. Held: a note, about 500 Hz with the knob at the low end, higher as you turn it.
- OCTAVE: everything an octave lower (500 → 250 Hz).
- RANGE: the knob reaches much higher notes (up to about 9 kHz instead of 2.7 kHz).

## Why it works

The amplifier's output is either high or low. Through the key, the range resistor and the pot it charges or empties the capacitor on its − input, until the capacitor passes the switching level its + input sets; then the output flips and the capacitor heads the other way. Less resistance or less capacitance means less time per swing, a higher note. Two equal capacitors side by side hold twice the charge: twice the time, half the pitch, an octave lower. With the key up the capacitor is cut off and the output just stays where it is.
