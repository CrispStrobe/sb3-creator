# lab-npn-four-tone-keys — expected behaviour

## Circuit
9 V (`vsource_2`). Shared tone stage: `npn_3` (Q1) and `npn_4` (Q2) form an astable, each with 2.2 kΩ to +9 V in its collector (`resistor_5`, `resistor_6`); `capacitor_7` couples Q1's collector to Q2's base, `capacitor_8` Q2's collector to Q1's base. A third NPN (Q3) gets Q2's collector through 10 kΩ and switches the magnetic earphone (2 kΩ, 0.1 H) with a 1N4148 across it for the coil's kick. Each half stays off for about 0.69 · R · C, R being the resistor that recharges the capacitor on its base. Here Q3 is `npn_16`, the earphone `earphone_17`. Coupling capacitors 22 nF; Q2's base resistor 33 kΩ (`resistor_9`) from +9 V. Q1's base is fed from +9 V through a chain: 22 kΩ (`resistor_12`), 39 kΩ (`resistor_11`), 27 kΩ (`resistor_10`, at the base). Button **A** (`button_13`) bridges the 39 kΩ, button **B** (`button_14`) the 22 kΩ.

## Observable behaviour
| buttons | feed resistance | pitch |
|---|---|---|
| none | 88 kΩ | about 569 Hz (the drone) |
| B | 66 kΩ | about 689 Hz |
| A | 49 kΩ | about 824 Hz |
| A + B | 27 kΩ | about 1104 Hz |

The circuit sounds all the time; the buttons pick the note.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6a.test.mjs` (a fresh bench per combination, 4 ms settling, 6 ms window): 568.7 Hz, 689.3 Hz, 824.4 Hz, 1104.5 Hz, each with period spread below 0.1 %.

## What this verifies
1. Resistors in series add; bridging one with a button removes it from the sum.
2. Two buttons give four combinations, and four R · C products give four notes.

```assert
# t = 1 ms: Q2 on, Q1 recharging, the earphone driver off
net vsource_2.pos V 9.00 +-0.01
net npn_4.base V 0.69 +-0.03
net npn_4.collector V 0.08 +-0.03
net npn_16.collector V 9.00 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0f6b38a` and `bw-circuit-ui@42aaddc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **15 of this page's 30** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-npn-four-tone-keys` prints them one by one.
<!-- engine-provenance -->
