---
level: beginner
age: 10+
prereqs: [arduino-01-analog-read-serial]
teaches: [analog-input, voltage-conversion, adc, serial-print]
---
## What you see
A potentiometer connected to pin A0. The program reads the ADC value, converts it to voltage (0–5 V), and prints the result.

## Try this
1. Run the program and turn the potentiometer — the voltage reading changes.
2. Set the potentiometer to the middle: the voltage should read approximately 2.5 V.
3. Compare with the raw ADC version (AnalogReadSerial) — this one shows meaningful units.

## What is going on
The ADC converts the voltage on A0 to a number 0–1023. The formula `sensorValue * (5.0 / 1023)` maps this back to volts: 0 → 0.00 V, 512 → 2.50 V, 1023 → 5.00 V. This is how every analog measurement works: read the raw ADC count, then scale it to real units using the reference voltage and the ADC resolution.

## Why it matters
Converting ADC readings to real-world units (volts, degrees, grams) is the fundamental skill for sensor-based projects. The formula is always the same shape: `rawValue * (referenceVoltage / maxCount)`.

## Go further
- Experiment: with a 3.3 V board, the formula becomes `sensorValue * (3.3 / 1023)`.
- [arduino-01-fade](../arduino-01-fade) — output an analog-like signal instead of reading one.
