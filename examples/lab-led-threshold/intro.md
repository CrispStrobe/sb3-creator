# LED thresholds: four colours on one adjustable voltage

Four LEDs, red, yellow, green and blue, each with its own resistor, all fed from the same adjustable voltage. Turn the knob up slowly and they light one after another, in the order of their colour. Blue needs the most voltage, red the least. The colour of the light is set by the energy of each photon, and that is set by the material, which also sets the voltage the LED needs.

**Teaches:** forward voltage depends on colour, the exponential diode curve, why LEDs need a series resistor

## What to do

Click **Sim** and turn the knob from 0 up to full. Watch which LED lights first, and read the ammeter and voltmeter on the red one. At half way three LEDs glow and blue is still dark.

## What you should see

- Red lights first, then yellow, then green; blue only past about 60 % of the knob.
- Once an LED glows, its voltage barely changes while its current keeps rising.
- At half way: red about 1.5 V and 1.6 mA, blue dark.

## Why it works

An LED is a diode: below its knee almost no current flows, above it the current shoots up. The op-amp follower copies the knob voltage without being loaded down, so every LED sees the same voltage and you can compare them fairly.
