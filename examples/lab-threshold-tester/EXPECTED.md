# lab-threshold-tester — expected behaviour

## Circuit
- 9 V supply. Q2 (`npn_4`), collector tied to base and fed through 10 kΩ, is the reference junction. The reference slide switch (`slide_switch_5`) puts the bottom of the 10 kΩ test pot (`potentiometer_7`) on Q2's base (left) or on ground (right); 10 kΩ from the supply to the pot's top.
- The voltmeter (`voltmeter_8`) reads the wiper against the pot's bottom.
- The wiper feeds Q1's base (`npn_16`) through 10 kΩ: directly (`slide_switch_9` left) or through a junction chosen by `slide_switch_10` / `slide_switch_11`: a 1N34A germanium diode, a red LED, a green LED. Q1 has 4.7 kΩ and a yellow LED in its collector.
- Both transistors have a temperature slider (`surroundC`, 25 °C as authored).

## Observable behaviour
Turning the pot up from 0, the yellow LED comes on (Q1's collector below 6 V) at these readings:

| reference | in between | reading at switch-on |
|---|---|---|
| Q2 junction | nothing | 0.04 V |
| Q2 junction | germanium diode | 0.12 V |
| Q2 junction | red LED | 1.32 V |
| Q2 junction | green LED | 1.61 V |
| ground | nothing | 0.71 V |

- With both transistors at 70 °C: the Q2-referenced reading stays where it was; the ground-referenced one falls by about ninety millivolts (two millivolts per kelvin over the 45 degrees).

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r7a.test.mjs` (pot stepped by 0.005).

## What this verifies
1. Silicon, germanium and LED junctions have different thresholds.
2. A matched junction cancels a threshold and its temperature drift.

## Simulation notes
The junctions are tested at microamps (Q1's base current), so the LEDs read well below the 2 V quoted at milliamps. The two transistors are given the same temperature by their sliders; the engine does not couple them thermally.

```assert
# power-on, pot at 0: the reference junction and the pot's top
net vsource_2.pos V 9.00 +-0.01
net npn_4.base V 0.68 +-0.02
net potentiometer_7.a V 4.84 +-0.05
net npn_16.collector V 7.24 +-0.1
```

