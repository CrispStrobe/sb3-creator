---
level: beginner
age: 8+
prereqs: [01-blink]
teaches: [active-low, active-high, port-mode]
---
## What you see
Two LEDs on the same board, wired differently. One is active-low (lights up when the pin goes LOW), the other is active-high (lights up when the pin goes HIGH). The program turns both "on" but only one command means the same electrical thing for both.

## Try this
1. Run the program and watch both LEDs light up at the same time.
2. Look at the pin values in the simulator — one pin is 0 (low) and the other is 1 (high), yet both LEDs are on.
3. Swap the wiring style of one LED in the circuit and notice it now behaves in reverse.

## What is going on
The active-low LED is connected between VCC and the pin through a resistor. When the pin goes LOW, current flows from VCC through the LED to the pin, and it lights up. The active-high LED is connected between the pin and ground through a resistor. When the pin goes HIGH, current flows from the pin through the LED to ground. On an 8051, active-low is preferred because the port can sink about 20 mA but can only source around 230 µA — not enough to drive most LEDs brightly.

## Why it matters
Misunderstanding active-low versus active-high is the most common wiring mistake with 8051 chips. Knowing why "on" can mean "pin low" prevents hours of debugging and protects LEDs from being connected without enough current to light them.

## Go further
- [01-blink](../01-blink) — the simplest active-low example.
- [12-dual-blink](../12-dual-blink) — two active-low LEDs alternating.
- Experiment: measure the current through each LED in the simulator and confirm that the active-low LED is much brighter.
