---
level: beginner
age: 8+
prereqs: []
teaches: [mcu-basics, gpio, atmega168p]
---
## What you see
An LED on a pin blinks on and off once per second, just like the classic 01-blink example. The difference is the chip: this runs on an ATmega168P, the microcontroller inside many Arduino boards, instead of an STC12.

## Try this
1. Run the program and confirm the LED blinks at a steady 1 Hz rhythm.
2. Change the wait time to 200 ms and watch the blink speed up.
3. Compare this code side by side with 01-blink — notice how the logic is identical but the pin names and chip declaration differ.

## What is going on
The ATmega168P is an AVR microcontroller commonly found in Arduino Nano and older Arduino Uno boards. It uses different pin names and register conventions than the STC12, but the fundamental idea is the same: toggle a GPIO pin on and off with a delay in between. Brickwright abstracts the chip-specific details behind the same block language, so the program reads almost identically. The DEVICE declaration tells the compiler which chip to target.

## Why it matters
Learning that the same program works on different chips is a key insight. The algorithm does not change — only the hardware details do. This is why high-level languages and abstractions exist: you write the logic once and target different platforms.

## Go further
- [01-blink](../01-blink) — the same program on an STC12 chip for comparison.
- [12-dual-blink](../12-dual-blink) — blink two LEDs in alternation as the next step.
- Experiment: look up the ATmega168P pinout and try blinking a different pin.
