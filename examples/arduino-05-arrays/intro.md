---
level: beginner
age: 10+
prereqs: [arduino-01-blink]
teaches: [arrays, sequential-control, led-patterns]
---
## What you see
Six LEDs on pins D2-D7 light up one at a time in a pattern, cycling through different sequences.

## Try this
1. Run the program and watch the LED sequence.
2. Change the order of the turn-on/turn-off statements to create your own chaser pattern.
3. Change the wait times to speed up or slow down the animation.

## What is going on
The original Arduino sketch stores pin numbers in an array and loops through them. In blocks, this becomes a sequence of turn-on/turn-off pairs for each LED. The pattern walks through the LEDs in a fixed order, with a short delay between each step.

## Go further
- [arduino-05-for-loop](../arduino-05-for-loop) — the same LED walk expressed as a counted loop.
- [08-led-chaser-595](../08-led-chaser-595) — drive 8 LEDs from 3 pins using a shift register.
