---
level: intermediate
age: 10+
prereqs: [arduino-05-switch-case]
teaches: [switch-case, led-patterns, sequencing]
---
## What you see
Five LEDs on pins D2-D6 cycle through patterns — each step lights a different LED, then moves to the next. The original sketch reads serial input to choose a pattern; this version cycles automatically.

## Try this
1. Run the program and watch the LEDs step through their sequence.
2. Change the wait from 0.5 to 0.1 seconds for a faster cycle.
3. Try lighting two LEDs at once in one of the steps.

## What is going on
The program cycles through states, and each state turns on a different LED. In C this would be a switch/case on the state variable; in blocks it becomes a chain of IF blocks. The pattern repeats forever, advancing one step per half-second.

## Go further
- [arduino-05-switch-case](../arduino-05-switch-case) — switch on a sensor reading instead of a counter.
- [14-traffic-light](../14-traffic-light) — a state machine with real timing.
