---
level: intermediate
age: 12+
prereqs: [arduino-03-analog-input]
teaches: [calibration, sensor-range, min-max-tracking, pwm]
---
## What you see
During the first 5 seconds (status LED on), the program learns the sensor minimum and maximum. After that, it maps the sensor value to the full LED brightness range.

## Try this
1. During calibration, vary the light on the sensor to set a wide range.
2. Calibrate with a narrow range and observe that small changes produce large brightness swings.
3. Change the calibration window from 5 seconds to 10 for a longer learning period.

## What is going on
The program tracks the lowest and highest sensor values seen during calibration. After the window closes, each new reading is mapped from [sensorMin, sensorMax] to [0, 255]. This auto-scales the sensor to whatever light conditions you have.

## Go further
- [arduino-05-while-statement](../arduino-05-while-statement) — button-held calibration instead of timed.
- [arduino-03-smoothing](../arduino-03-smoothing) — averaging to reduce noise.
