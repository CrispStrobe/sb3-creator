# Polarity protector

A diode in series with the load: it costs a fraction of a volt when the supply is
the right way round, and blocks everything when it is not.

Measured on the engine (board vcc 9, `--at 1`; reversed via `--set src=-9`):

| supply | `d1` cathode | LED anode | LED current |
|---|---|---|---|
| +9 V | 8.2382 V | 2.0618 V | 6.176 mA |
| −9 V | −4.4955 V | −4.4955 V | 0.000 mA |

Forward, the diode drops 9 − 8.238 = **0.762 V** and the LED runs normally.
Reversed, no current flows at all: the LED's two terminals sit at the same
voltage, and the engine raises the expected DRC warning ("LED appears to be
wired backward"). That warning is the example working, not failing.

```assert
# Forward diode drop: 9V - Vf(diode) across R+LED
net d1.cathode V 8.24 +-0.20
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@1caf851` and `bw-circuit-ui@06c7ea7` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **1 of this page's 9** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc34-polarity-protector` prints them one by one.
<!-- engine-provenance -->
