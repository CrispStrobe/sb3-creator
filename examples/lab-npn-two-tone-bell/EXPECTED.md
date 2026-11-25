# lab-npn-two-tone-bell — expected behaviour

## Circuit
9 V (`vsource_2`). Shared tone stage: `npn_3` (Q1) and `npn_4` (Q2) form an astable, each with 2.2 kΩ to +9 V in its collector (`resistor_5`, `resistor_6`); `capacitor_7` couples Q1's collector to Q2's base, `capacitor_8` Q2's collector to Q1's base. A third NPN (Q3) gets Q2's collector through 10 kΩ and switches the magnetic earphone (2 kΩ, 0.1 H) with a 1N4148 across it for the coil's kick. Each half stays off for about 0.69 · R · C, R being the resistor that recharges the capacitor on its base. Here Q3 is `npn_15`, the earphone `earphone_16`. Coupling capacitors 22 nF each. Q2's base resistor is 47 kΩ (`resistor_9`) from +9 V. Q1's base has no resistor to +9 V of its own: **LOW** (`button_10`) connects 100 kΩ (`resistor_11`), **HIGH** (`button_12`) connects 33 kΩ (`resistor_13`).

## Observable behaviour
- No button: Q1's base is never recharged, Q1 stays off, Q2 stays on, Q3 stays off: the earphone is silent.
- LOW held: a tone of about 465 Hz. HIGH held: about 824 Hz. Both held (100 kΩ ∥ 33 kΩ ≈ 25 kΩ): about 910 Hz.
- Released: the tone stops within a cycle.
- By the formula: Q2's half 0.69 · 47 kΩ · 22 nF = 0.71 ms; Q1's half 1.52 ms (LOW) or 0.50 ms (HIGH), giving 448 Hz and 828 Hz.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6a.test.mjs`, periods between the earphone's tone-tracker edges in a window after a few ms of settling:

| buttons | pitch |
|---|---|
| none | no edges |
| LOW | 465.4 Hz |
| HIGH | 824.5 Hz |
| LOW + HIGH | 910.4 Hz |

## What this verifies
1. An astable's frequency is set by R · C; a button choosing R chooses the note.
2. Without its base resistor one half never recharges: the oscillator stops.

## Simulation notes
The earphone is driven by its own transistor on purpose. As Q2's collector load, the coil's current dying away through the diode dragged Q2's collector down while Q2 was off; that pull reached Q1's base through the coupling capacitor and turned Q1 off early (two settings 0.26 ms apart in theory gave the same 1.3 ms period).

```assert
# t = 1 ms, no button: Q1 off, Q2 on, the earphone driver off
net npn_3.collector V 9.00 +-0.02
net npn_4.collector V 0.09 +-0.03
net npn_15.collector V 9.00 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b094eb2` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **12 of this page's 30** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-npn-two-tone-bell` prints them one by one.
<!-- engine-provenance -->
