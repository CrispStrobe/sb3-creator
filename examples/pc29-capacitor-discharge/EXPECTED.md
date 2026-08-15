# Capacitor discharge

Two switches, one capacitor. Close `charge` to fill it from the 5 V supply
through 1 kΩ; open `charge` and close `discharge` to empty it through the 1 kΩ
load and the LED. The LED is lit by stored energy only — its supply is
disconnected the whole time it is on.

Measured on the engine (`--set charge=1`, then at t = 2.9 s
`charge → 0`, `discharge → 1`):

| t | capacitor | LED current |
|---|---|---|
| 0.1 s | 0.48 V | 0.00 mA |
| 1.0 s | 3.16 V | 0.00 mA |
| 2.9 s | 4.72 V | 0.00 mA |
| 3.0 s | 4.47 V | 2.44 mA |
| 3.5 s | 3.50 V | 1.49 mA |
| 4.0 s | 2.92 V | 0.91 mA |
| 5.0 s | 2.34 V | 0.34 mA |
| 7.0 s | 2.05 V | 0.05 mA |

Charging time constant is 1 kΩ × 1000 µF = **1 s**, which the 0.1 s / 1.0 s rows
follow (63 % of 5 V after one τ). The discharge is *not* a clean exponential: the
LED stops conducting near its 2 V forward voltage, so the curve flattens against
that floor instead of reaching 0 V — visible in the last two rows, where the
voltage has almost stopped falling and the current has all but gone.
