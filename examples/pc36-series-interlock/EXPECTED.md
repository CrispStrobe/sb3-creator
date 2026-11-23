# Series interlock

The indicator has a complete path only when both switches are closed. Opening
either one breaks the same branch, so no logic chip and no program is involved.

Measured on the engine (board vcc 5, `--at 1`):

| `sw1` | `sw2` | `r1.a` | LED current |
|---|---|---|---|
| open | open | floating | 0.000 mA |
| closed | open | floating | 0.000 mA |
| open | closed | floating | 0.000 mA |
| closed | closed | 5.0000 V | 3.252 mA |

Closed, the two switches pass the supply through untouched (5.0000 V at the
resistor) and the LED runs at the usual (5 − 1.748) V / 1 kΩ = 3.25 mA. Open, the
resistor's top end is connected to nothing that drives it: whatever a
solver reads there is set by the leakage of the open switch and the dark LED,
not by a path — 0.000 mA either way.

```assert
# Series switches both closed: 5V reaches R+LED, I = (5-1.748)/1k = 3.25mA
net src.pos V 5.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0bc7baf` and `bw-circuit-ui@8404334` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **2 of this page's 9** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc36-series-interlock` prints them one by one.
<!-- engine-provenance -->
