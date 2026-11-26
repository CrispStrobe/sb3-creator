# lab-thermocouple — expected behaviour

## Circuit
- 9 V supply. A thermocouple (`thermocouple_3`) twisted from a copper and a constantan wire (type T) sits between the + input of an LM358 and ground. The LM358 is a non-inverting amplifier with gain 101 (100 kΩ from output to − input, 1 kΩ to ground).
- A moving-coil meter (10 V full scale) shows the output.
- The hot junction is in a match flame as authored (600 °C). The **Heat** slider in the instruments column sets its temperature, with buttons for a match (600 °C), a lighter (900 °C) and room temperature. The free ends are at the bench temperature (25 °C).

## Observable behaviour
- Room temperature: no difference between the junctions, no voltage, the meter rests at 0.
- Match (600 °C): 31.8 mV from the thermocouple, 3.21 V on the meter.
- Lighter (900 °C): 49.9 mV, 5.03 V.
- Warm the bench to 35 °C: the reading drops a little, because only the difference counts.

## Measured on the engine
bw-board r4/transducers-20261123, `test/lab-circuits-8.test.mjs`.

| hot junction | EMF | amplifier output |
|---|---|---|
| 25 °C | 0 mV | 0.005 V |
| 600 °C | 31.82 mV | 3.21 V |
| 900 °C | 49.85 mV | 5.03 V |

## What this verifies
1. Two different metals joined at a hot junction make a voltage that grows with the temperature difference (Seebeck effect), about 40 µV per kelvin near room temperature, 60 µV per kelvin when hot.
2. Tens of millivolts need an amplifier before a meter can show them.

## Simulation notes
The EMF comes from the type T reference table, which ends at 400 °C; above that it continues at the table's last slope (about 60 µV/K). The 5 mV the LM358 leaves at room temperature is its output stage near the negative rail.

```assert
# the match flame as authored: 31.8 mV in, x101 out
net thermocouple_3.pos V 0.032 +-0.001
net lm358_4.1_out V 3.21 +-0.02
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0f6b38a` and `bw-circuit-ui@42aaddc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **3 of this page's 26** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-thermocouple` prints them one by one.
<!-- engine-provenance -->
