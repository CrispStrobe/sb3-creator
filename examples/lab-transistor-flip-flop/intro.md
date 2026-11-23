---
level: intermediate
age: 12+
prereqs: [pc05-npn-switch]
teaches: [flip-flop, positive-feedback, set-reset, memory]
---
## What you see
Two transistors, a red and a green LED, and two buttons. At power-on the green LED is lit. Press SET and red lights — and stays lit after you let go. Press RESET and green comes back.

## Try this
1. Click **Sim**: green is on.
2. Press **SET** briefly. Red on, green off. Let go: nothing changes.
3. Press **SET** again: still red. The circuit already "knows".
4. Press **RESET**: back to green.
5. Hold both buttons, then release one first. Which LED wins?

## What is going on
Each transistor's collector drives the other transistor's base. When Q1 conducts, its collector is low, so Q2 gets no base current and stays off; Q2's collector is then high and keeps feeding Q1. That loop holds itself — positive feedback. A button only has to break the loop for a moment to flip it into the other stable state. This is one bit of memory, the same idea as a cell in static RAM.

## Go further
- [pc59-nor-memory](../pc59-nor-memory) — the same memory made from logic gates.
- [pc05-npn-switch](../pc05-npn-switch) — one transistor as a switch.
