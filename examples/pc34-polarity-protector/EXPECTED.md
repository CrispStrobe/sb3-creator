# Polarity protector

A diode in series with the load: it costs a fraction of a volt when the supply is
the right way round, and blocks everything when it is not.

Measured on the engine (board vcc 9, `--at 1`; reversed via `--set src=-9`):

| supply | `d1` cathode | LED anode | LED current |
|---|---|---|---|
| +9 V | 8.2382 V | 2.0618 V | 6.176 mA |
| −9 V | −4.4955 V | −4.4955 V | 0.000 mA |

Forward, the diode drops 9 − 8.238 = **0.762 V** and the LED runs normally.
Reversed, no current flows at all: the LED's two terminals sit at the same
voltage, and the engine raises the expected DRC warning ("LED appears to be
wired backward"). That warning is the example working, not failing.

```assert
# Forward diode drop: 9V - Vf(diode) across R+LED
net d1.cathode V 8.24 +-0.20
```
