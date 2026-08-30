# pc14-mini-led — LED on a mini breadboard (no rails)

## Circuit
5 V supply → 470 Ω → red LED → return, built on a **170-point mini
breadboard**: 17 columns, rows a–e above the gutter and f–j below, and **no
power rails at all**. Nothing is joined by a drawn wire except the two supply
leads; everything else is joined by the board's own column strips.

Seating:

| part | lead | hole | column strip |
|---|---|---|---|
| R (470 Ω) | a | a3 | col-t3 |
| R (470 Ω) | b | a7 | col-t7 |
| LED | anode | b7 | col-t7 |
| LED | cathode | b8 | col-t8 |

Supply leads tap **e3** (col-t3, the + end) and **e8** (col-t8, the return).
R's b lead and the LED's anode meet only because a7 and b7 are the same
column strip — that is the whole point of the example.

## Expected (measured, `audit-solve pc14-mini-led`)

| node | volts |
|---|---|
| supply / R top (col-t3) | 5.0000 |
| R bottom = LED anode (col-t7) | 2.0625 |
| return (col-t8) | 0.0000 |

- Current **6.25 mA** = (5.0 − 2.0625) / 470.
- LED brightness **0.3125**.

The ideal-drop estimate (5.0 − 2.0) / 470 ≈ 6.4 mA is 2 % high, because the
LED's real drop at 6 mA is 2.06 V rather than a flat 2.0 V.

## Failure mode this example guards
With no rails, every connection must come from a column strip or a tap wire.
Move the LED's anode from **b7** to **b6** and the circuit goes dark: b6 is a
different column, so the strip no longer bridges R to the LED. The board looks
identical; only the column number changed.

```assert
# 5V -> 470R -> LED: I = 6.25mA, LED anode ~ 2.06V
net vsource_2.pos V 5.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@6571648` and `bw-circuit-ui@14efc75` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **6 of this page's 10** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc14-mini-led` prints them one by one.
<!-- engine-provenance -->
