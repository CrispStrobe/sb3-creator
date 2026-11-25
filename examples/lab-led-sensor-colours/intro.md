---
level: intermediate
age: 12+
prereqs: [lab-led-light-sensor, lab-optical-bench]
teaches: [photocurrent, wavelength, led-as-sensor, transimpedance-amplifier]
---
## What you see
Two lamps (a red LED and an infrared LED) shine on two sensors that are also just LEDs: a red one and an infrared one. A switch picks which sensor goes to the amplifier, and the meter shows its photocurrent, one volt per microamp.

## Try this
1. Click **Sim**. Only the red lamp is on and the red sensor is selected: the meter shows about 0.4 V.
2. Switch the IR lamp on as well. Nothing changes: the red sensor cannot see infrared.
3. Flip the selector to the IR sensor. It reads much more, about 2.5 V from the red lamp alone.
4. Now try the IR lamp alone with each sensor. The IR sensor sees it; the red one reads nothing.

## What is going on
An LED turns electricity into light of one colour, and it can also do the reverse: light falling on it frees electrons and makes a tiny current. But only light whose photons carry at least as much energy as the LED's own light can do this. Blue light carries more energy than red, red more than infrared. So an infrared LED as a sensor sees red and infrared, while a red LED as a sensor is blind to infrared. The op-amp holds the sensor at zero volts and pushes the photocurrent back through a 1 MΩ resistor, which turns each microamp into a volt.

## Go further
- [lab-led-light-sensor](../lab-led-light-sensor) — an LED sensor as a twilight switch.
- [lab-ir-light-meter](../lab-ir-light-meter) — an IR LED light meter with a zero adjustment.
