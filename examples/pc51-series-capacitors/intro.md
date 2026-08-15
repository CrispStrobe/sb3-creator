---
level: beginner
age: 12+
prereqs: [pc06-rc-charge]
teaches: [series-capacitance, voltage-sharing, equivalent-capacitance]
---
## What you see
Two capacitors connected in series across a voltage source. The total voltage divides between them, and the combined capacitance is less than either individual capacitor.

## Try this
1. Run the simulation and read the voltage across each capacitor — they add up to the supply voltage.
2. Use equal capacitors and confirm each gets half the supply voltage.
3. Try unequal values (e.g. 10 uF and 47 uF) and observe that the smaller capacitor takes the larger share of voltage.

## What is going on
When capacitors are in series, the same charge sits on every plate. A smaller capacitor needs more voltage to hold that charge (V = Q/C), so it takes a larger share of the total voltage. The equivalent capacitance is always less than the smallest individual capacitor, calculated as 1/C_total = 1/C1 + 1/C2. This is the opposite of resistors in series, which add directly.

## Why it matters
Series capacitors let you build a capacitor that can handle a higher voltage than any single one in the chain. They also appear naturally any time two capacitive elements sit in a signal path, and understanding their voltage sharing prevents one from being overstressed.

## Go further
- [pc06-rc-charge](../pc06-rc-charge) — see how a single capacitor charges through a resistor.
- [pc50-two-stage-rc](../pc50-two-stage-rc) — capacitors in a cascaded filter context.
- Experiment: put a large resistor across one capacitor and observe how the voltage balance shifts over time as one capacitor slowly discharges.
