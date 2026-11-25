# lab-transistor-thermometer — expected behaviour

## Circuit
- 9 V supply. **Sensor:** an NPN on a lead, wired as a diode (base and collector together) with 10 kΩ from +9 V. Its base-emitter voltage falls by about two millivolts per kelvin. It sits in its own surroundings (25 °C as authored; the **Temperature** slider moves them, time constant 1 s).
- **Scaling:** op-amp 1 of an LM324 subtracts the sensor voltage from the **ZERO** setting with a gain of 25 (10 kΩ in, 250 kΩ feedback). ZERO is a 10 kΩ pot between 100 kΩ (to +9 V) and 4.7 kΩ (to ground), its wiper through 100 kΩ with 2.7 MΩ to ground onto the + input; as authored it is calibrated so 0 °C reads 0 V. 50 mV per kelvin: the meter (5 V full scale) reads 0–100 °C.
- **Thermostat:** op-amp 2 compares the reading with the **SET** pot (10 kΩ under 8.2 kΩ from +9 V, 0–4.95 V = 0–99 °C, its wiper through 47 kΩ, with 4.7 MΩ from the output for a little hysteresis). While it is colder than SET the output drives an NPN (10 kΩ) and a relay (200 Ω coil, 1N4148 across it); the relay's contact lights the lamp that stands for the heater.

## Observable behaviour
- 25 °C: the meter at 1.23 V (25 on the scale); SET is at about 49 °C, so the relay is in and the heater lamp lit.
- 70 °C: the meter near 3.45 (70 on the scale); warmer than SET, relay out, lamp dark.

## Measured on the engine
`test/lab-circuits-r6e.test.mjs`:

(meter in volts; the junction temperature is the engine's thermal model)

| surroundings | junction | meter | relay |
|---|---|---|---|
| 25 °C, as authored | 25 °C | 1.234 | in |
| 70 °C, after 4 s | 69.3 °C | 3.446 | out |

## What this verifies
1. A silicon junction is a linear thermometer: its voltage falls by about two millivolts per kelvin.
2. An offset (ZERO) and a gain turn that into a calibrated scale, here 50 mV per kelvin.
3. A comparator with a set point and a relay make a thermostat.

## Simulation notes
The junction's coefficient in the model is minus two millivolts per kelvin at constant current; twenty-five times that is the scale's fifty millivolts per kelvin. The sensor's self-heating at 0.8 mA is about 0.1 K.

```assert
# 25 °C: the junction voltage and the calibrated reading (1.23 V = 25 °C on the 5 V scale)
net npn_4.base V 0.678 +-0.003
net lm324_10.1_out V 1.23 +-0.05
net potentiometer_15.wiper V 2.47 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f4aaec4` and `bw-circuit-ui@141b2cc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **18 of this page's 38** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-transistor-thermometer` prints them one by one.
<!-- engine-provenance -->
