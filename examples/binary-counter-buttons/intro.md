---
level: beginner
age: 10+
prereqs: [01-blink, 11-toggle-button]
teaches: [binary, place-value, procedures]
---
## What you see
Five LEDs show a number from 0 to 31 in binary. Press up to count up, press down to count down. The serial monitor shows the same number in ordinary decimal, so you can check every step.

## Try this
1. Run the program and press up five times. Which LEDs are on? Add up their place values: 4 + 1 = 5.
2. Count down from 0. The LEDs jump to 31 — all five on.
3. Before pressing, predict the pattern for 18, then count there and check.

## What is going on
Each LED is worth twice as much as the one to its right: 1, 2, 4, 8, 16. Any number from 0 to 31 is exactly one combination of them. The procedure `show value` finds that combination the way you would pay with coins: start with the biggest place value, use it if it fits, take it away, and continue with the rest.

Each button press counts once because the program waits for the button to be released before it looks again.

## Why it matters
Everything inside a computer is stored like this — on and off, 1 and 0, each position worth double the last. Five LEDs are five bits; a byte is eight.

## Go further
- [20-shift-register-binary](../20-shift-register-binary) — a binary counter through a shift register, with fewer pins.
- [dice-pips](../dice-pips) — another way to show a number with LEDs.
- Experiment: add a third button that resets the value to 0.
