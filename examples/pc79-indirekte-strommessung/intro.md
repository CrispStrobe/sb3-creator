---
level: intermediate
age: 12+
prereqs: [pc77-klemmenspannung]
teaches: [shunt-resistor, current-measurement, Ohms-law, voltmeter]
---
## What you see
Indirect current measurement: a small shunt resistor (1 Ω) is in series with the load. The voltage across the shunt is proportional to the current: V_shunt = I × R_shunt. I = V_shunt / 1 Ω.

## Try this
1. Measure the voltage across the 1 Ω shunt.
2. Calculate: I = V_shunt / 1 Ω. With a 9 V battery, 0.5 Ω internal resistance, 470 Ω load + 1 Ω shunt: I = 9 / (0.5 + 470 + 1) ≈ 19.1 mA. V_shunt ≈ 19.1 mV.
3. The LED shows that current is flowing — the shunt barely affects the circuit (1 Ω << 470 Ω).

## What is going on
A shunt resistor is deliberately small so it barely affects the circuit. Instead of an ammeter (which requires breaking the circuit), you measure the voltage across the shunt with a voltmeter and calculate the current. This principle is used by every digital multimeter in its ampere range.

## Go further
- [pc77-klemmenspannung](../pc77-klemmenspannung) — battery internal resistance.
- [pc80-quellen-vergleich](../pc80-quellen-vergleich) — comparing voltage sources under load.
