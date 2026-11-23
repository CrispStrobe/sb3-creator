# lab-optical-bench — expected behaviour

## Circuit
- 9 V battery. A red LED with 470 Ω faces a photodiode 10 cm away on an optical bench (a `light_path` in air). The photodiode is reverse-biased (cathode to +9 V) into 10 kΩ, so the voltage across the 10 kΩ is proportional to the light on it. The voltmeter reads it.
- The light path's knob is the distance, 2 to 30 cm.

## Observable behaviour
- 10 cm: about 0.124 V.
- 5 cm: four times as much; 20 cm: a quarter. Twice the distance, a quarter of the light.
- Turn the LED 15° away (the light path's `angleDeg`): half the reading, because this LED's half angle is 15°; at 30° almost nothing.

## What this verifies
1. The inverse-square law: the light spreads over an area that grows with the square of the distance.
2. An LED does not shine equally in all directions: its beam pattern.
3. A reverse-biased photodiode is a light meter with a linear scale.

```assert
# Photodiode current through 10 k at 10 cm from the LED.
net voltmeter_7.a V 0.124 +-0.003
```
