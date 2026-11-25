---
level: beginner
age: 10+
prereqs: [lab-rtl-gates]
teaches: [logic, and, transistor]
---
## What you see
Two transistors stacked in series under a red LED, each with its own button: **A** and **B**.

## Try this
1. Click **Sim**: the LED is dark.
2. Hold **A** alone: still dark. Hold **B** alone: still dark.
3. Hold **A** and **B** together: the LED lights.

## What is going on
The LED's current has to pass through both transistors, one after the other, to reach ground. Each button gives its transistor base current through 10 kΩ and switches it on. One open transistor in the chain is enough to stop the current, so the LED lights only when A AND B are both pressed. That is an AND gate built from two transistors.

## Go further
- [lab-rtl-gates](../lab-rtl-gates) — more logic gates from transistors and resistors.
