---
level: beginner
age: 10+
prereqs: [avr01-blink, avr04-serial-pot]
teaches: [multitasking, concurrent-scripts, serial-output]
---
## What you see
An LED blinks while the serial monitor shows potentiometer readings — two tasks running concurrently on one Arduino. Neither task blocks the other.

## Try this
1. Click **Sim** and watch the LED blink while serial output streams.
2. Turn the pot and see the printed values change without affecting the blink rate.
3. Change the blink timing — the serial output continues at its own pace.

## What is going on
Two `WHEN flag clicked` scripts run cooperatively. The first toggles the LED every 0.5 seconds. The second reads the pot's ADC value and prints it every 0.5 seconds. The scheduler interleaves them at their wait points, so both appear to run simultaneously. This is the same cooperative model as Scratch — each script yields at every wait, and the scheduler picks the next one.

## Why it matters
Real applications almost always combine I/O with display or logging. This example proves the pattern works: sensor reading and status indication run independently, each at its own rate, without complex thread management.

## Go further
- [avr03-dual-blink](../avr03-dual-blink) — two independent blink tasks.
- [nano03-two-tasks](../nano03-two-tasks) — the same pattern on an Arduino Nano.
- Experiment: add a third script that reads a button and prints "pressed" or "released".
