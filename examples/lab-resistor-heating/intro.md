# A resistor heats up: the power limit is a curve

Every resistor turns electrical power into heat. How hot it gets depends on the power, voltage times current, not on the voltage alone. Two resistors and a thermometer on each show it.

**Teaches:** electrical power, heating, power rating, I–V line and power hyperbola

## What to do

Click **Sim**. Read the voltmeter and the ammeter, multiply. Turn **VOLTS** up until the voltmeter shows 4 V and wait a few seconds. Then slide **SELECT** to the 100 Ω resistor and wait again.

## What you should see

- 47 Ω at 3.4 V: 72 mA, about a quarter watt; the HOT LED stays dark.
- 47 Ω at 4 V: 0.34 W, it gets hot (about 93 °C) and its HOT LED lights.
- 100 Ω at the same 4 V: only 40 mA, 0.16 W; it stays cool enough.

## Why it works

Power is voltage times current, and with a fixed resistor the current grows with the voltage too: P = V²/R. A quarter-watt resistor may dissipate 0.25 W, which on a chart of current against voltage is a curve, I = 0.25/V. Each resistor's straight line crosses that curve at a different voltage: about 3.4 V for 47 Ω, 5 V for 100 Ω. The thermometers are transistors whose base-emitter voltage drops 2 mV for every degree.
