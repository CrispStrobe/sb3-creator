# lab-tone-keys — expected behaviour

## Circuit
A 555 astable on 9 V driving a piezo speaker. R1 = 1 kΩ runs from +9 V to DISCHARGE; C = 22 nF sits from THRESHOLD/TRIGGER to ground. The timing resistance R2 between DISCHARGE and THRESHOLD is not one resistor but a small network:

- R_a = 33 kΩ and R_b = 47 kΩ in series (the chain).
- KEY 1 connects R_c = 47 kΩ across the whole chain (parallel).
- KEY 2 shorts out R_a, leaving R_b alone.

CONTROL is decoupled with 10 nF, RESET is tied to +9 V.

## Observable behaviour
f = 1.44 / ((R1 + 2·R2) · C). Two keys give four values of R2 and four notes:

| Keys pressed | R2 | f by formula | f in the simulation |
|---|---|---|---|
| none | 33k + 47k = 80 kΩ | 407 Hz | about 402 Hz |
| KEY 2 | 47 kΩ | 689 Hz | about 676 Hz |
| KEY 1 | 80k ∥ 47k = 29.6 kΩ | 1087 Hz | about 1058 Hz |
| KEY 1 + KEY 2 | 47k ∥ 47k = 23.5 kΩ | 1364 Hz | about 1333 Hz |

- **Lowest to highest:** more resistance means a slower charge and a lower note, so the order is none, KEY 2, KEY 1, both.
- **The capacitor** swings between 3 V and 6 V (one and two thirds of the supply) in every case; only the speed changes.
- **Nearly square:** because R1 is small compared with R2, high and low times are almost equal (duty about 50 %).

## What this verifies
1. Series resistances add, parallel ones combine to less than the smallest.
2. A 555's pitch is inversely proportional to its timing resistance.

```assert
# nothing pressed, t = 1 ms: the output starts high while C charges
net timer.reset V 9.00 +-0.01
```
