# A silicon PTC sensor in a bridge: meter and warm/cold LEDs

A silicon PTC sensor changes its resistance by less than one percent per degree. Put it into a bridge and that small change becomes a clear reading: a meter that swings either side of zero and two LEDs that say warm or cold.

**Teaches:** the Wheatstone bridge, silicon PTC sensors, a comparator

## What to do

Click **Sim**. In the instruments column use the **Temperature** slider of the sensor or its buttons (ice, room, fingers, hot water). Watch the meter and the two LEDs. The balance potentiometer sets which temperature counts as zero.

## What you should see

- Room temperature (25 °C): the meter stays at 0.
- Colder: the needle swings left (−22 mV at 15 °C) and the green LED lights.
- Warmer: the needle swings right (+23 mV at 35 °C) and the red LED lights.

## Why it works

Each arm of the bridge is a voltage divider. When both arms divide in the same ratio, nodes A and B are at the same voltage and no current flows through the meter. Warming the sensor raises its resistance, A rises above B and the meter shows the difference. The amplifier multiplies that difference by 200, which is enough to switch an LED from a few millivolts.
