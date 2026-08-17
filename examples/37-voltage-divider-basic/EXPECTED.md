# 37-voltage-divider-basic -- expected behaviour

## Circuit

VCC (5 V) -> R1 (10 kOhm) -> junction -> R2 (10 kOhm) -> GND.
No MCU, no load -- pure resistive divider.

## Observable behaviour

- **Total resistance:** 10000 + 10000 = 20000 Ohm
- **Circuit current:** 5.0 / 20000 = 0.25 mA
- **Voltage at midpoint (R1-R2 junction):** 5.0 x R2 / (R1 + R2) = 5.0 x 10000 / 20000 = 2.5 V
- **Voltage across R1:** 0.25 mA x 10000 = 2.5 V
- **Voltage across R2:** 0.25 mA x 10000 = 2.5 V
- **Power dissipated:** 5.0 V x 0.25 mA = 1.25 mW total

## What this verifies

1. Voltage divider formula: V_out = V_in x R2 / (R1 + R2)
2. Equal resistors divide voltage in half
3. High-value resistors keep quiescent current low

```assert
# Equal divider: Vout = VCC × R2/(R1+R2) = 5.0 × 0.5 = 2.500V
net r1.b V 2.50 +-0.01
```
