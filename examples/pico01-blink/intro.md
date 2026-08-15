---
level: beginner
age: 8+
prereqs: []
teaches: [raspberry-pi-pico, gpio, blink]
---
## What you see
An LED on a GPIO pin of the Raspberry Pi Pico blinks on and off once per second. The Pico runs the same blink logic as other boards, but on an ARM Cortex-M0+ processor with dual cores.

## Try this
1. Run the program and watch the LED blink at 1 Hz.
2. Change the wait time to 250 ms and observe the faster blinking.
3. Switch the LED to a different GPIO pin and update the pin declaration.

## What is going on
The Raspberry Pi Pico uses the RP2040 chip with 26 GPIO pins and a 133 MHz dual-core ARM processor. The blink program sets a pin high, waits, sets it low, and waits — the same pattern as on any other microcontroller. The Pico runs at 3.3 V logic levels, not 5 V like the Arduino boards, so LEDs and peripherals must be compatible with 3.3 V. The built-in LED on the Pico is on GPIO 25 (Pico) or directly connected to the wireless chip (Pico W).

## Why it matters
The Pico brings modern ARM processing power at a very low cost. It runs MicroPython, C/C++, and now Brickwright pseudocode. Starting with blink confirms the board works and establishes the foundation for more complex projects using its dual cores, PIO state machines, and rich peripheral set.

## Go further
- [pico02-pot-print](../pico02-pot-print) — read an analog input on the Pico.
- [pico04-button](../pico04-button) — respond to button presses.
- Experiment: try blinking at 1 ms intervals and use a scope or fast camera to see if the LED actually toggles that fast — the Pico is fast enough to do it.
