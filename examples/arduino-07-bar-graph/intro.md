---
level: intermediate
age: 12+
prereqs: [arduino-03-analog-input]
teaches: [bar-graph, led-array, analog-mapping, threshold-levels]
---
## What you see
A row of LEDs acts as a bar graph: an analog sensor reading on A0 maps to how many LEDs are lit. Higher reading = more LEDs. Like a VU meter or battery level indicator.

## Try this
1. Change the analog stimulus from low to high and watch the bar fill up.
2. Change the number of LEDs in the bar for finer or coarser resolution.
3. Add hysteresis so the bar doesn't flicker at boundary values.

## What is going on
The analog reading (0-1023) is divided into as many levels as there are LEDs. Each LED has a threshold: if the reading exceeds its threshold, the LED is on; otherwise off. The result is a proportional display — a row of LEDs encoding a number visually.

## Go further
- [16-ldr-bargraph](../16-ldr-bargraph) — bar graph driven by a light sensor on the STC12 platform.
- [arduino-03-analog-in-out-serial](../arduino-03-analog-in-out-serial) — map analog input to a single PWM LED.
