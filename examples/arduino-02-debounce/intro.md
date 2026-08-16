---
level: intermediate
age: 12+
prereqs: [arduino-02-button]
teaches: [debounce, edge-detection, button, toggle]
---
## What you see
A pushbutton toggles an LED — press once to turn on, press again to turn off. Software debouncing prevents the mechanical contact bounce from causing multiple toggles per press.

## Try this
1. Press the button and watch the LED toggle cleanly once per press.
2. Remove the debounce delay and press the button — the LED may flicker or toggle twice.
3. Change the debounce time from 50 ms to 10 ms — at what point does bounce get through?

## What is going on
A mechanical button doesn't make clean contact — it bounces for a few milliseconds, producing multiple rapid edges. Without debouncing, each bounce looks like a separate press. The program ignores any change within 50 ms of the last accepted change, filtering the bounce. Only after the signal has been stable for the debounce period does it count as a real press.

## Go further
- [arduino-02-button](../arduino-02-button) — the un-debounced version.
- [11-toggle-button](../11-toggle-button) — the same toggle pattern on the STC12.
