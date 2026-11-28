---
level: advanced
age: 14+
prereqs: [pc81-led-lauflicht]
teaches: [tilt-sensor, 555-timer, CD4017, hourglass, sequential-fill]
---
## What you see
An LED hourglass: six LEDs fill up one by one — like grains of sand falling. A 555 timer clocks the CD4017 at ~1 Hz. Return the sensor to level to clear the LEDs, then tilt it again to restart.

## Try this
1. Click **Sim** and tilt the sensor. The LEDs fill one per second.
2. After six seconds all are lit — the hourglass is "full."
3. Return the sensor to level. All LEDs go dark until you tilt it again.

## What is going on
The 555 in astable mode (R₁=10 kΩ, R₂=68 kΩ, C=10 µF → f ≈ 1 Hz) clocks the CD4017. Each count from Q1 through Q6 powers one additional LED through the diode matrix. Q7 resets the counter to the dark Q0 state. The level sensor can also hold the counter at Q0.

## Go further
- [pc81-led-lauflicht](../pc81-led-lauflicht) — chaser instead of fill.
- [pc63-555-bistabil](../pc63-555-bistabil) — the timer as a memory element.
