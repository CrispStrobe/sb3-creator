# Timer pulse

A 555 wired as an astable: `c1` charges through `r1 + r2`, discharges through
`r2` alone, and the output drives the LED. No program runs — the RC network is
the clock.

Measured on the engine (board vcc 5, samples in ms):

| t | `c1` | `u1.output` | LED |
|---|---|---|---|
| 1 ms | 0.02 V | 4.86 V | on, 2.83 mA |
| 100 ms | 1.95 V | 4.86 V | on |
| 228 ms | 3.32 V | 0.00 V | off |
| 296 ms | 1.67 V | 4.86 V | on |
| 437 ms | 3.30 V | 4.86 V | flips again |

The capacitor swings between the 555's two thresholds — 1/3 VCC = **1.667 V**
and 2/3 VCC = **3.333 V** — which the control pin sets and holds at 3.3333 V.

Timing, measured against the textbook formulas:

| | formula | predicted | measured |
|---|---|---|---|
| output high | 0.693 · (R1+R2) · C | 138.6 ms | ~139 ms |
| output low | 0.693 · R2 · C | 69.3 ms | ~68 ms |
| period | | 208 ms (4.8 Hz) | ~208 ms |

**Pin 5 must be connected.** `c2` (10 nF, control → ground) is the decoupling
capacitor every 555 datasheet puts there. On this engine it is not optional: the
internal threshold divider is only formed when the control pin belongs to a net,
and without it both thresholds collapse to 0 V, the flip-flop never sets, and
the output sits at 0 V forever. See `examples/AUDIT/pc25-pc36.md`.

```assert
# 555 astable: VCC = 5V, period ~ 208ms
net vcc1.pos V 5.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@1caf851` and `bw-circuit-ui@06c7ea7` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **0 of this page's 29** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc27-timer-pulse` prints them one by one.
<!-- engine-provenance -->
