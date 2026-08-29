# pc21-rc-smoothing

## Circuit
5 V source → 1 kΩ → node → 100 µF to ground. τ = 1000 × 0.0001 = **100 ms**.

## Expected — charging from power-on
`audit-solve pc21-rc-smoothing --at 0.001,1,10,100,200,300,500`

| t | node voltage | fraction |
|---|---|---|
| 0.001 ms | 0.0000 V | 0 % |
| 1 ms | 0.0497 V | 1.0 % |
| 10 ms | 0.4756 V | 9.5 % |
| **100 ms = 1 τ** | **3.1568 V** | **63.1 %** |
| 200 ms = 2 τ | 4.3202 V | 86.4 % |
| 300 ms = 3 τ | 4.7493 V | 95.0 % |
| 500 ms = 5 τ | 4.9657 V | 99.3 % |

## Expected — the step the title is about
The source is steady, so the smoothing has to be provoked. Step it from 5 V to
2 V at t = 500 ms:

`audit-solve pc21-rc-smoothing --at 100,300,500,600,700,800,1000,1200 --set@501 src=2`

| t | node voltage | τ since step | distance remaining |
|---|---|---|---|
| 500 ms | 4.9655 V | — | step happens here |
| 600 ms | **3.0937 V** | 1 τ | 36.9 % of 2.9655 V left |
| 700 ms | 2.4033 V | 2 τ | 13.6 % left |
| 800 ms | 2.1488 V | 3 τ | 5.0 % left |
| 1000 ms | 2.0203 V | 5 τ | 0.7 % left |
| 1200 ms | 2.0028 V | 7 τ | 0.1 % left |

The source moved 3 V in zero time; the node took about 300 ms to follow it 95 %
of the way. That lag **is** the smoothing: fast wobbles on the input never
reach the output, slow changes do.

The same 63 / 86 / 95 / 99 percentages govern both directions — charging up and
settling down are the same exponential.

## Observation conditions (important)
- Sub-millisecond samples read 0 V. With τ = 100 ms there is nothing to see
  before ~10 ms; the default single 1 ms sample makes this example look dead.
- `--set@<ms>` in the harness is applied **before** `advanceTo(ms)`, so a
  stimulus takes effect at the *previous* sample time. To make the step land at
  500 ms, 500 must be a sample and the schedule must be `--set@501`. Getting
  this backwards puts the step at t = 0 and the transient vanishes.

```assert
# RC smoothing: tau = 1k * 100uF = 100ms, supply 5V
net src.pos V 5.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@4ae89b5` and `bw-circuit-ui@60fd117` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **20 of this page's 54** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc21-rc-smoothing` prints them one by one.
<!-- engine-provenance -->
