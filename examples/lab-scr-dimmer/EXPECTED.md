# lab-scr-dimmer — expected behaviour

## Circuit
- Low-voltage AC: 12 V peak, 50 Hz, as from a bell transformer.
- A 12 V lamp (120 Ω), a 1N4001 diode in series (so the thyristor never sees the negative half), and the PNP/NPN thyristor (4.7 kΩ base-emitter on the PNP, 4.7 kΩ gate-cathode on the NPN).
- Gate network: from the AC through the DIMMER pot (100 kΩ used as a variable resistor) and 4.7 kΩ into 100 nF to the cathode; from that capacitor through a 1N4148 and 1 kΩ to the gate.

## Observable behaviour
- DIMMER fully up: the thyristor fires about 16° into each positive half-wave and carries the lamp to the end of it; the lamp takes about 196 mW on average.
- DIMMER at 0.75: firing at about 55°, about 170 mW. At 0.5: about 83°, about 116 mW.
- DIMMER at 0.25: the capacitor's voltage never gets high enough to fire the gate; the lamp stays dark.
- Every firing ends by itself at the zero crossing, when the current through the pair stops.

## Measured on the engine
Firing angle (first sample with more than 1 V across the lamp) over one 20 ms period after 40 ms: 16° / 55° / 83° / none for DIMMER 1 / 0.75 / 0.5 / 0.25; average lamp power 196 / 170 / 116 / 0 mW. `test/lab-circuits-r6d.test.mjs` holds these.

## Why
More resistance in front of the capacitor makes its voltage both smaller and later than the AC. The gate fires when the capacitor reaches about 1.3 V (diode plus base-emitter drop) with enough current behind it, so that moment slides later into the half-wave; beyond a quarter of the way down the pot it never comes.

## What this verifies
1. A thyristor on AC switches off by itself at every zero crossing.
2. Delaying the gate pulse with an RC network controls the power: phase-angle control.

```assert
# t = 1 ms: AC at 12 V sin(18°), thyristor not fired yet
net vsource_2.pos V 3.71 +-0.02
net pnp_5.emitter V 3.67 +-0.05
net capacitor_11.a V 0.32 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **7 of this page's 18** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-scr-dimmer` prints them one by one.
<!-- engine-provenance -->
