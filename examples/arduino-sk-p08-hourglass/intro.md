---
level: intermediate
age: 10+
prereqs: [arduino-01-blink]
teaches: [timer, tilt-sensor, led-sequence, state-machine]
---
## What you see
Six LEDs light up one by one over time — a digital hourglass. Tilt the sensor (on D8) to reset the count and start over.

## Try this
1. Run the program and watch the LEDs fill one at a time.
2. Trigger the tilt sensor to reset the hourglass.
3. Change the interval between LED steps from 10 minutes to 10 seconds for testing.

## What is going on
A timer counts elapsed time. Each interval, the next LED in the sequence turns on. When all six are lit, the hourglass is full. Tilting the sensor resets the counter and turns all LEDs off — like flipping a real hourglass. The tilt sensor is a simple switch that opens or closes when tilted past its threshold.

## Go further
- [arduino-05-for-loop](../arduino-05-for-loop) — sequential LED patterns without a timer.
- [14-traffic-light](../14-traffic-light) — timed state transitions between coloured LEDs.
