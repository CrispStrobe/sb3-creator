---
level: intermediate
age: 12+
prereqs: [pc48-ldr-comparator]
teaches: [window-comparator, open-collector, and-condition]
---
## What you see
A light sensor, two comparators and one LED. The LED lights only when the light is "just right" — not too dark and not too bright.

## Try this
1. Click **Sim**. In the dark the LED is off.
2. Raise the light slider slowly. At some point the LED comes on.
3. Keep going. Well before full brightness it goes out again.
4. Find both switching points on the slider.

## What is going on
The phototransistor passes a current that grows with the light; through a fixed resistor that becomes a voltage that rises with the light. One comparator checks "above the lower limit", the other "below the upper limit". Each can only pull the shared output line down (open collector); the line is only high when neither pulls — when both conditions are met at once. That is an AND gate made from two wires. The same trick sorts parts as "inside tolerance" in a factory.

## Go further
- [pc48-ldr-comparator](../pc48-ldr-comparator) — one comparator, one threshold.
- [lab-2bit-adc](../lab-2bit-adc) — three thresholds, turned into a binary number.
