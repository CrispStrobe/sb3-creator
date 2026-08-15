---
level: intermediate
age: 14+
prereqs: [pc05-npn-switch]
teaches: [mosfet, voltage-control, gate-resistor]
---
## What you see
An N-channel MOSFET switches an LED on the low side. The gate is held low by a 10 kΩ pull-down resistor, and a switch lifts it to 5 V to turn the LED on.

## Try this
1. Click **Sim** with the gate switch open. The gate is at 0 V and the LED is dark — the MOSFET is off.
2. Close the gate switch. The gate goes to 5 V, the MOSFET turns on, and the LED lights.
3. Notice the drain voltage: when on, it drops to about 0.14 V instead of zero — that is the MOSFET's on-state resistance.

## What is going on
A MOSFET is a voltage-controlled switch. Unlike a BJT (pc05), the gate draws no continuous current — it is a capacitor, not a diode. The 10 kΩ pull-down resistor ensures the gate is at a defined voltage when the switch is open; without it, the gate would float and the transistor could switch randomly. When the gate is high, the MOSFET conducts from drain to source with a small voltage drop.

## Why it matters
MOSFETs are the dominant switching device in modern electronics — every processor, every power supply, every motor driver uses them. Their voltage-controlled gate means they can be driven directly by logic signals with negligible power loss at the control input.

## Go further
- [pc05-npn-switch](../pc05-npn-switch) — compare with a BJT: the base draws current, the gate does not.
- [pc44-push-pull-led](../pc44-push-pull-led) — N-channel and P-channel MOSFETs working together.
- Experiment: remove the pull-down resistor and observe what happens when you open the switch — the gate remembers its last state.
