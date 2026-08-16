---
level: advanced
age: 14+
prereqs: [pc81-led-lauflicht]
teaches: [555-timer, CD4017, RC-decay, roulette, randomness]
---
## What you see
A mini roulette: press the button and the LEDs race around the circle. On release the chase slows down and stops at a random position — an electronic wheel of fortune.

## Try this
1. Press the button — the LEDs run fast.
2. Release — the chase slows down and stops.
3. The stop position is "random" (depends on release timing and RC decay curve).

## What is going on
The button activates the 555 via its reset pin. An RC network on the control pin (pin 5) modifies the internal threshold: initially the timer oscillates fast, then the charging capacitor slows the clock rate until the timer stops. The CD4017 holds its last active output — that is the "rolled" position.

## Go further
- [pc83-gluecksrad](../pc83-gluecksrad) — same circuit with a tilt sensor instead of a button.
- [pc81-led-lauflicht](../pc81-led-lauflicht) — the chaser without slowdown.
