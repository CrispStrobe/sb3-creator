---
level: intermediate
age: 10+
prereqs: [lab-heat-alarm]
teaches: [transistor, temperature, bias]
---
## What you see
Two transistors and a green LED. The left transistor is the heat detector itself: it sits on its leads, and its **Temperature** slider sets what surrounds it (ice, room, fingers, hot air). A small trimmer sets the switching point.

## Try this
1. Click **Sim**. At room temperature the green LED is lit.
2. Move the temperature to fingers (about 33 °C): the LED dims.
3. Move it to hot (a hair dryer): after a second or two the LED goes out: alarm.
4. Move it to ice: the LED is bright again.
5. Turn the trimmer towards its other end and warm it again: now it needs more heat before the LED dims.

## What is going on
The base of the left transistor is held just below the voltage at which it starts to conduct. A silicon junction needs about 2 mV less for every degree warmer, so when the transistor warms up, the same base voltage pushes far more current through it: roughly ten times more for every 30 °C. That current is taken from the base of the right transistor, which runs the LED. Warm: the right transistor gets less and the LED dims; cool: it gets it back. The trimmer moves the left transistor's base voltage and with it the temperature at which this happens.

## Go further
- [lab-heat-alarm](../lab-heat-alarm) — the same alarm with a resistor that changes with heat.
