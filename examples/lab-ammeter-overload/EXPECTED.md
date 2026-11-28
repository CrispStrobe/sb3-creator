# lab-ammeter-overload — expected behaviour

## Circuit
- 9 V supply. Three loads from +9 V, each behind its own switch: **LAMP** (a 9 V / 0.1 A bulb, 90 Ω; closed as authored), **HEATER** (15 Ω) and **SHORT** (8.2 Ω). All return to ground through one 0.1 Ω shunt.
- LM324 op-amp 1: + input on the shunt, 91 kΩ from the output to the − input and 10 kΩ to ground: gain 10.1, so 0.1 V per amp in the shunt becomes about 1 V per amp. A moving-coil meter (1 V full scale) reads it: the scale is amps.
- Op-amp 2 compares the reading with 0.98 V (82 kΩ / 10 kΩ from +9 V).
- Op-amp 3 is an astable (three 100 kΩ thresholds, 10 kΩ into 100 nF) feeding the loudspeaker through 47 µF and 100 Ω. A 1N4148 from its capacitor to op-amp 2's output holds the capacitor near 0.6 V while op-amp 2 is low: silent. Op-amp 4 is parked.

## Observable behaviour
| LAMP | HEATER | SHORT | meter (V = A) | tone |
|---|---|---|---|---|
| on | off | off | 0.097 | none |
| on | on | off | 0.697 | none |
| on | on | on | 1.78 (pegged) | about 660 Hz |

Each reading is about 4 mV below 10.1 × the shunt voltage: the LM324's − input bias current (about 42 nA) flows through the 91 kΩ feedback resistor.

## Measured on the engine
`test/lab-circuits-r6e.test.mjs` holds the table above; with everything on the comparator output is 7.5 V and the tone measures 663 Hz (±30), read from the loudspeaker's edges.

## What this verifies
1. A small shunt turns a current into a proportional voltage (Ohm's law), small enough not to disturb the circuit.
2. An op-amp amplifies that voltage until a meter can read it: the meter's volts are amps.
3. A comparator on the same signal can raise an alarm above a limit.

## Simulation notes
The battery is ideal (no internal resistance), so 1.8 A does not sag it. The shunt's 0.18 V is well inside the LM324's input range, which reaches down to ground.

```assert
# as authored: only the lamp, 0.1 A
net resistor_9.a V 0.0100 +-0.0005
net lm324_10.1_out V 0.097 +-0.005
net resistor_14.b V 0.978 +-0.005
net capacitor_20.a V 0.57 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@818e026` and `bw-circuit-ui@659431c` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **26 of this page's 31** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ammeter-overload` prints them one by one.
<!-- engine-provenance -->
