---
level: advanced
age: 14+
prereqs: [lab-window-comparator, pc92-and-or-xor-compared]
teaches: [adc, flash-converter, quantisation, logic-gates]
---
## What you see
A potentiometer, three comparators, three logic chips and two LEDs. The LEDs show the knob position as a two-bit binary number.

## Try this
1. Click **Sim**. The LEDs show 1 0 (binary for 2).
2. Turn the potentiometer from one end to the other. The LEDs walk 00, 01, 10, 11.
3. Turn it a little within one step. Does the code change?

## What is going on
A resistor ladder makes three reference voltages. Each comparator says "my input is above my reference". Together they form a thermometer: more comparators high means a higher voltage. Three gates translate the thermometer into binary: the middle comparator is the high bit, and the low bit is on for "only the first" or "all three". A microcontroller's ADC does the same job with more bits.

## Go further
- [lab-2bit-dac](../lab-2bit-dac) — the opposite direction.
- [lab-window-comparator](../lab-window-comparator) — two thresholds joined by AND.
