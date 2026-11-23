---
level: intermediate
age: 12+
prereqs: [pc05-npn-switch, pc93-nand-is-universal]
teaches: [transistor-switch, logic-gates, RTL, NAND, NOR, fan-out]
---
## What you see
Logic gates with no chip at all: six transistors and a handful of resistors. Two buttons, A and B, are the inputs. Four LEDs show NOT A, A NOR B, A OR B and A NAND B.

## Try this
1. Start with both buttons released: red (NOT), yellow (NOR) and blue (NAND) are lit, green (OR) is dark.
2. Press A, then B, then both, and fill in the truth table for each LED.
3. Compare the NOR and the NAND on the board. Both use two transistors. In the NOR they sit side by side, in the NAND one sits on top of the other. That single difference decides which gate you get.
4. Look at the output voltages: a HIGH output is only about 1.8 V, and the NAND's LOW is higher than the NOR's.

## What is going on
A transistor that gets base current pulls its collector down to almost 0 V; one without base current lets the 1 kΩ load pull the collector up. So one transistor is an inverter. Two transistors in parallel pull the output down when either is on: NOT (A OR B) = NOR. Two in series only pull down when both are on: NOT (A AND B) = NAND. The green LED's transistor inverts the NOR output again and turns it into OR. This is how the first integrated logic families were built, and why NAND and NOR alone can build everything.

## Go further
- [pc93-nand-is-universal](../pc93-nand-is-universal): the same gates from a 74HC00 chip.
- [pc05-npn-switch](../pc05-npn-switch): one transistor switching one LED.
