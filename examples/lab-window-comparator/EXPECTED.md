# lab-window-comparator — expected behaviour

## Circuit
5 V. Sensor: a phototransistor (0.5 mA at full light) from +5 V to node S, 10 kΩ from S to ground, so S sits at
about 5 V × light until the transistor runs out of voltage near the top. A 15 kΩ / 20 kΩ / 15 kΩ ladder makes the thresholds
3.5 V (upper) and 1.5 V (lower). LM393 dual comparator: half 1 compares S (+) with 1.5 V (−), half 2 compares 3.5 V (+)
with S (−). Their open-collector outputs are tied together with a 4.7 kΩ pull-up. That node drives an NPN through
10 kΩ; the NPN switches a green LED with 330 Ω.

## Observable behaviour
- Dark (light slider at 0): no photocurrent, S is at 0 V. Half 1 pulls the shared node low (about 0.21 V),
  the transistor is off, the LED is dark.
- Middle light (0.5): S is at 2.5 V, inside the window. Neither output pulls low, the pull-up lifts the node to
  about 3.6 V, the transistor turns on and the LED lights (about 9.1 mA).
- Bright (1): S is at about 4.7 V, above 3.5 V. Now half 2 pulls the node low and the LED is dark again.
- The window opens at a light level of 0.3 (S = 1.5 V) and closes at 0.7 (S = 3.5 V): bring a lamp closer and the
  LED comes on, then goes out again when the lamp gets too close.
- The LED is on only while 1.5 V < S < 3.5 V: two conditions joined by AND, done by wiring.

## What this verifies
1. Two comparators with different thresholds form a window.
2. Open-collector outputs tied together act as an AND of the "released" states.

```assert
# dark: sensor below the window
net resistor_5.b V 3.50 +-0.01
net resistor_6.b V 1.50 +-0.01
net resistor_4.a V 0.00 +-0.01
net lm393_8.1_out V 0.21 +-0.05
```
