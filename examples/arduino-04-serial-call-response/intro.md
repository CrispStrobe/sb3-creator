---
level: intermediate
age: 12+
prereqs: [arduino-01-analog-read-serial]
teaches: [serial-print, multi-sensor, call-response]
---
## What you see
Two potentiometers on A0 and A1 and a button on D2 are read continuously, with values printed to the serial monitor.

## Try this
1. Turn pot A0 and watch its value change in the serial output.
2. Press the button and see the digital reading flip.
3. Add a third print line for a new sensor on A2.

## What is going on
The program reads two analog channels and one digital input in a loop, printing each value. The original sketch implements call-and-response serial handshaking; this version prints freely.

## Go further
- [arduino-04-serial-passthrough](../arduino-04-serial-passthrough) — single-channel continuous print.
- [pico03-two-tasks](../pico03-two-tasks) — two independent sensor loops running concurrently.
