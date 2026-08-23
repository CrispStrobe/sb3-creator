---
level: intermediate
age: 10+
prereqs: [arduino-01-blink]
teaches: [millis-timing, non-blocking-code, led]
---
## What you see
An LED on D13 blinks at 1 Hz using timer comparison instead of delay — the program never blocks, so other code can run between toggles.

## Try this
1. Run the program and confirm the LED blinks at the same rate as the basic blink.
2. Change the interval from 1000 to 250 ms for a faster blink.
3. Add a second LED on another pin with a different interval — both blink independently because neither blocks.

## What is going on
Instead of `wait 1 second` (which freezes the program), this version checks whether enough time has passed since the last toggle. If yes, it toggles and records the new time. If not, it continues immediately — the loop runs thousands of times per second, but the LED only changes once per interval. This is the foundation of every real-time embedded program.

## The button on D2

The board has a push button wired to D2. **This sketch does not read it** — and
that is the exercise. A `delay()`-based blink cannot notice a press while it is
waiting; this one is free the whole time. Add a read of D2 and confirm the LED
keeps its rhythm exactly while you press.

## Go further
- [arduino-01-blink](../arduino-01-blink) — the blocking version for comparison.
- [12-dual-blink](../12-dual-blink) — two LEDs at different rates using the cooperative scheduler.
