# lab-wet-dry-probe — expected behaviour

## Circuit
The probe — two bare wires in water, soil or wet paper — is modelled by a
10 MΩ potentiometer used as a variable resistor between +9 V and a 10 kΩ base
resistor. Wiper at 0 means 10 MΩ (dry air); wiper at 1 means the wires touch.
This is a stand-in: the simulator has no "wires in water" part and does not
model electrolysis.

- q1 (NPN) takes the probe current into its base. Its collector has a 4.7 kΩ
  pull-up and the blue "wet" LED with its own 1 kΩ.
- q2 (NPN) gets its base from q1's collector through 22 kΩ and switches the red
  "dry" LED through 1 kΩ. It is an inverter: it is on whenever q1 is off.

## Expected behaviour
- Dry (probe at 10 MΩ, as authored): under 1 µA reaches q1, which stays off.
  Its collector is high, q2 is on, the red LED is lit.
- Damp (around 1 MΩ to 500 kΩ): q1 starts to conduct and the blue LED glows
  faintly; the red LED is still fully on.
- Wet (around 100 kΩ): q1 already saturates, the blue LED is clearly on and
  the red one has gone dark.
- Shorted probes: the same, with the blue LED a little brighter.

## Measured on the engine
| probe position | probe resistance | q1 base current | blue "wet" | red "dry" |
|---|---|---|---|---|
| 0 | 10 MΩ | 0.001 mA | 0.000 mA | 7.14 mA |
| 0.9 | 1 MΩ | 0.008 mA | 0.36 mA | 7.13 mA |
| 0.99 | 100 kΩ | 0.076 mA | 5.71 mA | 0.000 mA |
| 1 | shorted | 0.83 mA | 5.98 mA | 0.000 mA |

## What this verifies
1. A sensor is just a resistance that changes; a transistor turns a tiny probe current into a lamp current.
2. One extra transistor inverts the indication: "wet" and "dry" from the same probe.

```assert
# dry probe as authored: q1 off (collector high), q2 on (collector low)
net q1.collector V 7.22 +-0.1
net q2.collector V 0.07 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **17 of this page's 28** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-wet-dry-probe` prints them one by one.
<!-- engine-provenance -->
