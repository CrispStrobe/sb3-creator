---
level: beginner
age: 10+
prereqs: [arduino-01-blink]
teaches: [digital-input, button, pull-down-resistor, serial-print]
---
## What you see
A pushbutton connected to pin D2 with a pull-down resistor. The program reads the button state and prints 0 or 1 to the serial terminal.

## Try this
1. Run the program — the terminal shows 0 (button not pressed).
2. Press the button — the terminal shows 1.
3. Remove the pull-down resistor and observe: the readings become unpredictable when the button is released (a floating input).

## What is going on
When the button is pressed, it connects D2 to 5 V through the button, so digitalRead returns HIGH (1). When released, the 10 kΩ pull-down resistor holds D2 at 0 V, so digitalRead returns LOW (0). Without the resistor, the pin floats — it picks up noise and reads randomly.

## Why it matters
Buttons are the simplest digital input. Understanding pull-down (and pull-up) resistors is essential — every digital input needs a defined state when nothing is driving it.

## Go further
- [arduino-01-analog-read-serial](../arduino-01-analog-read-serial) — read an analog value instead of digital.
- Experiment: try a pull-UP resistor (button to GND, resistor to 5V) — the logic inverts.
