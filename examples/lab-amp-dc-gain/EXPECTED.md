# lab-amp-dc-gain — expected behaviour

## Circuit
- 9 V supply. LM386 (lm386_6), − input grounded.
- Input: 47 kΩ (resistor_3) from +9 V onto a 100 Ω INPUT pot (potentiometer_4) to ground; the wiper feeds the + input directly, 0 to 19 mV (as built: knob at half, 9.5 mV). A voltmeter (voltmeter_5) shows it.
- Gain pins 1 and 8: open, or bridged by 1 kΩ (switch_7), 220 Ω (switch_9), 47 Ω (switch_11) or a wire (switch_13).
- Output: a moving-coil meter (analog_meter_16: `fullScale` 3, `ifs` 0.00005, a three-volt range on a twenty-kilohm-per-volt movement) from the output to a 1 kΩ / 1 kΩ half-supply divider.

## Observable behaviour
- With the input at zero the meter reads zero: the output sits at half the supply.
- Knob at half (9.5 mV in), one switch at a time:

| switch_7 (1 kΩ) | switch_9 (220 Ω) | switch_11 (47 Ω) | switch_13 (wire) | meter | gain |
|---|---|---|---|---|---|
| open | open | open | open | 0.19 V | 20 |
| closed | open | open | open | 0.38 V | 40 |
| open | closed | open | open | 0.82 V | 86 |
| open | open | closed | open | 1.44 V | 151 |
| open | open | open | closed | 1.89 V | 198 |

- Turning the input knob moves the reading in proportion, more steeply the higher the gain.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10d.test.mjs`, which holds the readings in the table to within a few hundredths of a volt:
- Knob at half: input 9.545 mV.
- Knob at zero, all switches open: the meter reads about 4 mV.

## What this verifies
1. The amplifier's gain is set by what is wired between pins 1 and 8: 1 + 2·14.18 kΩ / (142.5 Ω + 1.35 kΩ ∥ R) in the chip's equivalent circuit, from 20 (open) to 200 (short). With 1 kΩ that is 41, with 220 Ω 87, with 47 Ω 152.
2. The gain holds at DC: a resistor (not a capacitor) across the gain pins raises the DC gain too.

## Simulation notes
The meter's own load on the divider makes it read about 1 % low against the bare formula. A capacitor across pins 1 and 8, as in most audio circuits, raises only the AC gain; at DC it stays 20.

```assert
# 1 ms after switch-on, knob at half, gain pins open
net lm386_6.inp V 0.0095 +-0.0005
net lm386_6.vout V 4.691 +-0.02
net analog_meter_16.b V 4.502 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@e744ede` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **15 of this page's 29** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-dc-gain` prints them one by one.
<!-- engine-provenance -->
