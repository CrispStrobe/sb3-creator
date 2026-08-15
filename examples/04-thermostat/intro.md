---
level: intermediate
age: 12+
prereqs: [03-night-light]
teaches: [thermistor, hysteresis, control-loop]
---
## What you see
A "heater" LED turns on when the temperature drops below a low threshold and turns off when it rises above a high threshold. An NTC thermistor in a voltage divider feeds the ADC, and the gap between the two thresholds prevents the heater from flickering on and off at the boundary.

## Try this
1. Run the program and adjust the thermistor value. The heater LED turns on when it gets cold and off when it warms up.
2. Notice the heater does not turn off at the same temperature it turned on — there is a gap. That is hysteresis.
3. Widen or narrow the hysteresis band in the code and observe how it changes the switching behaviour.

## What is going on
An NTC thermistor's resistance falls as temperature rises. In the voltage divider, this produces a higher ADC reading when it is warm and a lower one when cold. A naive threshold would cause the heater to chatter on and off rapidly near the set point. Hysteresis solves this: the program uses two thresholds — a lower one to turn the heater on and a higher one to turn it off. Between those two values the heater stays in whatever state it was already in. This dead band eliminates jitter.

## Why it matters
Every thermostat, fridge, and HVAC system uses hysteresis. Without it, a relay or compressor would cycle hundreds of times per minute near the set point, wasting energy and destroying the hardware. This pattern applies to any on/off controller, not just temperature.

## Go further
- [03-night-light](../03-night-light) — the simpler version without hysteresis for comparison.
- [10-motor-speed](../10-motor-speed) — proportional analog control instead of on/off.
- Experiment: add a second LED that blinks when the temperature is inside the hysteresis band, showing the "dead zone."
