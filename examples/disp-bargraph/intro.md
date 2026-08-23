---
level: beginner
age: 10+
teaches: [bargraph, adc, led, analog-input]
---
## What you see
An 8-LED bargraph that shows the potentiometer level. Turn the pot and the
bar grows or shrinks — each LED represents one eighth of the range.

## Try this
1. Run the program and turn the pot — LEDs light from bottom to top.
2. Replace the pot with `read light` for an ambient light meter.
3. Add colours: use red LEDs for the top 2, yellow for the next 3, green for the bottom 3.

## What is going on
The pot outputs 0–1023 on the ADC. Dividing by 128 gives a level from 0 to 7.
Each `if level > N` turns on one more LED. This is a simple DAC-to-display
conversion — the analog value becomes a visual bar.

## Why it matters
Bargraph displays are used in audio level meters, battery indicators, and
signal strength displays. Building one from individual LEDs teaches the
relationship between analog values and discrete visual steps.
