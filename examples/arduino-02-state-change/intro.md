---
level: intermediate
age: 12+
prereqs: [arduino-02-button]
teaches: [edge-detection, state-change, counting, serial-print]
---
## What you see
The program counts how many times the button on D2 has been pressed and prints the count. It reacts to the transition from released to pressed (a rising edge), not to the held state.

## Try this
1. Press the button several times and watch the count increment in the serial monitor.
2. Hold the button down — the count does not keep climbing (edge, not level).
3. Every 4th press, the LED on D13 toggles — change 4 to 2 for faster toggling.

## What is going on
The program remembers the previous button state. Each loop pass, it compares the current reading to the previous one. If the button went from LOW to HIGH (a rising edge), it increments the counter and prints. If the button is held HIGH or was already HIGH, nothing happens. This is edge detection — the same principle interrupts use in hardware.

## Go further
- [arduino-02-debounce](../arduino-02-debounce) — add bounce filtering to the edge detection.
- [26-debounce](../26-debounce) — debounced counting on the STC12.
