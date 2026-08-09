# 34-ohms-law -- expected behaviour

## Circuit

VCC (5 V) -> 1 kOhm resistor -> red LED (Vf = 2.0 V) -> GND.
No MCU -- pure passive circuit, LED is always on.

## Observable behaviour

- **Circuit current:** (5.0 - 2.0) / 1000 = 3.0 mA
- **Voltage across resistor:** 3.0 mA x 1000 = 3.0 V
- **Voltage across LED:** 2.0 V (forward voltage)
- **Power dissipated in resistor:** 3.0 mA x 3.0 V = 9.0 mW
- **Power dissipated in LED:** 3.0 mA x 2.0 V = 6.0 mW
- **Total power:** 5.0 V x 3.0 mA = 15.0 mW
- **LED state:** always ON, dim (3 mA is low but visible)

## What this verifies

1. Ohm's law: I = (V_supply - V_f) / R
2. KVL: V_supply = V_R + V_LED = 3.0 + 2.0 = 5.0 V
3. The first circuit -- simplest possible LED driver
