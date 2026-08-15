---
level: intermediate
age: 12+
prereqs: [37-voltage-divider-basic]
teaches: [zener-diode, voltage-clamping, overvoltage-protection]
---
## What you see
A Zener diode connected in reverse across a load, with a series resistor from the supply. An LED shows the clamped output voltage. No matter how high the input goes, the Zener holds the output at its rated voltage — acting as a ceiling.

## Try this
1. Run the simulation and note the voltage across the Zener and LED.
2. Increase the supply voltage and observe that the output stays clamped at the Zener voltage.
3. Decrease the supply below the Zener voltage and watch the Zener stop conducting — it only clamps when the voltage exceeds its rating.

## What is going on
A Zener diode is designed to conduct in reverse at a specific breakdown voltage. The series resistor absorbs the excess voltage and limits the current through the Zener. As long as the supply exceeds the Zener voltage, the diode clamps the output to a stable value. The LED lights at this clamped voltage, visually confirming the regulation. This is one of the simplest voltage regulation techniques.

## Why it matters
Overvoltage protection is essential in any system where the input voltage is uncertain. Zener clamps protect sensitive components — MCU inputs, sensor lines, communication buses — from spikes that would destroy them.

## Go further
- [52-battery-voltage-divider](../52-battery-voltage-divider) — combine a voltage divider with clamping for safe battery measurement.
- [42-diode-rectifier](../42-diode-rectifier) — see how a regular diode behaves differently from a Zener.
- Experiment: replace the Zener with one rated at a different voltage and predict the new output voltage before running the simulation.
