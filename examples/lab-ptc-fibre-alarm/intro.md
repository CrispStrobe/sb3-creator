# A temperature limit alarm sent through a light guide

A warning from far away: when a silicon PTC sensor gets warmer than a limit you set, an LED switches on, a light guide carries its light away, and at the other end a phototransistor starts a tone. Nothing electrical connects the two ends.

**Teaches:** comparators, optical isolation, remote alarms

## What to do

Click **Sim**. Use the **Temperature** slider of the sensor in the instruments column and raise it from room temperature to hot water. The set potentiometer moves the limit.

## What you should see

- Room temperature: all quiet, the transmitter LED is dark.
- Above about 36 °C: the LED lights and the piezo at the far end sounds.

## Why it works

The LM386 compares the sensor's voltage with the set voltage and, with a gain of 200, switches fully one way or the other. Its output lights the LED. At the receiver the phototransistor turns the light back into a current that switches on a transistor pair, and they power the tone oscillator. Because only light travels between the two halves, a fault or a high voltage at one end cannot reach the other.
