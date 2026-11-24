---
level: advanced
age: 14+
prereqs: [lab-mosfet-vcr]
teaches: [dual-gate-mosfet, pinch-off, and-gate]
---
## What you see
A MOSFET with two gates. Each gate has its own slide switch, and a green LED sits in the drain line. A red LED under the source lifts it a little above ground.

## Try this
1. Click **Sim**: both switches are on the left, both gates high, the green LED is lit.
2. Slide the first switch to the right. The LED goes out.
3. Slide it back and try the second switch instead. Same result.
4. Which switch positions light the LED? Write it down as a table: you have built an AND gate.

## What is going on
The two gates sit one after the other over the same channel, gate 1 at the source end and gate 2 at the drain end. Electrons have to pass under both on their way through. Each gate can push the carriers out of the part of the channel beneath it, and then the whole channel is cut off, just as a hose stops when you pinch it at any point. Because the source is lifted by the red LED, switching a gate to ground makes it about 1.8 V negative with respect to the source, and that is enough to pinch off this depletion-mode transistor. In radios, the second gate of such a MOSFET is used to turn the gain of an amplifier up and down.

## Go further
- [lab-mosfet-vcr](../lab-mosfet-vcr) — between on and off: the channel as a resistor.
- [lab-humidity-comb](../lab-humidity-comb) — a gate driven by breath.
