---
level: beginner
age: 12+
prereqs: [pc02-voltage-divider]
teaches: [ntc-thermistor, temperature-sensing, indicator]
---
## What you see
An NTC thermistor in a voltage divider drives an LED indicator. As temperature rises, the thermistor's resistance drops, the divider voltage changes, and the LED responds — brighter when warm, dimmer when cool.

## Try this
1. Run the simulation at room temperature and note the LED brightness and the divider voltage.
2. Increase the temperature and watch the LED get brighter as the NTC resistance falls.
3. Decrease the temperature and observe the LED dimming as the NTC resistance rises.

## What is going on
An NTC (Negative Temperature Coefficient) thermistor is a resistor whose resistance decreases as it gets warmer. Placed in a voltage divider with a fixed resistor, the voltage at the midpoint shifts with temperature. When the NTC is cold, its resistance is high, the midpoint voltage is low, and little current flows through the LED. When it warms up, resistance drops, the midpoint voltage rises, and the LED glows brighter. No microcontroller is needed — the physics does the sensing directly.

## Why it matters
Temperature is one of the most commonly measured quantities in electronics. NTC thermistors are cheap, reliable, and easy to read with just a voltage divider. They appear in thermostats, battery chargers, and overcurrent protection circuits where knowing the temperature decides what happens next.

## Go further
- [pc02-voltage-divider](../pc02-voltage-divider) — the voltage divider principle this circuit relies on.
- [pc54-opamp-follower](../pc54-opamp-follower) — buffer the divider output for a more accurate reading.
- Experiment: swap the NTC and fixed resistor positions in the divider and predict how the LED behavior inverts with temperature.
