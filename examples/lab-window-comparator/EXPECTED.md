# lab-window-comparator — expected behaviour

## Circuit
5 V. Sensor: LDR from +5 V to node S, 10 kΩ from S to ground. A 15 kΩ / 20 kΩ / 15 kΩ ladder makes the thresholds
3.5 V (upper) and 1.5 V (lower). LM393 dual comparator: half 1 compares S (+) with 1.5 V (−), half 2 compares 3.5 V (+)
with S (−). Their open-collector outputs are tied together with a 4.7 kΩ pull-up. That node drives an NPN through
10 kΩ; the NPN switches a green LED with 330 Ω.

## Observable behaviour
- Dark (light slider at 0): the LDR is about 1 MΩ, S is about 0.05 V. Half 1 pulls the shared node low (about 0.21 V),
  the transistor is off, the LED is dark.
- Middle light (about 0.5): S is near 2.5 V, inside the window. Neither output pulls low, the pull-up lifts the node,
  the transistor turns on and the LED lights.
- Bright (1): S is near 5 V, above 3.5 V. Now half 2 pulls the node low and the LED is dark again.
- The LED is on only while 1.5 V < S < 3.5 V: two conditions joined by AND, done by wiring.

## What this verifies
1. Two comparators with different thresholds form a window.
2. Open-collector outputs tied together act as an AND of the "released" states.

```assert
# dark: sensor below the window
net resistor_5.b V 3.50 +-0.01
net resistor_6.b V 1.50 +-0.01
net resistor_4.a V 0.05 +-0.01
net lm393_8.1_out V 0.21 +-0.05
```
