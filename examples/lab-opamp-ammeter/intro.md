---
level: advanced
age: 14+
prereqs: [lab-buffered-voltmeter]
teaches: [ammeter, shunt, amplifier, calibration]
---
## What you see
A small circuit under test (a 4.5 V battery and a 47 Ω resistor) whose current flows back through a 1 Ω sensing resistor. An op-amp amplifier with a "calibrate" knob, a meter, and a switch that feeds the amplifier either from the sensing resistor or from a small voltage made with a red LED.

## Try this
1. Click **Sim**. The meter reads about 4.7: at 20 mA per volt, about 94 mA flow through the circuit.
2. Flip the switch to the calibration voltage: the meter reads 4.34, the value that voltage stands for (87 mA).
3. Turn the calibrate knob a little: the reading moves. Turn it back until it shows 4.34 again, then switch back to measuring.

## What is going on
Every current leaves a small voltage across a resistor in its path. With a resistor of only 1 Ω the circuit hardly notices it, but the voltage is tiny, under a tenth of a volt, so the op-amp multiplies it by about fifty for the meter. How do you check the factor without a big known current? An LED holds an almost fixed voltage across itself, and a divider makes a small, steady voltage from it. If that voltage stands for 87 mA, the knob is turned until the meter reads 87 mA; from then on every current reads right.

## Go further
- [lab-buffered-voltmeter](../lab-buffered-voltmeter) — the op-amp helping the meter measure voltage.
- [lab-linear-ohmmeter](../lab-linear-ohmmeter) — and measuring resistance.
