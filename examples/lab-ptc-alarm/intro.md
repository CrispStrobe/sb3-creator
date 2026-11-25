# Temperature alarm with two thresholds: rising or falling

An alarm that sounds when something gets too hot, or, with one switch, when it gets too cold. It does not switch back at the same temperature, but a few degrees later, so it cannot chatter on and off.

**Teaches:** Schmitt triggers, hysteresis, alarm circuits

## What to do

Click **Sim**. Use the **Temperature** slider of the sensor in the instruments column: raise it slowly to hot water, then lower it slowly again. Move the slide switch to the other mode and repeat.

## What you should see

- Rising mode: the tone starts at about 35 °C and stops only at about 32 °C.
- Falling mode: silent while warm; the tone starts once it has cooled to about 32 °C.

## Why it works

The LM386 compares the sensor's voltage with the set voltage. A resistor from its output back to its + input adds a little of the output to the input: once the output is high, the input looks a bit warmer than it is, so the temperature must fall further before the output can go low again. In the falling mode a PNP transistor turns "output low" into "tone on".
