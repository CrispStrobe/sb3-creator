---
level: beginner
age: 10+
prereqs: [pc01-led-resistor]
teaches: [diode, polarity, forward-voltage]
---
## What you see
A signal diode and an LED in series. Current flows through both in the forward direction: the diode drops about 0.7 V and the LED drops about 2 V, leaving the rest across the resistor.

## Try this
1. Click **Sim** and observe the LED lighting up.
2. Check the voltage across the diode — it is about 0.7–0.8 V, not the full supply.
3. Swap the diode around (reverse its anode and cathode). No current flows and the LED goes dark — the diode blocks.

## What is going on
A diode only allows current in one direction: from anode to cathode. In the forward direction it drops a small, nearly fixed voltage (about 0.7 V for a silicon diode, about 2 V for a typical LED). In reverse, it blocks completely. Here the resistor limits the current to about 10 mA. The total voltage drops around the loop add up to the supply: 2.1 V (R) + 0.8 V (diode) + 2.1 V (LED) ≈ 5.0 V.

## Why it matters
Diodes are the simplest one-way valve in electronics. They protect circuits from reversed power supplies, steer current in the right direction, and form the building blocks of rectifiers that convert AC to DC.

## Go further
- [pc22-diode-selector](../pc22-diode-selector) — diodes steering current between two paths.
- [pc34-polarity-protector](../pc34-polarity-protector) — a diode protecting a circuit from reversed polarity.
- Experiment: calculate the current using ideal Vf values (0.7 + 2.0 = 2.7 V drop, leaving 2.3 V across 220 Ω) and compare with the simulated value.
