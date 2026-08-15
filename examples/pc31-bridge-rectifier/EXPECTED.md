# Bridge rectifier

Four diodes arranged so the load sees the same polarity whichever way round the
source is. The source floats; the load's negative side is the ground reference.

Measured on the engine (board vcc 9, `--at 1`; the reversed row via
`--set src=-9`):

| source | `src.pos` | `src.neg` | bridge output | LED anode | LED current |
|---|---|---|---|---|---|
| +9 V | 8.2456 V | −0.7544 V | 7.4913 V | 2.0544 V | 5.437 mA |
| −9 V | −0.7544 V | 8.2456 V | 7.4913 V | 2.0544 V | 5.437 mA |

The two rows are identical everywhere that matters: the source terminals swap,
the output does not move at all. That is the claim the title makes, and it is
now measurable rather than asserted.

Output is 9 V − 1.51 V = 7.49 V, and the missing 1.51 V is **two diode drops**
of 0.7544 V each — the price of a bridge, and the reason a two-diode circuit is
sometimes preferred despite needing a centre-tapped supply. The conducting pair
is `d1`+`d4` on one polarity and `d3`+`d2` on the other; the other two diodes are
reverse biased and idle.
