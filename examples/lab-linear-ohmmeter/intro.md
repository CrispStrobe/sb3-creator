---
level: advanced
age: 14+
prereqs: [lab-wheatstone-bridge]
teaches: [op-amp, constant-current, ohmmeter, linear-scale]
---
## What you see
An op-amp, a 1.5 V cell, a range switch with two resistors, a second switch that picks the resistor to measure (a fixed "mystery" one or a knob), and a meter on the output.

## Try this
1. Click **Sim**. The mystery resistor is connected and the meter reads 3.3: on this range that means 3.3 kΩ.
2. Flip the range switch: 0.33, the same resistor on a ten times larger range.
3. Switch back, pick the knob and turn it slowly from its end: the needle moves in equal steps for equal turns.
4. Turn the knob far: the needle pins past full scale. Change range and read it again.

## What is going on
The op-amp keeps its − input at ground. The range resistor goes from there to the − pole of the cell, so exactly 1.5 V lie across it and a fixed current flows: 1 mA through 1.5 kΩ. That current has to come from somewhere, and the only way in is through the resistor under test, from the op-amp's output. So the output has to rise by that current times the unknown resistance, and the meter shows it. Twice the resistance, twice the reading: a straight scale. An ordinary pointer ohmmeter crowds the high values together at one end; this one does not.

## Go further
- [lab-wheatstone-bridge](../lab-wheatstone-bridge) — measuring a resistor by comparing it with known ones.
- [lab-bridge-meter](../lab-bridge-meter) — the op-amp forcing a current through a meter again.
