# A thermometer for 15 to 25 °C across the whole dial

A normal thermometer scale goes from freezing to boiling. This one covers only ten degrees, 15 to 25 °C, across the whole dial, so you can read tenths of a degree. The trick is to take away the 15-degree value first and then amplify what is left.

**Teaches:** offset and gain, expanded scales, self-heating of sensors

## What to do

Click **Sim**. Use the **Temperature** slider of the sensor in the instruments column and set 15, 20 and 25 °C. Wait a few seconds at each setting and read the meter. The offset potentiometer moves the zero of the scale.

## What you should see

- 15 °C: the needle near 0.
- 20 °C: about 2.3 V, halfway.
- 25 °C: about 4.5 V, almost full scale.
- Right after a change the needle moves for a few seconds before it settles.

## Why it works

The sensor's voltage changes by only about 12 mV per degree, riding on almost 2 V. The buffered potentiometer supplies a voltage equal to the 15 °C value, the amplifier subtracts it and multiplies the rest by 36. The sensor also warms itself a little with the current that flows through it, which is why the reading drifts up slightly after switch-on.
