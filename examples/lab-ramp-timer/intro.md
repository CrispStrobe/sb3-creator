---
level: advanced
age: 14+
prereqs: [lab-tilt-comparator]
teaches: [integrator, ramp, timer, threshold-detector]
---
## What you see
An op-amp integrator with a hold/run switch, a time knob and a **Zero** button, and three more op-amp sections working as comparators, with a green, a yellow and a red LED.

## Try this
1. Click **Sim**. The timer is already running: watch green, then yellow, then red come on at equal intervals, a bit under half a second apart.
2. Press **Zero**: all dark again, and the timer starts over.
3. Flip the switch to hold halfway through: everything freezes. Flip it back and it carries on.
4. Turn the time knob towards slow and press **Zero**: the LEDs now take several seconds.

## What is going on
In run, the input resistor sits between ground and the op-amp's − input, which the op-amp holds near 1 V. So a constant current flows, about 1 V divided by the resistance, and it all goes into the capacitor. A capacitor fed a constant current charges in a straight line, so the output climbs like the hand of a clock. Each comparator switches its LED on when the ramp passes its own tap of the resistor ladder, and on a straight ramp equal voltage steps are equal time steps. In hold, both ends of the input resistor are at the same 1 V: no current, and the ramp stands still.

## Go further
- [lab-tilt-comparator](../lab-tilt-comparator) — one op-amp section as a comparator, on its own.
- [lab-delay-off-timer](../lab-delay-off-timer) — a timer from a capacitor that discharges, not in a straight line.
