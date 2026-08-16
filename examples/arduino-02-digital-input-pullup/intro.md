---
level: beginner
age: 10+
prereqs: [arduino-02-button]
teaches: [internal-pullup, digital-input, inverted-logic]
---
## What you see
A button on D2 drives an LED — but with no external pull-up resistor. The Arduino's internal pull-up keeps the pin HIGH when the button is open; pressing connects it to ground (LOW). The logic is inverted: pressed = LOW = LED on.

## Try this
1. Press the button and watch the LED respond (it lights when pressed, not released).
2. Swap the IF logic to make the LED turn off on press instead.
3. Compare with arduino-02-button — that version needs an external resistor; this one does not.

## What is going on
Every Arduino digital pin has a built-in ~20 kOhm pull-up resistor that can be enabled in software. When enabled, the pin reads HIGH by default. The button connects the pin to ground when pressed, pulling it LOW. This saves a resistor but inverts the logic: pressed is 0, not 1. Understanding this is essential because most real-world buttons are wired active-low.

## Go further
- [arduino-02-button](../arduino-02-button) — external pull-down, non-inverted logic.
- [06-active-low-high](../06-active-low-high) — the active-low lesson with LEDs.
