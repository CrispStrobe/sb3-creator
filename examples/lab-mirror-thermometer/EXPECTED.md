# lab-mirror-thermometer — expected behaviour

## Circuit
- 9 V supply. Current mirror with emitter resistors: the reference NPN, base tied to collector, takes about 0.9 mA through 8.2 kΩ with 1 kΩ in its emitter; the sensor NPN shares its base voltage, 1 kΩ in its emitter, 6.8 kΩ collector resistor.
- The sensor sits in surroundings of its own (Temperature slider, 25 °C as authored, time constant 1 s). Both transistors are solved on the exponential junction law.
- LM358 half 2 buffers the ZERO pot's wiper (10 kΩ across the supply, 0.327 as authored): the reference. Half 1 is an inverting amplifier: 10 kΩ from the sensor's collector to the - input, 120 kΩ feedback, + input at the reference.
- A moving-coil meter (5 V full scale) between the amplifier's output and the reference.

## Observable behaviour
- Room temperature: the meter rests at zero (once the sensor has warmed itself by about 0.3 K).
- Warmer sensor: its junction needs about two millivolts less per kelvin, the emitter resistors turn that into about two microamps more collector current per kelvin, the collector falls, and the amplifier turns the fall into a rising needle, about a tenth of a volt per kelvin. At 70 °C the meter shows about 4.16 V.
- Cold (0 °C): the needle tries to go below zero.
- Moved from 25 to 70 °C, the sensor follows with its time constant: after 1 s it is at about 54 °C.

## Measured on the engine
Meter after 2 s: 0.00 V +- 0.06 at 25 °C, 4.16 V at 70 °C, −2.3 V at 0 °C. Live: 53.8 °C one second after the slider moved, and the reading settles to the 70 °C value. `test/lab-circuits-r6d.test.mjs` holds these.

## Why
With a resistor in each emitter the two currents are tied together by the emitter resistors rather than by the junctions alone: the sensor junction's change of two millivolts per kelvin moves its current by about two microamps per kelvin, nearly in a straight line. Across the collector resistor (in parallel with the amplifier's input resistor) that is about thirteen millivolts per kelvin, and the amplifier multiplies it about seven times.

## What this verifies
1. A transistor junction measures temperature through its voltage.
2. A current mirror compares it with a reference junction, and an inverting amplifier puts the difference on a meter.

```assert
# t = 1 ms: room temperature, needle near zero
net vsource_2.pos V 9.00 +-0.01
net npn_4.base V 1.55 +-0.02
net npn_6.collector V 2.94 +-0.03
net lm358_10.1_pos V 2.94 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@818e026` and `bw-circuit-ui@659431c` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 27** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-mirror-thermometer` prints them one by one.
<!-- engine-provenance -->
