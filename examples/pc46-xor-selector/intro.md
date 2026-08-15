---
level: intermediate
age: 12+
prereqs: [pc45-nand-test]
teaches: [xor-gate, difference-detection, parity]
---
## What you see
An XOR gate with two switches and an LED. The LED lights up when exactly one input is high — it detects "different", not "both" or "either".

## Try this
1. Click **Sim** with both switches open. LED dark — XOR of (0,0) is 0.
2. Close one switch. LED lights — XOR of (0,1) or (1,0) is 1.
3. Close both switches. LED goes dark again — XOR of (1,1) is 0.

## What is going on
XOR (exclusive OR) outputs high when its inputs are different and low when they are the same. This makes it a one-bit comparator: it answers "are these two signals the same?" The pull-down resistors define the low state for each input when its switch is open.

## Why it matters
XOR is the building block of binary addition (the sum bit of a half-adder is an XOR), parity checking (detecting transmission errors), and toggle logic (press once to turn on, again to turn off). It is also used in encryption — XOR with a key is the simplest cipher.

## Go further
- [pc45-nand-test](../pc45-nand-test) — compare with NAND: same switches, different logic.
- [pc28-logic-interlock](../pc28-logic-interlock) — logic gates in a safety circuit.
- Experiment: can you build an XOR from three NAND gates? (Hint: you need four, and it is called the NAND-XOR decomposition.)
