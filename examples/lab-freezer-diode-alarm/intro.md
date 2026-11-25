# Freezer watchdog with a sensor diode

A freezer must stay below freezing. A diode inside it, compared with one outside, raises the alarm when the freezer warms up.

**Teaches:** diode as thermometer, current mirror, over-temperature alarm

## What to do

Click **Sim**. In the instruments column, move the Temperature slider of the sensor diode (diode_7) from −10 to ice (0), then to 10, then to room (25).

## What you should see

- −10 and 0: quiet.
- 10 and above: the alarm sounds.

## Why it works

The sensor diode's forward drop is about 2 mV smaller per degree warmer. Below Q2 it decides how much current Q2 copies from Q1: cold means less current and a high collector that keeps the alarm off; warm means more current, the collector falls and the alarm is released. The trimmer sets the temperature at which that happens.
