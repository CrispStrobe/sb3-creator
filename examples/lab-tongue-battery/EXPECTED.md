# lab-tongue-battery — expected behaviour

## Circuit
- A 9 V battery and a 1.5 V cell on a slide switch (right: 9 V, as authored; left: 1.5 V). The push button is the tongue on the contacts: it connects the selected source through an ammeter to the electrolysis cell (`electrolysis_cell_7`).
- The cell is the wet tongue between two contacts: about 2 kΩ of electrolyte, and at each contact an interface that passes current only by electrolysis (about 1.7 V needed), with a 2 µF double layer.
- A voltmeter across the contacts.

## Observable behaviour
- Not touching: no current.
- 9 V, touching: 3.47 mA. The contacts settle at 2.05 V of polarisation; the rest of the voltage drops in the electrolyte. The electrolysis current is far above the ≈ 20 µA it takes to taste it: taste "strong", sour at the + contact (the tooltip shows it).
- 1.5 V, touching: 0.35 µA. Below the decomposition voltage almost nothing flows: no taste.
- Let go after 9 V: the voltmeter still shows about 1.75 V a few milliseconds later, slowly falling. The contacts hold a charge, like a tiny battery.

## Measured on the engine
bw-board r4/transducers-20261123, `test/lab-circuits-8.test.mjs`.

| source | current | contacts | taste |
|---|---|---|---|
| 9 V | 3.47 mA | 2.05 V | strong |
| 1.5 V | 0.35 µA | 1.50 V | none |

## What this verifies
1. Current enters an electrolyte only through a chemical reaction, which needs a minimum voltage (the decomposition voltage).
2. Electrolysis products are what the tongue tastes; Faraday's law links the current to how much is made.
3. Polarised electrodes keep a voltage: the principle of a rechargeable cell.

## Simulation notes
The cell is electrolyte resistance in series with a double layer in parallel with Tafel-law electrolysis (onset 1.7 V, 60 mV per e-fold). Don't put anything bigger than a 9 V battery on your tongue.

```assert
# power-on: switch on 9 V, button open: no current into the tongue
net slide_switch_4.com V 9.00 +-0.01
net vsource_3.pos V 1.50 +-0.01
net electrolysis_cell_7.a V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d5501af` and `bw-circuit-ui@0efc30a` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **6 of this page's 24** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-tongue-battery` prints them one by one.
<!-- engine-provenance -->
