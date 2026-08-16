---
level: beginner
age: 10+
prereqs: [arduino-02-button]
teaches: [touch-sensor, toggle, debounce, state]
---
## What you see
Touch the TTP223 sensor on D2 and the LED on D3 toggles — touch once to turn on, touch again to turn off. A touch lamp with no moving parts.

## Try this
1. Touch the sensor and watch the LED toggle.
2. Touch rapidly — does the toggle keep up, or does it bounce?
3. Change the debounce delay to see the difference between responsive and stable.

## What is going on
The program tracks the previous touch state. When the sensor transitions from not-touched to touched (a rising edge), it flips the LED state. This edge detection prevents the LED from toggling continuously while the sensor is held. The original sketch used a capacitive sensor library; this version uses a TTP223 touch module, which handles the capacitance internally.

## Go further
- [11-toggle-button](../11-toggle-button) — the same toggle pattern with a push button.
- [arduino-02-debounce](../arduino-02-debounce) — debouncing explained.
