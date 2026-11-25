# A temperature sent as a pulse rate and read by a PLL

The same temperature stage now sets how often a two-transistor oscillator flashes an LED: about 900 times a second, faster when warmer. At the far end of the light guide a phase-locked loop locks onto the flashes, and the voltage that holds it in step is shown on a meter: a thermometer at the end of a light guide.

**Teaches:** pulse-rate (frequency) coding of a measured value, PLL as a frequency-to-voltage converter

## What to do

Click **Sim**. Set the PTC's surroundings to 25 °C and then 45 °C and compare the meter readings. Pull the light guide's end back a little: the reading stays.

## What you should see

- 25 °C: the PLL's oscillator runs near 900 Hz; the meter reads about 3 V.
- 45 °C: faster flashes (about 1050 Hz), the oscillator follows, and the meter reads about 3.8 V.

## Why it works

The LM386's output feeds the astable's base resistors, so a warmer sensor charges its capacitors faster. The 4046 compares the incoming pulses with its own oscillator and moves its control voltage until both run at the same rate; that voltage, copied to the demodulator output, rises with the rate and therefore with the temperature. Since only the rate carries the value, a dimmer light does not change it as long as the pulses still arrive.
