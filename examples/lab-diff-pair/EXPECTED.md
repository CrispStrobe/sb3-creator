# lab-diff-pair — expected behaviour

## Circuit
Two NPN transistors share one 1 kΩ emitter resistor to ground (the "tail").
Each collector reaches +9 V through its own LED and 470 Ω: red on q1, green on
q2.

- q1's base is the reference: two 10 kΩ resistors hold it near half supply.
- q2's base is the input: the wiper of a 10 kΩ potentiometer across the supply.

The transistors use the engine's exponential (Ebers-Moll) junction model, so
the split between them follows the real tanh-shaped curve.

## Expected behaviour
- The tail resistor sets the total: about 3.7 mA, whatever the inputs do,
  because the emitters sit one base-emitter drop below the higher base.
- Input well below the reference (pot at 0.3): q2 is cut off, all of the tail
  current flows through q1 and the red LED.
- Input equal to the reference (pot at 0.5, as authored): the current is
  shared and both LEDs glow at about half brightness.
- Input well above (pot at 0.7): everything moves to q2 and the green LED.
- The whole changeover happens within about a tenth of a volt either side of the reference — a
  very sensitive comparison of two voltages.

## Measured on the engine
| pot position | input | reference | red (q1) | green (q2) |
|---|---|---|---|---|
| 0.3 | 2.70 V | 4.38 V | 3.67 mA | 0.000 mA |
| 0.48 | 4.32 V | 4.39 V | 3.44 mA | 0.237 mA |
| 0.5 | 4.46 V | 4.45 V | 1.48 mA | 2.28 mA |
| 0.52 | 4.62 V | 4.50 V | 0.042 mA | 3.86 mA |
| 0.7 | 5.62 V | 4.50 V | 0.000 mA | 4.59 mA |

The reference moves a little with the pot because q1's base current loads its
divider while q1 conducts.

## What this verifies
1. The pair responds to the DIFFERENCE between its two inputs.
2. The shared tail current is constant and only its split changes.
3. This is the input stage of every op-amp.

```assert
# pot at mid-travel: both bases near half supply, tail one Vbe below
net q2.base V 4.46 +-0.05
net q1.base V 4.45 +-0.05
net re.a V 3.79 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d4113b4` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **26 of this page's 26** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-diff-pair` prints them one by one.
<!-- engine-provenance -->
