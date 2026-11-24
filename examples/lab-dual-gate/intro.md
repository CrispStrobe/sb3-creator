---
level: advanced
age: 14+
prereqs: [lab-mosfet-vcr]
teaches: [dual-gate-mosfet, pinch-off]
---
## What you see
A MOSFET with two gates. Each gate has its own knob and its own button, and a green LED sits in the drain line. A red LED under the source lifts it a little above ground.

## Try this
1. Click **Sim**: both knobs are up and the green LED is lit.
2. Turn the first knob down slowly until the LED goes out. Now try the second knob: does it change anything?
3. Turn the first knob back up, then turn the second one down. Which knob dims the LED sooner?
4. Press either button: it pulls its gate to ground, below the source.

## What is going on
The two gates sit one after the other over the same channel, gate 1 at the source end and gate 2 at the drain end. Electrons have to pass under both on their way through. Each gate can push the carriers out of the part of the channel beneath it, and then the whole channel is cut off, just as a hose stops when you pinch it anywhere. Once one gate has closed it, the other gate has nothing left to control. In radios the second gate of such a transistor is used to turn the gain of an amplifier up and down.

## Go further
- [lab-mosfet-nand](../lab-mosfet-nand) — one dual-gate MOSFET as a logic gate.
- [lab-humidity-comb](../lab-humidity-comb) — a gate driven by breath.
