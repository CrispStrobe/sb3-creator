---
level: intermediate
age: 12+
prereqs: [lab-dual-gate]
teaches: [nand-gate, dual-gate-mosfet, logic]
---
## What you see
One MOSFET with two gates, two buttons and a red LED placed across the transistor. A yellow LED under the source glows all the time.

## Try this
1. Click **Sim**: the red LED is lit.
2. Press button A. Still lit? Release it and press button B.
3. Press both buttons together. What happens?
4. Write the four cases in a table. Which logic gate is it?

## What is going on
Each button lifts one gate high; released, the gate sits below the source and pinches the channel. The channel only conducts when both gates are high. The red LED is connected across the channel: as long as the channel is shut, the current from the 1 kΩ resistor has to go through the LED. When the channel conducts it takes that current itself, and the LED goes dark. So the LED is off only when A and B are pressed: a NAND gate, the building block from which every other logic gate can be made, here from a single transistor.

## Go further
- [lab-dual-gate](../lab-dual-gate) — the two gates with knobs.
- [pc93-nand-is-universal](../pc93-nand-is-universal) — why NAND can build every other gate.
