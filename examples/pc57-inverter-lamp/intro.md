---
level: beginner
age: 12+
prereqs: [pc45-nand-test]
teaches: [inverter, logic-not, lamp-driver]
---
## What you see
A logic inverter (NOT gate) driving a lamp. When the input is high, the lamp is off; when the input is low, the lamp turns on. The output is always the opposite of the input.

## Try this
1. Set the input high and confirm the lamp is off.
2. Set the input low and watch the lamp turn on.
3. Toggle the input rapidly and observe the lamp following in inverse.

## What is going on
A NOT gate outputs the logical complement of its input: high becomes low, low becomes high. The lamp is wired to the output, so it lights when the output is high (input low). This is the simplest possible logic function — one input, one output, always opposite. In this circuit the gate also serves as a driver, sourcing enough current for the lamp that a weak signal alone could not power.

## Why it matters
Inversion is the fundamental building block of digital logic. Every flip-flop, counter, and processor is built from gates, and the inverter is the simplest one. Using a gate as a lamp driver also shows that logic outputs can do real work, not just talk to other logic.

## Go further
- [pc45-nand-test](../pc45-nand-test) — a NAND gate, which includes inversion in a two-input gate.
- [pc59-nor-memory](../pc59-nor-memory) — NOR gates combining inversion with memory.
- Experiment: chain two inverters in series and confirm the output matches the input — double inversion cancels out.
