# lab-potato-x10 — expected behaviour

## Circuit
- 9 V supply for half of an LM358 wired as a non-inverting amplifier: 91 kΩ from the output to the - input, 10 kΩ from there to ground (gain 10.1).
- Its + input is the potato cell: a copper coin and an iron nail in a potato, 0.5 V behind the potato's own internal resistance of a few kilohms (the model's default).
- A moving-coil meter (10 V full scale, 100 µA movement) reads either the potato directly (slide switch left) or the amplifier output (right, as authored).
- The second LM358 half is unused.

## Observable behaviour
- Through the amplifier the meter shows about 5.05 V, half scale: ten times the potato's 0.5 V. The amplifier's input takes no current, so the potato keeps its full 0.5 V.
- Straight on the potato the meter shows about 0.48 V, a barely moving needle; its own 100 kΩ loads the potato a little.
- With a zinc nail instead (0.85 V) the output would need 8.6 V; the LM358 on 9 V stops at about 7.5 V.

## Measured on the engine
Through the amplifier 5.05 V on the meter and 0.500 V at the potato; directly 0.476 V. The zinc-nail case is checked by raising the cell's voltage parameter: the output then stops at its ceiling. `test/lab-circuits-r6d.test.mjs` holds these.

## What this verifies
1. A non-inverting amplifier multiplies a small voltage by 1 + 91 k / 10 k.
2. Its high input resistance does not load a weak source.

```assert
# t = 1 ms: potato voltage times 10.1
net vsource_2.pos V 9.00 +-0.01
net potato_battery_3.pos V 0.500 +-0.002
net lm358_4.1_neg V 0.500 +-0.003
net lm358_4.1_out V 5.05 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d4113b4` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **13 of this page's 18** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-potato-x10` prints them one by one.
<!-- engine-provenance -->
