# 35-series-resistors -- expected behaviour

## Circuit

VCC (5 V) -> R1 (1 kOhm) -> R2 (2 kOhm) -> red LED (Vf = 2.0 V) -> GND.
No MCU -- pure passive circuit, LED is always on.

## Observable behaviour

- **Total resistance:** 1000 + 2000 = 3000 Ohm
- **Circuit current:** (5.0 - 2.0) / 3000 = 1.0 mA
- **Voltage across R1:** 1.0 mA x 1000 = 1.0 V
- **Voltage across R2:** 1.0 mA x 2000 = 2.0 V
- **Voltage across LED:** 2.0 V (forward voltage)
- **KVL check:** 1.0 + 2.0 + 2.0 = 5.0 V
- **LED state:** always ON, very dim (1 mA)

## What this verifies

1. Series resistors add: R_total = R1 + R2
2. Same current flows through all series components
3. Voltage divides proportionally to resistance

```assert
# Series R: R1.b = VCC - I×R1, where I=(5-Vf)/(R1+R2)≈1mA
net r1.b V 4.00 +-0.15
```
