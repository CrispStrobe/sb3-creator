---
level: beginner
age: 8+
prereqs: []
teaches: [random, tilt-sensor, conditional, serial-print]
---
## What you see
Tilt the sensor on D6 and the crystal ball answers with a random fortune — one of eight responses printed to the serial monitor. Like a Magic 8-Ball.

## Try this
1. Tilt the sensor and read the fortune on the serial monitor.
2. Tilt again for a different answer (it picks randomly each time).
3. Add more responses by extending the IF chain past 8.

## What is going on
When the tilt sensor activates, the program picks a random number from 1 to 8 and prints the matching response. The randomness comes from pick-random, which on real hardware uses the ADC noise seed. Each tilt gives an independent roll.

## Go further
- [27-led-dice](../27-led-dice) — random LED pattern on a button press.
- [arduino-05-switch-case](../arduino-05-switch-case) — the same IF-chain pattern with sensor ranges.
