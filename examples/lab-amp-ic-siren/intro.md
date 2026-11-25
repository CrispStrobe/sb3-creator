# Two-tone siren with blinking lights

Two transistors blink a red and a blue LED in turn. A power amplifier makes the tone. Through a diode and a pot, one transistor feeds extra current into the tone oscillator's timing capacitor whenever it is off: the tone jumps up an octave with the red light and back down with the blue one.

**Teaches:** one oscillator modulating another, a diode as a one-way path, charging current sets the pitch

## What to do

Click **Sim**, watch the LEDs and listen. Turn the pot to change the high tone.

## What you should see

- Red and blue alternate, each about half a second.
- About 1.9 kHz while red is lit, about 940 Hz while blue is lit.
- Less resistance at the pot: a higher high tone.

## Why it works

The amplifier's tone is set by how fast its timing capacitor charges. While the second transistor is off, its collector is high, and current flows through the diode and the pot into the capacitor as well: it charges faster, so the tone is higher. While that transistor is on, its collector is near 0 V and the diode blocks.
