# 23-voltage-regulator -- expected behaviour

## Circuit

VCC (9 V) -> R1 (330 Ohm) -> junction -> two paths:
  Path 1: Zener diode (Vz = 5.1 V, reverse-biased) -> GND.
  Path 2: R2 (470 Ohm) -> green LED (Vf = 2.0 V) -> GND.

No MCU -- pure passive voltage regulation circuit.

## Observable behaviour

### Regulated junction voltage
- **Zener clamps junction to:** 5.1 V
- **Voltage across R1:** 9.0 - 5.1 = 3.9 V

### Load path (LED branch)
- **Voltage available for R2 + LED:** 5.1 V
- **LED current:** (5.1 - 2.0) / 470 = 6.60 mA
- **Voltage across R2:** 6.60 mA x 470 = 3.1 V

### Zener path
- **Total current through R1:** (9.0 - 5.1) / 330 = 11.82 mA
- **Zener current:** 11.82 - 6.60 = 5.22 mA
- **Zener power:** 5.1 x 5.22 = 26.6 mW

### Power budget

| component | voltage (V) | current (mA) | power (mW) |
|-----------|-------------|-------------|------------|
| R1        | 3.9         | 11.82       | 46.1       |
| Zener     | 5.1         | 5.22        | 26.6       |
| R2        | 3.1         | 6.60        | 20.5       |
| LED       | 2.0         | 6.60        | 13.2       |
| **total** | 9.0         | --          | 106.4      |

### Regulation test
If VCC changes from 9 V to 12 V:
- Junction stays at 5.1 V (zener clamps)
- LED current unchanged: still 6.60 mA
- R1 current increases: (12.0 - 5.1) / 330 = 20.91 mA
- Extra current absorbed by zener: 20.91 - 6.60 = 14.31 mA

## What this verifies

1. Zener diode clamps voltage at its breakdown voltage
2. Load current is independent of supply voltage (regulation)
3. Series resistor R1 limits total current and drops excess voltage

```assert
# Zener regulator: 9V in, clamp at ~6.15V (zener + margin)
net r1.b V 6.15 +-0.25
```
