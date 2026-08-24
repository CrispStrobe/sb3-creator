# Loaded reference tap

Three 10 kΩ resistors across 9 V make a chain with two taps: 6.000 V at the
upper junction and 3.000 V at the lower one. The switch connects a 100 kΩ
measurement load to the **upper** tap.

Measured on the engine (`audit-solve pc37-selectable-reference`):

| node | switch open | switch closed |
|---|---|---|
| upper tap (`r1.b`) | 6.0000 V | 5.6250 V |
| lower tap (`r2.b`) | 3.0000 V | 2.8125 V |
| load node (`sel.b`) | 0.0000 V (floating) | 5.6250 V |

The 0.375 V droop is not an error — it is the prediction. Looking back into
the divider from the tap, the source resistance is 10 kΩ ∥ 20 kΩ = 6.667 kΩ,
so a 100 kΩ load forms a second divider: 6 V × 100 / 106.667 = **5.625 V**,
exactly what the solver reports. The load current is 5.625 V / 100 kΩ =
56.25 µA.

The lesson: a reference is only as stiff as its source resistance. Even a
"high-impedance" load moves this one by 6.25 %.

```assert
# Three equal 10k: upper tap = 9×2/3 = 6.0V, lower = 9×1/3 = 3.0V
net r1.b V 6.00 +-0.01
net r2.b V 3.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@88e9668` and `bw-circuit-ui@410f8ce` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **7 of this page's 22** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc37-selectable-reference` prints them one by one.
<!-- engine-provenance -->
