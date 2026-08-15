---
level: beginner
age: 12+
prereqs: [nano01-blink]
teaches: [multitasking, concurrent-scripts, timing]
---
## What you see
Two scripts running at the same time on the Arduino Nano: one blinks an LED at one rate, while the other blinks a second LED at a different rate. Both run independently without interfering with each other.

## Try this
1. Run the program and observe two LEDs blinking at different speeds simultaneously.
2. Change one LED's timing without affecting the other — confirm they stay independent.
3. Add a third script with a third LED and a third timing to see three concurrent blinks.

## What is going on
The cooperative scheduler divides time between the two scripts. Each script runs until it hits a wait, then yields to the other. Because each script tracks its own timing independently, the two LEDs blink at different rates without any explicit coordination. This is how Scratch handles multiple sprites — each has its own script that runs concurrently — and the same model works on a microcontroller.

## Why it matters
Real embedded systems almost always need to do several things at once: blink a status LED, read a sensor, check a button. Cooperative multitasking lets you write each task as a simple, readable script instead of tangling everything into one complex loop. This is the pattern that scales from two LEDs to full embedded applications.

## Go further
- [nano01-blink](../nano01-blink) — single-task blink for comparison.
- [pico03-two-tasks](../pico03-two-tasks) — the same concept on a different microcontroller.
- Experiment: make one task blink very fast (50 ms) and the other very slow (2000 ms) and confirm they do not drift — the scheduler keeps them accurate.
