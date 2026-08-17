---
level: beginner
age: 8+
prereqs: [18-logic-and-gate]
teaches: [or-logic, boolean-algebra]
---
## What you see
Two push buttons and one LED. The LED turns on when either button is pressed — or when both are pressed. It only goes dark when neither is pressed. This example works on all supported microcontrollers — pick a different device in the toolbar to see the adapted circuit.

## Try this
1. Press just the left button — the LED lights up.
2. Press just the right button — the LED lights up too.
3. Release both and the LED turns off. Press both together — it is on again.

## What is going on
This implements a logical OR gate in software. The MCU reads two input pins and sets the output high when at least one input is high. In Boolean algebra this is Q = A OR B. Compare this with the AND gate: AND requires both, OR requires at least one. Together with NOT, these three operations can build any digital circuit — from an adder to an entire CPU. The difference between AND and OR is just one word in the code, but it changes the behavior completely.

## Why it matters
OR logic shows up everywhere: a laptop wakes when you press the power button OR open the lid. An alarm triggers if the door opens OR the window breaks. Seeing how one word in a condition changes the entire behavior builds a deep understanding of how digital systems make decisions.

## Go further
- [18-logic-and-gate](../18-logic-and-gate) — the AND gate for direct comparison.
- [20-shift-register-binary](../20-shift-register-binary) — combine logic gates to build a counter.
- Experiment: implement XOR — the LED is on when exactly one button is pressed, but off when both are pressed or neither is.
