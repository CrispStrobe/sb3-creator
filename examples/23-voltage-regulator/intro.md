---
level: beginner
age: 8+
prereqs: [21-resistor-led]
teaches: [zener-diode, voltage-regulation]
---
## What you see
A Zener diode holds the output voltage steady even though the input voltage might vary. A resistor connects VCC to the Zener, which is wired in reverse (cathode to the resistor). The voltage across the Zener stays at its rated value — typically 3.3 V or 5.1 V.

## Try this
1. Run the simulation and measure the voltage across the Zener diode — it should match its rated voltage.
2. Change the input voltage (VCC) up or down and observe that the Zener voltage barely changes.
3. Try replacing the Zener with a regular diode and see that the regulation disappears.

## What is going on
A Zener diode is designed to conduct in reverse at a specific voltage called the breakdown voltage. The series resistor limits current so the Zener is not destroyed. When the input voltage exceeds the Zener voltage, the diode clamps the output to its rated value by absorbing the excess current. If the input drops below the Zener voltage, the diode stops conducting and the output follows the input. This creates a simple but effective voltage regulator.

## Why it matters
Many circuits need a stable voltage even when the power supply fluctuates. Microcontrollers, sensors, and communication chips all have maximum voltage ratings. A Zener regulator is the simplest way to protect them. Understanding voltage regulation is essential before building any circuit that mixes components with different voltage requirements.

## Go further
- [21-resistor-led](../21-resistor-led) — the simplest circuit to start with.
- [22-series-parallel](../22-series-parallel) — understanding resistor combinations helps calculate the series resistor for a Zener circuit.
- Experiment: calculate the maximum current the Zener must handle if VCC is 12 V, the Zener is 5.1 V, and the series resistor is 330 ohms. Check your answer in the simulation.
