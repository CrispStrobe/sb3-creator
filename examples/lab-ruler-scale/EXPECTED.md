# lab-ruler-scale — expected behaviour

## Circuit
- 9 V supply. A steel ruler clamped at one end carries a small magnet over a linear Hall sensor (`bending_ruler_3`: 20 cm free, 12.5 mm deflection per newton, 25 mm rest gap, magnet moment rated 0.1 A·m²). The **load** slider hangs grams on the free end.
- An LM358 (`lm358_7`) half is a difference amplifier with gain 20 (10 kΩ in, 200 kΩ feedback, the same on the + side). It subtracts a zero voltage from the Hall output. The zero comes from a fine trim (47 kΩ, 1 kΩ potentiometer, 47 kΩ across the supply), buffered by the other LM358 half.
- A meter (5 V) on the output.

## Observable behaviour
- No load: the needle rests near 0 (0.02 V).
- 20 g: 0.25 V. 50 g: 0.87 V. 100 g: 4.25 V. Much beyond 100 g the amplifier saturates.
- The second 50 g move the needle about four times as far as the first 50 g: the scale is not linear.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`.

| load | magnet distance | field at the sensor | meter |
|---|---|---|---|
| 0 g | 25.0 mm | 1.28 mT | 0.018 V |
| 20 g | 22.5 mm | 1.75 mT | 0.252 V |
| 50 g | 18.9 mm | 2.98 mT | 0.873 V |
| 100 g | 12.7 mm | 9.68 mT | 4.249 V |

## What this verifies
1. The ruler bends in proportion to the load (Hooke's law): 2.45 mm per 20 g.
2. The magnet's field falls with the cube of the distance, so equal steps of load give ever larger steps of field. A scale built this way has to be calibrated point by point.
3. A difference amplifier with an offset brings a small change riding on 4.5 V onto a meter.

## Simulation notes
The ruler, magnet and Hall sensor are one part (bw-board bending-ruler.js): cantilever deflection, a dipole field on axis and a ratiometric sensor (rated 14 mV/mT at 5 V, scaled to the 9 V supply).

```assert
# as built: no load, 1.28 mT at the sensor
net bending_ruler_3.ao V 4.531 +-0.002
net lm358_7.1_out V 0.02 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2965782` and `bw-circuit-ui@e3441d2` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **16 of this page's 20** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ruler-scale` prints them one by one.
<!-- engine-provenance -->
