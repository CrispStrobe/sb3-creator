---
level: beginner
age: 8+
prereqs: [pc01-led-resistor]
teaches: [series-resistance, voltage-drop]
---
## What you see
A green LED powered through two resistors in series — 1 kΩ and 2 kΩ. The LED is dimmer than in pc01 because the total resistance is higher.

## Try this
1. Click **Sim** and note the voltage at each junction: after R1, after R2, and across the LED.
2. Add up the three voltage drops — they should equal the 5 V supply (Kirchhoff's voltage law).
3. Change R2 to 0 Ω (a wire). The LED gets brighter and the current matches pc01's single-resistor value.

## What is going on
Resistors in series add up: R_total = 1 kΩ + 2 kΩ = 3 kΩ. The current is (5 V − 2 V) / 3 kΩ = 1.0 mA. Each resistor drops voltage in proportion to its resistance — R1 drops 1.0 V and R2 drops 2.0 V. The LED still gets its ~2 V forward voltage; the rest is shared between the resistors.

## Why it matters
Putting resistors in series is how you build a value you do not have from values you do. It also shows Kirchhoff's voltage law in action: all the drops around the loop add up to the supply.

## Go further
- [pc02-voltage-divider](../pc02-voltage-divider) — two resistors without an LED, focusing on the junction voltage.
- [pc04-parallel-leds](../pc04-parallel-leds) — resistors in parallel instead of series.
- Experiment: predict the current for R1 = 470 Ω, R2 = 330 Ω, then simulate to check.
