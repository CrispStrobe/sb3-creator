# lab-colour-sensor — expected behaviour

## Circuit
- 9 V battery. A red LED with 470 Ω and a phototransistor look at a surface 1 cm away (`light_path` medium reflect, surface red as authored).
- The phototransistor's emitter feeds 10 kΩ to ground (voltmeter across it) and, through 4.7 kΩ, the base of an NPN that switches a yellow indicator LED (1 kΩ).

## Observable behaviour
- Red surface: the meter reads about 1.86 V and the indicator is on.
- Green surface (path param `surface` green): about 0.38 V, indicator off. Blue and black are off too; white is on.
- An infrared LED instead of the red one: red and green surfaces read alike and the indicator lights for both. Most dyes reflect infrared; only light of the right colour tells them apart.

## What this verifies
1. A coloured surface reflects its own colour and absorbs the others.
2. Colour sensing needs light of the colour to be found.

```assert
# Over the red surface: the reflected red light on the phototransistor.
net voltmeter_11.a V 1.86 +-0.05
```
