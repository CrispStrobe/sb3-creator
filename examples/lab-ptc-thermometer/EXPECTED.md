# lab-ptc-thermometer — expected behaviour

## Circuit
- 9 V supply. A divider of 6.8 kΩ and the silicon PTC sensor (`ptc_sensor_3`, r25 = 2000, i.e. two kilohms at 25 °C) gives the sensor voltage S.
- An offset voltage comes from 6.8 kΩ, a 1 kΩ potentiometer (`potentiometer_6`) and 1.5 kΩ across the supply, buffered by one half of an LM358 (`lm358_8`).
- The other half is a difference amplifier with gain 36 (10 kΩ in, 360 kΩ feedback, the same on the + side): output = 36 × (S − offset). A meter rated 5 V full scale shows it.
- The sensor sits in its own surroundings (Temperature slider, 20 °C as built, time constant 1 s).

## Observable behaviour
- Readings at about these temperatures: 15 °C near zero (0.09 V); 20 °C 2.3 V; 25 °C 4.5 V: about 0.44 V per kelvin, so tenths of a degree are visible.
- Just after switching on the reading is lower (2.0 V at 20 °C) and creeps up over a few seconds: the current through the sensor warms it by about 0.8 K.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`, 3 s after setting each temperature, values at about the stated settings (a sequence or a waveform swing, which no single solve stands in for).

| surroundings | meter |
|---|---|
| 15 °C | 0.09 V |
| 20 °C | 2.30 V |
| 25 °C | 4.53 V |

## What this verifies
1. Subtracting a fixed offset and then amplifying stretches a small part of a sensor's range over the whole meter.
2. A resistive sensor carrying current heats itself: here about 1 mA and 2 mW, and with 400 K/W from the sensor to its surroundings that is 0.8 K, which an expanded scale makes visible.

## Simulation notes
The sensor's self-heating comes from the thermal model (thermal resistance 400 K/W, time constant 1 s). The 1 ms values in the assert block are before it has warmed.

```assert
# t = 1 ms, sensor still at 20 C
net ptc_sensor_3.a V 1.975 +-0.01
net lm358_8.2_out V 1.921 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b094eb2` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **10 of this page's 31** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ptc-thermometer` prints them one by one.
<!-- engine-provenance -->
