# pc18-zener-clamp — zener voltage regulation

## Circuit
9 V → 330 Ω → 5.1 V zener (cathode up, i.e. reverse-biased) → return. The
junction between the resistor and the zener also feeds a 1 kΩ + green LED
branch, which is the load being protected.

## Expected (measured, `audit-solve pc18-zener-clamp`)

At the shipped 9 V input, t = 1 ms:

| node | volts |
|---|---|
| supply | 9.0000 |
| junction (zener cathode, load top) | **5.1429** |
| LED anode | 2.0311 |
| return | 0.0000 |

- LED current **3.11 mA** = (5.1429 − 2.0311) / 1000, brightness **0.1556**.
- Zener current = (9.0 − 5.1429) / 330 − 3.11 mA ≈ **8.58 mA**.

## The phenomenon: it holds against a moving input
Re-solved with only `volts` on the source changed:

| input | junction | LED brightness |
|---|---|---|
| 6 V | 5.0149 V | 0.1493 |
| 9 V | 5.1429 V | 0.1556 |
| 12 V | 5.1874 V | 0.1578 |

A **6 V swing at the input produces a 0.17 V swing at the load** — a rejection
of about 35:1. That is the titled behaviour, and it is what a plain resistive
divider cannot do: a divider's output would have tracked the input in
proportion, moving from 4 V to 8 V across the same sweep.

The junction sits slightly above the nominal 5.1 V and creeps up with current,
because a zener's reverse characteristic is steep but not vertical. That slope
is the regulator's imperfection, and it is visible in the table.

```assert
# Zener clamp: Vz ≈ 5.1V (breakdown), resistor drops 9-5.1=3.9V
net resistor_2.b V 5.14 +-0.20
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@6571648` and `bw-circuit-ui@14efc75` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **12 of this page's 20** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc18-zener-clamp` prints them one by one.
<!-- engine-provenance -->
