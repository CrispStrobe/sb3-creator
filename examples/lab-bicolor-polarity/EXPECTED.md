# lab-bicolor-polarity — expected behaviour

## Circuit
Two test leads, A and B. From A a 1 kΩ resistor leads to node X. A red LED
points from X to B, a green LED points from B to X — they are anti-parallel, so
exactly one of them can conduct for either polarity.

The "unknown" voltage is the 9 V battery fed through a double-pole relay wired
as a reversing switch. At rest A is plus; holding the **swap leads** button
energises the coil (a diode across it catches the switch-off spike) and crosses
the leads over, so B becomes plus.

## Expected behaviour
- Button released, A positive: the red LED carries about 7.2 mA, the green one
  is reverse-biased and dark.
- Button pressed, B positive: the roles swap — green lit, red dark. Green
  carries a little less (about 6.9 mA): its forward voltage is higher, so less
  is left across the 1 kΩ.
- In either direction the dark LED sits reverse-biased across the lit one,
  seeing only that LED's forward voltage, so it is never stressed.

## Measured on the engine
| state | lead A | lead B | red LED | green LED |
|---|---|---|---|---|
| button released | 9.00 V | 0.00 V | 7.23 mA | 0.000 mA |
| button pressed | 0.00 V | 9.00 V | 0.000 mA | 6.93 mA |

## What this verifies
1. An LED conducts in one direction only.
2. Two LEDs back to back make a polarity indicator that is safe both ways round.

```assert
# at rest lead A is plus: X sits one red-LED drop above lead B
net r1.a V 9.00 +-0.02
net red.anode V 1.77 +-0.05
net red.cathode V 0.00 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2c62bd5` and `bw-circuit-ui@15b936d` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **7 of this page's 13** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-bicolor-polarity` prints them one by one.
<!-- engine-provenance -->
