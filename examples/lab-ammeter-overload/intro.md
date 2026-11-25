# Electronic ammeter to 1 A with an overload tone

To measure a current you can send it through a tiny resistor and measure the voltage across it. At 0.1 Ω that is only a tenth of a volt per amp, so an op-amp multiplies it by ten for the meter. A second op-amp sounds an alarm above 1 A.

**Teaches:** shunt resistor, measuring current with a voltmeter, amplifying, overload alarm

## What to do

Click **Sim**. The **LAMP** is on. Switch on **HEATER**, then **SHORT**. Switch them off again.

## What you should see

- Lamp: 0.1 on the meter (0.1 A).
- Lamp and heater: 0.7 A.
- With the short: the needle pegs (1.8 A) and the loudspeaker sounds an alarm tone.

## Why it works

The current of all loads flows through the 0.1 Ω shunt and makes 0.1 V per amp across it (U = R·I). The op-amp amplifies that ten times, so the meter shows 1 V per amp. Another op-amp compares the reading with 0.98 V; above it, it lets a third op-amp oscillate, which it otherwise holds still through a diode.
