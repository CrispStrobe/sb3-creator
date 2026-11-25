# FSK: two tones turned back into 0 and 1 by a PLL

Data can travel as sound: one tone means 0, another means 1. Here a transistor oscillator sends the tones and a phase-locked loop listens. It follows whichever tone arrives, and its control voltage, judged by an amplifier, lights the "0" or the "1" LED.

**Teaches:** frequency-shift keying, the PLL as a demodulator, how modems work

## What to do

Click **Sim**. Hold the key button down for a moment, then release it. Hover over the PLL chip to see its frequency.

## What you should see

- Key up: about 700 Hz, the green "0" LED is lit.
- Key down: about 920 Hz, the yellow "1" LED lights.
- Released: back to "0".

## Why it works

The key changes one timing resistor of the astable, so it switches between two frequencies. The PLL keeps its own oscillator in step with the incoming tone; to follow the higher tone it has to raise its control voltage. That voltage is therefore the message: low for 0, high for 1. The LM386 compares it with a fixed level and drives the two LEDs. Old home computers saved their programs on cassette tapes the same way.
