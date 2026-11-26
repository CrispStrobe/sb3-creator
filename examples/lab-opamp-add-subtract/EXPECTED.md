# lab-opamp-add-subtract — expected behaviour

## Circuit
- 9 V supply. A LED (red with the slide switch left, as authored; green with it right) gets current from +9 V through 4.7 kΩ. A 1N4148 diode gets current through 10 kΩ.
- Adder, LM358 half 1: both voltages through 10 kΩ each to the + input (which then sits at their mean), 10 kΩ / 10 kΩ feedback (gain 2): output = LED + diode.
- Subtractor, half 2: the LED voltage through 10 kΩ / 10 kΩ to the + input (half of it), the diode voltage through 10 kΩ to the - input with 10 kΩ feedback: output = LED − diode.
- Two moving-coil meters on the two outputs.

## Observable behaviour
- Red LED: it sits at about 1.59 V, the diode at about 0.58 V. The adder shows about 2.17 V, the subtractor about 1.01 V.
- Green LED: about 1.89 V; the adder about 2.47 V, the subtractor about 1.31 V.
- Each output equals the sum or the difference of the two voltages as they actually are, to within a few millivolts.

## Measured on the engine
Red: LED 1.592 V, diode 0.580 V, sum 2.173 V, difference 1.012 V. Green: LED 1.888 V, sum 2.470 V, difference 1.307 V. In both cases the outputs match LED + diode and LED − diode to within a few millivolts. `test/lab-circuits-r6d.test.mjs` holds these.

## What this verifies
1. Two equal resistors into the + input and a gain of 2 add two voltages.
2. Four equal resistors around an op-amp subtract one voltage from another.

```assert
# t = 1 ms: red LED selected
net vsource_2.pos V 9.00 +-0.01
net slide_switch_4.com V 1.592 +-0.01
net diode_8.anode V 0.580 +-0.01
net lm358_9.1_out V 2.173 +-0.01
net lm358_9.2_out V 1.012 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **21 of this page's 25** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-add-subtract` prints them one by one.
<!-- engine-provenance -->
