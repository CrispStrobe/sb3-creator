---
level: advanced
age: 14+
prereqs: [pc08-diode-polarity, pc02-voltage-divider]
teaches: [zener-diode, voltage-regulation, clamping]
---
## What you see
A zener diode clamping the voltage at about 5.1 V despite a 9 V supply. A series resistor drops the excess voltage, and the zener maintains a stable reference regardless of load changes.

## Try this
1. Click **Sim** and read the voltage at the zener node — it should be near 5.1 V.
2. Change the supply voltage from 9 V to 12 V. The zener node barely moves — that is regulation.
3. Reduce the load resistor. More current flows through the load, less through the zener, but the voltage stays the same until the zener runs out of current headroom.

## What is going on
A zener diode is designed to conduct in reverse at a precise voltage — its breakdown voltage. Below that voltage it blocks like any diode; above it, it clamps and holds the voltage constant. The series resistor absorbs the difference between the supply and the zener voltage: (9 V − 5.1 V) / R = the total current, which splits between the zener and the load.

## Why it matters
Zener references are the simplest voltage regulators. They provide a stable voltage for sensor biasing, ADC references, and protection circuits. Understanding how the series resistor interacts with the zener is the key to designing them — too high and the zener starves under load, too low and it overheats with no load.

## Go further
- [pc18-zener-clamp](../pc18-zener-clamp) — a zener used for overvoltage protection.
- [pc37-selectable-reference](../pc37-selectable-reference) — compare with a resistor-divider reference (no regulation).
- Experiment: calculate the maximum load current before the zener drops out of regulation.
