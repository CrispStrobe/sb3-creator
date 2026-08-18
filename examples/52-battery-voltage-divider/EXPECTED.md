# 52-battery-voltage-divider -- expected behaviour

## Circuit

9 V battery (internal resistance 0.5 Ohm) -> R1 (10 kOhm) -> junction -> R2 (10 kOhm) -> battery negative.

A voltage divider powered by a real battery. Place a meter probe at the
junction between R1 and R2 to read the divided voltage.

## Calculations

- **Total resistance:** R1 + R2 = 20 kOhm (plus 0.5 Ohm internal, negligible)
- **Circuit current:** 9.0 / 20000.5 = 0.450 mA (approximately)
- **V_junction (across R2):** I x R2 = 0.450 mA x 10000 = 4.50 V
- **V_junction (by divider formula):** V_bat x R2 / (R1 + R2) = 9.0 x 10000 / 20000 = 4.50 V
- **Voltage across R1:** 4.50 V
- **Voltage across R2:** 4.50 V
- **Battery internal drop:** 0.450 mA x 0.5 = 0.225 mV (negligible)
- **Power dissipated per resistor:** 4.50^2 / 10000 = 2.03 mW

## Observable behaviour

- **Meter at junction reads:** 4.5 V (half the battery voltage)
- **No visible output** -- this circuit is about measurement, not actuation
- Equal resistors divide the voltage exactly in half

## What this verifies

1. Voltage divider formula: V_out = V_in x R2 / (R1 + R2)
2. Equal resistors produce V_in / 2
3. Battery internal resistance is negligible at low current draws
4. A meter probe measures voltage at a node without significantly loading the circuit
   (assuming high-impedance meter)

```assert
# Battery: 9.0V (default for battery part)
net bat1.pos V 9.00 +-0.01
# Equal divider mid-point: Vbat × R2/(R1+R2) = 9.0 × 0.5 = 4.500V
net r1.b V 4.50 +-0.01
```
