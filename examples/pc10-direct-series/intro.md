---
level: beginner
age: 8+
prereqs: [pc09-direct-led]
teaches: [series-leds, voltage-sharing]
---
## What you see
Two LEDs in series — red and green — powered through a 470 Ω resistor from a 9 V battery. Both light up, sharing the available voltage.

## Try this
1. Click **Sim** and confirm both LEDs are lit.
2. Check the voltage across each LED — both are near 2 V.
3. Remove one LED (disconnect it). The remaining LED gets brighter because it no longer shares the voltage budget.

## What is going on
In a series chain, the same current flows through every part. Each LED needs about 2 V, so together they need 4 V. The resistor gets the remaining 5 V, setting the current to 5 V / 470 Ω ≈ 10.6 mA. You can only stack LEDs in series if the supply voltage is higher than the sum of their forward voltages — here 9 V is enough for two, but not for four.

## Why it matters
LED strips use series strings to share one current-limiting resistor, saving parts and power. Knowing how many LEDs you can chain before running out of voltage is essential for designing them.

## Go further
- [pc09-direct-led](../pc09-direct-led) — start with a single LED.
- [pc11-direct-parallel](../pc11-direct-parallel) — the alternative: two LEDs side by side.
- Experiment: how many 2 V LEDs can you stack in series with 9 V before the current drops to near zero?
