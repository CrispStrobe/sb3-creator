# lab-capacitive-level — expected behaviour

## Circuit
A 555 astable on 9 V: 10 kΩ from the supply to DISCHARGE, 47 kΩ from DISCHARGE
to THRESHOLD/TRIGGER, 10 nF on the control pin, and a blue LED with 1 kΩ on
the output.

The timing capacitor is the "sensor": two foil electrodes on the outside of a
jar. The simulator has no variable capacitor, so the sensor is modelled in
steps:

- 1 µF from THRESHOLD to ground: the electrodes with an empty jar.
- Three more 1 µF capacitors, each switched in by a slide switch
  ("water reaches band 1/2/3"). Water has a much higher dielectric constant
  than air, so every band the water covers adds capacitance.

## Expected behaviour
- Empty jar: the LED blinks quickly, about 13.8 times a second.
- Each band of water adds capacitance, the capacitor takes longer to charge
  and discharge, and the blinking slows: half the rate with one band, a third
  with two, a quarter with three.
- The water never touches the electrodes; the level is measured through the
  glass.

## Measured on the engine
Rates counted over two seconds per level by `test/lab-circuits-1.test.mjs`
(the census cannot operate slide switches, so these steps are held there):

| water bands | timing capacitance, microfarads | measured rate, per second | 1.44 / ((R1 + 2·R2)·C) |
|---|---|---|---|
| 0 | 1 | 13.70 | 13.85 |
| 1 | 2 | 6.85 | 6.92 |
| 2 | 3 | 4.58 | 4.62 |
| 3 | 4 | 3.44 | 3.46 |

```assert
# empty jar: 1.44 / ((10k + 2 x 47k) x 1 uF)
buzzer_tone_hz: 13.85 +- 0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d19b5e4` and `bw-circuit-ui@6b4d702` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **7 of this page's 7** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-capacitive-level` prints them one by one.
<!-- engine-provenance -->
