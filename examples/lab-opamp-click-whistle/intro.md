# From clicks to a whistle: an op-amp astable in a loudspeaker

An op-amp that switches itself back and forth makes a click in the loudspeaker at every switch. Slowly, you hear single clicks; fast, they melt into a tone. One knob takes you from one to the other.

**Teaches:** RC timing, op-amp astable, where clicks become a pitch

## What to do

Click **Sim** and listen. Turn the **RATE** pot slowly from full down to zero.

## What you should see

- RATE up: about 12 clicks a second.
- RATE down: a whistle of about 670 Hz.

## Why it works

The capacitor charges and discharges through the resistor between two thresholds, so the time for one cycle is proportional to resistance times capacitance. The pot changes the resistance from 480 kΩ to 10 kΩ, the cycle from about 80 ms to 1.5 ms. Your ear hears separate events below about 20 a second and a continuous pitch above.
