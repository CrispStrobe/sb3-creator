# lab-ir-light-meter — expected behaviour

## Circuit
- 9 V battery. An IR LED (470 Ω, on a slide switch) shines on the sensor 5 cm away along a `light_path` (medium air); the path's knob is the distance, 3 to 20 cm.
- The sensor is an IR LED used backwards (`photoSensitivity` 1e-5, its photocurrent in amps at full light), anode on ground, cathode on the inverting input of LM358 half 1.
- Half 1 is a transimpedance amplifier with 4.7 MΩ feedback. Its non-inverting input sits on a reference from 8.2 kΩ and 1 kΩ, about one volt: a single-supply op-amp cannot hold its input at ground and still work, so the whole stage is lifted by that reference. Its output is reference plus photocurrent x 4.7 MΩ.
- Half 2 is a difference amplifier with four 100 kΩ resistors: output = half 1's output minus the zero pot's voltage. The zero pot (10 kΩ, below 56 kΩ from +9 V) gives 0 to 1.36 V. A moving-coil meter (5 V full scale) reads half 2's output.

## Observable behaviour
- As authored (pot at half, lamp on, 5 cm): half 1 at 1.65 V, the meter at 0.96 V.
- Lamp off, the dark: half 1 still at 0.78 V: the reference, less the LM358's own input bias current (about 42 nA out of the − input) through the 4.7 MΩ. That is an offset, and the meter shows 0.11 V of it although there is no light.
- Turn the zero pot up until the meter just reads 0 in the dark (near position 0.58). The difference amplifier now subtracts exactly the offset. Turned further the meter stays at zero: a single-supply amplifier cannot go below ground.
- Zeroed, with the lamp on, the meter shows the light alone: about 0.85 V at 5 cm, 0.22 V at 10 cm, 0.06 V at 20 cm. Twice the distance gives close to a quarter of the reading.
- Without the zeroing, the same light would read 0.11 V too high everywhere, and the distance law would be hidden.

## What this verifies
1. A photocurrent amplifier on one supply needs a reference, and that shows up as an offset.
2. A second amplifier can subtract an adjustable voltage: offset compensation, a zero adjust.

```assert
# As authored, lamp on at 5 cm: reference, first stage, meter.
net lm358_9.1_pos V 0.978 +-0.01
net lm358_9.1_out V 1.648 +-0.02
net lm358_9.2_out V 0.960 +-0.02
```
