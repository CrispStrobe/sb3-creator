---
level: intermediate
age: 12+
prereqs: []
teaches: [breadboard-layout, strip-connectivity, debugging]
---
## What you see
A simple LED circuit built step by step on a breadboard. The components are placed to show how the internal strips connect: the long power rails run horizontally, the short component strips run vertically, and the centre channel breaks the connection. Getting the layout right is the difference between a working circuit and a frustrating debug session.

## Try this
1. Run the simulation and confirm the LED lights up when the components are placed correctly.
2. Move the LED to the wrong row so it no longer connects to the resistor — observe it going dark.
3. Bridge the centre channel with a jumper wire and verify the connection is restored.

## What is going on
A solderless breadboard has two types of internal connections: power rails (long horizontal strips, usually marked red and blue) and component strips (short vertical groups of five holes). Components plugged into the same strip are electrically connected. The centre channel divides the board into two halves with no connection between them — this is by design, so DIP ICs can straddle it with each pin on its own strip. Most wiring mistakes come from not understanding which holes are connected.

## Why it matters
The breadboard is the standard prototyping tool for electronics. Every circuit in this gallery can be built on one. Understanding its internal layout eliminates the most common source of beginner wiring errors.

## Go further
- [21-resistor-led](../21-resistor-led) — the circuit this layout exercise is based on.
- [22-series-parallel](../22-series-parallel) — a more complex layout with series and parallel paths on the breadboard.
- Experiment: build a circuit with two LEDs on opposite sides of the centre channel, sharing a common ground rail, and verify both light up.
