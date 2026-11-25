# lab-opamp-adder-subtractor — expected behaviour

## Circuit
- 9 V supply. Knobs **A** and **B**: 10 kΩ pots with 20 kΩ above each, from 0 to a third of the supply on their wipers. Two op-amps of the LM324 buffer them as followers.
- Adder: A and B through 10 kΩ each to the + input of op-amp 1, which therefore sees (A + B)/2; 10 kΩ / 10 kΩ feedback (gain 2) makes the output A + B. Meter **SUM**, 6 V full scale.
- Subtractor: op-amp 2 as a difference amplifier from four 10 kΩ: A to + (10 kΩ to ground), B to − (10 kΩ feedback). Output A − B. Meter **DIFFERENCE**, 3 V full scale.

## Observable behaviour
- As authored (A = 1.8 V, B = 0.9 V): SUM 2.7 V, DIFFERENCE 0.9 V.
- Any knob setting: SUM is A + B; DIFFERENCE is A − B while A is the larger.
- B larger than A: DIFFERENCE sits at zero; on a single 9 V supply the op-amp cannot go below ground.

## Measured on the engine
`test/lab-circuits-r6e.test.mjs`: A 1.80 V, B 0.90 V, sum 2.70 V, difference 0.90 V; B to 2.7 V: sum 4.50 V, difference 0.01 V.

## What this verifies
1. Equal resistors into a node average voltages; gain 2 turns the average into the sum.
2. A difference amplifier subtracts, as long as the result stays inside the output range.

## Simulation notes
The meters (10 kΩ per volt) load the op-amp outputs slightly; the op-amps do not notice.

```assert
# as authored: A = 1.8 V, B = 0.9 V
net potentiometer_4.wiper V 1.800 +-0.01
net potentiometer_6.wiper V 0.900 +-0.01
net lm324_7.1_out V 2.700 +-0.01
net lm324_7.2_out V 0.900 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b094eb2` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **22 of this page's 24** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-adder-subtractor` prints them one by one.
<!-- engine-provenance -->
