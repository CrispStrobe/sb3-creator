# Capacitor bypass

The capacitor sits **in parallel with the load** — across the LED, not in line
with it. It does not change the steady-state current; it is a local reservoir of
charge sitting right next to the thing that might suddenly need some.

Measured on the engine (board vcc 5, `--at 1 … 3000`):

| t | LED anode / capacitor | LED current |
|---|---|---|
| 1 ms | 0.0106 V | 0.00 mA |
| 100 ms | 0.9578 V | 0.00 mA |
| 300 ms | 2.0297 V | 2.97 mA |
| 1 s … 3 s | 2.0297 V | 2.97 mA |

Steady state is the plain resistor-and-LED answer — (5 − 2.03) V / 1 kΩ =
**2.97 mA** — exactly as it would be with no capacitor at all, which is the
point: a bypass capacitor is invisible until something changes.

What it *does* change is the edges. The rise takes a few hundred milliseconds
here (470 µF filling through 1 kΩ) instead of being instantaneous. Real bypass
capacitors are 100 nF, five thousand times smaller, so the same effect happens in
microseconds — invisible to the eye, which is exactly the timescale on which
digital circuits misbehave.

> Do not try to demonstrate the reservoir by switching the board's power off:
> `setPower(false)` currently annihilates stored capacitor charge on this engine
> rather than leaving it to discharge. See `examples/AUDIT/pc25-pc36.md`.

```assert
# Bypass cap: steady state = plain R+LED, (5-2.03)/1k = 2.97mA
net src.pos V 5.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@338ac5d` and `bw-circuit-ui@14efc75` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 18** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc35-capacitor-bypass` prints them one by one.
<!-- engine-provenance -->
