# lab-salt-water-probe — expected behaviour

## Circuit
- 9 V battery, 470 Ω, red LED (led_4), then two bare wires in a glass of water to the battery's minus.
- The slide switch (slide_switch_5) is the glass: left, demineralised water (electrolysis_cell_6, 500 kΩ between the wires, as built); right, the same water with a pinch of salt (electrolysis_cell_7, 300 Ω).
- Each glass is an electrolysis cell: the water's resistance plus two electrode surfaces that pass current only above about 1.7 V.

## Observable behaviour
- Demineralised water: the LED stays dark; about 15 µA flows and 7.6 V of the battery stand across the water.
- Salt water: the LED lights with about 6.7 mA; the water now takes about 4.1 V, most of it the electrodes' decomposition voltage.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10a.test.mjs`: demineralised 0.015 mA (7.63 V across the water), salt 6.74 mA (4.11 V across the water).

## What this verifies
1. Pure water is a poor conductor; dissolved salt supplies ions and lowers its resistance by three orders of magnitude.
2. Even with salt, current needs about 1.7 V across the electrodes before it flows (electrolysis), on top of the LED's forward voltage.

## Simulation notes
The two glasses are two `electrolysis_cell` parts with fixed resistances (500 kΩ and 300 Ω) for wires about a centimetre apart. Current through salt water makes gas at the electrodes; the cell reports the charge passed and the hydrogen made.

```assert
# 1 ms after switch-on, demineralised water: almost no current
net led_4.anode V 8.99 +-0.01
net led_4.cathode V 7.63 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **4 of this page's 16** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-salt-water-probe` prints them one by one.
<!-- engine-provenance -->
