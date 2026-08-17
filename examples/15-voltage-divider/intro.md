---
level: beginner
age: 8+
prereqs: [01-blink]
teaches: [voltage-divider, adc-reading]
---
## What you see
Two resistors form a voltage divider between VCC and ground. The MCU reads the voltage at the junction using its ADC and reports the value. Changing either resistor changes the reading. This example works on all supported microcontrollers — pick a different device in the toolbar to see the adapted circuit.

## Try this
1. Run the program and note the ADC reading — it should be roughly half of the supply voltage if both resistors are equal.
2. Change one resistor to a different value and observe how the reading shifts up or down.
3. Replace one resistor with a potentiometer and watch the reading change as you turn it.

## What is going on
A voltage divider splits a voltage proportionally between two resistors. The voltage at the junction equals VCC times R2 divided by (R1 + R2). The MCU's analog-to-digital converter (ADC) measures this voltage and converts it to a number. With equal resistors the junction sits at half the supply voltage. This is the fundamental building block for reading any resistive sensor — thermistors, LDRs, and flex sensors all work this way.

## Why it matters
Most analog sensors are just resistors that change with some physical quantity. Once you understand the voltage divider, you can read temperature, light, pressure, and position — all with the same circuit pattern and the same ADC code.

## Go further
- [01-blink](../01-blink) — the simplest MCU project, if you have not done it yet.
- [03-night-light](../03-night-light) — a voltage divider in action with a light-dependent resistor.
- Experiment: calculate the expected voltage for a 1k/2k divider, then measure with the ADC and compare.
