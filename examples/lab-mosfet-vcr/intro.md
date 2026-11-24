---
level: advanced
age: 14+
prereqs: [lab-ce-vs-follower, pc39-nmos-switch]
teaches: [mosfet, depletion-mode, voltage-controlled-resistor, pinch-off]
---
## What you see
A MOSFET with two gates, a 4.7 kΩ resistor above it, a red LED under its source and a knob on its first gate. The voltmeter shows how much of the battery voltage the transistor's channel takes.

## Try this
1. Click **Sim**. With the knob in the middle the meter shows a few volts.
2. Turn the knob slowly down. The reading climbs and stops at its maximum: the channel no longer conducts at all.
3. Turn it up to the top. The reading falls almost to zero: now the channel is only about a hundred ohms.
4. Press the button. It connects the gate to the source, so the gate voltage is zero. Does the transistor conduct?

## What is going on
Between source and drain lies a thin conducting channel. The gate sits on top of it, insulated by a layer of oxide, and its voltage pushes charge carriers out of the channel or pulls them in. In this kind of MOSFET the channel is already there at zero gate voltage: it is a depletion-mode MOSFET. To pinch it off the gate must go more than about 1.2 V below the source. The red LED lifts the source a little above ground, so the knob can reach those negative gate voltages with only one battery. In between, the channel simply behaves like a resistor whose value you set with a voltage.

## Go further
- [lab-dual-gate](../lab-dual-gate) — the second gate can pinch the channel too.
- [lab-button-volume](../lab-button-volume) — the voltage-controlled resistor as a volume control.
