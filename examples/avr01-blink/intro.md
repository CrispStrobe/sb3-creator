---
level: beginner
age: 8+
prereqs: []
teaches: [arduino-uno, gpio, blink]
---
## What you see
An Arduino Uno blinking an LED on pin D13 at 1 Hz — half a second on, half a second off. This is the universal first program for every Arduino board.

## Try this
1. Click **Sim** and watch the LED blink.
2. Change the wait time from 0.5 to 0.1 seconds and see the LED flash five times faster.
3. Change it to 2 seconds and notice how slow blinking feels when you are watching for it.

## What is going on
The program runs a forever loop that toggles digital pin D13 between high and low. When D13 goes high, current flows through the 220 Ω resistor and the LED to ground, lighting it up. The Arduino Uno runs an ATmega328P at 16 MHz — far more power than a blink needs, but the same chip that runs complex projects.

## Why it matters
Blink is the "Hello, World!" of hardware. If the LED blinks, you know the board works, the toolchain works, and you can upload code. Every Arduino project starts here.

## Go further
- [avr03-dual-blink](../avr03-dual-blink) — two LEDs blinking at different rates.
- [01-blink](../01-blink) — the same program on an STC12 microcontroller.
- Experiment: add a second LED on D12 and make it alternate with D13.
