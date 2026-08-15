---
level: beginner
age: 8+
prereqs: []
teaches: [arduino-nano, gpio, blink]
---
## What you see
An LED on pin D13 of an Arduino Nano blinks on and off once per second. The Nano runs a forever loop toggling the pin with 500 ms waits between each change.

## Try this
1. Run the program and watch the LED blink at 1 Hz.
2. Change the wait time from 500 ms to 200 ms and observe the faster blinking.
3. Move the LED to a different pin (e.g. D12) and update the pin declaration to match.

## What is going on
The Arduino Nano is a small microcontroller board based on the ATmega328P. Pin D13 has a built-in LED on most Nano boards, making it the easiest pin to test. The program sets the pin high to light the LED, waits, sets it low to turn it off, and waits again. This repeats forever. Unlike the STC12, the Nano's pins source enough current to drive an LED directly in active-high wiring.

## Why it matters
The Nano is one of the most popular boards for learning embedded programming. If you can blink an LED, you have confirmed that the board is working, the toolchain is set up correctly, and you understand the basic structure of a microcontroller program. Everything more complex builds on this.

## Go further
- [nano02-pot-print](../nano02-pot-print) — read an analog sensor and print values.
- [nano03-two-tasks](../nano03-two-tasks) — run two things at once on the Nano.
- Experiment: connect an external LED with a resistor to a different pin and blink both the built-in and external LEDs in alternation.
