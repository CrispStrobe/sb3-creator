---
level: beginner
age: 12+
prereqs: [mega01-blink]
teaches: [port-current, led-walker, aggregate-current]
---
## What you see
Eight LEDs connected to one port of the Arduino Mega, lighting up one at a time in sequence like a walking light. The pattern sweeps from pin 0 to pin 7 and repeats.

## Try this
1. Run the program and watch the single LED walk across the row of eight.
2. Modify the code to light two adjacent LEDs at once and observe the pattern.
3. Try lighting all eight LEDs simultaneously and check whether they are dimmer — this reveals the port's total current limit.

## What is going on
Each port on the ATmega2560 groups eight pins that can be written at once using a port register. The program shifts a bit through positions 0-7, lighting one LED at a time. Each pin can source about 20 mA, but the entire port has an aggregate limit (around 100-200 mA depending on the chip). Lighting one LED at a time stays well within limits. Lighting all eight pushes toward the aggregate maximum, which is why they may dim — the chip protects itself by limiting total current.

## Why it matters
Port-level I/O is faster than pin-by-pin writes and essential for driving displays, LED arrays, and parallel buses. Understanding the aggregate current limit prevents overloading the chip — a mistake that can cause dim outputs, unstable behavior, or permanent damage.

## Go further
- [mega01-blink](../mega01-blink) — single-pin output for comparison.
- [mega02-adc-print](../mega02-adc-print) — reading inputs across multiple channels.
- Experiment: add current-limiting resistors of different values to each LED and measure the total port current with a multimeter to find the practical aggregate limit.
