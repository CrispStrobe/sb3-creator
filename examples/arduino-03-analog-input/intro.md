---
level: beginner
age: 8+
prereqs: [arduino-01-analog-read-serial]
teaches: [analog-input, variable-timing, potentiometer]
---
## What you see
A potentiometer on A0 controls how long an LED stays on each blink — turn the pot and the blink rate changes in real time.

## Try this
1. Turn the pot to one extreme and watch the LED blink fast; turn it the other way for slow blinks.
2. Change the divisor from 1000 to 500 to double the blink speed range.
3. Add a print statement to see the raw sensor value in the serial monitor.

## What is going on
The program reads the pot (0-1023), divides by 1000 to get a wait time in seconds, then blinks the LED with that delay. At the pot minimum the LED blinks instantly; at maximum it stays on for about 1 second. This is the simplest analog-to-timing conversion.

## Go further
- [arduino-03-analog-in-out-serial](../arduino-03-analog-in-out-serial) — map analog input to PWM brightness.
- [arduino-03-fading](../arduino-03-fading) — automatic fade without a sensor.
