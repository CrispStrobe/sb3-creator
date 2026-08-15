---
level: intermediate
age: 12+
prereqs: [pc02-voltage-divider]
teaches: [reference-voltage, loading, source-resistance]
---
## What you see
Three equal 10 kΩ resistors divide a 9 V supply into three equal steps: 6 V, 3 V, and 0 V. A switch connects a 100 kΩ measurement load to the upper 6 V tap.

## Try this
1. Click **Sim** with the switch open. Read the two tap voltages: 6.000 V and 3.000 V — exactly one-third and two-thirds of the supply.
2. Close the switch. The upper tap drops to 5.625 V — the load pulled it down even though 100 kΩ seems like a light load.
3. Change the load resistor to 10 kΩ and watch the tap sag much further.

## What is going on
A resistor divider makes a good voltage reference only if nothing draws current from it. The moment a load connects, it forms a second divider with the source resistance of the tap. Here the source resistance at the upper tap is 10 kΩ ∥ 20 kΩ = 6.67 kΩ, so even a 100 kΩ load pulls the voltage down by 6.25%. The cure is either lower divider resistances (more wasted current) or a buffer amplifier.

## Why it matters
Sensor circuits, ADC references, and bias networks all rely on voltage taps. If you do not account for loading, your readings will be systematically wrong — and the error depends on what is connected, making it hard to debug.

## Go further
- [pc02-voltage-divider](../pc02-voltage-divider) — the two-resistor version without a load.
- [pc40-opamp-threshold](../pc40-opamp-threshold) — an op-amp buffers a reference voltage.
- Experiment: calculate the load resistance that would pull the tap down to exactly 5.0 V.
