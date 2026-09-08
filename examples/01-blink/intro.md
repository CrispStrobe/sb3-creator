---
level: beginner
age: 8+
prereqs: []
teaches: [mcu-basics, gpio, active-low]
---
## What you see
An LED blinks on and off once per second. The microcontroller runs a forever loop that toggles the pin, waiting 500 ms between each change. This example works on all supported microcontrollers — pick a different device in the toolbar to see the adapted circuit.

## Try this
1. Run the program and watch the LED blink at 1 Hz.
2. Change the wait time from 500 ms to 100 ms and observe how the blink speeds up.
3. Swap the first `turn on LED` and `turn off LED` — on this STC12 bench the pattern inverts because its LED is wired active-low.

## What is going on
On the authored STC12 bench, the LED is wired from the supply through a resistor to P1.0. LOW completes that active-low path. When you choose another device, the retargeter may instead generate an active-high pin-to-ground path; `turn on` and `turn off` keep their logical meanings either way.

## Why it matters
Blink is the "Hello World" of embedded programming. If your LED blinks, you know the chip is running, the clock is correct, and your pin assignment works. Every MCU project starts here.

## Go further
- [12-dual-blink](../12-dual-blink) — blink two LEDs in alternation.
- [06-active-low-high](../06-active-low-high) — see both wiring styles side by side.
- [56-logical-on-pin-level](../56-logical-on-pin-level) — compare logical LED state with the electrical pin level on different chips.
- Experiment: try a 2-second period (1000 ms on, 1000 ms off) and confirm the timing with a stopwatch.
