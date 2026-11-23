# Moving-coil ammeter: shunts and Kirchhoff's current law

A needle movement that deflects fully at 100 µA is useless for milliamps, unless most of the current goes round it. A small parallel resistor, the shunt, does exactly that. Three such meters on one network show the total current and the two branch currents, and the branch readings add up to the total.

**Teaches:** shunt resistors, current division, Kirchhoff's current law, meter loading

## What to do

Click **Sim**. Read the three needles: the total and branches A and B, all on a 10 mA scale. Add the two branch readings and compare with the total. Then flip the switch that takes out the total meter's shunt and watch its needle slam against the stop.

## What you should see

- Total about 6.2 mA, branch A about 4.3 mA, branch B about 1.95 mA.
- Branch A plus branch B equals the total.
- Shunt out: total needle pegged, and the branch currents drop.

## Why it works

At full scale the coil has 0.1 V across it. The 10.1 Ω shunt passes 9.9 mA at that voltage, so coil and shunt together carry 10 mA. Without the shunt, the coil would need 60 times its rated current to show 6 mA.
