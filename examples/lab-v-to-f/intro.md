---
level: advanced
age: 14+
prereqs: [lab-function-generator]
teaches: [voltage-to-frequency, integrator, adc-by-counting, linearity]
---
## What you see
A knob and a flashing LED. Turn the knob up and the LED flashes faster — in proportion to the voltage the knob sets.

## Try this
1. Click **Sim** and count the flashes for a few seconds.
2. Turn the knob halfway up and count again. Then to the top.
3. Turn it all the way down: no flashes at all.
4. Put a scope probe on the integrator output and watch the sawtooth.

## What is going on
The input voltage drives a current into an integrator, so its output ramps down — faster for a larger voltage. When the ramp reaches a lower limit, a Schmitt trigger fires, pulls the ramp back up through a diode and lets go again. The LED flashes once per cycle. Because the ramp always travels the same height, the number of flashes per second follows the input voltage. Count them for a fixed time and you have converted an analog voltage into a number.

## Go further
- [lab-function-generator](../lab-function-generator) — the same integrator and trigger making triangles.
- [lab-2bit-adc](../lab-2bit-adc) — converting a voltage with comparators instead.
