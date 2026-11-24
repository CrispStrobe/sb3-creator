---
level: intermediate
age: 14+
prereqs: [lab-ce-vs-follower]
teaches: [emitter-follower, current-gain, darlington, loading]
---
## What you see
A knob, two transistors one after the other, a red LED with a switch that chooses which transistor feeds it, three voltmeters and an ammeter in the first base lead. The knob does not drive the base directly: there is a large 47 kΩ resistor in the way, like a weak sensor.

## Try this
1. Click **Sim** and read the three voltmeters. How much lower is each one than the one before?
2. Read the ammeter: how much base current does it take to light the LED?
3. Flip the switch so the LED hangs on the first transistor. Watch the ammeter, the first voltmeter and the LED.
4. Flip it back and turn the knob down slowly. At what knob voltage does the LED go out?

## What is going on
An emitter follower copies its base voltage to its emitter, minus the drop of about 0.7 V across the base-emitter junction. It does not make the voltage bigger, but it makes the current bigger: the emitter delivers about a hundred times what the base takes. Put a second follower behind the first and the gains multiply, so the LED's milliamps need only a couple of microamps at the first base. That tiny current hardly drops anything across the 47 kΩ resistor. With only one follower the base has to supply far more, the resistor eats a large part of the voltage and the LED is dimmer, even though one follower loses less voltage. Two followers glued together like this are called a Darlington pair.

## Go further
- [lab-ce-vs-follower](../lab-ce-vs-follower) — one follower next to an amplifying stage.
- [lab-inverting-stages](../lab-inverting-stages) — two amplifying stages in a row.
