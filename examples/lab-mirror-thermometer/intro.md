---
level: advanced
age: 14+
prereqs: [lab-heat-alarm, lab-thermocouple]
teaches: [current-mirror, junction-temperature, inverting-amplifier, thermometer]
---
## What you see
Two transistors as a current mirror, an op-amp and a meter. One transistor is the sensor and has its own Temperature slider.

## What to do
1. Click **Sim**. The needle rests at zero.
2. Move the sensor's **Temperature** slider to 70 (hot water). The needle climbs, quickly at first, then more slowly, to about 4.2 V.
3. Move it to 0 (ice). The needle wants to go below zero.
4. If the needle does not rest at zero at room temperature, turn the **ZERO** pot.

## What is going on
The reference transistor sets a base voltage; the sensor copies its current, as long as both are equally warm. A warmer sensor junction needs about 2 mV less per degree, so it carries a little more current and its collector voltage falls. The op-amp amplifies that fall about seven times and turns it the right way up, and the meter shows about 0.09 V for every degree above room temperature.

## Go further
- [lab-heat-watchdog](../lab-heat-watchdog) — the same mirror as an alarm.
- [lab-thermocouple](../lab-thermocouple) — a different kind of thermometer.
