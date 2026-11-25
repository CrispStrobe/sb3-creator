# A reflective pen reads black bars: LED and tone

A pen that reads: an LED lights the paper and a phototransistor beside it sees how much comes back. Over white paper a lot, over a black bar almost nothing. Transistors turn that into a lamp and a tone.

**Teaches:** reflective sensing, transistor switches, reading bar codes and Morse

## What to do

Click **Sim**. Move the knob of the light path (how much of the spot lies on a black bar) from 0 to 1 and back. Try short and long "bars" to send dots and dashes.

## What you should see

- White paper: the yellow LED is dark and the speaker silent.
- Black bar: the yellow LED lights and a tone of about 410 Hz sounds.

## Why it works

The phototransistor's current follows the reflected light. On white paper it switches transistor 1 on, which holds transistor 2 (the LED) off, and transistor 3 short-circuits the oscillator's timing capacitor so the LM386 cannot swing. Over a black bar the current stops, transistor 1 lets go, the LED comes on, transistor 3 releases the capacitor and the oscillator sounds. Scanning a row of bars gives a pattern of flashes and beeps.
