# A thermocouple from two wires: match against lighter

Twist a copper wire and a constantan wire together and heat the twist: a small voltage appears between the free ends. It is tiny, a few hundredths of a volt even in a flame, so an op-amp multiplies it by a hundred before a meter shows it. A match and a lighter give clearly different readings.

**Teaches:** the Seebeck effect, amplifying small signals, measuring temperature

## What to do

Click **Sim**. In the instruments column, use the **Heat** slider or its buttons: **Room**, **Match**, **Lighter**. Watch the meter, and hover over the thermocouple to see its own voltage in millivolts.

## What you should see

- Room temperature: the meter rests at 0.
- Match: about 3.2 V on the meter (32 mV from the wires).
- Lighter: about 5 V (50 mV).

## Why it works

In each metal the heat pushes electrons from the hot end towards the cold end, but not equally hard in copper and in constantan. The difference shows up as a voltage between the two cold ends, growing with the temperature difference. Thermocouples measure ovens, kilns and engine exhausts the same way.
