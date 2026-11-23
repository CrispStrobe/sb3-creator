---
level: intermediate
age: 14+
prereqs: [lab-transistor-curves]
teaches: [common-emitter, emitter-follower, voltage-gain, inversion]
---
## What you see
One input knob, two transistors wired in two different ways, three voltmeters. Turn the knob and the two outputs move in opposite directions.

## Try this
1. Click **Sim** and read the three meters.
2. Turn the potentiometer up a little. How far did the input move? How far did each output move?
3. Divide the change at the collector by the change at the input. Compare with 2.2 kΩ ÷ 1 kΩ.
4. Turn the knob all the way down. Why do both outputs stop following?

## What is going on
In the common-emitter stage the emitter resistor sets the current (emitter voltage ÷ 1 kΩ), and that current flows through the 2.2 kΩ collector resistor, so the collector voltage changes 2.2 times as much — in the opposite direction. In the emitter follower the output is simply the input minus one diode drop: no gain, but the transistor supplies the current, not the knob. Amplifiers often use both: a gain stage, then a follower to drive the load.

## Go further
- [lab-push-pull](../lab-push-pull) — two followers make an output stage.
- [lab-transistor-curves](../lab-transistor-curves) — where the operating point comes from.
