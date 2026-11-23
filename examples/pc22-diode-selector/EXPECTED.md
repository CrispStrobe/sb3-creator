# pc22-diode-selector

## Circuit
Two 5 V sources, each through its own diode into a shared node; that node feeds
1 kΩ + a green LED to ground. Both source returns share the ground.

## Expected (measured, `audit-solve pc22-diode-selector [--set …]`)

| condition | shared node | LED current |
|---|---|---|
| both sources on | 4.4327 V | 2.699 mA |
| `--set src_a=0` | 4.4011 V | **2.668 mA** |
| `--set src_b=0` | 4.4011 V | **2.668 mA** |
| `--set src_a=0,src_b=0` | 0.0000 V | 0.000 mA |

**Losing either source costs the load about 1 % of its current.** That is the
point of the circuit: the indicator does not care which supply is present, only
that one of them is. LED brightness 0.1349, anode 1.7338 V.

## The blocking half
With both sources at 5 V each diode drops **0.567 V** (5.0000 → 4.4327). Each
diode carries only half of the 2.7 mA, and at 1.35 mA a silicon junction sits
well below the textbook figure; alone, one diode carries all of it and drops
0.599 V (the `src_a=0` row).

Set the two sources to *different* voltages and the selection becomes visible.
With `src_a` at 9 V and `src_b` at 5 V, the shared node sits at **8.3582 V**:
`d_a` conducts, and `d_b` now has 5 V on its anode against 8.36 V on its
cathode — reverse-biased, blocking. Without that diode, the 9 V supply would be
driving current backwards into the 5 V one, which is the failure the circuit
exists to prevent. LED brightness rises to 0.3272.

## Note on reading brightness
With both sources off the node is at 0 V and the LED current is exactly
0.000 mA, but `ledBrightness` still reports the lit value: it is averaged over a
trailing window and has not yet forgotten the lit period. Read **current** for
an instantaneous answer, brightness for a perceptual one.

```assert
# Two diodes OR: both sources at 5V, shared node ~ 4.43V (5 - Vf_diode)
net src_a.pos V 5.00 +-0.01
net src_b.pos V 5.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0bc7baf` and `bw-circuit-ui@8404334` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 26** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc22-diode-selector` prints them one by one.
<!-- engine-provenance -->
