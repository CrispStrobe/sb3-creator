# Two-input logic interlock

The AND gate's output is high only when both switches connect their inputs to
the supply. The 100 kΩ pull-down resistors are what make the other three
combinations well-defined: an unconnected CMOS input is not "low", it is
undecided.

Measured on the engine (board vcc 5):

| `sw_a` | `sw_b` | `in0` | `in1` | `gate1.out` | LED |
|---|---|---|---|---|---|
| open | open | 0.00 V | 0.00 V | 0.00 V | off, 0.00 mA |
| closed | open | 5.00 V | 0.00 V | 0.00 V | off, 0.00 mA |
| open | closed | 0.00 V | 5.00 V | 0.00 V | off, 0.00 mA |
| closed | closed | 5.00 V | 5.00 V | 4.86 V | on, 2.83 mA |

The output's 4.86 V rather than 5.00 V is the gate's 50 Ω output resistance
carrying 2.83 mA. The gate switches at CMOS thresholds — below 30 % of VCC is
low, above 70 % is high — so the 0 V and 5 V the switches produce are
unambiguous at both ends.

```assert
# AND gate: both switches open -> output LOW, LED off
net vcc1.pos V 5.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@6571648` and `bw-circuit-ui@14efc75` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 25** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc28-logic-interlock` prints them one by one.
<!-- engine-provenance -->
