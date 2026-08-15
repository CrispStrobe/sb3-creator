---
level: beginner
age: 12+
prereqs: [pico01-blink]
teaches: [multitasking, concurrent-scripts]
---
## What you see
Two scripts running concurrently on the Raspberry Pi Pico: one blinks an LED at one rate while the other blinks a second LED at a different rate. Both scripts execute independently on the same core.

## Try this
1. Run the program and observe two LEDs blinking at different speeds.
2. Change one script's timing and confirm the other is unaffected.
3. Try adding a third concurrent task — the scheduler handles it the same way.

## What is going on
The cooperative scheduler runs both scripts on a single core, switching between them at each wait point. Each script tracks its own deadline, so the two blink rates stay independent. The Pico has two cores, but the scheduler does not need the second one for this — cooperative multitasking works by sharing time within one core. The second core is available for truly parallel work if needed later.

## Why it matters
Concurrent tasks are the natural way to express embedded behavior: one task reads a sensor, another updates a display, a third checks for user input. The Pico's scheduler makes this as easy as writing separate Scratch scripts. The concept is identical to the Nano's multitasking, showing that the programming model is portable across hardware.

## Go further
- [pico01-blink](../pico01-blink) — single-task starting point.
- [nano03-two-tasks](../nano03-two-tasks) — the same concept on the Arduino Nano.
- Experiment: make one task print to serial while the other blinks an LED, and confirm both work smoothly without timing glitches.
