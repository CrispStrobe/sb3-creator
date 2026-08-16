---
level: beginner
age: 8+
prereqs: [arduino-01-analog-read-serial]
teaches: [potentiometer, serial-print, analog-input]
---
## What you see
A potentiometer on A0 is read and printed to the serial monitor continuously. Turn the knob and watch the number change from 0 to 1023.

## Try this
1. Turn the pot slowly and watch the value change smoothly.
2. Change the wait time to 100 ms for slower updates.
3. Add a formula to convert the raw reading to a percentage: (reading * 100) / 1023.

## What is going on
The ADC converts the pot's wiper voltage to a 10-bit number (0-1023). The program reads it and prints it in a tight loop. The original Starter Kit sketch sent the value to a Processing sketch that animated the Arduino logo — this version prints to the serial monitor instead.

## Go further
- [arduino-03-analog-input](../arduino-03-analog-input) — use the pot reading to control blink timing.
- [arduino-03-analog-in-out-serial](../arduino-03-analog-in-out-serial) — map the pot to LED brightness.
