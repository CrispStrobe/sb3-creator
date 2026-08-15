---
level: beginner
age: 10+
prereqs: [pc09-direct-led]
teaches: [voltage-divider, direct-wiring]
---
## What you see
Two equal 10 kΩ resistors in series across a 9 V battery, wired directly without a breadboard. The junction between them sits at exactly 4.5 V.

## Try this
1. Click **Sim** and read the voltage at the junction.
2. Change R2 to 30 kΩ. The junction voltage drops — work out the new value with the formula before you look.
3. Swap R1 and R2 (make R1 = 30 kΩ, R2 = 10 kΩ). The voltage shifts the other way.

## What is going on
This is the same voltage divider as pc02, but drawn with direct wires so you can see there is nothing hidden — just two resistors and the voltage divides in proportion: V_out = V_in × R2 / (R1 + R2). With equal resistors, the junction is always at half the supply.

## Why it matters
Reading a circuit with no breadboard is how you read a schematic — the layout is gone and only the connections remain. If you can follow this circuit, you can follow any voltage-divider schematic in a datasheet.

## Go further
- [pc02-voltage-divider](../pc02-voltage-divider) — the same circuit on a breadboard.
- [pc33-thermistor-divider](../pc33-thermistor-divider) — replace a resistor with a temperature sensor.
- Experiment: what ratio of R1 to R2 gives exactly 3.3 V from a 5 V supply?
