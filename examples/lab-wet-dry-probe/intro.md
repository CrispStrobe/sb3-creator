---
level: beginner
age: 10+
prereqs: [38-npn-switch]
teaches: [conductivity, sensor, transistor-amplifier, inverter]
---
## What you see
A water probe — two bare wires — feeds a transistor. A blue LED means "wet", a red LED means "dry". Because the simulator has no water, the probe is a slider resistance: at 0 it is dry air (10 MΩ), at 1 the wires touch.

## Try this
1. Click **Sim**: the probe is dry and the red LED warns "too dry".
2. Slide the probe slowly towards 1. Around 1 MΩ the blue LED starts to glow; at about 100 kΩ (tap water, damp soil) it takes over.
3. Short the probes (slider at 1): blue is on, red is off.

## What is going on
Water with a little salt or dirt in it conducts, dry air does not. Even wet, the probe passes only microamps — far too little for an LED. The first transistor multiplies that current about a hundred times and lights the blue LED. Its collector voltage falls at the same time, and that is what the second transistor watches: when the first one is off, the second one is on. So one probe gives two opposite answers, "wet" for a rain alarm and "dry" for a plant that needs water.

## Go further
- [lab-touch-darlington](../lab-touch-darlington) — even more gain for even larger resistances.
- [38-npn-switch](../38-npn-switch) — the transistor switch on its own.
