# Resistor ladder

Three equal resistors across a 9 V supply divide it into equal steps. Nothing is
connected to the taps, so the measured values are the ideal unloaded ones.

Measured on the engine (board vcc 9, `--at 1`):

| node | measured | ideal |
|---|---|---|
| `src.pos` / `r1.a` | 9.0000 V | 9 V |
| `r1.b` / `r2.a` | 6.0000 V | 6 V (2/3) |
| `r2.b` / `r3.a` | 3.0000 V | 3 V (1/3) |
| `r3.b` / ground | 0.0000 V | 0 V |

Exact to four decimals, because with nothing drawing current from the taps the
same 9 V / 30 kΩ = **0.3 mA** flows through all three resistors and each drops
0.3 mA × 10 kΩ = 3 V. Hang a load on a tap and the equality breaks — that is the
lesson the intro's experiment makes visible.
