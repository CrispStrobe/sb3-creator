---
level: beginner
age: 8+
prereqs: []
teaches: [voltage-divider, resistor-ratio]
---
## What you see
Two resistors connected in series between VCC and ground, with a probe point between them. The voltage at the midpoint is a fraction of the supply, determined by the resistor ratio. No active components — just passive voltage scaling.

## Try this
1. Run the simulation and read the voltage at the midpoint between the two resistors.
2. Change the top resistor to a higher value and observe the midpoint voltage drop.
3. Make both resistors equal and confirm the midpoint sits at exactly half the supply voltage.

## What is going on
A voltage divider splits the supply voltage proportionally across two resistors. The output voltage is Vout = VCC * R2 / (R1 + R2), where R2 is the bottom resistor. No current is drawn from the midpoint in this circuit, so the formula holds exactly. This is the simplest way to produce a voltage lower than your supply without a regulator.

## Why it matters
Voltage dividers appear everywhere — in sensor interfaces, feedback networks, and level shifters. Understanding this ratio is the first step toward reading analog signals with a microcontroller.

## Go further
- [52-battery-voltage-divider](../52-battery-voltage-divider) — use a divider to measure a battery voltage that exceeds the MCU's input range.
- [41-pot-as-dimmer](../41-pot-as-dimmer) — replace the fixed resistors with a potentiometer for a continuously adjustable divider.
- Experiment: calculate the resistor values needed to produce exactly 3.3 V from a 5 V supply, then verify in the simulation.
