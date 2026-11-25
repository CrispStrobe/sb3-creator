---
level: intermediate
age: 12+
prereqs: [lab-opamp-blinker, lab-transistor-flip-flop]
teaches: [comparator, positive-feedback, latch, astable, pnp-switch]
---
## What you see
A level crossing for a model railway: two red lamps that blink in turn, a yellow "occupied" light, and two track contacts, ARRIVE and LEAVE.

## What to do
1. Click **Sim**. All lamps are dark: the crossing is clear.
2. Press **ARRIVE**, the contact a train touches before the crossing. The yellow light comes on and the red lamps start to blink in turn.
3. Let go. They keep blinking: the circuit remembers.
4. Press **LEAVE**, the contact behind the crossing. Everything goes dark and stays dark.

## What is going on
The memory is one half of an op-amp used as a comparator. Its output feeds back to its own + input through a resistor, so whichever way the output points, it pulls the input further in the same direction and holds itself there. The contacts just tip it over. While the output is low it switches on a PNP transistor, and that transistor powers a classic two-transistor flasher.

## Go further
- [lab-level-crossing](../lab-level-crossing) — the same job with a NAND latch and a 555.
- [lab-transistor-flip-flop](../lab-transistor-flip-flop) — a latch made from two transistors instead.
