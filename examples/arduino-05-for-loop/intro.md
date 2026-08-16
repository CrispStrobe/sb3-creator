---
level: beginner
age: 8+
prereqs: [arduino-01-blink]
teaches: [for-loop, iteration, led-sequence]
---
## What you see
Six LEDs on pins D2-D7 light one at a time in sequence, then in reverse — a classic chaser pattern driven by a counted loop.

## Try this
1. Run the program and watch the LEDs walk left then right.
2. Change the wait time from 0.1 to 0.05 seconds for a faster chase.
3. Remove the reverse pass and make the chase always go in one direction.

## What is going on
A REPEAT loop turns each LED on for a short time, then off, before moving to the next. The forward pass lights D2 through D7; the reverse pass lights them D7 through D2. Each LED is on for exactly one wait period, so only one is lit at any moment.

## Go further
- [arduino-05-arrays](../arduino-05-arrays) — the same LEDs in a custom order.
- [30-multi-led-pattern](../30-multi-led-pattern) — multiple LEDs at once.
