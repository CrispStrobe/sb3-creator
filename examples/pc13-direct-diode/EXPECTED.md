# pc13-direct-diode — a plain diode in series with an LED

## Circuit
5 V → 220 Ω → diode (forward) → LED (green) → return. One loop, no branches.

## Expected (measured on the engine, `audit-solve pc13-direct-diode`)

| node | volts |
|---|---|
| supply / R top | 5.0000 |
| R bottom = diode anode | 2.6037 |
| diode cathode = LED anode | 1.9089 |
| return | 0.0000 |

- Diode forward drop **0.695 V**, LED forward drop **1.909 V**.
- Current **10.89 mA** = (5.0 − 2.6037) / 220.
- LED brightness **0.5446**.

The hand calculation with textbook drops — (5.0 − 0.7 − 2.0) / 220 ≈ 10.45 mA —
lands about 4 % low, and that gap is the lesson, not an error: a junction's drop
is not a constant, it is a curve the circuit picks a point on. Both quoted
figures are read off that curve somewhere ELSE — 0.7 V for a silicon diode at
around 1 mA, 2.0 V for a red LED at its rated 20 mA — and this loop settles at
10.89 mA, which is above the first and below the second. So both junctions here
sit a little BELOW their nominal drops, and the naive answer comes out low.
Push the current higher and the drops rise to meet the nominal figures; that is
what "the drop is not a constant" actually looks like.

## Try it
Delete the diode and wire R straight to the LED: current rises to about
13.9 mA and brightness to ≈ 0.70 (that circuit is `pc01-led-resistor`). The
difference is the ~0.7 V the diode was eating.

```assert
# Series drops: R + diode(0.8V Shockley) + LED(2.1V Shockley) = 5V
net resistor_2.b V 2.60 +-0.15
net diode_3.cathode V 1.91 +-0.15
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@4ae99be` and `bw-circuit-ui@a2b1cb2` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **6 of this page's 14** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc13-direct-diode` prints them one by one.
<!-- engine-provenance -->
