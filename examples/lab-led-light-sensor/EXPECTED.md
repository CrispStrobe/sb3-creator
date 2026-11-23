# lab-led-light-sensor — expected behaviour

## Circuit
- 9 V supply, one LM358. The sensor is an ordinary red LED used backwards: with `photoSensitivity` = 5 µA it delivers 5 µA of photocurrent in full light, about what a clear LED gives. Its anode is on ground and its cathode on the virtual ground, so there is no voltage across it and its own junction never conducts.
- Channel 1 is a transimpedance amplifier: the photocurrent flows into the inverting input, which the op-amp holds at 0 V, and back out through R1 = 1 MΩ from the output. Output voltage = photocurrent x 1 MΩ, so 1 µA gives 1 V. An analog meter (5 V full scale) shows it.
- Channel 2 compares that voltage with a threshold from R2 = 8.2 kΩ and a 10 kΩ pot. When the light level falls below the threshold, the output goes high and lights the yellow night lamp through 680 Ω.

## Observable behaviour

| light | photocurrent | amplifier output | night lamp |
|---|---|---|---|
| full | 5 µA | 5.0 V | off |
| 0.8 (authored) | 4 µA | 4.0 V | off |
| 0.5 | 2.5 µA | 2.5 V | off, just above the threshold |
| 0.4 | 2 µA | 2.0 V | ON |
| dark | 0 | 0 V | ON |

- With the knob at half way the threshold is 9 x 5000 / 18200 = 2.47 V, so the lamp switches on just below half light.
- The amplifier makes volts out of microamps: without it the photocurrent through a meter would be far too small to see.
- Turning the knob moves the switch-on level.

```assert
# light 0.8: 4 uA through 1 MOhm, inverting input held at 0 V
net u1.1_out V 4.00 +-0.02
net u1.1_neg V 0.00 +-0.01
net u1.2_pos V 2.47 +-0.02
```
