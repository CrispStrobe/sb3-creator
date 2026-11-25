---
level: intermediate
age: 12+
prereqs: [lab-virtual-ground]
teaches: [voltage-follower, meter-loading, input-resistance, amplifier]
---
## What you see
Two equal 220 kΩ resistors in series across the battery, so their middle should be at half the supply. A meter, a slide switch that puts it either straight on that middle or behind an op-amp follower, and a second op-amp stage with gain ten and its own meter.

## Try this
1. Click **Sim**. The meter sits straight on the divider and reads only about 2.3 V, not 4.5.
2. Flip the switch: now the meter is behind the follower and reads about 4.2 V.
3. Look at the second meter: with nothing connected the ×10 stage still shows about half a volt.
4. Hold **probe**: half a volt goes in, about 4.9 V comes out.

## What is going on
A moving-coil meter needs current to move its needle, so it is itself a resistor, here a hundred and twenty kilohms. Put across the bottom 220 kΩ it makes that half of the divider smaller and pulls the voltage down: the meter changes what it measures. The op-amp follower draws practically no current from the divider and copies its voltage to its output, which can easily feed the meter. A small diode in its input protects it if the probe is connected the wrong way round; it costs a little of the reading. The second stage multiplies by ten, so small voltages can be read on the same scale. The op-amp's inputs need a tiny current, about 47 nA; with nothing connected it flows through the 1 MΩ input resistor, and the stage shows those 48 mV ten times over. A real meter amplifier cancels it with a zero pot.

## Go further
- [lab-virtual-ground](../lab-virtual-ground) — a follower holding a voltage steady under load.
- [lab-opamp-ammeter](../lab-opamp-ammeter) — the op-amp helping the meter measure current.
