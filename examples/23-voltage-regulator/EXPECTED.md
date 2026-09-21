# 23-voltage-regulator -- expected behaviour

## Circuit

VCC (9 V) -> R1 (330 Ohm) -> junction -> two paths:
  Path 1: Zener diode (Vz = 5.1 V, reverse-biased) -> GND.
  Path 2: R2 (470 Ohm) -> green LED (Vf = 2.0 V) -> GND.

No MCU -- pure passive voltage regulation circuit.

## Observable behaviour

The zener's 5.1 V and the LED's 2.0 V are both RATINGS, quoted at a test
current. The engine solves each junction at the current this circuit actually
delivers, so the junction settles slightly above the zener's nameplate and the
green LED sits below its own. The numbers below are that solve, and the lesson
is that a clamp is a steep curve rather than a flat line.

### Regulated junction voltage
- **Zener holds the junction at:** 5.1627 V (rated 5.1 V)
- **Voltage across R1:** 9.0 - 5.1627 = 3.8373 V

### Load path (LED branch)
- **Voltage available for R2 + LED:** 5.1627 V
- **LED forward voltage at this current:** 1.8701 V
- **LED current:** (5.1627 - 1.8701) / 470 = 7.006 mA
- **Voltage across R2:** 7.006 mA x 470 = 3.2926 V

### Zener path
- **Total current through R1:** (9.0 - 5.1627) / 330 = 11.628 mA
- **Zener current:** 11.628 - 7.006 = 4.622 mA
- **Zener power:** 5.1627 x 4.622 = 23.9 mW

### Power budget

| component | voltage (V) | current (mA) | power (mW) |
|-----------|-------------|-------------|------------|
| R1        | 3.8373      | 11.628      | 44.6       |
| Zener     | 5.1627      | 4.622       | 23.9       |
| R2        | 3.2926      | 7.006       | 23.1       |
| LED       | 1.8701      | 7.006       | 13.1       |
| **total** | 9.0         | --          | 104.7      |

### Regulation test
If VCC changes from 9 V to 12 V:
- Junction stays near 5.16 V (zener clamps)
- LED current essentially unchanged: still about 7.0 mA
- R1 current increases: (12.0 - 5.1) / 330 = 20.91 mA
- Extra current absorbed by zener: 20.91 - 6.60 = 14.31 mA

## What this verifies

1. Zener diode clamps voltage at its breakdown voltage
2. Load current is independent of supply voltage (regulation)
3. Series resistor R1 limits total current and drops excess voltage

```assert
# The junction IS the zener's breakdown: 9 V in, clamped to vz = 5.1 V.
# The previous claim of 6.15 V was a snapshot of a bench with nothing
# clamping — the zener was declared kind:"diode", so no current took its
# branch and the junction sat at 9 - 8.642 mA x 330 = 6.148 V, which the
# comment then rationalised as "zener + margin".
net r1.b V 5.13 +-0.05
```
