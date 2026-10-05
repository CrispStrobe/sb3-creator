---
level: intermediate
age: 11+
prereqs: [04-thermostat, sense-distance-alarm]
teaches: [sensors, buses, thresholds]
---
## What you see
A digital thermometer: every second the temperature in whole degrees Celsius appears on the serial monitor. A blue LED lights when it is cold (below 18 °C), a red one when it is warm (above 28 °C). Drag the temperature control of the sensor and watch both.

## Try this
1. Set the sensor to 15 °C, then 22 °C, then 31 °C. Which LEDs are on?
2. Set it to -10.5 °C. Which whole number does the program print?
3. Change the program so that a third LED lights in the comfortable range in between.

## What is going on
This sensor does the measuring itself and sends the result as a number. It needs only one data wire — that is why the bus is called "1-Wire". Both sides take turns pulling the wire low for a few microseconds; a short pulse means a 1, a long one a 0. A resistor keeps the wire high whenever nobody pulls.

Reading the temperature is a conversation: the chip resets the bus and the sensor answers "I'm here" with a pulse of its own; the chip asks it to convert; then it asks for the result, nine bytes, the last of which is a checksum. If the checksum does not match, the reading is thrown away and taken again. A conversion takes up to 0.75 seconds, so the program always gets the most recent finished one while the next is already running.

## Why it matters
Heating systems, fridges and weather stations use exactly this kind of sensor. Many of them can share one wire, each with its own serial number — a whole house full of thermometers on a single cable.

## Go further
- [04-thermostat](../04-thermostat) — the same idea with an analog sensor and a heater.
- [sense-distance-alarm](../sense-distance-alarm) — a sensor that answers with the length of a pulse.
- Experiment: remember the lowest and highest temperature since the start and print them too.
