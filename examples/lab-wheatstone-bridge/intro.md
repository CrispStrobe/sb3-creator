---
level: intermediate
age: 12+
prereqs: [pc02-voltage-divider]
teaches: [wheatstone-bridge, null-measurement, ratio]
---
## What you see
Two voltage dividers side by side, one with a known and an unknown resistor, the other a potentiometer. A meter sits between their middle points.

## Try this
1. Click **Sim**. The meter shows a voltage.
2. Turn the potentiometer until the meter reads zero. Note the position.
3. Work out the unknown resistor: position ÷ (1 − position) × 10 kΩ.
4. Switch to the second unknown resistor and balance again.
5. Change the battery voltage. Does the zero move?

## What is going on
Each divider hands its middle point a fraction of the supply. When both fractions are the same, there is no voltage between the middle points and the meter reads zero — whatever the battery voltage. So you never need to trust the meter's scale, only its zero. Strain gauges, scales and many sensors use exactly this bridge.

## Go further
- [pc02-voltage-divider](../pc02-voltage-divider) — one divider.
