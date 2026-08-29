# pc13-direct-diode — a plain diode in series with an LED

## Circuit
5 V → 220 Ω → diode (forward) → LED (green) → return. One loop, no branches.

## Expected (measured on the engine, `audit-solve pc13-direct-diode`)

| node | volts |
|---|---|
| supply / R top | 5.0000 |
| R bottom = diode anode | 2.8917 |
| diode cathode = LED anode | 2.0958 |
| return | 0.0000 |

- Diode forward drop **0.796 V**, LED forward drop **2.096 V**.
- Current **9.58 mA** = (5.0 − 2.8917) / 220.
- LED brightness **0.4792**.

The hand calculation with textbook drops — (5.0 − 0.7 − 2.0) / 220 ≈ 10.5 mA —
lands about 10 % high, and that gap is the lesson, not an error: a diode's drop
is not a constant. It rises with current (0.7 V is the number quoted at about
1 mA), so the more current you push the more voltage the diode takes back, and
the loop settles below the naive answer. Both diodes here sit above their
nominal drop.

## Try it
Delete the diode and wire R straight to the LED: current rises to about
13.6 mA and brightness to ≈ 0.65 (that circuit is `pc01-led-resistor`). The
difference is the ~0.8 V the diode was eating.

```assert
# Series drops: R + diode(0.8V Shockley) + LED(2.1V Shockley) = 5V
net resistor_2.b V 2.89 +-0.15
net diode_3.cathode V 2.10 +-0.15
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@4ae89b5` and `bw-circuit-ui@60fd117` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **6 of this page's 11** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc13-direct-diode` prints them one by one.
<!-- engine-provenance -->
