# lab-cable-tracer — expected behaviour

## Circuit
- 9 V supply (`vsource_2`). A 1000-turn pickup coil (`air_coil_3`, 0.2 mm wire, 1.5 cm radius) feeds a one-transistor preamplifier (`npn_5`) through 470 nF (`capacitor_4`). The preamplifier has:
  - a base divider of 100 kΩ / 15 kΩ;
  - 4.7 kΩ in the collector;
  - 100 Ω + 390 Ω ‖ 47 µF in the emitter, for a gain of about 40.
- From the preamplifier, 100 nF (`capacitor_12`) leads to a 100 kΩ volume pot (`potentiometer_13`, resting at 80 %). The pot drives an LM386 (`lm386_14`, gain 200 with 10 µF across pins 1–8), which drives the 8 Ω loudspeaker (`speaker_18`) through 220 µF.
- Field source 1, a two-core mains cable (`induction_loop_21`, cores 6 mm apart). It carries the current of a low-voltage AC lamp: a 50 Hz, 17 V peak generator (`function_gen_20`, standing in for the lamp transformer) through the lamp (`light_bulb_23`, 7.2 Ω), switched by `slide_switch_22` (position 0 = lamp on).
- Field source 2, a telephone's coil (`induction_loop_26`, 200 turns, 2 cm radius). It carries an 800 Hz tone: 0.3 V peak (`function_gen_24`) through 100 Ω (`resistor_25`).
- Each source has a distance dial: 0 is far (cable 30 cm, telephone 60 cm), 1 is 1 cm. Both rest at 0.2 (24 cm and 48 cm).

## Observable behaviour
Speaker voltage, measured over 40 ms after 60 ms:
- At rest: 0.005 V of 50 Hz and 0.023 V of 800 Hz, almost silence.
- Cable dial 0.9 (3.9 cm) with the lamp on: 0.14 V of 50 Hz hum, from about 0.36 mV at the pickup.
- The same with the lamp off: 0.005 V. The cable still carries 17 V, but no current flows, so there is no field.
- Telephone dial 0.75 (15.75 cm): 0.63 V of the 800 Hz tone. Closer, it overdrives the amplifier: at 6.9 cm the loudspeaker swings about 4 V, clipped.

## Measured on the engine
bw-board master 2c62bd54, `test/lab-circuits-r7mech.test.mjs`: the four readings above.

## What this verifies
1. An alternating current induces a voltage in a nearby coil (mutual induction): the hum follows the cable's CURRENT, not its voltage.
2. A two-core cable's field falls off steeply (go and return nearly cancel), so it is found only close by.
3. A transistor preamplifier and an audio power-amp IC make microvolts to millivolts audible.

## Simulation notes
bw-board `induction_loop` (src/magnetic-coupling.js):
- Field per ampere of a two-core cable seen broadside, µ0·s/2π(d² + s²/4), and of a loop on its axis.
- Mutual inductance N₂·π·r₂²·(B/I) to the pickup, solved as a transformer. The pickup's inductance is split into one coupled section per source.
- The generators stand in for the lamp transformer and the telephone line and share the bench's common.
- The LM386 output takes a few hundred milliseconds to centre after switch-on; the speaker's coupling capacitor hides that.

```assert
# the supply rail; the hum and the tone are checked in the scenario test
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2c62bd5` and `bw-circuit-ui@15b936d` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **17 of this page's 34** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-cable-tracer` prints them one by one.
<!-- engine-provenance -->
