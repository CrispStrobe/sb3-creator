---
level: intermediate
age: 12+
prereqs: [51-555-astable]
teaches: [555-timer, astable, potentiometer, frequency-control]
---
## What you see
A 555 timer in astable mode as an adjustable metronome. A potentiometer controls the frequency: fully clockwise for a fast click, counter-clockwise for a slow tick.

## Try this
1. Click **Sim** — the buzzer ticks at a rate set by the pot position.
2. Turn the pot fully clockwise — the ticking speeds up.
3. Turn it back — the ticking slows down.

## What is going on
In astable mode the 555 oscillates freely between charging and discharging the capacitor. The frequency is f = 1.44 / ((R₁ + 2·R_pot) × C). The potentiometer changes R₂ and therefore the charge/discharge time.

## Go further
- [51-555-astable](../51-555-astable) — the basic astable 555 circuit.
- [pc67-555-tongenerator](../pc67-555-tongenerator) — higher frequency, an audible tone instead of clicks.
- [ttl-clock-module](../ttl-clock-module) — a full clock module based on the 555.
