# lab-transistor-and-or — expected behaviour

## Circuit
- 9 V battery. Buttons A (button_3) and B (button_4) each feed two NPN bases through 10 kΩ; 47 kΩ pull-downs.
- NAND: two NPNs in series under 2.2 kΩ. NOR: two NPNs in parallel under 2.2 kΩ.
- Each gate output drives a PNP inverter through 22 kΩ: green LED (led_20, 1 kΩ) under the NAND's PNP = AND; yellow LED (led_24, 1 kΩ) under the NOR's PNP = OR.

## Observable behaviour
- AND (green) lights only with A and B both pressed.
- OR (yellow) lights with A, with B, or with both.
- The NAND output is high (9 V) except with both pressed (0.11 V); the NOR output is high only with neither.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10a.test.mjs`: NAND 9 / 9 / 9 / 0.109 V and NOR 9 / 0.053 / 0.053 / 0.041 V for none / A / B / both; AND 6.90 mA only with both, OR 7.0 mA with any.

## What this verifies
1. Two switches in series make a NAND (output low only if both conduct), two in parallel a NOR.
2. An inverter after each turns them into AND and OR: the PNP conducts exactly when the gate output is low.

## Simulation notes
The PNP inverter needs no extra supply: its emitter is on +9 V and the gate's 9 V high output keeps it off, its 0.1 V low output drives it hard on through 22 kΩ.

```assert
# 1 ms after switch-on, no button pressed
net resistor_11.b V 9.00 +-0.02
net resistor_16.b V 9.00 +-0.02
net resistor_19.b V 0.00 +-0.02
net resistor_23.b V 0.00 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **14 of this page's 18** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-transistor-and-or` prints them one by one.
<!-- engine-provenance -->
