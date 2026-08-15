---
level: beginner
age: 8+
prereqs: [avr01-blink]
teaches: [multitasking, concurrent-scripts, timing]
---
## What you see
Two LEDs blinking at different rates — one fast, one slow. Both run at the same time on one Arduino, each driven by its own script.

## Try this
1. Click **Sim** and watch both LEDs. They blink independently.
2. Change one LED's timing without affecting the other — that is the proof they run concurrently.
3. Set both to the same rate and watch them synchronize.

## What is going on
The program has two `WHEN flag clicked` scripts, each running its own forever loop with its own timing. The cooperative scheduler gives each script time to run: when one script waits, the other gets a turn. This is how Scratch-style concurrency works — not true parallel execution, but interleaved scripts that appear simultaneous.

## Why it matters
Real embedded systems almost always need to do multiple things at once — blink a status LED while reading a sensor, or drive a motor while watching a button. Cooperative multitasking is the simplest way to achieve this without a full operating system.

## Go further
- [avr06-blink-and-print](../avr06-blink-and-print) — one script blinks, the other prints sensor data.
- [12-dual-blink](../12-dual-blink) — the same concept on an STC12 microcontroller.
- Experiment: add a third LED on D11 with a third timing value.
