---
level: intermediate
age: 12+
prereqs: [arduino-03-analog-input]
teaches: [smoothing, averaging, noise-reduction, lists]
---
## What you see
An analog sensor is read repeatedly, and the program prints a running average of the last 10 readings. The output is smoother than the raw input.

## Try this
1. Set the sensor stimulus to a noisy pattern and compare the averaged output to the raw reading.
2. Change numReadings from 10 to 3 — the output responds faster but is noisier.
3. Change it to 50 — smoother, but it takes longer to track a step change.

## What is going on
The program keeps a list of recent readings and replaces the oldest one each loop pass. The average of the list is the output. More readings means more smoothing but more lag. This is a moving-average filter — the simplest digital filter.

## Go further
- [arduino-03-calibration](../arduino-03-calibration) — adapt to the sensor range instead of filtering noise.
- [arduino-05-while-statement](../arduino-05-while-statement) — runtime calibration with a button.
