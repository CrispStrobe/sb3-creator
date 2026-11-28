# lab-led-power-curve — expected behaviour

## Circuit
- 9 V supply → 4.7 kΩ potentiometer (`potentiometer_3`, used between `a` and the wiper) → 220 Ω → ammeter (`ammeter_5`) → slide switch (`slide_switch_6`) → red LED (`led_7`) or green LED (`led_8`) → ground.
- A photodiode (`photodiode_9`) 3 cm in front of each LED (two `light_path` parts, air, 3 cm). Its cathode is on the − input of an LM358 (`lm358_10`), its anode and the + input on ground, and 22 kΩ runs from the output to the − input, so the output is the photocurrent × 22 kΩ. A voltmeter reads it.

## Observable behaviour
- The pot sets the LED current from 1.5 mA to 31.5 mA; the amplifier output follows it in proportion: just under two tenths of a volt for every milliampere through the red LED.
- The green LED at the same current gives a reading about 3.5 times lower.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`, pot positions 0, 0.5, 0.8 and 1 (values at about the stated settings; the 0.8 row is a pot position no single solve of this gate stands in for).

| LED | current | output | volts per milliampere |
|---|---|---|---|
| red | 1.51 mA | 0.297 V | 0.197 |
| red | 2.86 mA | 0.564 V | 0.197 |
| red | 6.28 mA | 1.237 V | 0.197 |
| red | 31.48 mA | 6.197 V | 0.197 |
| green | 2.75 mA | 0.153 V | 0.056 |
| green | 30.19 mA | 1.679 V | 0.056 |

## What this verifies
1. The light an LED radiates grows in proportion to its current: double the current, double the light. (The forward voltage hardly changes; that is why an LED is set by its current.)
2. A silicon photodiode measures radiated power, weighted by its own sensitivity, which is lower in the green than in the red. The eye is weighted the other way: it is most sensitive in the green, so a green LED looks brighter to it than this reading suggests.

## Simulation notes
The optics model makes an LED's radiated power its efficiency × its solved current (listed as 0.04 for red and 0.015 for this green type, in watts per ampere), so the straight line is the model. The eye's sensitivity curve is not simulated; the intro only explains it.

```assert
# as built: red LED, pot at half: 2.86 mA, 0.564 V
net lm358_10.1_out V 0.564 +-0.02
net led_7.anode V 1.638 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **7 of this page's 19** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-led-power-curve` prints them one by one.
<!-- engine-provenance -->
