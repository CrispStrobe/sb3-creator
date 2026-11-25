# Unijunction metronome

**Teaches:** relaxation oscillator, complementary latch, RC period

## What to do

Click **Sim** and listen: the loudspeaker ticks and the LED flashes. Turn the knob (potentiometer_4) up and down to set the tempo. Then slide TONE (slide_switch_5) right: the ticks become a buzz, and the knob changes its pitch.

## What you should see

- Ticks from about four a second (knob up) to one every 2.3 s (knob down).
- At TONE a buzz from about 40 Hz to about 340 Hz.

## Why it works

The capacitor charges slowly through the knob. When it reaches the switching point, the two transistors latch on and empty it in a flash through the LED and the loudspeaker: one click. Then the latch lets go and the capacitor charges again. A smaller capacitor fills a hundred times faster, so the clicks turn into a tone.
