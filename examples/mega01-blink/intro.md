---
level: beginner
age: 8+
prereqs: []
teaches: [arduino-mega, gpio, blink]
---
## What you see
An LED on pin D13 of an Arduino Mega blinks on and off once per second. The Mega runs the same blink pattern as the Nano, but on a board with far more pins and memory.

## Try this
1. Run the program and watch the LED blink at 1 Hz.
2. Change the wait time to 100 ms for a fast strobe effect.
3. Move the LED to one of the Mega's higher-numbered pins (e.g. D50) and update the declaration — the Mega has pins the Nano does not.

## What is going on
The Arduino Mega uses an ATmega2560 with 54 digital I/O pins, 16 analog inputs, and 256 KB of flash — much more than the Nano's ATmega328P. But blink works identically: set a pin high, wait, set it low, wait, repeat. The extra capacity matters for larger projects, not for this one. The point is that the same program structure works across different Arduino boards.

## Why it matters
The Mega is the board you reach for when a Nano runs out of pins or memory. Knowing that the same blink program works on both means your skills transfer directly. The difference is scale, not concept.

## Go further
- [mega02-adc-print](../mega02-adc-print) — use the Mega's 16 analog channels.
- [mega03-port-current](../mega03-port-current) — drive 8 LEDs from one port and learn about current limits.
- Experiment: blink LEDs on two different ports simultaneously and confirm the Mega handles both without timing conflicts.
