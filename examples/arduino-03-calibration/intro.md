---
level: intermediate
age: 12+
prereqs: [arduino-03-analog-input]
teaches: [calibration, sensor-range, min-max-tracking, pwm, moving-average]
---
## What you see
During the first 5 seconds (status LED on), the program learns the sensor minimum and maximum. After that, it maps the sensor value to the full LED brightness range.

## Try this
1. During calibration, vary the light on the sensor to set a wide range.
2. Calibrate with a narrow range and observe that small changes produce large brightness swings.
3. Change the calibration window from 5 seconds to 10 for a longer learning period.
4. Add a fifth sample to the moving average and predict, before running it, what the settling time and the lag become.

## What is going on
The program tracks the lowest and highest sensor values seen during calibration. After the window closes, each new reading is averaged over the last four samples and then mapped from [sensorMin, sensorMax] to the LED's 0-100 percent duty. This auto-scales the sensor to whatever light conditions you have.

Averaging is not free, and the price is stated rather than hidden. The loop runs every 20 ms, so a 4-sample window takes 4 x 20 ms = 80 ms to follow a step all the way, and lags a steady ramp by (4 - 1) / 2 x 20 ms = 30 ms. Step the pot and the duty climbs in four equal quarters: 24, 49, 74, 100 percent. Change the window and both numbers change with it — that is the trade the filter is.

## Go further
- [arduino-05-while-statement](../arduino-05-while-statement) — button-held calibration instead of timed.
- [arduino-03-smoothing](../arduino-03-smoothing) — averaging to reduce noise.
