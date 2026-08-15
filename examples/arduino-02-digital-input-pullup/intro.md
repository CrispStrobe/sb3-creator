---
level: beginner
age: 10+
prereqs: [arduino-02-button]
teaches: [internal-pullup, digital-input, inverted-logic]
---
## What you see
Uses the Arduino's internal pull-up resistor on D2 — no external resistor needed. The logic is inverted: pressed=LOW.

## Try this
1. Run the program and observe the behavior.
2. Change a parameter and see how the output changes.
3. Read the "What is going on" section to understand the principle.

## What is going on
This sketch demonstrates a fundamental Arduino programming pattern. See the source comments in the .bw file for the detailed explanation.

## Why it matters
Understanding this pattern is essential for real embedded projects where timing, input handling, and state management matter.

## Go further
- Experiment with different pin numbers and timing values.
- Combine this pattern with other examples for more complex projects.
