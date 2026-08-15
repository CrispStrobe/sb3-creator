---
level: advanced
age: 14+
prereqs: [pc40-opamp-threshold, pc02-voltage-divider]
teaches: [ldr, light-sensing, automatic-control]
---
## What you see
A light-dependent resistor (LDR) feeding one input of an op-amp comparator, with a fixed voltage reference on the other input. The LED turns on or off as the light level crosses the threshold.

## Try this
1. Click **Sim** — in the dark (high LDR resistance), the sensing voltage is below the reference, and the LED is dark.
2. Increase the light level (lower the LDR resistance). When the sensing voltage crosses the 2.5 V reference, the op-amp output goes high and the LED lights.
3. Adjust the reference divider to change the switching threshold.

## What is going on
The LDR and a fixed resistor form a voltage divider whose output depends on the light level. In the dark, the LDR's resistance is very high (hundreds of kΩ), pulling the sensing voltage near ground. In bright light, it drops to a few kΩ, and the sensing voltage rises toward the supply. The op-amp compares this changing voltage with the fixed 2.5 V reference and snaps its output high or low — a clean digital decision from an analogue sensor.

## Why it matters
Light-triggered circuits are used in street lights, security systems, camera exposure meters, and industrial automation. The LDR-plus-comparator pattern is the simplest way to turn a physical quantity into a yes/no signal, and the same pattern works for temperature (thermistor), moisture, and many other sensors.

## Go further
- [pc40-opamp-threshold](../pc40-opamp-threshold) — the comparator with a manual pot instead of a sensor.
- [pc33-thermistor-divider](../pc33-thermistor-divider) — a temperature sensor in a divider.
- Experiment: add hysteresis with a feedback resistor from the output to the non-inverting input, and observe how the switching threshold changes depending on the current state.
