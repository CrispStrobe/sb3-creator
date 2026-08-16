---
level: beginner
age: 8+
prereqs: [arduino-01-analog-read-serial]
teaches: [serial-print, continuous-output, analog-input]
---
## What you see
An analog sensor on A0 is read and printed to the serial monitor as fast as possible — a continuous data stream.

## Try this
1. Run the program and watch the sensor values scroll past.
2. Change the wait from 0.01 to 0.1 seconds to slow the output.
3. Remove the wait entirely — the values print at CPU speed.

## What is going on
The original sketch echoes serial data between two ports. In blocks, the adaptation reads an analog sensor and prints the value in a tight loop. The 10 ms wait keeps the output readable.

## Go further
- [arduino-04-serial-call-response](../arduino-04-serial-call-response) — multi-sensor with handshaking.
- [arduino-03-smoothing](../arduino-03-smoothing) — average the readings to reduce noise.
