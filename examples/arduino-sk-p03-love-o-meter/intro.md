---
level: intermediate
age: 10+
prereqs: [arduino-01-analog-read-serial]
teaches: [temperature-sensor, bargraph, analog-input, threshold]
---
## What you see
Love-O-Meter: a TMP36 temperature sensor on A0 drives a 3-LED bargraph. Touch the sensor (warming it) and more LEDs light up. The warmer the reading, the higher the bar.

## Try this
1. Change the temperature stimulus and watch the LEDs respond — one LED per threshold.
2. Lower the base threshold from the default to make the bar more sensitive.
3. Add a fourth LED with a higher threshold for "very warm."

## What is going on
The TMP36 outputs a voltage proportional to temperature (10 mV per degree, 500 mV at 0 C). The program reads it (0-1023), converts to voltage, then compares against three thresholds. Each exceeded threshold lights another LED. The result is a proportional bar — a visual thermometer.

## Go further
- [arduino-07-bar-graph](../arduino-07-bar-graph) — a general-purpose bar graph with more LEDs.
- [04-thermostat](../04-thermostat) — temperature-controlled output with hysteresis.
