# Light made audible: a phototransistor tunes the PLL oscillator

Move the light slider of the phototransistor and the speaker changes its pitch: brighter light, higher note. The phototransistor gives a voltage, and the oscillator of a PLL chip turns it into a tone.

**Teaches:** sensors as control voltages, the voltage-controlled oscillator

## What to do

Click **Sim** and listen. Move the light slider of the phototransistor between 0.1 and 0.3.

## What you should see

- Light 0.1: a low tone of about 250 Hz.
- Light 0.2: about 440 Hz.
- Light 0.3: about 640 Hz.

## Why it works

The phototransistor lets through a current proportional to the light, and the 3.3 kΩ resistor turns that current into a voltage. The 4046's oscillator charges its capacitor faster the higher that voltage is, so the tone rises with the light. The LM386 makes it loud enough for the speaker. Blind people have used light-to-tone devices like this to find windows and lamps.
