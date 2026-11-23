---
level: intermediate
age: 12+
prereqs: [pc40-opamp-threshold, pc84-led-herz]
teaches: [relaxation-oscillator, hysteresis, positive-feedback, RC-timing, op-amp]
---
## What you see
An op-amp that blinks: a red and a green LED take turns, and the RATE knob sets how fast. There is no timer chip, just one amplifier, a capacitor and some resistors.

## Try this
1. Start the simulation and watch the LEDs alternate, about one and a half times a second.
2. Turn RATE all the way down, then all the way up. The blink speeds up to about 3 per second and slows to about one every 1.7 s.
3. Put a scope probe on the capacitor and on the output. The capacitor ramps up and down between two voltages; the output jumps between low and high.

## What is going on
The three 100 kΩ resistors feed part of the output back to the non-inverting input. That is positive feedback: once the output starts to move it runs all the way to one side, and it moves the switching point with it. So the op-amp becomes a comparator with two thresholds (hysteresis). The capacitor, charged from the output through R_t, is what the comparator watches. It creeps up to the upper threshold, the output flips low, the capacitor creeps back down to the lower threshold, the output flips high, and so on for ever. A bigger R_t or C_t makes each creep slower.

## Go further
- [lab-555-inside](../lab-555-inside): the 555 does the same with two comparators and a flip-flop.
- [pc84-led-herz](../pc84-led-herz): another op-amp blinker.
