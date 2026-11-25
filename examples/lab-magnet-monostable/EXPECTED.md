# lab-magnet-monostable — expected behaviour

## Circuit
- 9 V supply. A 500-turn air coil (`air_coil_3`); a 0.2 A·m² magnet falls through it from 20 cm. Its pulse reaches Q1's base (`npn_8`) through 1 µF.
- Sensitivity: 82 kΩ and a 10 kΩ pot (`potentiometer_6`, set to 0.9) from the supply to ground give the wiper a range from ground to under one volt; the wiper feeds Q1's base through 22 kΩ.
- Q1: 1 kΩ and the red LED in its collector, and 10 µF from its collector to Q2's base (`npn_13`). Q2: base held up by 47 kΩ, 2.2 kΩ collector load, 47 kΩ from its collector back to Q1's base.

## Observable behaviour
- Rest: Q2 on (collector 0.09 V), Q1 off (collector 7.7 V), LED off. Q1's base rests at about 0.57 V, just below its threshold.
- Each drop: 190 ms later (the fall time) the pulse (about 0.26 V) switches Q1 on; the LED is lit for about 320 ms (0.69·47 kΩ·10 µF = 324 ms), then the circuit falls back. A second drop does the same.
- Sensitivity pot at 0.5: Q1's base rests at about 0.34 V and the same pulse does nothing.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r7a.test.mjs`.

## What this verifies
1. A monostable gives one output pulse of fixed length per trigger and re-arms.
2. The bias sets how large a trigger pulse has to be.

## Simulation notes
The magnet is a point dipole falling freely.

```assert
# power-on: the sensitivity divider and Q2 switched on
net vsource_2.pos V 9.00 +-0.01
net potentiometer_6.a V 0.75 +-0.02
net potentiometer_6.wiper V 0.65 +-0.02
net npn_13.collector V 0.03 +-0.05
```

