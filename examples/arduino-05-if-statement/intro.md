---
level: beginner
age: 8+
prereqs: [arduino-01-analog-read-serial]
teaches: [conditional, threshold, analog-input]
---
## What you see
A potentiometer controls an LED: turn the pot above a threshold and the LED lights up; below the threshold it goes dark. The serial monitor prints the analog reading.

## Try this
1. Run the program and turn the pot — watch the LED snap on and off.
2. Change the threshold from 400 to 200 and see the LED turn on earlier.
3. Add a second threshold for a medium range that blinks the LED.

## What is going on
The program reads the analog pin every 50 ms (0-1023 raw counts). An IF/ELSE block compares the reading to a threshold: above it, the pin drives HIGH; below it, LOW. This is the simplest form of a sensor-controlled output.

## Go further
- [arduino-05-switch-case](../arduino-05-switch-case) — multiple thresholds with named ranges.
- [arduino-05-while-statement](../arduino-05-while-statement) — calibrate the sensor range at runtime.
