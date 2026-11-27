# lab-npn-swell-siren — expected behaviour

## Circuit
9 V (`vsource_2`). Astable: Q1 `npn_3`, Q2 `npn_4`, collector resistors 2.2 kΩ (`resistor_5`, `resistor_6`), coupling capacitors 22 nF (`capacitor_7` Q1 → Q2, `capacitor_8` Q2 → Q1), Q2's base resistor 47 kΩ (`resistor_10`) from +9 V. Q1's base resistor, 47 kΩ (`resistor_9`), is fed from the bias capacitor: 10 µF (`polarized_cap_13`), plus 47 µF (`polarized_cap_15`) in parallel when the **SLOW** slide switch (`slide_switch_14`) is at position 1. The button (`button_11`) charges it from +9 V through 2.2 kΩ (`resistor_12`). Q3 (`npn_17`) drives the earphone (`earphone_18`) from Q2's collector through 10 kΩ.

## Observable behaviour
- Idle: the bias capacitor is empty, Q1's base is never recharged, the earphone is silent.
- Button held: the capacitor charges (time constant 22 ms), Q1's base recharges faster and faster, the note swells from about 380 Hz to about 640 Hz within 36 ms.
- Released: Q1's base empties the capacitor slowly (about half a second), the note sinks and finally stops when the capacitor is below about 0.6 V.
- SLOW: 57 µF charge about six times more slowly; after 30 ms the capacitor is at about 1.9 V instead of 6.5 V, and the note is still near 390 Hz.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6a.test.mjs`. The rows are one run, each stepped from the one before:

| step | pitch | bias capacitor |
|---|---|---|
| button held, consecutive 6 ms windows | 381, 460, 529, 578, 614, 637 Hz | 7.0 V at the end |
| released, first 15 ms | 640 Hz | |
| released, 45–60 ms later | 612 Hz | 6.04 V |
| new run with SLOW, held, window 20–30 ms | 386 Hz | 1.90 V at the end |

## What this verifies
1. An astable's pitch depends on the voltage its base resistors recharge from, not only on R and C.
2. A capacitor filled and emptied through resistors turns a button into a slow glide.

## Simulation notes
The kit-style version feeds both base resistors from the bias capacitor. With that, the engine found the astable running anyway at about 4 kHz with the capacitor empty: each half was held on only by the other collector recharging its coupling capacitor through 2.2 kΩ, enough base current for a transistor with a gain of 100. Feeding Q2's base from +9 V keeps Q2 firmly on at idle and the circuit silent; the swell then comes from Q1's half alone. The glide is scaled to tens of milliseconds so the scenario stays short; a real swelling siren uses a capacitor a hundred times larger.

```assert
# t = 1 ms, idle: bias capacitor empty
net vsource_2.pos V 9.00 +-0.01
net polarized_cap_13.pos V 0.00 +-0.03
net npn_4.collector V 0.09 +-0.03
net npn_17.collector V 9.00 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 35** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-npn-swell-siren` prints them one by one.
<!-- engine-provenance -->
