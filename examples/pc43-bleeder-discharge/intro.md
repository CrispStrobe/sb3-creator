---
level: intermediate
age: 12+
prereqs: [pc06-rc-charge]
teaches: [bleeder-resistor, capacitor-discharge, standby-power]
---
## What you see
A capacitor charges through a resistor with a bleeder resistor in parallel. The bleeder slowly drains the capacitor after power is removed, making the circuit safe to handle.

## Try this
1. Click **Sim** and watch the capacitor charge up over a few seconds.
2. Note that the charging is slower than a plain RC circuit — the bleeder is drawing current even while charging.
3. Disconnect the supply (imagine it). The bleeder would then discharge the capacitor through itself.

## What is going on
The bleeder resistor serves two purposes: it draws a small, constant current that stabilises the supply voltage, and after power-off it provides a discharge path for the capacitor. Without a bleeder, a large capacitor can hold a dangerous charge for minutes or hours. The tradeoff is standby power — a smaller bleeder discharges faster but wastes more energy while running.

## Why it matters
Every power supply with filter capacitors needs a bleeder for safety. TV repair technicians learn this the hard way — a CRT's filter caps can hold hundreds of volts long after the set is unplugged. Bleeders are also required by safety standards in many consumer products.

## Go further
- [pc29-capacitor-discharge](../pc29-capacitor-discharge) — watch a plain capacitor discharge.
- [pc06-rc-charge](../pc06-rc-charge) — the basic RC charging curve.
- Experiment: calculate the discharge time constant with the bleeder value and predict how long until the cap drops below 1 V.
