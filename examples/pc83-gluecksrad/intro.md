---
level: advanced
age: 14+
prereqs: [pc82-mini-roulette]
teaches: [tilt-sensor, shake-trigger, 555-timer, CD4017, game]
---
## What you see
A wheel of fortune: shake the device (tilt sensor) and the LEDs start racing. The shaking motion triggers the 555 timer that drives the chaser. When the sensor settles, the wheel slows and stops at a position. Six LED segments, reset after q6.

## Try this
1. Activate the tilt sensor — the LEDs start running.
2. Sensor settles → the chase slows and stops.
3. The stop position is unpredictable — depends on shake duration and RC decay.

## What is going on
The tilt sensor sits on the 555's reset pin. Shaking produces brief HIGH pulses that enable the timer. The RC network on the control pin brakes the oscillator once the sensor is still. The CD4017 only counts to q5 (q6 triggers reset → 6-position wheel).

## Go further
- [pc82-mini-roulette](../pc82-mini-roulette) — button-triggered version of the same principle.
