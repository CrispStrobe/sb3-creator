# lab-coil-compass — expected behaviour

## Circuit
- A 1.5 V cell, a switch, 22 Ω and a 100 Ω rheostat (`potentiometer_5`, authored at the end with no resistance in circuit), an ammeter and a hand-wound coil (`air_coil_7`: 200 turns of 0.25 mm wire on a 3 cm tube, 1.5 cm radius).
- A compass lies on the coil's axis 5 cm from its centre; the coil points east–west, so its field pushes the needle sideways against the Earth's 20 µT. The coil's field and the compass angle show on its tooltip.

## Observable behaviour
- Switch open: no current, the compass points north (0°).
- The coil's 12.6 m of copper wire add their own resistance (about six and a half ohms).
- Switch closed, rheostat out: 50.5 mA, 0.30 mT inside the coil, the compass turns 30°.
- Rheostat all in: 11.7 mA, the compass turns only about 8°.
- The field is proportional to the current; the angle is atan(B / B_earth), so it grows more slowly at large fields.

## Measured on the engine
bw-board r4/transducers-20261123, `test/lab-circuits-8.test.mjs`.

| setting | current | field inside | compass |
|---|---|---|---|
| switch open | 0 | 0 | 0° |
| rheostat out | 50.5 mA | 0.299 mT | 30.3° |
| rheostat in | 11.65 mA | 0.069 mT | 7.7° |

## What this verifies
1. A current through a coil makes a magnetic field proportional to turns × current.
2. A compass compares that field with the Earth's.

## Simulation notes
Field from the finite-solenoid formula on the axis; L from Wheeler's formula, R from the copper wire's length and cross-section.

```assert
# switch open as authored: the cell's voltage, nothing through the coil
net vsource_2.pos V 1.50 +-0.01
net air_coil_7.a V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2c62bd5` and `bw-circuit-ui@15b936d` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **2 of this page's 7** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-coil-compass` prints them one by one.
<!-- engine-provenance -->
