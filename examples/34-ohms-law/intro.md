---
level: beginner
age: 8+
prereqs: []
teaches: [ohms-law, resistance, current]
---

## What you see

A power supply, a resistor, and an LED are wired in series. The voltage across
the resistor and the current through the circuit are displayed. This is the
simplest possible complete circuit: a source, a load, and a wire connecting
them.

## Try this

1. Click **Sim** and read the voltage across the resistor and the current
   through the circuit.
2. Change the resistor to a higher value -- double it. The current drops to
   half. The voltage across the LED stays roughly the same.
3. Change the resistor to a lower value -- halve the original. The current
   doubles. This is Ohm's law in action: I = V / R.

## What is going on

Ohm's law says that current equals voltage divided by resistance (I = V / R).
The supply provides a fixed voltage. The LED drops a roughly constant voltage
(about 2 V for a red LED). The remaining voltage falls across the resistor, and
that voltage divided by the resistance gives you the current. Change R and the
current changes in exact inverse proportion. This is not an approximation -- it
is one of the most precisely verified relationships in physics.

## Why it matters

Every circuit calculation starts with Ohm's law. Choosing a resistor for an LED,
sizing a power supply, understanding why a wire heats up -- they all come back
to V = I * R. It is three letters, and it is the foundation of everything else
in electronics.

## Go further

- **Adding resistors together:** [35-series-resistors](../35-series-resistors)
  -- what happens when you put two resistors in a row.
- **The LED without its resistor:**
  [31-no-resistor-led](../31-no-resistor-led) -- why skipping R is destructive.
- **Experiment:** with a fixed resistor, try supply voltages of 3.3 V and 5 V.
  Calculate the expected current for each before you simulate, then check. If
  your prediction is off, remember to subtract the LED's forward voltage first.
