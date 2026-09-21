# 34-ohms-law -- expected behaviour

## Circuit

VCC (5 V) -> 1 kOhm resistor -> red LED -> GND.
No MCU -- pure passive circuit, LED is always on.

A red LED is often quoted as "2.0 V", and that is its drop at its RATED
20 mA. This circuit runs it at about 3 mA, where the same LED sits lower:
the engine solves the diode junction rather than clamping it at a knee, and
reports 1.83 V. Every line below follows from that, which is the point of
the lesson -- the forward voltage is a function of the current, not a
constant you look up once.

## Observable behaviour

- **Voltage across LED:** 1.83 V (solved at this current, not the 2.0 V rating)
- **Circuit current:** (5.0 - 1.83) / 1000 = 3.17 mA
- **Voltage across resistor:** 3.17 mA x 1000 = 3.17 V
- **Power dissipated in resistor:** 3.17 mA x 3.17 V = 10.04 mW
- **Power dissipated in LED:** 3.17 mA x 1.83 V = 5.80 mW
- **Total power:** 5.0 V x 3.17 mA = 15.84 mW
- **LED state:** always ON, dim (3 mA is low but visible)

## What this verifies

1. Ohm's law: I = (V_supply - V_f) / R
2. KVL: V_supply = V_R + V_LED = 3.0 + 2.0 = 5.0 V
3. The first circuit -- simplest possible LED driver

```assert
# Ohm's law: I = (5.0 - Vf) / 1000, Vf ≈ 2.03 (Shockley at ~3mA)
net r1.b V 1.83 +-0.15
```
