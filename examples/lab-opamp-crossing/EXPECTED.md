# lab-opamp-crossing — expected behaviour

## Circuit
- 9 V supply through the **TRAIN** switch (closed as authored) to the LM324 and the lamps; 10 kΩ from the switched supply to ground empties it when the switch opens.
- One op-amp of the LM324 is an astable: three 100 kΩ resistors (from the switched supply, from ground and from the output) meet at the + input and set the two thresholds; 47 kΩ from the output charges a 10 µF electrolytic on the − input.
- Left lamp: 1 kΩ and a red LED from the output to ground, lit while the output is high. Right lamp: 1 kΩ and a red LED from the supply into the output, lit while the output is low.
- The other three op-amps are parked as grounded followers.

## Observable behaviour
- TRAIN on: the two red lamps flash in turn, about one and a half times a second (one full cycle about 0.67 s).
- TRAIN off: both lamps dark.

## Measured on the engine
`test/lab-circuits-r6e.test.mjs`: at power-on the output is 7.23 V and the + input 5.41 V (the upper threshold); the left lamp carries about 5.2 mA, the right one nothing. Three changes of the output take 670 ms ±40 (one full cycle). With TRAIN off, both lamp currents fall to zero.

## What this verifies
1. Positive feedback through the three 100 kΩ gives the op-amp two thresholds (hysteresis); the capacitor swinging between them makes it oscillate.
2. One output can drive two lamps in opposite phase: one hangs from the output to ground, the other from the supply to the output.

## Simulation notes
The LM324's output reaches only about 1.5 V below the supply, so each threshold is not exactly one or two thirds of 9 V: the upper threshold is (9 + 7.2)/3, the lower one (9 + 0.4)/3.

```assert
# power-on: output high, the + input at the upper threshold, the capacitor still empty
net lm324_4.1_out V 7.23 +-0.05
net lm324_4.1_pos V 5.41 +-0.05
net lm324_4.1_neg V 0.015 +-0.02
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **7 of this page's 15** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-crossing` prints them one by one.
<!-- engine-provenance -->
