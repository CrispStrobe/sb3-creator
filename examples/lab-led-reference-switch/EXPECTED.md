# lab-led-reference-switch — expected behaviour

## Circuit
- 9 V battery. 10 kΩ potentiometer (potentiometer_3) across the battery; its wiper feeds the NPN's base through 4.7 kΩ (as built at 0.1 of the travel).
- Emitter: a red LED (led_7) to ground, kept lit by 2.2 kΩ from +9 V: the emitter stands at its forward voltage, about 1.65 V.
- Collector: 1 kΩ and a green LED (led_9) from +9 V.

## Observable behaviour
- Below about a quarter of the travel (2.25 V at the wiper) the green LED is dark.
- At about 0.27 of the travel (2.4 V, the reference plus one base-emitter drop) it comes on, and from 0.3 to 0.4 it reaches its full 5.2 mA.
- Beyond that the knob changes nothing.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10a.test.mjs`: green LED 0 mA at 0.2 and 0.25, 4.23 mA at 0.3, 5.16 mA at 0.4, 5.2 mA at 1; reference 1.65 V.

## What this verifies
1. An emitter held at a fixed voltage moves the transistor's switching point from 0.6 V to that voltage plus 0.6 V.
2. A lit LED is a usable voltage reference: its forward voltage barely moves with its current.

## Simulation notes
The reference LED carries about 3 mA from its 2.2 kΩ; when the transistor conducts, its emitter current adds to that and the reference rises by only about 0.1 V.

```assert
# 1 ms after switch-on, knob at 0.1: the base is below the reference
net potentiometer_3.wiper V 0.90 +-0.02
net npn_5.emitter V 1.65 +-0.05
net resistor_8.b V 9.00 +-0.02
```
