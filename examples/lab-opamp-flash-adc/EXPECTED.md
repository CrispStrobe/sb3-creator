# lab-opamp-flash-adc — expected behaviour

## Circuit
- 9 V supply. The **INPUT** pot (10 kΩ, 5 kΩ above it) gives the input, shown on a moving-coil meter.
- A ladder from +9 V, 30 kΩ, 10 kΩ, 10 kΩ, 10 kΩ, makes 4.5, 3.0 and 1.5 V for the − inputs of three LM324 comparators; the input goes to all three + inputs.
- **Bit 1** (red LED, 1 kΩ): straight from the middle comparator (above 3 V).
- **Bit 0** (red LED): the lowest comparator (above 1.5 V) feeds it through 1 kΩ and a 1N4148; an NPN (22 kΩ to its base from the middle comparator) shorts that feed once the input passes 3 V; the top comparator (above 4.5 V) feeds the LED again through its own 1 kΩ and 1N4148.

## Observable behaviour
| input | bit 1 | bit 0 |
|---|---|---|
| below 1.5 V | off | off |
| 1.5 … 3 V | off | on |
| 3 … 4.5 V | on | off |
| above 4.5 V | on | on |

## Measured on the engine
`test/lab-circuits-r6e.test.mjs`: INPUT at 0.88, 2.01, 3.40 and 5.09 V reads 00, 01, 10 and 11.

## What this verifies
1. Comparators against a resistor ladder turn a voltage into a "thermometer" of on/off signals (a flash converter).
2. A few diodes and one transistor decode that thermometer into a binary number: bit 0 = (above 1.5 V and not above 3 V) or above 4.5 V.

## Simulation notes
The ladder is loaded only by op-amp inputs, so the thresholds are exact.

```assert
# as authored: INPUT at 2.29 V, between 1.5 and 3 V: binary 01
net potentiometer_4.wiper V 2.29 +-0.02
net lm324_10.1_neg V 1.50 +-0.01
net lm324_10.2_neg V 3.00 +-0.01
net lm324_10.3_neg V 4.50 +-0.01
net lm324_10.1_out V 7.26 +-0.05
net lm324_10.2_out V 0.005 +-0.01
net led_19.anode V 1.78 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **14 of this page's 25** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-flash-adc` prints them one by one.
<!-- engine-provenance -->
