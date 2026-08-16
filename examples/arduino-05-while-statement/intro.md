---
level: intermediate
age: 12+
prereqs: [arduino-03-calibration]
teaches: [while-loop, calibration, sensor-range, button-held]
---
## What you see
Hold the button to calibrate an LDR: the status LED lights while calibrating. Release the button and the program maps the LDR reading to the calibrated range, driving an output LED brighter or dimmer.

## Try this
1. Press and hold the button, then vary the light on the LDR. Release and the calibrated range is locked.
2. Change the LDR stimulus and watch the output LED respond within the learned range.
3. Press the button again to recalibrate with a wider or narrower light range.

## What is going on
While the button is held, a REPEAT UNTIL loop records the minimum and maximum sensor readings. After release, each new reading is mapped from that range to the LED output range. The result: the LED uses the full brightness range regardless of ambient light — auto-calibration.

## Go further
- [arduino-03-calibration](../arduino-03-calibration) — the same idea with a timed calibration window.
- [arduino-05-if-statement](../arduino-05-if-statement) — a simpler threshold without calibration.
