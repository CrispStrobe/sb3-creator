# Series interlock

The indicator has a complete path only when both switches are closed. Opening
either one breaks the same branch, so no logic chip and no program is involved.

Measured on the engine (board vcc 5, `--at 1`):

| `sw1` | `sw2` | `r1.a` | LED current |
|---|---|---|---|
| open | open | 0.0017 V | 0.000 mA |
| closed | open | 0.0050 V | 0.000 mA |
| open | closed | 0.0017 V | 0.000 mA |
| closed | closed | 5.0000 V | 2.970 mA |

Closed, the two switches pass the supply through untouched (5.0000 V at the
resistor) and the LED runs at the usual (5 − 2.03) V / 1 kΩ = 2.97 mA. Open, the
few millivolts left on the branch are the switch model's leakage, not a path —
0.000 mA either way.

```assert
# Series switches both closed: 5V reaches R+LED, I = (5-2.03)/1k = 2.97mA
net src.pos V 5.00 +-0.01
```
