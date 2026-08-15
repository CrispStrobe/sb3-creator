---
level: beginner
age: 8+
prereqs: [12-dual-blink]
teaches: [sequencing, state-machine, multi-output]
---
## What you see
Three LEDs — red, yellow, and green — cycle through the standard traffic light sequence. Green stays on longest, then yellow briefly, then red, then red-and-yellow together before green again. Each phase has its own duration.

## Try this
1. Run the program and watch the sequence: green, yellow, red, red+yellow, green.
2. Change the green phase duration to something shorter and observe the cycle speed up.
3. Try adding a "flashing yellow" phase by toggling the yellow LED a few times before going to green.

## What is going on
A traffic light is a state machine: the system is always in exactly one state (green, yellow, red, or red+yellow), and it transitions to the next state after a fixed time. Each state sets certain outputs high and others low. This is different from blink, where a single output alternates — here, three outputs change in a coordinated pattern. The red+yellow phase before green is common in European traffic lights and gives drivers time to prepare.

## Why it matters
State machines are one of the most powerful ideas in embedded programming. Any system with distinct modes — a washing machine, a vending machine, a robot — is a state machine. This project teaches you to think in states and transitions rather than just "on and off."

## Go further
- [12-dual-blink](../12-dual-blink) — coordinating two LEDs, the simpler prerequisite.
- [13-sos-morse](../13-sos-morse) — another timed sequence, but encoding information.
- Experiment: add a pedestrian button that forces the light to red after a minimum green phase.
