---
level: intermediate
age: 12+
prereqs: [pc45-nand-test]
teaches: [nor-latch, memory-element, set-reset]
---
## What you see
Two NOR gates cross-coupled to form an SR latch. The circuit remembers which button was pressed last — Set or Reset — and holds that state even after the button is released.

## Try this
1. Press the Set button briefly and observe the output LED turn on and stay on.
2. Press the Reset button briefly and observe the output LED turn off and stay off.
3. Press neither button — the output holds its last state. This is memory.

## What is going on
Each NOR gate's output feeds into the other gate's input, creating a feedback loop. When you pulse Set, it forces one gate's output low, which makes the other gate's output high — and that high feeds back to keep the first gate's output low even after Set is released. The circuit has two stable states and stays in whichever one it was last pushed into. This is the simplest form of digital memory: one bit, stored in two gates.

## Why it matters
Every register, every byte of SRAM, and every flip-flop in a computer is built from cross-coupled gates. The SR latch is where digital memory begins. Understanding it makes flip-flops, counters, and eventually entire CPUs less mysterious — they are all built from this pattern, scaled up.

## Go further
- [pc45-nand-test](../pc45-nand-test) — the individual gate behavior that makes latches possible.
- [pc57-inverter-lamp](../pc57-inverter-lamp) — a single gate with no memory for comparison.
- Experiment: press both Set and Reset simultaneously and observe the forbidden state — both outputs go low, and the outcome when you release both is unpredictable. This is why real circuits avoid it.
