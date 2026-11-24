---
level: advanced
age: 14+
prereqs: [lab-function-generator]
teaches: [integrator, op-amp, analog-memory, threshold-detector]
---
## What you see
A knob, an op-amp with a capacitor from its output back to its input, and two LEDs at the ends: red on the left, green on the right. The op-amp's output voltage is a ball on a table, and the knob tilts the table.

## Try this
1. Click **Sim**. The knob is in the middle: the table is level and the ball (the output, about 4.5 V) stays put.
2. Turn the knob fully right. The ball rolls: the output climbs steadily until the green end stop lights.
3. Turn it fully left. The ball rolls back across the table and on to the red end stop.
4. While it rolls, set the knob back to the middle. The ball stops wherever it is.
5. Try a small tilt: the ball rolls slowly. The steeper the tilt, the faster it goes.

## What is going on
The knob does not set where the ball is, only how fast it moves. The op-amp keeps its − input at the same voltage as its + input (half the supply), so the knob's difference from half supply drives a small, steady current through the 100 kΩ resistor. That current can only go into the capacitor, which charges at a steady rate, and the output ramps. Level knob, no current, no change: the capacitor remembers. Each end stop is a transistor on a divider that only switches on when the ball gets close to its own end.

## Go further
- [lab-function-generator](../lab-function-generator) — an integrator that turns round at each end by itself.
- [lab-ramp-timer](../lab-ramp-timer) — the same rolling ball used as a clock.
