# lab-inverting-stages — expected behaviour

## Circuit
9 V. A 10 kΩ potentiometer across the supply feeds the first NPN's base through 100 kΩ; its emitter is
grounded. The first collector has 1 kΩ to +9 V and, as its "output lamp", 470 Ω plus a yellow LED to
ground. The same collector feeds the second NPN's base through 47 kΩ. The second stage is built the same
way: 1 kΩ to +9 V, 470 Ω plus a green LED from its collector to ground. Each LED shows how high its
stage's output voltage is.

## Observable behaviour
- Knob at the bottom: the first transistor is off, its collector sits at about 4.1 V and the yellow LED is
  bright (about 4.8 mA). That high voltage drives the second transistor hard on, its collector is pulled
  down and the green LED is dark.
- Turn the knob up: the first transistor conducts more and more, its collector voltage falls and the
  yellow LED dims smoothly. The second stage sees a falling input, conducts less, and the green LED
  brightens: two inverting stages in a row make "more input, brighter lamp" again.
- As authored (knob in the middle, wiper 4.41 V): first collector 2.91 V, second collector 2.65 V; yellow
  about 2.3 mA, green about 1.6 mA.
- Knob at the top: the first stage is saturated, yellow is dark, and green is bright (about 4.8 mA).
- No step anywhere: the 100 kΩ and 47 kΩ base resistors let each transistor move gradually through its
  active region, so both lamps fade instead of switching.

## What this verifies
1. A common-emitter stage inverts: its output falls as its input rises.
2. Two inverting stages in a row do not invert.

```assert
# knob at mid-travel: both stages in their active region
net potentiometer_3.wiper V 4.407 +-0.03
net npn_5.collector V 2.911 +-0.05
net npn_10.collector V 2.653 +-0.05
```
