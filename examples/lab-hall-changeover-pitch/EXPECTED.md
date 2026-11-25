# lab-hall-changeover-pitch — expected behaviour

## Circuit
- 9 V supply. A linear Hall sensor (`hall_analog_3`): its output sits at half the supply without field and moves towards ground for a north pole (field −1) and towards the supply for a south pole (field +1).
- Changeover: the Hall output reaches `npn_6`'s base through 10 kΩ with 10 kΩ to ground. `npn_6` and `npn_11` share a 470 Ω emitter resistor (an emitter-coupled trigger). `npn_6`'s collector carries the yellow LED (`led_8`, 2.2 kΩ) and drives `npn_11`'s base through 33 kΩ with 30 kΩ to ground; `npn_11`'s collector carries the green LED (`led_13`, 1 kΩ).
- Pitch: the Hall output also reaches VCO_IN of a 4046 (`cd4046_16`; R1 = 47 kΩ, R2 = 470 kΩ, C1 = 10 nF) through 10 kΩ; its output sounds a piezo through 1 kΩ.

## Observable behaviour
- Raising the field: the yellow LED takes over between +0.2 and +0.3.
- Lowering it again: the yellow LED stays on through 0 and down to −0.3; the green LED returns between −0.3 and −0.4. Between those thresholds the trigger remembers the last pole.
- At power-on with no field the yellow LED is lit.
- The piezo's pitch follows the field continuously: about 160 Hz at −1, 580 Hz at 0, 1010 Hz at +1.

## Measured on the engine
bw-board d4113b4b / bw-circuit-ui 0b594d6, `test/lab-circuits-r6i.test.mjs`, 1 ms per field step.

| state | yellow LED | green LED |
|---|---|---|
| yellow | 2.62 mA | 0 mA |
| green | 0.13 mA (divider current) | 4.23 mA |

| field | VCO |
|---|---|
| −1 | 159 Hz |
| 0 | 584 Hz |
| +1 | 1009 Hz |

## What this verifies
1. The shared emitter resistor gives two thresholds: switching on needs more field than holding on.
2. A linear Hall sensor's output, used as a control voltage, shifts a VCO's pitch in proportion to the field.

## Simulation notes
With `npn_6` off, the yellow LED still carries the 0.13 mA that biases `npn_11` through the divider: it is dim, not dark.

```assert
# t = 1 ms, no field: power-on state yellow
net hall_analog_3.ao V 4.49 +-0.03
net npn_11.emitter V 1.257 +-0.05
net led_8.cathode V 1.37 +-0.1
net led_13.cathode V 8.01 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d4113b4` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **18 of this page's 25** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-hall-changeover-pitch` prints them one by one.
<!-- engine-provenance -->
