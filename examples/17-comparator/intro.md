---
level: intermediate
age: 12+
prereqs: [02-dimmer]
teaches: [comparison, dual-adc, decision-logic]
---
## What you see
Two potentiometers each feed an ADC channel. An LED lights up to show which pot is set higher. Turn one pot past the other and the LED switches.

## Try this
1. Run the program and turn both pots to their midpoint — the LED may flicker as the values are nearly equal.
2. Turn the left pot fully clockwise and the right fully counter-clockwise — the LED should be solidly on (or off, depending on which side it indicates).
3. Try finding the exact crossover point where the LED switches and observe how sensitive it is.

## What is going on
The MCU reads two analog voltages and compares them in software. If channel A is greater than channel B, the LED turns on; otherwise it turns off. This is the digital equivalent of an analog comparator circuit, but done in code. The comparison happens every loop iteration, so the response is nearly instantaneous. Near the crossover point, noise in the ADC readings can cause the LED to flicker — a real-world lesson in why comparators often include hysteresis.

## Why it matters
Comparing two measurements and making a decision is the core of control logic. Thermostats compare a temperature reading to a setpoint. Motor controllers compare desired speed to actual speed. This simple two-pot circuit is the minimal version of that pattern.

## Go further
- [02-dimmer](../02-dimmer) — reading a single potentiometer, the simpler prerequisite.
- [16-ldr-bargraph](../16-ldr-bargraph) — comparing one value against multiple thresholds.
- Experiment: add hysteresis — require the winning channel to be ahead by at least 10 before switching, to stop the flicker near the crossover.
