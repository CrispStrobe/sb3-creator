---
level: beginner
age: 8+
prereqs: []
teaches: [mcu-basics, gpio, active-low]
---
## What you see
An LED on pin P1.0 blinks on and off once per second. The STC12 microcontroller runs a forever loop that toggles the pin, waiting 500 ms between each change.

## Try this
1. Run the program and watch the LED blink at 1 Hz.
2. Change the wait time from 500 ms to 100 ms and observe how the blink speeds up.
3. Try changing `turn on LED` to `turn off LED` as the first step — the pattern inverts because the LED is wired active-low.

## What is going on
The LED is wired between the supply voltage and pin P1.0 through a resistor. When the MCU drives the pin LOW (0), current flows through the LED and it lights up. When the pin goes HIGH (1), both sides are at the same voltage and no current flows. This is called active-low wiring — "turn on" actually pulls the pin to ground. The 8051's quasi-bidirectional ports can sink far more current than they can source, so active-low is the standard way to drive LEDs on these chips.

## Why it matters
Blink is the "Hello World" of embedded programming. If your LED blinks, you know the chip is running, the clock is correct, and your pin assignment works. Every MCU project starts here.

## Go further
- [12-dual-blink](../12-dual-blink) — blink two LEDs in alternation.
- [06-active-low-high](../06-active-low-high) — see both wiring styles side by side.
- Experiment: try a 2-second period (1000 ms on, 1000 ms off) and confirm the timing with a stopwatch.
