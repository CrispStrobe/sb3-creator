---
level: advanced
age: 14+
prereqs: [lab-led-sensor-colours, lab-led-light-sensor]
teaches: [offset, zero-adjust, difference-amplifier, inverse-square-law]
---
## What you see
An infrared LED shines on a second IR LED that works as a light sensor. Two op-amps turn its tiny photocurrent into a meter reading. A pot marked "zero" sets the meter's zero point.

## Try this
1. Click **Sim**. The meter reads about 1.2 V.
2. Switch the IR lamp off. The meter still shows about 0.3 V in the dark: that is the offset.
3. Turn the zero pot up slowly until the meter just reaches 0.
4. Switch the lamp on again and move the light path's distance knob: 5 cm, 10 cm, 20 cm. Each doubling of the distance leaves about a quarter of the reading.

## What is going on
The first op-amp turns the sensor's photocurrent into a voltage. Running from one battery, it cannot work right down at 0 V, so its input is lifted to about 1 V by a voltage divider, and its output sits at that 1 V even in the dark. The second op-amp is a difference amplifier: it outputs the first stage's voltage minus the voltage on the zero pot. When the pot matches the 1 V exactly, darkness reads zero and the meter shows the light alone. Every precision meter has such a zero adjustment.

## Go further
- [lab-led-sensor-colours](../lab-led-sensor-colours) — which light an LED sensor can see.
- [lab-optical-bench](../lab-optical-bench) — the inverse-square law with a photodiode.
