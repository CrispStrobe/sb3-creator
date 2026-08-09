# 21-resistor-led -- expected behaviour

## Circuit

VCC (5 V) -> 220 Ohm resistor -> red LED (Vf = 2.0 V) -> GND.
No MCU -- pure passive circuit, LED is always on.

## Observable behaviour

- **Circuit current:** (5.0 - 2.0) / 220 = 13.6 mA
- **Voltage across resistor:** 13.6 mA x 220 = 3.0 V
- **Voltage across LED:** 2.0 V (forward voltage)
- **Power dissipated in resistor:** 13.6 mA x 3.0 V = 40.9 mW
- **Power dissipated in LED:** 13.6 mA x 2.0 V = 27.3 mW
- **Total power:** 5.0 V x 13.6 mA = 68.2 mW
- **LED state:** always ON at full brightness

## Resistor selection

| R (Ohm) | I (mA) | within safe range |
|---------|--------|-------------------|
| 100     | 30.0   | near max for typical LED |
| 220     | 13.6   | good brightness   |
| 470     | 6.4    | moderate          |
| 1000    | 3.0    | dim               |

## What this verifies

1. Ohm's law: V = IR applied to series circuit
2. LED forward voltage drop is constant (2.0 V)
3. Resistor limits current to safe LED operating range
