---
level: beginner
age: 8+
prereqs: [34-ohms-law]
teaches: [series-resistance, voltage-drop]
---

## What you see

Two resistors are wired in series with an LED. The total resistance is the sum
of both resistors, and the current through the circuit is determined by that
total. Voltage probes show how the supply voltage is divided across the two
resistors and the LED.

## Try this

1. Click **Sim** and read the voltage across each resistor and the current
   through the circuit.
2. Add the two resistor voltages and the LED voltage. They should equal the
   supply voltage -- that is Kirchhoff's voltage law.
3. Replace the two resistors with a single resistor whose value equals their
   sum. The current should be exactly the same.

## What is going on

Resistors in series add up. A 220-ohm and a 330-ohm resistor in series behave
exactly like a single 550-ohm resistor. The current is the same through every
part of a series circuit -- there is only one path for it to take. The voltage
splits across the components in proportion to their resistance: the bigger
resistor gets the bigger share of the voltage. This is Kirchhoff's voltage law:
the sum of all voltage drops around a closed loop equals the supply voltage.

## Why it matters

Series resistance is how you fine-tune current when you do not have the exact
resistor value you need. It is also how voltage dividers work, how you read
sensors, and how every resistor ladder DAC produces its output steps.

## Go further

- **Where this starts:** [34-ohms-law](../34-ohms-law) -- Ohm's law with a
  single resistor.
- **Parallel instead of series:**
  [22-series-parallel](../22-series-parallel) -- what changes when resistors
  share the same two nodes instead of chaining end to end.
- **Experiment:** use three resistors of equal value in series. Predict that
  each one drops exactly one-third of the remaining voltage (after the LED
  drop). Simulate and verify.
