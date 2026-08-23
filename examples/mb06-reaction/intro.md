---
level: beginner
age: 8+
prereqs: []
teaches: [microbit, buttons, display, variables, loops]
---

# Reaction Game

Press button A as fast as you can after the screen flashes!

## What you see

The micro:bit counts down 3 — 2 — 1, pauses for a moment, then lights up
every LED at once. You have about one second to press button A as many
times as you can. At the end it shows "OK".

## Try this

1. Flash the program to your micro:bit.
2. Watch the countdown on the LED display.
3. When all LEDs light up, press button A rapidly.
4. Try to beat your own score by pressing faster.

## What is going on

The program uses a `REPEAT 20` loop with a 50 ms wait each cycle — that
gives you roughly one second of reaction time. Every time button A is
pressed during that window, the `score` variable goes up by one. The
random pause before the flash prevents you from anticipating the moment.

## Why it matters

Reaction games teach event detection — checking a sensor (the button) on
every pass through a timed loop. This is the same pattern used in real
embedded systems: poll a sensor, decide, act, repeat.

## Go further

- Add button B as a second player and compare scores.
- Change the number of repeats to make the window longer or shorter.
- Show a different pattern instead of all-on to make it harder to spot.
