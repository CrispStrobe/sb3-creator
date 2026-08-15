---
level: beginner
age: 8+
prereqs: [21-resistor-led]
teaches: [series-circuits, parallel-circuits, comparison]
---
## What you see
Two paths from VCC to ground, side by side. One has two resistors in series; the other has two resistors in parallel. The circuit shows how the same resistors produce different total resistances depending on how they are connected.

## Try this
1. Run the simulation and compare the current in each path — the parallel path carries more.
2. Look at the voltage across each resistor in the series path — they share the supply voltage.
3. Change one resistor in the parallel path and observe how the total current changes more than you might expect.

## What is going on
In a series circuit, current flows through one resistor then the next. The total resistance is the sum: R1 + R2. In a parallel circuit, current has two paths and splits between them. The total resistance is lower than either individual resistor: 1/Rtotal = 1/R1 + 1/R2. With two equal 1k resistors, series gives 2k and parallel gives 500 ohms — a four-to-one difference from the same parts. The voltage divides across series resistors but is the same across parallel ones.

## Why it matters
Series and parallel are the two ways components connect in every circuit. Understanding the difference lets you predict current flow, calculate power dissipation, and design voltage dividers. These rules apply not just to resistors but to capacitors, inductors, and even batteries.

## Go further
- [21-resistor-led](../21-resistor-led) — the single-resistor starting point.
- [23-voltage-regulator](../23-voltage-regulator) — another pure circuit with more complex behavior.
- Experiment: try three resistors — two in parallel, then that combination in series with the third — and calculate the total resistance before checking it in the simulation.
