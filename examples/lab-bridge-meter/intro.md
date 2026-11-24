---
level: advanced
age: 14+
prereqs: [lab-linear-ohmmeter]
teaches: [precision-rectifier, full-wave, op-amp, polarity]
---
## What you see
An op-amp on two batteries (plus and minus 9 V), a knob or a sine generator as its input, and in its feedback path a bridge of two diodes and two LEDs with a meter across the middle.

## Try this
1. Click **Sim**. The knob gives half a volt: the meter reads half a milliamp and the red LED is lit.
2. Turn the knob below the middle. The meter reads the same as before, but now the green LED carries the current.
3. Set the knob to the middle: meter at zero, both LEDs dark.
4. Flip the switch to the generator. Red and green take turns, fifty times a second each, and the meter shows a steady average.

## What is going on
The op-amp holds its − input at the same voltage as its + input. The 1 kΩ resistor from there to ground therefore carries a current set only by the input: 1 mA per volt. That current can only reach the resistor through the bridge. Flowing one way it takes the left diode, the meter and the red LED; the other way the right diode, the meter and the green LED. Either way it crosses the meter in the same direction. The op-amp's output simply goes as high or as low as needed to push the current through a diode and an LED, so their voltage drops never show up on the meter: even a tiny input is measured correctly. This is how good AC meters rectify.

## Go further
- [lab-linear-ohmmeter](../lab-linear-ohmmeter) — the same trick of an op-amp forcing a current.
- [lab-sound-meter](../lab-sound-meter) — a half-wave version measuring sound.
