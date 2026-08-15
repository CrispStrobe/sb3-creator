---
level: beginner
age: 8+
prereqs: []
teaches: [digital-output, gpio, delay, led]
---
## What you see
An LED on pin D13 blinks on and off once per second. This is the Arduino "Hello World" — if your LED blinks, your board works.

## Try this
1. Run the program and watch the LED blink at 1 Hz.
2. Change the wait time from 1 second to 0.1 seconds — the blink speeds up.
3. Try 2 seconds on, 0.5 seconds off — an asymmetric pattern.

## What is going on
The Arduino sets pin D13 HIGH (5 V), which pushes current through the resistor and the LED. After one second it sets the pin LOW (0 V), and the LED turns off. The forever loop repeats this indefinitely. Pin 13 on most Arduinos also drives the built-in LED, so you can see the blink even without an external LED.

## Why it matters
Blink proves the toolchain works end-to-end: code compiles, uploads, runs, and drives hardware. Every Arduino project starts here.

## Go further
- [arduino-01-fade](../arduino-01-fade) — control brightness with PWM instead of just on/off.
- [arduino-01-digital-read-serial](../arduino-01-digital-read-serial) — read a button instead of driving an LED.
