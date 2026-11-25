---
level: beginner
age: 10+
prereqs: [lab-led-shunt]
teaches: [transistor, shunt, current-paths]
---
## What you see
Two small circuits side by side. Each has a 470 Ω resistor feeding a green LED (with a diode in front of it) and, beside it, a red LED in series with a transistor.

## Try this
1. Click **Sim**. Left: green is lit. Right: red is lit.
2. Hold **ON** (left): green goes out and red lights.
3. Hold **OFF** (right): red goes out and green lights.

## What is going on
The current from the 470 Ω resistor takes whichever path needs the least voltage. The green path needs about 2.8 V (diode plus green LED). The red path needs about 2 V, but only while its transistor conducts; with the transistor off it is closed. Left, the transistor's base gets current only while **ON** is pressed: pressing moves the current from green to red. Right, the base is fed all the time through 10 kΩ, so red is normally lit; **OFF** connects the base to ground and takes its current away: the transistor closes and the current moves back to green. The same transistor shunt, used the other way round.

## Go further
- [lab-led-shunt](../lab-led-shunt) — a shunt made from a plain switch.
